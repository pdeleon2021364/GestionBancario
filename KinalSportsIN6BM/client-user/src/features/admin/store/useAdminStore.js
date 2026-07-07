import { create } from "zustand";
import {
    getAllAccountsApi, createAccountApi, updateAccountApi, deleteAccountApi, toggleAccountStatusApi,
    getAllTransactionsApi, cancelTransactionApi,
    createCurrencyApi, updateCurrencyApi, deleteCurrencyApi,
    createExchangeRateApi, updateExchangeRateApi, deleteExchangeRateApi,
    createFinancialProductApi, updateFinancialProductApi, deleteFinancialProductApi,
    getAllUserProductsApi, getPendingUserProductsApi, approveUserProductApi, rejectUserProductApi,
    createRoleApi, updateRoleApi, deleteRoleApi,
} from "../../../shared/api/adminApi";
import { getCurrenciesApi, getExchangeRatesApi, getFinancialProductsApi } from "../../../shared/api/banco";

export const useAdminStore = create((set, get) => ({
    // Accounts
    accounts: [], accountsLoading: false,
    fetchAccounts: async (params = {}) => {
        set({ accountsLoading: true });
        try { const data = await getAllAccountsApi(params); set({ accounts: Array.isArray(data) ? data : data?.accounts ?? [] }); }
        catch {} finally { set({ accountsLoading: false }); }
    },
    createAccount: async (data) => { await createAccountApi(data); await get().fetchAccounts(); },
    updateAccount: async (id, data) => { await updateAccountApi(id, data); await get().fetchAccounts(); },
    deleteAccount: async (id) => { await deleteAccountApi(id); await get().fetchAccounts(); },
    toggleAccountStatus: async (id, estado) => { await toggleAccountStatusApi(id, { estado }); await get().fetchAccounts(); },

    // Transactions
    transactions: [], transactionsLoading: false,
    fetchTransactions: async (params = {}) => {
        set({ transactionsLoading: true });
        try { const data = await getAllTransactionsApi(params); set({ transactions: Array.isArray(data) ? data : data?.transactions ?? [] }); }
        catch {} finally { set({ transactionsLoading: false }); }
    },
    cancelTransaction: async (id) => { await cancelTransactionApi(id); await get().fetchTransactions(); },

    // Currencies
    currencies: [], currenciesLoading: false,
    fetchCurrencies: async () => {
        set({ currenciesLoading: true });
        try { const data = await getCurrenciesApi(); set({ currencies: Array.isArray(data) ? data : [] }); }
        catch {} finally { set({ currenciesLoading: false }); }
    },
    createCurrency: async (data) => { await createCurrencyApi(data); await get().fetchCurrencies(); },
    updateCurrency: async (id, data) => { await updateCurrencyApi(id, data); await get().fetchCurrencies(); },
    deleteCurrency: async (id) => { await deleteCurrencyApi(id); await get().fetchCurrencies(); },

    // Exchange Rates
    exchangeRates: [], exchangeRatesLoading: false,
    fetchExchangeRates: async () => {
        set({ exchangeRatesLoading: true });
        try { const data = await getExchangeRatesApi(); set({ exchangeRates: Array.isArray(data) ? data : [] }); }
        catch {} finally { set({ exchangeRatesLoading: false }); }
    },
    createExchangeRate: async (data) => { await createExchangeRateApi(data); await get().fetchExchangeRates(); },
    updateExchangeRate: async (id, data) => { await updateExchangeRateApi(id, data); await get().fetchExchangeRates(); },
    deleteExchangeRate: async (id) => { await deleteExchangeRateApi(id); await get().fetchExchangeRates(); },

    // Financial Products
    products: [], productsLoading: false,
    fetchProducts: async () => {
        set({ productsLoading: true });
        try { const data = await getFinancialProductsApi(); set({ products: Array.isArray(data) ? data : [] }); }
        catch {} finally { set({ productsLoading: false }); }
    },
    createProduct: async (data) => { await createFinancialProductApi(data); await get().fetchProducts(); },
    updateProduct: async (id, data) => { await updateFinancialProductApi(id, data); await get().fetchProducts(); },
    deleteProduct: async (id) => { await deleteFinancialProductApi(id); await get().fetchProducts(); },

    // User Products (solicitudes)
    userProducts: [], userProductsLoading: false,
    fetchUserProducts: async () => {
        set({ userProductsLoading: true });
        try { const data = await getAllUserProductsApi(); set({ userProducts: Array.isArray(data) ? data : [] }); }
        catch {} finally { set({ userProductsLoading: false }); }
    },
    fetchPendingUserProducts: async () => {
        set({ userProductsLoading: true });
        try { const data = await getPendingUserProductsApi(); set({ userProducts: Array.isArray(data) ? data : [] }); }
        catch {} finally { set({ userProductsLoading: false }); }
    },
    approveUserProduct: async (id) => { await approveUserProductApi(id); await get().fetchUserProducts(); },
    rejectUserProduct: async (id, motivo) => { await rejectUserProductApi(id, motivo); await get().fetchUserProducts(); },

    // Roles
    roles: [], rolesLoading: false,
    fetchRoles: async () => {
        set({ rolesLoading: true });
        try { const data = await getAllAccountsApi(); /* HACK: reuse until separate endpoint */ set({ roles: [] }); }
        catch {} finally { set({ rolesLoading: false }); }
    },
    createRole: async (data) => { await createRoleApi(data); await get().fetchRoles(); },
    updateRole: async (id, data) => { await updateRoleApi(id, data); await get().fetchRoles(); },
    deleteRole: async (id) => { await deleteRoleApi(id); await get().fetchRoles(); },
}));
