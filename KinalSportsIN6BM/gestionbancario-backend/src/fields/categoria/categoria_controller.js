export const getCategorias = async (req, res) => {
    const categorias = ['alimentos', 'transporte', 'servicios', 'entretenimiento', 'salud', 'educacion', 'vivienda', 'ropa', 'ahorro', 'otros'];
    return res.status(200).json({ success: true, data: categorias });
};
