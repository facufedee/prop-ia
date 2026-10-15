"use client";

import { createContext, useContext } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

// The dashboard is dark-only: the theme is fixed and applied by the `.app-theme dark`
// wrapper in ClientLayout. The provider keeps its API so existing imports keep working,
// and it never touches <html>, so public pages stay unaffected.
const DARK_ONLY: ThemeContextValue = {
    theme: "dark",
    toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(DARK_ONLY);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return <ThemeContext.Provider value={DARK_ONLY}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
