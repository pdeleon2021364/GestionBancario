import Field from './bankAccount_model.js';


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

export const deleteField = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedField = await Field.findByIdAndDelete(id);

        if (!deletedField) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta bancaria eliminada correctamente',
            data: deletedField
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la cuenta bancaria',
            error: error.message
        });
    }
};



export const getAccountByAccountNumber = async (req, res) => {
    try {
        const { accountNumber, numeroCuenta } = req.params;
        const accountNumberToFind = numeroCuenta || accountNumber;

        if (!accountNumberToFind) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un número de cuenta'
            });
        }

        const account = await BankAccount.findOne({ numeroCuenta: accountNumberToFind });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la cuenta',
            error: error.message
        });
    }
};


export const updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (req.file) {
            data.photo = req.file.path;
        }

        const updatedField = await Field.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );

        if (!updatedField) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta bancaria actualizada correctamente',
            data: updatedField
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la cuenta bancaria',
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
