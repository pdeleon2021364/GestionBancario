import bancoClient from "./bancoClient";

const unwrap = (response) => response.data?.data ?? response.data ?? [];

// ── Users (Admin) ──────────────────────────────────────────────────────────
export const getAllUsersApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/auth/users", { params }));
};

export const getUserByIdApi = async (id) => {
    return unwrap(await bancoClient.get(`/Usuarios/${id}`));
};

export const createUserApi = async (data) => {
    return unwrap(await bancoClient.post("/Usuarios/create", data));
};

export const updateUserApi = async (id, data) => {
    return unwrap(await bancoClient.put(`/Usuarios/${id}`, data));
};

export const deleteUserApi = async (id) => {
    return unwrap(await bancoClient.delete(`/Usuarios/${id}`));
};

// ── Bank Accounts (Admin) ──────────────────────────────────────────────────
export const getAllAccountsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/bankAccount", { params }));
};

export const getAccountByIdApi = async (id) => {
    return unwrap(await bancoClient.get(`/bankAccount/${id}`));
};

export const createAccountApi = async (data) => {
    return unwrap(await bancoClient.post("/bankAccount/create", data));
};

export const updateAccountApi = async (id, data) => {
    return unwrap(await bancoClient.put(`/bankAccount/update/${id}`, data));
};

export const deleteAccountApi = async (id) => {
    return unwrap(await bancoClient.delete(`/bankAccount/delete/${id}`));
};

export const toggleAccountStatusApi = async (id, data) => {
    return unwrap(await bancoClient.patch(`/bankAccount/status/${id}`, data));
};

// ── Currencies (Admin) ─────────────────────────────────────────────────────
export const createCurrencyApi = async (data) => {
    return unwrap(await bancoClient.post("/Currency/create", data));
};

export const updateCurrencyApi = async (id, data) => {
    return unwrap(await bancoClient.put(`/Currency/update/${id}`, data));
};

export const deleteCurrencyApi = async (id) => {
    return unwrap(await bancoClient.delete(`/Currency/delete/${id}`));
};

// ── Exchange Rates (Admin) ─────────────────────────────────────────────────
export const createExchangeRateApi = async (data) => {
    return unwrap(await bancoClient.post("/ExchangeRate/create", data));
};

export const updateExchangeRateApi = async (id, data) => {
    return unwrap(await bancoClient.put(`/ExchangeRate/update/${id}`, data));
};

export const deleteExchangeRateApi = async (id) => {
    return unwrap(await bancoClient.delete(`/ExchangeRate/delete/${id}`));
};

// ── Financial Products (Admin) ─────────────────────────────────────────────
export const createFinancialProductApi = async (data) => {
    return unwrap(await bancoClient.post("/financialproduct/create", data));
};

export const updateFinancialProductApi = async (id, data) => {
    return unwrap(await bancoClient.put(`/financialproduct/update/${id}`, data));
};

export const deleteFinancialProductApi = async (id) => {
    return unwrap(await bancoClient.delete(`/financialproduct/delete/${id}`));
};

// ── User Products (Admin approval) ─────────────────────────────────────────
export const getAllUserProductsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/user-products", { params }));
};

export const getPendingUserProductsApi = async () => {
    return unwrap(await bancoClient.get("/user-products/pending"));
};

export const approveUserProductApi = async (id) => {
    return unwrap(await bancoClient.put(`/user-products/approve/${id}`));
};

export const rejectUserProductApi = async (id, motivo) => {
    return unwrap(await bancoClient.put(`/user-products/reject/${id}`, { motivoRechazo: motivo }));
};

// ── Transactions (Admin) ───────────────────────────────────────────────────
export const getAllTransactionsApi = async (params = {}) => {
    return unwrap(await bancoClient.get("/transactions", { params }));
};

export const cancelTransactionApi = async (id) => {
    return unwrap(await bancoClient.delete(`/transactions/delete/${id}`));
};

// ── Roles (Admin) ──────────────────────────────────────────────────────────
export const createRoleApi = async (data) => {
    return unwrap(await bancoClient.post("/Roles/create", data));
};

export const updateRoleApi = async (id, data) => {
    return unwrap(await bancoClient.put(`/Roles/update/${id}`, data));
};

export const deleteRoleApi = async (id) => {
    return unwrap(await bancoClient.delete(`/Roles/delete/${id}`));
};
