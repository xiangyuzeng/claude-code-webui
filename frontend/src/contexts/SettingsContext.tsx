import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
  AppSettings,
  Language,
  FontSize,
  SettingsContextType,
} from "../types/settings";
import { getSettings, setSettings } from "../utils/storage";
import { SettingsContext } from "./SettingsContextTypes";
import i18n from "~i18n/index";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(() =>
    getSettings(),
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize settings on client side (handles migration automatically)
  useEffect(() => {
    const initialSettings = getSettings();
    setSettingsState(initialSettings);
    setIsInitialized(true);
    // Sync i18n language with settings
    i18n.changeLanguage(initialSettings.language);
  }, []);

  // Apply theme, language, fontSize, and compactMode changes when settings change
  useEffect(() => {
    if (!isInitialized) return;

    const root = window.document.documentElement;

    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply fontSize to root element
    root.classList.remove("font-small", "font-medium", "font-large");
    root.classList.add(`font-${settings.fontSize}`);

    // Apply compactMode to root element
    if (settings.compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }

    // Sync i18n language when settings change
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }

    // Save settings to storage
    setSettings(settings);
  }, [settings, isInitialized]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleTheme = useCallback(() => {
    updateSettings({
      theme: settings.theme === "light" ? "dark" : "light",
    });
  }, [settings.theme, updateSettings]);

  const toggleEnterBehavior = useCallback(() => {
    updateSettings({
      enterBehavior: settings.enterBehavior === "send" ? "newline" : "send",
    });
  }, [settings.enterBehavior, updateSettings]);

  const setLanguage = useCallback(
    (lang: Language) => {
      updateSettings({ language: lang });
    },
    [updateSettings],
  );

  const setFontSize = useCallback(
    (size: FontSize) => {
      updateSettings({ fontSize: size });
    },
    [updateSettings],
  );

  const setCompactMode = useCallback(
    (compact: boolean) => {
      updateSettings({ compactMode: compact });
    },
    [updateSettings],
  );

  const value = useMemo(
    (): SettingsContextType => ({
      settings,
      theme: settings.theme,
      enterBehavior: settings.enterBehavior,
      language: settings.language,
      fontSize: settings.fontSize,
      compactMode: settings.compactMode,
      toggleTheme,
      toggleEnterBehavior,
      setLanguage,
      setFontSize,
      setCompactMode,
      updateSettings,
    }),
    [
      settings,
      toggleTheme,
      toggleEnterBehavior,
      setLanguage,
      setFontSize,
      setCompactMode,
      updateSettings,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
