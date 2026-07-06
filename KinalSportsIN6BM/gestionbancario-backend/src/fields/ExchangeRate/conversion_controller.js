import ExchangeRate from './ExchangeRate_model.js';
import Currency from '../Currency/Currency_model.js';

export const convertCurrency = async (req, res) => {
    try {
        const { from, to, amount } = req.body;

        if (!from || !to || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar from, to y amount'
            });
        }

        const rate = await ExchangeRate.findOne({
            divisaBase: from,
            divisaDestino: to
        });

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de cambio no encontrado'
            });
        }

        const convertedAmount = Number(amount) * Number(rate.tasa);

        res.status(200).json({
            success: true,
            from,
            to,
            originalAmount: amount,
            rate: rate.tasa,
            convertedAmount
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al convertir divisa',
            error: error.message
        });
    }
};