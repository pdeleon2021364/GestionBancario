import ExchangeRate from './ExchangeRate_model.js';

export const createExchangeRate = async (req, res) => {
    try {
        const exchangeRate = new ExchangeRate(req.body);
        await exchangeRate.save();

        res.status(201).json({
            success: true,
            message: 'Tipo de cambio creado exitosamente',
            data: exchangeRate
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el tipo de cambio',
            error: error.message
        });
    }
};

export const updateExchangeRate = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedRate = await ExchangeRate.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        ).populate('divisaBase divisaDestino');

        if (!updatedRate) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de cambio no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tipo de cambio actualizado correctamente',
            data: updatedRate
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el tipo de cambio',
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

        res.status(200).json({
            success: true,
            message: 'Tipo de cambio eliminado correctamente',
            data: deletedRate
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el tipo de cambio',
            error: error.message
        });
    }
};

export const getExchangeRates = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const rates = await ExchangeRate.find()
            .populate('divisaBase divisaDestino')
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await ExchangeRate.countDocuments();

        res.status(200).json({
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
        res.status(500).json({
            success: false,
            message: 'Error al obtener los tipos de cambio',
            error: error.message
        });
    }
};
