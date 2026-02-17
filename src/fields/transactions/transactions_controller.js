import Transaction from './transactions_model.js';

export const createTransaction = async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();

        res.status(201).json({
            success: true,
            message: 'Transacción creada exitosamente',
            data: transaction
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear la transacción',
            error: error.message
        });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const transactions = await Transaction.find()
            .populate('cuentaOrigen cuentaDestino')
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments();

        res.status(200).json({
            success: true,
            data: transactions,
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
            message: 'Error al obtener las transacciones',
            error: error.message
        });
    }
};
