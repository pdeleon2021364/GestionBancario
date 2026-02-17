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
