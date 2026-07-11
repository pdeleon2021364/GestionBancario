import axios from "axios";
import { ENDPOINTS } from "../constants/endpoints";
import { useAuthStore } from "../store/authStore";
import * as SecureStore from "expo-secure-store";

const userClient = axios.create({
    baseURL: ENDPOINTS.USER,
    headers: {
        "Content-Type": "application/json",
    },
});

userClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token),
    );
    failedQueue = [];
}

userClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Intercepta sólo 401 para intentar refresh
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return userClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                let refreshToken;
                try {
                    refreshToken = await SecureStore.getItemAsync("refreshToken");
                } catch {
                    refreshToken = useAuthStore.getState().refreshToken || null;
                }
                if (!refreshToken) throw new Error("No refresh token");

                const { data } = await axios.post(`${ENDPOINTS.AUTH}/refresh`, {
                    refreshToken,
                });

                useAuthStore.getState().setAccessToken(data.accessToken);
                try { await SecureStore.setItemAsync("refreshToken", data.refreshToken); } catch {}

                processQueue(null, data.accessToken);
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

                return userClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                try { await SecureStore.deleteItemAsync("refreshToken"); } catch {}
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default userClient;
