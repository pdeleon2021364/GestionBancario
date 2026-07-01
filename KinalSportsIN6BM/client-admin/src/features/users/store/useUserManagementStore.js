import { create } from "zustand";
import * as authApi from "../../../shared/api/auth.js";

const getAllUsers = authApi.getAllUsers;
const updateUserRoleRequest = authApi.updateUserRole;

export const useUserManagementStore = create((set, get) => ({
  /**
   * Cambia el rol de un usuario usando la API de auth-service (.NET)
   * @param {string} userId
   * @param {string} newRole "ADMIN_ROLE" o "USER_ROLE"
   * @param {string} token JWT de autenticación
   */
  updateUserRole: async (userId, newRole) => {
    set({ loading: true, error: null });
    try {
      if (typeof updateUserRoleRequest !== "function") {
        throw new Error("La función updateUserRole no está disponible");
      }
      const { data: updatedUser } = await updateUserRoleRequest(
        userId,
        newRole,
      );

      // Actualizar el usuario en el estado local
      const users = get().users.map((u) =>
        u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u,
      );
      set({ users, loading: false });
      return { success: true, user: updatedUser };
    } catch (err) {
      set({
        error:
          err.response?.data?.message || err.message || "Error al cambiar rol",
        loading: false,
      });
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  },
  users: [],
  loading: false,
  error: null,
  filters: {},

  setFilters: (filters) => set({ filters }),

  setUsers: (users) => set({ users }),

  fetchUsers: async (apiFn = getAllUsers, options = {}) => {
    const { force = false } = options;
    const state = get();

    // Evita llamadas duplicadas (por ejemplo, doble ejecución en StrictMode).
    if (state.loading) return;
    // Si ya están cargados, no volver a pedir a menos que se fuerce.
    if (!force && state.users.length > 0) return;

    set({ loading: true, error: null });
    try {
      const fetcher = typeof apiFn === "function" ? apiFn : getAllUsers;
      const result = await fetcher();
      set({ users: result.users || result, loading: false });
    } catch (err) {
      set({ error: err.message || "Error al cargar usuarios", loading: false });
    }
  },
}));
