import SavingGoal from './savingGoal_model.js';

export const createGoal = async (req, res) => {
    try {
        const { nombre, metaAmount, deadline, color } = req.body;
        const goal = new SavingGoal({ nombre, metaAmount, deadline, color, usuarioId: req.user.id });
        await goal.save();
        res.status(201).json({ success: true, message: 'Meta creada exitosamente', data: goal });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al crear la meta', error: error.message });
    }
};

export const getMyGoals = async (req, res) => {
    try {
        const goals = await SavingGoal.find({ usuarioId: String(req.user.id) }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: goals });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener metas', error: error.message });
    }
};

export const getGoalById = async (req, res) => {
    try {
        const goal = await SavingGoal.findById(req.params.id);
        if (!goal) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
        if (String(goal.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta meta' });
        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la meta', error: error.message });
    }
};

export const updateGoal = async (req, res) => {
    try {
        const allowedFields = ['nombre', 'metaAmount', 'deadline', 'color'];
        const data = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) data[field] = req.body[field];
        }
        const goal = await SavingGoal.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!goal) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
        if (String(goal.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para modificar esta meta' });
        res.status(200).json({ success: true, message: 'Meta actualizada exitosamente', data: goal });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al actualizar la meta', error: error.message });
    }
};

export const addFunds = async (req, res) => {
    try {
        const { monto } = req.body;
        const goal = await SavingGoal.findById(req.params.id);
        if (!goal) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
        if (String(goal.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para modificar esta meta' });
        goal.currentAmount += Number(monto);
        if (goal.currentAmount >= goal.metaAmount) {
            goal.estado = 'completada';
            goal.completadaAt = Date.now();
        }
        await goal.save();
        res.status(200).json({ success: true, message: 'Fondos agregados exitosamente', data: goal });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al agregar fondos', error: error.message });
    }
};

export const deleteGoal = async (req, res) => {
    try {
        const goal = await SavingGoal.findByIdAndUpdate(req.params.id, { estado: 'cancelada' }, { new: true });
        if (!goal) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
        if (String(goal.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar esta meta' });
        res.status(200).json({ success: true, message: 'Meta cancelada exitosamente', data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cancelar la meta', error: error.message });
    }
};
