import { axiosAuth } from "./api";

export const login = async (data) => {
    return await axiosAuth.post("/auth/login", data)
}

export const register = async (data) => {
    return await axiosAuth.post("/auth/register", data)
}

export const verifyEmail = async (token) => {
    return await axiosAuth.post("/auth/verify-email", { token })
}

export const requestPasswordReset = async (data) => {
    return await axiosAuth.post("/auth/request-reset", data)
}

export const resetPassword = async (data) => {
    return await axiosAuth.post("/auth/reset-password", data)
}

export const getAllUsers = async () => {
    const { data } = await axiosAuth.get("/auth/users")
    return { users: data }
}
