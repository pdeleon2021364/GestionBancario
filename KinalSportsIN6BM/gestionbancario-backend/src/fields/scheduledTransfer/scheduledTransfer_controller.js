import ScheduledTransfer from './scheduledTransfer_model.js';

export const createScheduled = async (req, res) => {
    try {
        const { nombre, cuentaOrigen, cuentaDestinoNumero, monto, frecuencia, descripcion, proximaEjecucion } = req.body;
        const transfer = new ScheduledTransfer({
            nombre, cuentaOrigen, cuentaDestinoNumero, monto, frecuencia, descripcion, proximaEjecucion,
            usuarioId: req.user.id
        });
        await transfer.save();
        res.status(201).json({ success: true, message: 'Transferencia programada creada exitosamente', data: transfer });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al crear la transferencia programada', error: error.message });
    }
};

export const getMyScheduled = async (req, res) => {
    try {
        const transfers = await ScheduledTransfer.find({ usuarioId: String(req.user.id) })
            .populate('cuentaOrigen').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: transfers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener transferencias programadas', error: error.message });
    }
};

export const getScheduledById = async (req, res) => {
    try {
        const transfer = await ScheduledTransfer.findById(req.params.id).populate('cuentaOrigen');
        if (!transfer) return res.status(404).json({ success: false, message: 'Transferencia no encontrada' });
        if (String(transfer.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta transferencia' });
        res.status(200).json({ success: true, data: transfer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la transferencia', error: error.message });
    }
};

export const updateScheduled = async (req, res) => {
    try {
        const allowedFields = ['nombre', 'cuentaOrigen', 'cuentaDestinoNumero', 'monto', 'frecuencia', 'descripcion', 'proximaEjecucion'];
        const data = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) data[field] = req.body[field];
        }
        const transfer = await ScheduledTransfer.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!transfer) return res.status(404).json({ success: false, message: 'Transferencia no encontrada' });
        if (String(transfer.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para modificar esta transferencia' });
        res.status(200).json({ success: true, message: 'Transferencia actualizada exitosamente', data: transfer });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al actualizar la transferencia', error: error.message });
    }
};

export const pauseScheduled = async (req, res) => {
    try {
        const transfer = await ScheduledTransfer.findByIdAndUpdate(req.params.id, { estado: 'pausada' }, { new: true });
        if (!transfer) return res.status(404).json({ success: false, message: 'Transferencia no encontrada' });
        if (String(transfer.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para pausar esta transferencia' });
        res.status(200).json({ success: true, message: 'Transferencia pausada', data: transfer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al pausar la transferencia', error: error.message });
    }
};

export const resumeScheduled = async (req, res) => {
    try {
        const transfer = await ScheduledTransfer.findByIdAndUpdate(req.params.id, { estado: 'activa' }, { new: true });
        if (!transfer) return res.status(404).json({ success: false, message: 'Transferencia no encontrada' });
        if (String(transfer.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para reactivar esta transferencia' });
        res.status(200).json({ success: true, message: 'Transferencia reactivada', data: transfer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al reactivar la transferencia', error: error.message });
    }
};

export const cancelScheduled = async (req, res) => {
    try {
        const transfer = await ScheduledTransfer.findByIdAndUpdate(req.params.id, { estado: 'cancelada' }, { new: true });
        if (!transfer) return res.status(404).json({ success: false, message: 'Transferencia no encontrada' });
        if (String(transfer.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar esta transferencia' });
        res.status(200).json({ success: true, message: 'Transferencia cancelada', data: transfer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cancelar la transferencia', error: error.message });
    }
};
