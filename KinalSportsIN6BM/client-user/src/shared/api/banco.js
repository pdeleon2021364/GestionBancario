import bancoClient from "./bancoClient";

const unwrap = (response) => response.data?.data ?? response.data ?? [];

// ── Auth ───────────────────────────────────────────────────────────────────
export const loginApi = async (data) => {
    return await bancoClient.post("/auth/login", data);
};

export const registerApi = async (data) => {
    const { name, surname, username, phone, confirmPassword, ...rest } = data;
    const payload = {
        nombre: name || rest.nombre || `${surname || ''}`.trim(),
        ...rest,
        ...(name ? { name } : {}),
        ...(surname ? { surname } : {}),
        ...(username ? { username } : {}),
        ...(phone ? { phone } : {}),
        ...(confirmPassword ? { confirmPassword } : {}),
    };
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

export const getMyTransactionsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/transactions/my", { params }));
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

// ── Favorites (additional) ──────────────────────────────────────────────────
export const deleteFavoriteApi = async (id) => {
    return unwrap(await bancoClient.delete(`/favorites/delete/${id}`));
};

export const transferToFavoriteApi = async (data) => {
    return unwrap(await bancoClient.post("/favorites/transfer", data));
};

// ── Savings Goals ───────────────────────────────────────────────────────────
export const getSavingsGoalsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/saving-goals", { params }));
};

export const createSavingGoalApi = async (data) => {
    return unwrap(await bancoClient.post("/saving-goals/create", data));
};

export const addFundsToGoalApi = async (id, data) => {
    return unwrap(await bancoClient.post(`/saving-goals/${id}/add-funds`, data));
};

export const deleteSavingGoalApi = async (id) => {
    return unwrap(await bancoClient.delete(`/saving-goals/delete/${id}`));
};

// ── Scheduled Transfers ─────────────────────────────────────────────────────
export const getScheduledTransfersApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/scheduled-transfer", { params }));
};

export const createScheduledTransferApi = async (data) => {
    return unwrap(await bancoClient.post("/scheduled-transfer/create", data));
};

export const cancelScheduledTransferApi = async (id) => {
    return unwrap(await bancoClient.delete(`/scheduled-transfer/delete/${id}`));
};

// ── Categories ──────────────────────────────────────────────────────────────
export const getCategoriasApi = async () => {
    return unwrap(await bancoClient.get("/categorias"));
};

// ── Account Management (User self-service) ───────────────────────────────────
export const createAccountApi = async (data) => {
    return unwrap(await bancoClient.post("/bankAccount/my/create", data));
};

export const closeAccountApi = async (id) => {
    return unwrap(await bancoClient.put(`/bankAccount/my/close/${id}`));
};

export const searchAccountByNumberApi = async (numero) => {
    return unwrap(await bancoClient.get(`/bankAccount/search/numero/${numero}`));
};

export const getActiveDestinationsApi = async () => {
    return unwrap(await bancoClient.get("/bankAccount/destinations/active"));
};

// ── PDF ────────────────────────────────────────────────────────────────────
export const sendAccountPDFApi = async (id, email) => {
    return unwrap(await bancoClient.get(`/bankAccount/send-pdf/${id}/${email}`));
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
