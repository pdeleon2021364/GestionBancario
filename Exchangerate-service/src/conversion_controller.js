import ExchangeRate from './exchangeRate_model.js';

export const convertCurrency = async (req, res) => {
    try {
        const { from, to, amount } = req.body;

        if (!from || !to || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar from, to y amount'
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El amount debe ser mayor a 0'
            });
        }

        const rate = await ExchangeRate.findOne({
            monedaOrigen: from,
            monedaDestino: to
        }).sort({ fecha: -1, createdAt: -1 });

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de cambio no encontrado'
            });
        }

        const convertedAmount = Number(amount) * Number(rate.tasa);

        return res.status(200).json({
            success: true,
            from,
            to,
            originalAmount: Number(amount),
            rate: rate.tasa,
            convertedAmount
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al convertir divisa',
            error: error.message
        });
    }
};
