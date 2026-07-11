import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { ENDPOINTS } from "../constants/endpoints";

let _getAuthStore = null;
const getAuthStore = () => {
  if (!_getAuthStore) {
    const mod = require("../store/authStore");
    _getAuthStore = () => mod.useAuthStore;
  }
  return _getAuthStore();
};

const bancoClient = axios.create({
    baseURL: ENDPOINTS.API,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
});

bancoClient.interceptors.request.use(async (config) => {
    const token = getAuthStore().getState().token;
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

bancoClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || "";

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
                    return bancoClient(originalRequest);
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try {
                let refreshToken;
                try {
                    refreshToken = await SecureStore.getItemAsync("refreshToken");
                } catch {
                    refreshToken = getAuthStore().getState().refreshToken || null;
                }
                if (!refreshToken) throw new Error("No refresh token");
                const { data } = await axios.post(`${ENDPOINTS.AUTH}/refresh`, {
                    refreshToken,
                });
                getAuthStore().getState().setAccessToken(data.accessToken || data.token);
                try {
                    await SecureStore.setItemAsync("refreshToken", data.refreshToken);
                } catch {}
                processQueue(null, data.accessToken || data.token);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken || data.token}`;
                return bancoClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                try { await SecureStore.deleteItemAsync("refreshToken"); } catch (e) {}
                try { await SecureStore.setItemAsync("refreshToken", ""); } catch (e) {}
                getAuthStore().getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    },
);

export default bancoClient;
