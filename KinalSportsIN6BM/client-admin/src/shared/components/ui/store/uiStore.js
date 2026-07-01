import { create } from "zustand";

export const useUIStore = create((set) => ({
    modal: {
        isOpen: false,
        title: "",
        message: "",
    },

    confirmModal: {
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
    },

    openModal: (title, message) =>
        set({
            modal: {
                isOpen: true,
                title,
                message,
            },
        }),

    closeModal: () =>
        set({
            modal: {
                isOpen: false,
                title: "",
                message: "",
            },
        }),

    openConfirm: ({ title, message, onConfirm }) =>
        set({
            confirmModal: {
                isOpen: true,
                title,
                message,
                onConfirm,
            },
        }),

    closeConfirm: () =>
        set({
            confirmModal: {
                isOpen: false,
                title: "",
                message: "",
                onConfirm: null,
            },
        }),
}));
