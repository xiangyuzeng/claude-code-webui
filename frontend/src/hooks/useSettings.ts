import { useContext } from "react";
import { SettingsContext } from "../contexts/SettingsContextTypes";
import type { SettingsContextType } from "../types/settings";

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Backward compatibility hooks for easier migration
export function useTheme() {
  const { theme, toggleTheme } = useSettings();
  return { theme, toggleTheme };
}

export function useEnterBehavior() {
  const { enterBehavior, toggleEnterBehavior } = useSettings();
  return { enterBehavior, toggleEnterBehavior };
}

export function useLanguage() {
  const { language, setLanguage } = useSettings();
  return { language, setLanguage };
}

export function useFontSize() {
  const { fontSize, setFontSize } = useSettings();
  return { fontSize, setFontSize };
}

export function useCompactMode() {
  const { compactMode, setCompactMode } = useSettings();
  return { compactMode, setCompactMode };
}

// Re-export types for convenience
export type {
  Theme,
  EnterBehavior,
  Language,
  FontSize,
} from "../types/settings";
