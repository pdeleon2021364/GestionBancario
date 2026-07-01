import { create } from "zustand";
import {
    getFields as getFieldsRequest,
    createField as createFieldRequest,
    updateField as updateFileRequest,
    deleteField as deleteFieldRequest
} from "../../../shared/api";

export const useFieldStore = create((set, get) => ({
    fields: [],
    loading: false,
    error: null,

    getFields: async () => {
        try {
            set({ loading: true, error: null });
            const response = await getFieldsRequest();
            console.log(response)

            set({
                fields: response.data.data,
                loading: false
            })
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error al obtener canchas",
                loading: false
            })
        }
    },

    createField: async (formData) => {
        try {
            set({ loading: true, error: null})

            const response = await createFieldRequest(formData)

            set({
                fields: [response.data.data, ...get().fields],
                loading: false
            })
        } catch (error) {
            set({
                loading: false,
                error: error.response?.data?.message || "Error al crear campo."
            })
        }
    },

    updateField: async (id, data) => {
        try {
            set({ loading: true, error: null})
            const response = await updateFileRequest(id, data)

            const updated = response.data.data

            set({
                fields: get().fields.map((f) =>
                    f._id === id ? updated : f
                ),
                loading: false
            })
        } catch (error) {
            set({
                loading: false,
                error: error.response?.data?.message || "Error al actualizar el campo."
            })
        }
    },

    deleteField: async (id) => {
        try {
            set({ loading: true, error: null})
            await deleteFieldRequest(id);

            set({
                fields: get().fields.filter(f => f._id !== id),
                loading: false
            })

        } catch (error) {
            set({
                loading: false,
                error: error.response?.data?.message || "Error al eliminar campo."
            })
        }
    }
}))