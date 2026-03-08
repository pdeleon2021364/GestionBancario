import ExchangeRate from './ExchangeRate_model.js';

//Usa API externa real (ExchangeRate-API) con fallback a BD local
export const convertCurrency = async (req, res) => {
    try {
        const { from, to, amount } = req.body;

        if (!from || !to || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar from, to y amount'
            });
        }

        let tasa = null;
        let fuente = 'api_externa';

        // Intentar obtener tasa desde API externa (ExchangeRate-API gratuita)
        try {
            const apiUrl = `https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`;
            const response = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });

            if (response.ok) {
                const data = await response.json();
                if (data.rates && data.rates[to.toUpperCase()]) {
                    tasa = data.rates[to.toUpperCase()];
                }
            }
        } catch (apiError) {
            // Si la API falla, se usa la BD local como fallback
            console.warn('API externa de divisas no disponible, usando BD local:', apiError.message);
        }

        // 2️⃣ Fallback: buscar tasa en BD local
        if (tasa === null) {
            const rate = await ExchangeRate.findOne({
                divisaBase: from.toUpperCase(),
                divisaDestino: to.toUpperCase()
            });

            if (!rate) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de cambio no encontrado. La API externa no está disponible y no hay tasa guardada en BD.'
                });
            }

            tasa = Number(rate.tasa);
            fuente = 'bd_local';
        }

        const convertedAmount = Number(amount) * tasa;

        res.status(200).json({
            success: true,
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            originalAmount: Number(amount),
            rate: tasa,
            convertedAmount: Math.round(convertedAmount * 100) / 100,
            fuente // indica si la tasa vino de la API externa o de la BD local
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al convertir divisa',
            error: error.message
        });
    }
};
