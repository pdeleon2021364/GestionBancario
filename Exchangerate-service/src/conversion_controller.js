import mongoose from 'mongoose';
import ExchangeRate from './exchangeRate_model.js';
import currencyServiceClient from '../helpers/currencyServiceClient.js';

const resolveCurrencyId = async (value) => {
    if (!value) return null;
    if (mongoose.Types.ObjectId.isValid(value)) {
        const response = await currencyServiceClient.getCurrencyById(value);
        if (response?.success?.data) {
            return response.data._id;
        }
    }

    const codeResponse = await currencyServiceClient.getCurrencyByCode(String(value).toUpperCase());
    if (codeResponse?.success?.data) {
        return codeResponse.data._id;
    }

    return null;
};

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

        if (String(from).toUpperCase() === String(to).toUpperCase()) {
            return res.status(200).json({
                success: true,
                from,
                to,
                originalAmount: Number(amount),
                rate: 1,
                convertedAmount: Number(amount)
            });
        }

        const fromId = await resolveCurrencyId(from);
        const toId = await resolveCurrencyId(to);

        if (!fromId || !toId) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la divisa de origen o destino'
            });
        }

        let rate = await ExchangeRate.findOne({
            monedaOrigen: fromId,
            monedaDestino: toId
        }).sort({ fecha: -1, createdAt: -1 });

        let convertedAmount;
        let convertRate;
        let useInverse = false;

        if (!rate) {
            const reverseRate = await ExchangeRate.findOne({
                monedaOrigen: toId,
                monedaDestino: fromId
            }).sort({ fecha: -1, createdAt: -1 });

            if (!reverseRate) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de cambio no encontrado para la conversión solicitada'
                });
            }

            convertRate = Number((1 / Number(reverseRate.tasa)).toFixed(8));
            convertedAmount = Number(amount) * convertRate;
            useInverse = true;
        } else {
            convertRate = Number(rate.tasa);
            convertedAmount = Number(amount) * convertRate;
        }

        return res.status(200).json({
            success: true,
            from,
            to,
            originalAmount: Number(amount),
            rate: convertRate,
            convertedAmount,
            inverseRateUsed: useInverse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al convertir divisa',
            error: error.message
        });
    }
};
