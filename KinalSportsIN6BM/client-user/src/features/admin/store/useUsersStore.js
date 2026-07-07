import { create } from "zustand";
import { getAllUsersApi, createUserApi, updateUserApi, deleteUserApi } from "../../../shared/api/adminApi";

export const useUsersStore = create((set, get) => ({
    users: [], usersLoading: false,
    fetchUsers: async () => {
        set({ usersLoading: true });
        try {
            const data = await getAllUsersApi();
            set({ users: Array.isArray(data) ? data : [] });
        } catch {} finally {
            set({ usersLoading: false });
        }
    },
    createUser: async (data) => {
        await createUserApi(data);
        await get().fetchUsers();
    },
    updateUser: async (id, data) => {
        await updateUserApi(id, data);
        await get().fetchUsers();
    },
    deleteUser: async (id) => {
        await deleteUserApi(id);
        await get().fetchUsers();
    },
}));
