import { create } from "zustand"
import * as authApi from "../../../shared/api/auth.js"

const getAllUsers = authApi.getAllUsers;
const updateUserRoleRequest = authApi.updateUserRole;

export const useUserManagmentStore = create((set, get) => ({
    users: [],
    loading: false,
    error: null,
    filters: {},

    setFilters: (filters) => set({ filters }),

    setUsers: (users) => set({ users }),

    updateUserRole: async (userId, newRole) => {
        set({ loading: true, error: null });
        try {
            if (typeof updateUserRoleRequest !== "function") {
                throw new Error("La función updateUserRole no esta disponible");
            }

            const { data: updateUser } = await updateUserRoleRequest(
                userId,
                newRole
            );

            const users = get().users.map((u) =>
                u.id === updateUser.id ? { ...u, role: updateUser.role } : u
            )

            set({ users, loading: false })
            return { success: true, user: updateUser }
        } catch (err) {
            set({
                error:
                    err.response?.data?.message || err.message || "Error al cambiar rol",
                loading: false
            })
            return {
                success: false,
                error: err.response?.data?.message || err.message
            }
        }
    },

    fetchUsers: async (apiFn = getAllUsers, options = {}) => {

        const { force = false } = options;
        const state = get();

        //Evitar llamdas duplicadas.
        if (state.loading) return;

        //Por si ya están cargados, no volver a pedir a menos que se fuerce.
        if (!force && state.users.length > 0) return;

        set({ loading: true, error: null })

        try {

            const fetcher = typeof apiFn === "function" ? apiFn : getAllUsers;

            const result = await fetcher();

            set({ users: result.users || result, loading: false });

        } catch (err) {
            set({ error: err.message || "Error al cargar usuarios", loading: false });
        }
    }
}))