const API_URL = process.env.EXPO_PUBLIC_API_URL;
const ADMIN_URL = process.env.EXPO_PUBLIC_ADMIN_URL;
const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL;

export const ENDPOINTS = {
    API: API_URL,
    ADMIN: ADMIN_URL,
    AUTH: `${API_URL}/auth`,
    BANK_ACCOUNT: `${API_URL}/bankAccount`,
    CURRENCY: `${API_URL}/Currency`,
    EXCHANGE_RATE: `${API_URL}/ExchangeRate`,
    TRANSACTIONS: `${API_URL}/transactions`,
    FINANCIAL_PRODUCT: `${API_URL}/financialproduct`,
    FAVORITES: `${API_URL}/favorites`,
    RECORD: `${API_URL}/record`,
    USER_PRODUCTS: `${API_URL}/user-products`,
    USUARIOS: `${API_URL}/Usuarios`,
    USER: AUTH_URL,
};
