import { create } from "zustand";
import {
  getTeams as getTeamsRequest,
  createTeam as createTeamRequest,
  // updateTeam as updateTeamRequest,
  // deleteTeam as deleteTeamRequest,
} from "../../../shared/api";

export const useTeamsStore = create((set, get) => ({
  teams: [],
  loading: false,
  error: null,

  getTeams: async () => {
    try {
      set({ loading: true, error: null });

      const response = await getTeamsRequest();

      set({
        teams: response.data.data,
        loading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error al obtener equipos",
        loading: false,
      });
    }
  },

  createTeam: async (formData) => {
    try {
      set({ loading: true, error: null });

      const response = await createTeamRequest(formData);

      set({
        teams: [response.data.data, ...get().teams],
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Error al crear equipo",
      });
    }
  },

  // updateTeam: async (id, data) => {
  //     // ...rest of logic
  // },
}));
