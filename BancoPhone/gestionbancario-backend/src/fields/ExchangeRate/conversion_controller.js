import ExchangeRate from './ExchangeRate_model.js';
import Currency from '../Currency/Currency_model.js';

export const convertCurrency = async (req, res) => {
    try {
        const { divisaBaseId, divisaDestinoId, monto, from, to, amount } = req.body;

        const baseId = divisaBaseId || from;
        const destId = divisaDestinoId || to;
        const montoNum = monto ?? amount;

        if (!baseId || !destId || !montoNum) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar divisaBaseId, divisaDestinoId y monto'
            });
        }

        const rate = await ExchangeRate.findOne({
            divisaBase: baseId,
            divisaDestino: destId
        });

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de cambio no encontrado'
            });
        }

        const convertedAmount = Number(montoNum) * Number(rate.tasa);

        res.status(200).json({
            success: true,
            from: baseId,
            to: destId,
            originalAmount: montoNum,
            rate: rate.tasa,
            convertedAmount,
            resultado: convertedAmount,
            montoConvertido: convertedAmount
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al convertir divisa',
            error: error.message
        });
    }
};