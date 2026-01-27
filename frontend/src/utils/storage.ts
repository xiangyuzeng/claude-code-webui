import type {
  AppSettings,
  Theme,
  EnterBehavior,
  Language,
  FontSize,
} from "../types/settings";
import { CURRENT_SETTINGS_VERSION } from "../types/settings";

export const STORAGE_KEYS = {
  // Unified settings key
  SETTINGS: "claude-code-webui-settings",
  // Legacy keys for migration
  THEME: "claude-code-webui-theme",
  ENTER_BEHAVIOR: "claude-code-webui-enter-behavior",
  LANGUAGE: "claude-code-webui-language",
  PERMISSION_MODE: "claude-code-webui-permission-mode",
} as const;

// Type-safe storage utilities
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Settings-specific utilities
export function getSettings(): AppSettings {
  // Try to load unified settings first
  const unifiedSettings = getStorageItem<AppSettings | null>(
    STORAGE_KEYS.SETTINGS,
    null,
  );

  if (unifiedSettings && unifiedSettings.version === CURRENT_SETTINGS_VERSION) {
    return unifiedSettings;
  }

  // If no unified settings or outdated version, migrate from legacy format
  return migrateLegacySettings();
}

export function setSettings(settings: AppSettings): void {
  setStorageItem(STORAGE_KEYS.SETTINGS, settings);
}

function migrateLegacySettings(): AppSettings {
  // Get system theme preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const systemDefaultTheme: Theme = prefersDark ? "dark" : "light";

  // Detect browser language for default
  const browserLang = navigator.language.startsWith("zh") ? "zh" : "en";

  // Check if there are existing v1 settings to migrate
  const existingSettings = getStorageItem<AppSettings | null>(
    STORAGE_KEYS.SETTINGS,
    null,
  );

  // Load legacy settings
  const legacyTheme = getStorageItem<Theme>(
    STORAGE_KEYS.THEME,
    existingSettings?.theme ?? systemDefaultTheme,
  );
  const legacyEnterBehavior = getStorageItem<EnterBehavior>(
    STORAGE_KEYS.ENTER_BEHAVIOR,
    existingSettings?.enterBehavior ?? "send",
  );
  const legacyLanguage = getStorageItem<Language>(
    STORAGE_KEYS.LANGUAGE,
    browserLang as Language,
  );

  // Get fontSize and compactMode from existing settings if migrating from v2
  const legacyFontSize: FontSize = existingSettings?.fontSize ?? "medium";
  const legacyCompactMode: boolean = existingSettings?.compactMode ?? false;

  // Create migrated settings
  const migratedSettings: AppSettings = {
    theme: legacyTheme,
    enterBehavior: legacyEnterBehavior,
    language: legacyLanguage,
    fontSize: legacyFontSize,
    compactMode: legacyCompactMode,
    version: CURRENT_SETTINGS_VERSION,
  };

  // Save migrated settings
  setSettings(migratedSettings);

  // Clean up legacy storage keys
  removeStorageItem(STORAGE_KEYS.THEME);
  removeStorageItem(STORAGE_KEYS.ENTER_BEHAVIOR);
  removeStorageItem(STORAGE_KEYS.LANGUAGE);

  return migratedSettings;
}
