import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            _hasHydrated: false,

            setHasHydrated: (state) => set({ _hasHydrated: state }),

            // Guarda accessToken y refreshToken seguro
            login: async (accessToken, user, refreshToken) => {
                set({
                    token: accessToken,
                    user,
                    isAuthenticated: true,
                });
                if (refreshToken) {
                    await import("expo-secure-store").then(({ setItemAsync }) =>
                        setItemAsync("refreshToken", refreshToken),
                    );
                }
            },

            // Solo actualiza el accessToken en memoria
            setAccessToken: (token) => set({ token }),

            // Limpia todo y borra refreshToken seguro
            logout: async () => {
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                });
                await import("expo-secure-store").then(({ deleteItemAsync }) =>
                    deleteItemAsync("refreshToken"),
                );
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
