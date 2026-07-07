import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/authStore";
import { ENDPOINTS } from "../constants/endpoints";

const adminClient = axios.create({
    baseURL: ENDPOINTS.ADMIN,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
});

adminClient.interceptors.request.use(async (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) delete config.headers["Content-Type"];
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

adminClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return adminClient(originalRequest);
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
                useAuthStore.getState().setAccessToken(data.accessToken || data.token);
                await SecureStore.setItemAsync("refreshToken", data.refreshToken);
                processQueue(null, data.accessToken || data.token);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken || data.token}`;
                return adminClient(originalRequest);
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

export default adminClient;
