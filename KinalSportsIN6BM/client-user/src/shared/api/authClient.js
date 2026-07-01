import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/authStore";
import { ENDPOINTS } from "../constants/endpoints";

const authClient = axios.create({
    baseURL: ENDPOINTS.AUTH,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: attach accessToken
authClient.interceptors.request.use(async (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token),
    );
    failedQueue = [];
}

// Response interceptor: handle 401 and refresh
authClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || "";

        // Esta app usa `authClient` para endpoints de auth (`/login`, etc).
        // Si esos endpoints responden 401, no tiene sentido intentar refresh.
        const isAuthEndpoint =
            requestUrl.includes("/login") ||
            requestUrl.includes("/register") ||
            requestUrl.includes("/forgot-password") ||
            requestUrl.includes("/reset-password") ||
            requestUrl.includes("/verify-email") ||
            requestUrl.includes("/resend-verification");

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !requestUrl.includes("/auth/refresh") &&
            !isAuthEndpoint
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return authClient(originalRequest);
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try {
                const refreshToken = await SecureStore.getItemAsync("refreshToken");
                if (!refreshToken) throw new Error("No refresh token");
                const { data } = await axios.post(`${ENDPOINTS.AUTH}/refresh`, {
                    refreshToken,
                });
                useAuthStore.getState().setAccessToken(data.accessToken);
                await SecureStore.setItemAsync("refreshToken", data.refreshToken);
                processQueue(null, data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return authClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await SecureStore.deleteItemAsync("refreshToken");
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    },
);

export default authClient;
