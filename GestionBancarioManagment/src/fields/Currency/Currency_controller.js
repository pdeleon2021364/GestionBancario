import Currency from './Currency_model.js';

export const createCurrency = async (req, res) => {
    try {
        const currency = new Currency(req.body);
        await currency.save();

        res.status(201).json({
            success: true,
            message: 'Divisa creada exitosamente',
            data: currency
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear la divisa',
            error: error.message
        });
    }
};

export const getCurrencyByCode = async (req, res) => {
    try {
        const { codigo, code } = req.params;
        const codeToFind = codigo || code;

        if (!codeToFind) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el código de la divisa'
            });
        }

        const currency = await Currency.findOne({ codigo: codeToFind.toUpperCase() });

        if (!currency) {
            return res.status(404).json({
                success: false,
                message: 'Divisa no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: currency
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la divisa',
            error: error.message
        });
    }
};

export const deleteCurrency = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCurrency = await Currency.findByIdAndDelete(id);

        if (!deletedCurrency) {
            return res.status(404).json({
                success: false,
                message: 'Divisa no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Divisa eliminada correctamente',
            data: deletedCurrency
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la divisa',
            error: error.message
        });
    }
};

export const updateCurrency = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedCurrency = await Currency.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );

        if (!updatedCurrency) {
            return res.status(404).json({
                success: false,
                message: 'Divisa no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Divisa actualizada correctamente',
            data: updatedCurrency
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la divisa',
            error: error.message
        });
    }
};

export const getCurrencies = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const currencies = await Currency.find()
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Currency.countDocuments();

        res.status(200).json({
            success: true,
            data: currencies,
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
            message: 'Error al obtener las divisas',
            error: error.message
        });
    }
};
