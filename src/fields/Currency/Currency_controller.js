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
