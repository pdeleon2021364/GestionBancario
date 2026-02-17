import Record from './record_model.js';

export const createRecord = async (req, res) => {
    try {
        const record = new Record(req.body);
        await record.save();

        res.status(201).json({
            success: true,
            message: 'Historial creado exitosamente',
            data: record
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el historial',
            error: error.message
        });
    }
};

export const getRecords = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const records = await Record.find()
            .populate('cuentaId listaTransacciones')
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Record.countDocuments();

        res.status(200).json({
            success: true,
            data: records,
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
            message: 'Error al obtener los historiales',
            error: error.message
        });
    }
};
