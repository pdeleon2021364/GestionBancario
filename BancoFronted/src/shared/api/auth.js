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

    return await axiosAuth.post("/auth/register", formData)
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

const unwrapData = (data) => data?.data ?? data;
const USERS_CACHE_MS = 60_000;
let usersCache = null;
let usersCacheAt = 0;
let usersRequest = null;

export const getCachedUsers = () => {
    if (!usersCache || Date.now() - usersCacheAt > USERS_CACHE_MS) return null;
    return usersCache;
};

export const getAllUsers = async ({ force = false } = {}) => {
    if (!force) {
        const cached = getCachedUsers();
        if (cached) return { users: cached };
        if (usersRequest) return usersRequest;
    }

    usersRequest = (async () => {
    const { data } = await axiosAuth.get("/auth/users")
        usersCache = unwrapData(data) || [];
        usersCacheAt = Date.now();
        return { users: usersCache }
    })();

    try {
        return await usersRequest;
    } finally {
        usersRequest = null;
    }
}

export const getUserById = async (id) => {
    const { data } = await axiosAuth.get(`/auth/users/${id}`)
    return unwrapData(data)
}

export const updateUser = async (id, data) => {
    const response = await axiosAuth.put(`/auth/users/${id}`, data)
    const updated = unwrapData(response.data);
    if (usersCache) {
        usersCache = usersCache.map((user) => (user.id ?? user.Id) === id ? updated : user);
        usersCacheAt = Date.now();
    }
    return updated
}

export const deleteUser = async (id) => {
    const response = await axiosAuth.delete(`/auth/users/${id}`)
    if (usersCache) {
        usersCache = usersCache.filter((user) => (user.id ?? user.Id) !== id);
        usersCacheAt = Date.now();
    }
    return response.data
}
