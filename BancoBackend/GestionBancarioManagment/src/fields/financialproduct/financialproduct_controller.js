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
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

        const products = await FinancialProduct.find()
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 });

        const total = await FinancialProduct.countDocuments();

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber
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
