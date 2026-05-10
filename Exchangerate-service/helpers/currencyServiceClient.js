import axios from 'axios';

class CurrencyServiceClient {
    constructor() {
        this.baseURL = process.env.CURRENCY_SERVICE_URL || 'http://localhost:3003';
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

    async currencyExists(id) {
        const result = await this.getCurrencyById(id);
        return Boolean(result?.success && result?.data);
    }
}

export default new CurrencyServiceClient();
