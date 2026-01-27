export type Theme = "light" | "dark";
export type EnterBehavior = "send" | "newline";
export type Language = "en" | "zh";
export type FontSize = "small" | "medium" | "large";

export interface AppSettings {
  theme: Theme;
  enterBehavior: EnterBehavior;
  language: Language;
  fontSize: FontSize;
  compactMode: boolean;
  version: number;
}

export interface LegacySettings {
  theme?: Theme;
  enterBehavior?: EnterBehavior;
  language?: Language;
  fontSize?: FontSize;
  compactMode?: boolean;
}

export interface SettingsContextType {
  settings: AppSettings;
  theme: Theme;
  enterBehavior: EnterBehavior;
  language: Language;
  fontSize: FontSize;
  compactMode: boolean;
  toggleTheme: () => void;
  toggleEnterBehavior: () => void;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  setCompactMode: (compact: boolean) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  enterBehavior: "send",
  language: "en",
  fontSize: "medium",
  compactMode: false,
  version: 3,
};

// Current settings version for migration
export const CURRENT_SETTINGS_VERSION = 3;
