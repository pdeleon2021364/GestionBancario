import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    login as loginRequest,
    register as registerRequest
} from "../../../shared/api"
import { showError } from "../../../shared/utils/toast";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            loading: false,
            error: null,
            isLoadingAuth: true,
            isAuthenticated: false,

            checkAuth: () => {
                const token = get().token;
                const role = get().user?.role;
                const isAdmin = role === "ADMIN";

                if (token && !isAdmin) {
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        expiresAt: null,
                        isAuthenticated: false,
                        isLoadingAuth: false,
                        error: "No tienes permisos para acceder como administrador."
                    })
                    return;
                }

                set({
                    isLoadingAuth: false,
                    isAuthenticated: Boolean(token) && isAdmin
                })
            },

            login: async ({ email, password }) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await loginRequest({ email, password })
                    console.log(data)

                    const role = data?.user?.role;

                    if (role !== "ADMIN") {
                        const message =
                            "No tienes permisos para acceder como administrador"
                        set({
                            user: null,
                            token: null,
                            refreshToken: null,
                            expiresAt: null,
                            isAuthenticated: false,
                            isLoadingAuth: false,
                            loading: false,
                            error: message
                        })

                        showError(message);
                        return { success: false, error: message }
                    }

                    set({
                        user: data.user,
                        token: data.token,
                        refreshToken: data.refreshToken ?? null,
                        expiresAt: data.expiresAt ?? null,
                        loading: false,
                        isAuthenticated: true
                    })

                    return { success: true }

                } catch (err) {
                    console.error("Login error:", err);
                    const message =
                        err.response?.data?.message || "Error de autenticación";
                    set({ error: message, loading: false })
                    return { success: false, error: message }
                }
            },

            register: async (formData) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await registerRequest(formData);
                    set({ loading: false });
                    return {
                        success: true,
                        emailVerificationRequired: data?.emailVerificationRequired,
                        data,
                    }
                } catch (err) {
                    const message = err.response?.data?.message || "Error al registrarse";
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    expiresAt: null,
                    isAuthenticated: false
                })
            }
        }),
        { name: "banco-auth-storage" }
    )
)
