import { createContext, useContext, useState, useMemo } from "react";
import { COLORS as DARK_COLORS, SPACING, FONT_SIZE, SHADOWS } from "../constants/theme";

const LIGHT_COLORS = {
    primary: "#0284c7",
    primaryDark: "#0369a1",
    secondary: "#0891b2",
    background: "#f0f9ff",
    surface: "#ffffff",
    surfaceAlt: "#e0f2fe",
    text: "#0f172a",
    textLight: "#475569",
    textMuted: "#94a3b8",
    border: "rgba(2, 132, 199, 0.2)",
    borderStrong: "rgba(2, 132, 199, 0.35)",
    error: "#e11d48",
    success: "#16a34a",
    warning: "#d97706",
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState("dark");
    const toggleTheme = () => setMode((prev) => (prev === "dark" ? "light" : "dark"));
    const colors = mode === "dark" ? DARK_COLORS : LIGHT_COLORS;

    const value = useMemo(() => ({ colors, spacing: SPACING, fontSize: FONT_SIZE, shadows: SHADOWS, mode, toggleTheme }), [mode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
