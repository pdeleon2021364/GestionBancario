import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginApi, registerApi } from "../api/banco";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            _hasHydrated: false,

            setHasHydrated: (state) => set({ _hasHydrated: state }),

            login: async ({ email, password }) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await loginApi({ email, password });

                    const userDetails = data.userDetails || data.user;
                    const accessToken = data.accessToken || data.token;

                    set({
                        token: accessToken,
                        refreshToken: data.refreshToken || null,
                        expiresAt: data.expiresIn
                            ? Date.now() + data.expiresIn * 1000
                            : null,
                        user: userDetails
                            ? {
                                id: userDetails.id,
                                nombre: userDetails.name || userDetails.nombre || userDetails.username,
                                username: userDetails.username,
                                email: userDetails.email,
                                role: userDetails.role,
                                profilePicture: userDetails.profilePicture,
                                emailVerified: userDetails.emailVerified,
                            }
                            : null,
                        isAuthenticated: true,
                        loading: false,
                        error: null,
                    });

                    if (data.refreshToken) {
                        const { setItemAsync } = await import("expo-secure-store");
                        await setItemAsync("refreshToken", data.refreshToken);
                    }

                    return { success: true };
                } catch (err) {
                    const message =
                        err.response?.data?.message || "Error al iniciar sesión";
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            register: async (formData) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await registerApi(formData);
                    set({ loading: false });
                    return {
                        success: true,
                        emailVerificationRequired: true,
                        data,
                    };
                } catch (err) {
                    const message =
                        err.response?.data?.message || "Error al registrarse";
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            setAccessToken: (token) => set({ token }),

            setUserField: (field, value) =>
                set((state) => ({
                    user: state.user ? { ...state.user, [field]: value } : null,
                })),

            logout: async () => {
                set({
                    token: null,
                    user: null,
                    refreshToken: null,
                    expiresAt: null,
                    isAuthenticated: false,
                    loading: false,
                    error: null,
                });
                try {
                    const { deleteItemAsync } = await import("expo-secure-store");
                    await deleteItemAsync("refreshToken");
                } catch {}
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                expiresAt: state.expiresAt,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.expiresAt && Date.now() >= state.expiresAt) {
                    state.logout();
                }
                state?.setHasHydrated(true);
            },
        },
    ),
);
