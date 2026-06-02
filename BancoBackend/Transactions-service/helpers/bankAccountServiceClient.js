import axios from 'axios';

/**
 * Cliente para comunicarse con el BankAccount Service
 */
class BankAccountServiceClient {
    constructor() {
        this.baseURL = process.env.BANK_ACCOUNT_SERVICE_URL || 'http://localhost:3001';
    }

    /**
     * Obtener una cuenta por su ID
     * @param {string} id - ID de la cuenta
     * @returns {Promise<Object>} Datos de la cuenta
     */
    async getAccountById(id) {
        try {
            const response = await axios.get(`${this.baseURL}/bankaccount/v1/bankAccount/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`Error al obtener cuenta por ID: ${error.message}`);
        }
    }

    /**
     * Actualizar el saldo de una cuenta (endpoint interno sin JWT)
     * @param {string} id - ID de la cuenta
     * @param {number} amount - Monto a sumar/restar (puede ser negativo)
     * @returns {Promise<Object>} Respuesta del servicio
     */
    async updateBalance(id, amount) {
        try {
            const response = await axios.put(`${this.baseURL}/bankaccount/v1/bankAccount/${id}/saldo`, {
                amount
            });
            return response.data;
        } catch (error) {
            throw new Error(`Error al actualizar saldo: ${error.message}`);
        }
    }

    /**
     * Obtener una cuenta por su número de cuenta
     * @param {string} numeroCuenta - Número de cuenta
     * @returns {Promise<Object>} Datos de la cuenta
     */
    async getAccountByNumero(numeroCuenta) {
        try {
            const response = await axios.get(`${this.baseURL}/bankaccount/v1/bankAccount/numero/${numeroCuenta}`);
            return response.data;
        } catch (error) {
            throw new Error(`Error al obtener cuenta por número: ${error.message}`);
        }
    }
}

export default new BankAccountServiceClient();