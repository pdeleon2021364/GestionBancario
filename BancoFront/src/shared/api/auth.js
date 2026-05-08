import { axiosAuth } from "./api";

export const login = async (data) => {
    return await axiosAuth.post("/auth/login", data)
}

export const register = async (data) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            formData.append(key, value);
        }
    });

    return await axiosAuth.post("/auth/register", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
}

export const verifyEmail = async (token) => {
    return await axiosAuth.post("/auth/verify-email", { token })
}

export const requestPasswordReset = async (data) => {
    return await axiosAuth.post("/auth/forgot-password", data)
}

export const resetPassword = async (data) => {
    return await axiosAuth.post("/auth/reset-password", data)
}

export const getAllUsers = async () => {
    const { data } = await axiosAuth.get("/auth/users")
    return { users: data }
}
