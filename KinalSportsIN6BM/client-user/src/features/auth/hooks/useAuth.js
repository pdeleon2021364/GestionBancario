import { useState } from "react";
import authClient from "../../../shared/api/authClient.js";
import { useAuthStore } from "../../../shared/store/authStore.js";

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);

    const handleLogin = async (data) => {
        try {
            setLoading(true);
            setError(null);
            const response = await authClient.post("/login", data);
            // El backend (auth-node) devuelve: accessToken, refreshToken, userDetails
            // (algunos servicios pueden devolver variantes como token/user)
            const { accessToken, refreshToken, userDetails, token, user } =
                response.data;

            const mappedAccessToken = accessToken || token;
            const mappedUser = userDetails || user;

            await login(mappedAccessToken, mappedUser, refreshToken);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || "Error al iniciar sesión");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (data) => {
        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();

            formData.append("name", data.name);
            formData.append("surname", data.surname);
            formData.append("username", data.username);
            formData.append("email", data.email);
            formData.append("password", data.password);
            formData.append("phone", data.phone);

            const response = await authClient.post(
                "/register",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || "Error al registrarse");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { handleLogin, handleRegister, loading, error, logout };
};
