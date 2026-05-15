import axios from 'axios';

class CurrencyServiceClient {
    constructor() {
        this.baseURL = process.env.CURRENCY_SERVICE_URL || 'http://localhost:3002';
    }

    async getCurrencyById(id) {
        try {
            const response = await axios.get(`${this.baseURL}/currency/v1/Currency/${id}`);
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            if (status === 404) {
                return null;
            }
            throw new Error(`Error consultando Currency Service: ${error.message}`);
        }
    }

    async getCurrencyByCode(code) {
        try {
            const response = await axios.get(`${this.baseURL}/currency/v1/Currency/code/${code}`);
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            if (status === 404) {
                return null;
            }
            throw new Error(`Error consultando Currency Service: ${error.message}`);
        }
    }

    async currencyExists(idOrCode) {
        const result = await this.getCurrencyById(idOrCode);
        if (result?.success && result?.data) return true;
        const resultByCode = await this.getCurrencyByCode(idOrCode);
        return Boolean(resultByCode?.success && resultByCode?.data);
    }
}

export default new CurrencyServiceClient();
