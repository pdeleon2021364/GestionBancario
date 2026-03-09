
import FinancialProduct from './financialproduct_model.js';
import User from '../Usuarios/usuarios.model.js';


const validateClientUser = async (usuarioId) => {
    const user = await User.findByPk(usuarioId);
    if (!user) {
        return { valid: false, message: 'El usuario especificado no existe' };
    }
    return { valid: true, user };
};


export const createFinancialProduct = async (req, res) => {
    try {
        const { usuarioId, ...rest } = req.body;

        if (!usuarioId) {
            return res.status(400).json({
                success: false,
                message: 'Debes indicar el usuarioId del cliente al que pertenece este producto'
            });
        }

        const { valid, message } = await validateClientUser(usuarioId);
        if (!valid) {
            return res.status(400).json({ success: false, message });
        }

        const product = new FinancialProduct({ ...rest, usuarioId });
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


export const getFinancialProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, usuarioId } = req.query;

        const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
        const safeOffset = (Math.max(parseInt(page) || 1, 1) - 1) * safeLimit;

        let filter = {};

        if (req.user.role === 'USER_ROLE') {
           
            filter.usuarioId = req.user.id;
        } else if (usuarioId) {
            
            filter.usuarioId = parseInt(usuarioId);
        }

        const [products, total] = await Promise.all([
            FinancialProduct.find(filter)
                .limit(safeLimit)
                .skip(safeOffset)
                .sort({ createdAt: -1 }),
            FinancialProduct.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / safeLimit),
                totalRecords: total,
                limit: safeLimit
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

      
        if (req.user.role === 'USER_ROLE' && product.usuarioId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este producto'
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

        const filter = { nombre: { $regex: nombre, $options: 'i' } };

        if (req.user.role === 'USER_ROLE') {
            filter.usuarioId = req.user.id;
        }

        const product = await FinancialProduct.findOne(filter);

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

        
        const { usuarioId, ...data } = req.body;

        if (usuarioId !== undefined) {
            return res.status(400).json({
                success: false,
                message: 'No se puede reasignar el usuarioId de un producto financiero existente'
            });
        }

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

