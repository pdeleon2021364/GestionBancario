import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    login as loginRequest,
    register as registerRequest
} from "../../../shared/api"
const ALLOWED_ROLES = ["ADMIN_ROLE", "USER_ROLE"];

const ERROR_MESSAGES = {
    "Email already exists": "Ese correo ya está registrado.",
    "Username already exists": "Ese nombre de usuario ya está en uso.",
};

const extractErrorMessage = (err, fallback) => {
    const data = err.response?.data;

    if (typeof data === "string") return ERROR_MESSAGES[data] || data;

    const rawMessage = data?.message || data?.detail || data?.error;
    if (rawMessage) return ERROR_MESSAGES[rawMessage] || rawMessage;

    if (data?.errors) {
        const messages = Object.values(data.errors).flat().filter(Boolean);
        if (messages.length > 0) return messages.join(" ");
    }

    return fallback;
};

const normalizeUser = (user) => {
    if (!user) return null;

    return {
        id: user.id ?? user.Id,
        username: user.username ?? user.Username,
        name: user.name ?? user.Name ?? user.username ?? user.Username,
        surname: user.surname ?? user.Surname,
        email: user.email ?? user.Email,
        profilePicture: user.profilePicture ?? user.ProfilePicture,
        role: user.role ?? user.Role,
    };
};

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            loading: false,
            error: null,
            isLoadingAuth: false,
            isAuthenticated: false,

            checkAuth: () => {
                const token = get().token;
                const role = get().user?.role;
                const expiresAt = get().expiresAt;
                const hasAllowedRole = ALLOWED_ROLES.includes(role);

                if (expiresAt && Date.now() >= expiresAt) {
                    get().logout();
                    set({
                        isLoadingAuth: false,
                        error: "La sesión expiró. Inicia sesión nuevamente."
                    });
                    return;
                }

                if (token && !hasAllowedRole) {
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        expiresAt: null,
                        isAuthenticated: false,
                        isLoadingAuth: false,
                        error: "Tu rol no tiene acceso a esta aplicación."
                    })
                    return;
                }

                set({
                    isLoadingAuth: false,
                    isAuthenticated: Boolean(token) && hasAllowedRole
                })
            },

            login: async ({ emailOrUsername, password }) => {
                try {
                    set({ loading: true, error: null });
                    const { data } = await loginRequest({ emailOrUsername, password })

                    const user = normalizeUser(data.userDetails ?? data.user);
                    const role = user?.role;

                    if (!ALLOWED_ROLES.includes(role)) {
                        const message = "Tu rol no tiene acceso a esta aplicación."
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

                        return { success: false, error: message }
                    }

                    set({
                        user,
                        token: data.accessToken ?? data.token,
                        refreshToken: data.refreshToken ?? null,
                        expiresAt: data.expiresIn
                            ? Date.now() + data.expiresIn * 1000
                            : data.expiresAt ?? null,
                        loading: false,
                        isLoadingAuth: false,
                        isAuthenticated: true
                    })

                    return { success: true }

                } catch (err) {
                    console.error("Login error:", err);
                    const message = extractErrorMessage(err, "Error de autenticación");
                    set({ error: message, loading: false, isLoadingAuth: false })
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
                    const message = extractErrorMessage(err, "Error al registrarse");
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    expiresAt: null,
                    isLoadingAuth: false,
                    isAuthenticated: false
                })
            }
        }),
        {
            name: "banco-auth-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                expiresAt: state.expiresAt,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.checkAuth();
            },
        }
    )
)
