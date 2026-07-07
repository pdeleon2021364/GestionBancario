import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useThemeStore = create(
    persist(
        (set) => ({
            mode: "dark",
            toggleTheme: () => set((state) => ({ mode: state.mode === "dark" ? "light" : "dark" })),
            setMode: (mode) => set({ mode }),
        }),
        {
            name: "theme-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ mode: state.mode }),
        }
    )
);
