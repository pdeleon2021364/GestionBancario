import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrenciesApi, getExchangeRatesApi } from "../api/banco";

export const useCurrencyStore = create(
    persist(
        (set, get) => ({
            currencies: [],
            exchangeRates: [],
            selectedCurrency: null,
            loading: false,

            fetchCurrencies: async () => {
                try {
                    const data = await getCurrenciesApi({ limit: 50 });
                    const list = Array.isArray(data) ? data : [];
                    set({ currencies: list });
                    const state = get();
                    if (!state.selectedCurrency && list.length > 0) {
                        const gtq = list.find(c => c.codigo === "GTQ") || list[0];
                        set({ selectedCurrency: gtq });
                    }
                } catch (e) {
                    console.warn("fetchCurrencies error:", e);
                }
            },

            fetchExchangeRates: async () => {
                try {
                    const data = await getExchangeRatesApi({ limit: 50 });
                    set({ exchangeRates: Array.isArray(data) ? data : [] });
                } catch (e) {
                    console.warn("fetchExchangeRates error:", e);
                }
            },

            setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
        }),
        {
            name: "currency-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ selectedCurrency: state.selectedCurrency }),
        }
    )
);
