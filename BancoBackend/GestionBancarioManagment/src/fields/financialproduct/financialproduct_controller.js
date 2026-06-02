import FinancialProduct from './financialproduct_model.js';

export const createFinancialProduct = async (req, res) => {
    try {
        const product = new FinancialProduct(req.body);
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Producto financiero creado exitosamente',
            data: product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el producto financiero',
            error: error.message
        });
    }
};

// ─── Crear producto (USER_ROLE) ───────────────────────────────────────────────
// Solo permite nombre, descripcion y tipoProducto.
// tasaInteres se fija en 0 y activo en true; el admin los ajusta después.
export const createFinancialProductUser = async (req, res) => {
    try {
        const { nombre, descripcion, tipoProducto } = req.body;

        if (!nombre || !descripcion || !tipoProducto) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, descripcion y tipoProducto son obligatorios'
            });
        }

        const product = new FinancialProduct({
            nombre,
            descripcion,
            tipoProducto,
            tasaInteres: 0,   // valor neutro; el admin lo configura
            activo: true,     // disponible por defecto
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Producto financiero creado exitosamente',
            data: product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el producto financiero',
            error: error.message
        });
    }
};

export const getFinancialProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await FinancialProduct.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto financiero no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar el producto financiero',
            error: error.message
        });
    }
};

export const getFinancialProductByName = async (req, res) => {
    try {
        const { nombre } = req.params;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el nombre del producto'
            });
        }

        const product = await FinancialProduct.findOne({
            nombre: { $regex: nombre, $options: 'i' }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto financiero no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar el producto financiero',
            error: error.message
        });
    }
};

export const updateFinancialProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedProduct = await FinancialProduct.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Producto financiero no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto financiero actualizado correctamente',
            data: updatedProduct
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el producto financiero',
            error: error.message
        });
    }
};

// ─── Actualizar producto (USER_ROLE) ─────────────────────────────────────────
// Solo permite modificar nombre, descripcion y tipoProducto.
// tasaInteres y activo son ignorados aunque vengan en el body.
export const updateFinancialProductUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, tipoProducto } = req.body;

        if (!nombre && !descripcion && !tipoProducto) {
            return res.status(400).json({
                success: false,
                message: 'Debes enviar al menos un campo para actualizar (nombre, descripcion o tipoProducto)'
            });
        }

        // Construimos el objeto de actualización solo con los campos permitidos
        const allowedUpdate = {};
        if (nombre)       allowedUpdate.nombre       = nombre;
        if (descripcion)  allowedUpdate.descripcion  = descripcion;
        if (tipoProducto) allowedUpdate.tipoProducto = tipoProducto;

        const updatedProduct = await FinancialProduct.findByIdAndUpdate(
            id,
            allowedUpdate,           // tasaInteres y activo nunca llegan aquí
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Producto financiero no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto financiero actualizado correctamente',
            data: updatedProduct
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el producto financiero',
            error: error.message
        });
    }
};

export const deleteFinancialProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedProduct = await FinancialProduct.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Producto financiero no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto financiero eliminado correctamente'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar el producto financiero',
            error: error.message
        });
    }
};

export const getFinancialProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const products = await FinancialProduct.find()
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await FinancialProduct.countDocuments();

        res.status(200).json({
            success: true,
            data: products,
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
            message: 'Error al obtener los productos financieros',
            error: error.message
        });
    }
};
