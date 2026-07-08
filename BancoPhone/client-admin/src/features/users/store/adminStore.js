import { create } from "zustand";
import {
  getFields as getFieldsRequest,
  createField as createFieldRequest,
  updateField as _updateFieldRequest,
  deleteField as _deleteFieldRequest,
  getAllReservations as getAllReservationsRequest,
  confirmReservation as confirmReservationRequest,
} from "../../../shared/api";

export const useFieldsStore = create((set, get) => ({
  fields: [],
  reservations: [],
  loading: false,
  error: null,

  getFields: async () => {
    try {
      set({ loading: true, error: null });

      const response = await getFieldsRequest();

      set({
        fields: response.data.data,
        loading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error al obtener canchas",
        loading: false,
      });
    }
  },

  createField: async (formData) => {
    try {
      set({ loading: true, error: null });

      const response = await createFieldRequest(formData);

      set({
        fields: [response.data.data, ...get().fields],
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || "Error al crear campo",
      });
    }
  },
  // ...rest of logic

  getAllReservations: async () => {
    try {
      set({ loading: true, error: null });
      const response = await getAllReservationsRequest();
      set({
        reservations: response.data.data,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Error al obtener reservaciones",
        loading: false,
      });
    }
  },

  confirmReservation: async (id) => {
    try {
      set({ loading: true, error: null });
      await confirmReservationRequest(id);
      // Refrescar lista después de confirmar
      await get().getAllReservations();
      set({ loading: false });
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Error al confirmar reservación",
        loading: false,
      });
    }
  },
}));
