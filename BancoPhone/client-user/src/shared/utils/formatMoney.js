const GTQ_CODE = "GTQ";

export function formatMoney(amount, selectedCurrency, exchangeRates, ratesByDestId) {
    const value = Number(amount || 0);
    if (!selectedCurrency) return `Q ${value.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const symbol = selectedCurrency.simbolo || "Q";
    if (selectedCurrency.codigo === GTQ_CODE) {
        return `${symbol} ${value.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
    }
    const rates = ratesByDestId || exchangeRates || [];
    const rate = rates.find(r => {
        const destId = r.divisaDestino?._id || r.divisaDestino;
        return destId === selectedCurrency._id;
    });
    if (rate) {
        const converted = value * Number(rate.tasa);
        return `${symbol} ${converted.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${symbol} ${value.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (cotizaci\u00f3n pendiente)`;
}
