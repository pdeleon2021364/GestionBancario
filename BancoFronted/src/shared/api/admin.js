import { axiosAdmin } from "./api";

// Usuarios
export const getUsuarios = async () => {
    return axiosAdmin.get("/Usuarios")
}

export const createUsuario = async (data) => {
    return await axiosAdmin.post("/Usuarios", data)
}

export const updateUsuario = async (id, data) => {
    return await axiosAdmin.put(`/Usuarios/${id}`, data)
}

export const deleteUsuario = async (id) => {
    return await axiosAdmin.delete(`/Usuarios/${id}`)
}

// Cuentas bancarias
export const getBankAccounts = async () => {
    return axiosAdmin.get("/bankAccount")
}

// Transacciones
export const getTransactions = async () => {
    return axiosAdmin.get("/transactions")
}

// Productos financieros
export const getFinancialProducts = async () => {
    return axiosAdmin.get("/financialproduct")
}
