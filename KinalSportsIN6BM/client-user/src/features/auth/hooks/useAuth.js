import { useState } from "react";
import { useAuthStore } from "../../../shared/store/authStore";
import { verifyEmailApi, resendVerificationApi } from "../../../shared/api/banco";

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);

    const verifyEmail = async (token) => {
        try {
            setLoading(true);
            setError(null);
            const response = await verifyEmailApi(token);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || "Error al verificar el email");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async (email) => {
        try {
            setLoading(true);
            setError(null);
            const response = await resendVerificationApi(email);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || "Error al reenviar el email");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (data) => {
        try {
            setLoading(true);
            setError(null);
            const result = await login({
                email: data.emailOrUsername || data.email,
                password: data.password,
            });
            if (!result.success) {
                throw new Error(result.error || "Error al iniciar sesión");
            }
            return result;
        } catch (err) {
            setError(err.message || "Error al iniciar sesión");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (data) => {
        try {
            setLoading(true);
            setError(null);
            const result = await useAuthStore.getState().register(data);
            if (!result.success) {
                throw new Error(result.error || "Error al registrarse");
            }
            return result;
        } catch (err) {
            setError(err.message || "Error al registrarse");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        handleLogin,
        handleRegister,
        verifyEmail,
        resendVerification,
        loading,
        error,
        logout,
    };
};
