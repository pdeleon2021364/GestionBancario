import UserProduct from './userProduct_model.js';
import FinancialProduct from '../financialproduct/financialproduct_model.js';
import BankAccount from '../bankAccount/bankAccount_model.js';

const generateAccountNumber = async () => {
    const prefix = 'CTA';
    for (let i = 0; i < 10; i++) {
        const num = `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const exists = await BankAccount.findOne({ numeroCuenta: num });
        if (!exists) return num;
    }
    throw new Error('No se pudo generar un numero de cuenta unico');
};

const createBankAccountForProduct = async (producto, usuarioId) => {
    const tipoMap = {
        ahorro: 'ahorro',
        cuenta: 'corriente',
    };
    const tipoCuenta = tipoMap[producto.tipoProducto] || 'ahorro';
    const numeroCuenta = await generateAccountNumber();

    const account = await BankAccount.create({
        nombre: `Cuenta ${producto.nombre}`,
        numeroCuenta,
        tipoCuenta,
        saldo: 100,
        usuarioId,
        estado: 'activa',
    });

    return account;
};

export const requestProduct = async (req, res) => {
    try {
        const { productoId } = req.body;
        const usuarioId = req.user?.id;

        if (!productoId) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar el ID del producto' });
        }

        const producto = await FinancialProduct.findById(productoId);
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto financiero no encontrado' });
        }

        if (!producto.activo) {
            return res.status(400).json({ success: false, message: 'Este producto no esta disponible actualmente' });
        }

        const existing = await UserProduct.findOne({ usuarioId: String(usuarioId), productoId, estado: { $in: ['pendiente', 'activo'] } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Ya tienes este producto solicitado o activo' });
        }

        let cuentaId = null;

        if (!producto.requiereAprobacion) {
            const tiposConCuenta = ['ahorro', 'cuenta'];
            if (tiposConCuenta.includes(producto.tipoProducto)) {
                const account = await createBankAccountForProduct(producto, usuarioId);
                cuentaId = account._id;
            }

            const userProduct = await UserProduct.create({
                usuarioId: String(usuarioId),
                productoId,
                estado: 'activo',
                requiereAprobacion: false,
                cuentaId,
            });

            const populated = await UserProduct.findById(userProduct._id).populate('productoId');

            return res.status(201).json({
                success: true,
                message: cuentaId
                    ? 'Producto asignado automaticamente. Se ha creado una cuenta bancaria.'
                    : 'Producto asignado exitosamente.',
                data: populated,
            });
        }

        const userProduct = await UserProduct.create({
            usuarioId: String(usuarioId),
            productoId,
            estado: 'pendiente',
            requiereAprobacion: true,
        });

        const populated = await UserProduct.findById(userProduct._id).populate('productoId');

        return res.status(201).json({
            success: true,
            message: 'Solicitud enviada. Un administrador revisara tu peticion.',
            data: populated,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyProducts = async (req, res) => {
    try {
        const items = await UserProduct.find({ usuarioId: String(req.user?.id) })
            .populate('productoId')
            .populate('cuentaId')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: items });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const filter = {};
        if (estado) filter.estado = estado;

        const items = await UserProduct.find(filter)
            .populate('productoId')
            .populate('cuentaId')
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 });

        const total = await UserProduct.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: items,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getPendingRequests = async (req, res) => {
    try {
        const items = await UserProduct.find({ estado: 'pendiente' })
            .populate('productoId')
            .populate('cuentaId')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: items });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const userProduct = await UserProduct.findById(id).populate('productoId');
        if (!userProduct) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        if (userProduct.estado !== 'pendiente') {
            return res.status(400).json({ success: false, message: 'La solicitud ya fue procesada' });
        }

        let cuentaId = userProduct.cuentaId;

        const tiposConCuenta = ['ahorro', 'cuenta'];
        if (tiposConCuenta.includes(userProduct.productoId.tipoProducto) && !cuentaId) {
            const account = await createBankAccountForProduct(userProduct.productoId, userProduct.usuarioId);
            cuentaId = account._id;
        }

        userProduct.estado = 'activo';
        userProduct.fechaAprobacion = new Date();
        userProduct.aprobadoPor = req.user?.id || 'system';
        if (cuentaId) userProduct.cuentaId = cuentaId;

        await userProduct.save();

        const populated = await UserProduct.findById(userProduct._id)
            .populate('productoId')
            .populate('cuentaId');

        return res.status(200).json({
            success: true,
            message: cuentaId
                ? 'Solicitud aprobada. Se ha creado una cuenta bancaria.'
                : 'Solicitud aprobada exitosamente.',
            data: populated,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivoRechazo } = req.body;

        const userProduct = await UserProduct.findById(id);
        if (!userProduct) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        if (userProduct.estado !== 'pendiente') {
            return res.status(400).json({ success: false, message: 'La solicitud ya fue procesada' });
        }

        userProduct.estado = 'rechazado';
        userProduct.motivoRechazo = motivoRechazo || 'Sin especificar';
        userProduct.aprobadoPor = req.user?.id || 'system';
        await userProduct.save();

        const populated = await UserProduct.findById(userProduct._id).populate('productoId');

        return res.status(200).json({
            success: true,
            message: 'Solicitud rechazada.',
            data: populated,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const cancelRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const userProduct = await UserProduct.findById(id);
        if (!userProduct) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        if (req.user?.role !== 'ADMIN_ROLE' && String(userProduct.usuarioId) !== String(req.user?.id)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar esta solicitud' });
        }

        if (userProduct.estado === 'rechazado' || userProduct.estado === 'cancelado') {
            return res.status(400).json({ success: false, message: 'La solicitud ya no puede cancelarse' });
        }

        userProduct.estado = 'cancelado';
        await userProduct.save();

        return res.status(200).json({
            success: true,
            message: 'Solicitud cancelada.',
            data: userProduct,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
