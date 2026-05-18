import { axiosAdmin } from "./api";

const unwrap = (response) => response.data?.data ?? response.data ?? [];

const crud = (base) => ({
    list:   async (params = {}) => unwrap(await axiosAdmin.get(base, { params: { limit: 100, ...params } })),
    create: async (data)        => unwrap(await axiosAdmin.post(`${base}/create`, data)),
    update: async (id, data)    => unwrap(await axiosAdmin.put(`${base}/update/${id}`, data)),
    remove: async (id)          => unwrap(await axiosAdmin.delete(`${base}/delete/${id}`)),
    get:    async (id)          => unwrap(await axiosAdmin.get(`${base}/${id}`)),
});

export const usuariosApi = {
    list:   async ()         => unwrap(await axiosAdmin.get("/Usuarios")),
    create: async (data)     => unwrap(await axiosAdmin.post("/Usuarios/create", data)),
    update: async (id, data) => unwrap(await axiosAdmin.put(`/Usuarios/${id}`, data)),
    remove: async (id)       => unwrap(await axiosAdmin.delete(`/Usuarios/${id}`)),
};

export const bankAccountsApi = {
    ...crud("/bankAccount"),
    search:     async (accountNumber) => unwrap(await axiosAdmin.get(`/bankAccount/search/${accountNumber}`)),
    sendAllPdf: async (email)         => unwrap(await axiosAdmin.get(`/bankAccount/send-pdf/all/${email}`)),
    sendPdf:    async (id, email)     => unwrap(await axiosAdmin.get(`/bankAccount/send-pdf/${id}/${email}`)),
};

export const currenciesApi = {
    ...crud("/Currency"),
    byCode: async (code) => unwrap(await axiosAdmin.get(`/Currency/code/${code}`)),
};

export const exchangeRatesApi = {
    ...crud("/ExchangeRate"),
    convert: async (data) => unwrap(await axiosAdmin.post("/ExchangeRate/convert", data)),
};

// ── FinancialProducts — ADMIN (acceso completo) ───────────────────────────────
export const financialProductsApi = {
    ...crud("/financialproduct"),
    byName: async (name) => unwrap(await axiosAdmin.get(`/financialproduct/name/${name}`)),
};

// ── FinancialProducts — USER (rutas restringidas: sin tasaInteres ni activo) ──
// Usa los endpoints /create/user y /update/user/:id del backend.
export const financialProductsUserApi = {
    list:   async (params = {}) => unwrap(await axiosAdmin.get("/financialproduct", { params: { limit: 100, ...params } })),
    create: async (data)        => unwrap(await axiosAdmin.post("/financialproduct/create/user", data)),
    update: async (id, data)    => unwrap(await axiosAdmin.put(`/financialproduct/update/user/${id}`, data)),
    get:    async (id)          => unwrap(await axiosAdmin.get(`/financialproduct/${id}`)),
    byName: async (name)        => unwrap(await axiosAdmin.get(`/financialproduct/name/${name}`)),
};

export const transactionsApi = {
    ...crud("/transactions"),
    byType: async (tipo) => unwrap(await axiosAdmin.get(`/transactions/type/${tipo}`)),
};

export const favoritesApi = {
    ...crud("/favorites"),
    byAlias:  async (alias) => unwrap(await axiosAdmin.get(`/favorites/alias/${alias}`)),
    transfer: async (data)  => unwrap(await axiosAdmin.post("/favorites/transfer", data)),
};

export const recordsApi = {
    ...crud("/record"),
    byAccount: async (cuentaId) => unwrap(await axiosAdmin.get(`/record/account/${cuentaId}`)),
};

export const getUsuarios        = usuariosApi.list;
export const createUsuario      = usuariosApi.create;
export const updateUsuario      = usuariosApi.update;
export const deleteUsuario      = usuariosApi.remove;
export const getBankAccounts    = bankAccountsApi.list;
export const getTransactions    = transactionsApi.list;
export const getFinancialProducts = financialProductsApi.list;
