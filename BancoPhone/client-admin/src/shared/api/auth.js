import { axiosAuth } from "./api";

// ================= AUTH =================
export const login = async (data) => {
  // Backend expects `email` and `password` fields.
  const payload = { email: data.email || data.emailOrUsername, password: data.password };
  return await axiosAuth.post("/auth/login", payload);
};

export const refreshToken = async (refreshToken) => {
  return await axiosAuth.post("/auth/refresh", { refreshToken });
};

export const register = async (data) => {
  return await axiosAuth.post("/auth/register", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const forgotPassword = async (email) => {
  return await axiosAuth.post("/auth/request-reset", { email });
};

export const resetPassword = async (token, newPassword) => {
  return await axiosAuth.post("/auth/reset-password", { token, newPassword });
};

export const verifyEmail = async (token) => {
  return await axiosAuth.post("/auth/verify-email", { token });
};

export const updateUserRole = async (userId, userData) => {
  return await axiosAuth.put(`/Usuarios/${userId}`, userData);
};

// ================= USERS =================
export const getAllUsers = async (page = 1, limit = 100) => {
  const { data } = await axiosAuth.get(`/auth/users?page=${page}&limit=${limit}`);
  // Backend returns { success, data, pagination }
  return { users: data.data || data, pagination: data.pagination };
};
