import bancoClient from "./bancoClient";

const unwrap = (response) => response.data?.data ?? response.data ?? [];

// ── Auth ───────────────────────────────────────────────────────────────────
export const loginApi = async (data) => {
    return await bancoClient.post("/auth/login", data);
};

export const registerApi = async (data) => {
    const { name, ...rest } = data;
    const payload = { nombre: name, ...rest };
    return await bancoClient.post("/auth/register", payload, { timeout: 30000 });
};

export const verifyEmailApi = async (token) => {
    return await bancoClient.post("/auth/verify-email", { token });
};

export const resendVerificationApi = async (email) => {
    return await bancoClient.post("/auth/resend-verification", { email });
};

export const refreshTokenApi = async (refreshToken) => {
    return await bancoClient.post("/auth/refresh", { refreshToken });
};

export const getProfileApi = async () => {
    return unwrap(await bancoClient.get("/auth/profile"));
};

export const updateProfileApi = async (data) => {
    return unwrap(await bancoClient.put("/auth/profile", data));
};

// ── Bank Accounts ──────────────────────────────────────────────────────────
export const getAccountsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/bankAccount", { params }));
};

export const getAccountApi = async (id) => {
    return unwrap(await bancoClient.get(`/bankAccount/${id}`));
};

// ── Transactions ───────────────────────────────────────────────────────────
export const getTransactionsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/transactions", { params }));
};

export const createTransactionApi = async (data) => {
    return unwrap(await bancoClient.post("/transactions/create", data));
};

export const getMyTransactionsApi = async () => {
    return unwrap(await bancoClient.get("/transactions/my"));
};

export const getTransactionsByTypeApi = async (tipo) => {
    return unwrap(await bancoClient.get(`/transactions/type/${tipo}`));
};

// ── Currencies ─────────────────────────────────────────────────────────────
export const getCurrenciesApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/Currency", { params }));
};

export const getCurrencyApi = async (id) => {
    return unwrap(await bancoClient.get(`/Currency/${id}`));
};

export const getCurrencyByCodeApi = async (code) => {
    return unwrap(await bancoClient.get(`/Currency/code/${code}`));
};

// ── Exchange Rates ─────────────────────────────────────────────────────────
export const getExchangeRatesApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/ExchangeRate", { params }));
};

export const convertCurrencyApi = async (data) => {
    return unwrap(await bancoClient.post("/ExchangeRate/convert", data));
};

// ── Financial Products ─────────────────────────────────────────────────────
export const getFinancialProductsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/financialproduct", { params }));
};

export const getFinancialProductApi = async (id) => {
    return unwrap(await bancoClient.get(`/financialproduct/${id}`));
};

// ── Favorites ──────────────────────────────────────────────────────────────
export const getFavoritesApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/favorites", { params }));
};

export const createFavoriteApi = async (data) => {
    return unwrap(await bancoClient.post("/favorites/create", data));
};

// ── Records ────────────────────────────────────────────────────────────────
export const getRecordsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/record", { params }));
};

export const getRecordsByAccountApi = async (cuentaId) => {
    return unwrap(await bancoClient.get(`/record/account/${cuentaId}`));
};

// ── User Products ──────────────────────────────────────────────────────────
export const requestProductApi = async (data) => {
    return unwrap(await bancoClient.post("/user-products/request", data));
};

export const getMyProductsApi = async () => {
    return unwrap(await bancoClient.get("/user-products/my"));
};
