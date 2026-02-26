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

export const updateRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedRecord = await Record.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        ).populate('cuentaId listaTransacciones');

        if (!updatedRecord) {
            return res.status(404).json({
                success: false,
                message: 'Historial no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Historial actualizado correctamente',
            data: updatedRecord
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el historial',
            error: error.message
        });
    }
};

export const deleteRecord = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRecord = await Record.findByIdAndDelete(id);

        if (!deletedRecord) {
            return res.status(404).json({
                success: false,
                message: 'Historial no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Historial eliminado correctamente'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar el historial',
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
