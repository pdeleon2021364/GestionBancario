import Field from './role_model.js';

export const createField = async (req, res) => {
    try {

        const fieldData = req.body;

        if(req.file) {
            fieldData.photo = req.file.path;    
        }

        const field = new Field(fieldData);
        await field.save();

        res.status(201).json({
            success: true,
            message: 'Campo creado exitosamente',
            data: field
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el campo',
            error: error.message
        })
    }
}

export const updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedField = await Field.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );

        if (!updatedField) {
            return res.status(404).json({
                success: false,
                message: 'Campo no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Campo actualizado correctamente',
            data: updatedField
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el campo',
            error: error.message
        });
    }
};

export const deleteField = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedField = await Field.findByIdAndDelete(id);

        if (!deletedField) {
            return res.status(404).json({
                success: false,
                message: 'Campo no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Campo eliminado correctamente',
            data: deletedField
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el campo',
            error: error.message
        });
    }
};

export const getFields = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const fields = await Field.find()
        .limit(parseInt(limit))
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Field.countDocuments();

      res.status(200).json({
        success: true,
        data: fields,
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
            message: 'Error al obtener los campos',
            error: error.message
        });
    }

    
}
