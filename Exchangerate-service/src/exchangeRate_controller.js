import ExchangeRate from './exchangeRate_model.js';
import currencyServiceClient from '../helpers/currencyServiceClient.js';

const validateCurrenciesExist = async (monedaOrigen, monedaDestino) => {
    const [origenExists, destinoExists] = await Promise.all([
        currencyServiceClient.currencyExists(monedaOrigen),
        currencyServiceClient.currencyExists(monedaDestino)
    ]);

    if (!origenExists || !destinoExists) {
        return false;
    }

    return true;
};

export const createExchangeRate = async (req, res) => {
    try {
        const { monedaOrigen, monedaDestino, tasa, fecha } = req.body;

        if (!monedaOrigen || !monedaDestino || !tasa) {
            return res.status(400).json({
                success: false,
                message: 'monedaOrigen, monedaDestino y tasa son obligatorios'
            });
        }

        if (String(monedaOrigen) === String(monedaDestino)) {
            return res.status(400).json({
                success: false,
                message: 'monedaOrigen y monedaDestino deben ser diferentes'
            });
        }

        const exists = await validateCurrenciesExist(monedaOrigen, monedaDestino);
        if (!exists) {
            return res.status(400).json({
                success: false,
                message: 'Una o ambas divisas no existen en Currency Service'
            });
        }

        const exchangeRate = new ExchangeRate({
            monedaOrigen,
            monedaDestino,
            tasa,
            fecha
        });

        await exchangeRate.save();

        return res.status(201).json({
            success: true,
            message: 'Tipo de cambio creado exitosamente',
            data: exchangeRate
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al crear el tipo de cambio',
            error: error.message
        });
    }
};

export const updateExchangeRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { monedaOrigen, monedaDestino } = req.body;

        if (monedaOrigen && monedaDestino && String(monedaOrigen) === String(monedaDestino)) {
            return res.status(400).json({
                success: false,
                message: 'monedaOrigen y monedaDestino deben ser diferentes'
            });
        }

        if (monedaOrigen || monedaDestino) {
            const currentRate = await ExchangeRate.findById(id);

            if (!currentRate) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de cambio no encontrado'
                });
            }

            const origenToValidate = monedaOrigen || currentRate.monedaOrigen;
            const destinoToValidate = monedaDestino || currentRate.monedaDestino;

            const exists = await validateCurrenciesExist(origenToValidate, destinoToValidate);
            if (!exists) {
                return res.status(400).json({
                    success: false,
                    message: 'Una o ambas divisas no existen en Currency Service'
                });
            }
        }

        const updatedRate = await ExchangeRate.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!updatedRate) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de cambio no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de cambio actualizado correctamente',
            data: updatedRate
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al actualizar el tipo de cambio',
            error: error.message
        });
    }
};

export const getExchangeRateById = async (req, res) => {
    try {
        const { id } = req.params;

        const rate = await ExchangeRate.findById(id);
        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de cambio no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: rate
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al buscar el tipo de cambio',
            error: error.message
        });
    }
};

export const deleteExchangeRate = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRate = await ExchangeRate.findByIdAndDelete(id);
        if (!deletedRate) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de cambio no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tipo de cambio eliminado correctamente',
            data: deletedRate
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el tipo de cambio',
            error: error.message
        });
    }
};

export const getExchangeRates = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);

        const rates = await ExchangeRate.find()
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ fecha: -1, createdAt: -1 });

        const total = await ExchangeRate.countDocuments();

        return res.status(200).json({
            success: true,
            data: rates,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los tipos de cambio',
            error: error.message
        });
    }
};
