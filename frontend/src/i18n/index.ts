import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// EN translations
import enCommon from "./locales/en/common.json";
import enSettings from "./locales/en/settings.json";
import enAnalytics from "./locales/en/analytics.json";

// ZH translations
import zhCommon from "./locales/zh/common.json";
import zhSettings from "./locales/zh/settings.json";
import zhAnalytics from "./locales/zh/analytics.json";

export const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    analytics: enAnalytics,
  },
  zh: {
    common: zhCommon,
    settings: zhSettings,
    analytics: zhAnalytics,
  },
} as const;

export type Language = "en" | "zh";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "settings", "analytics"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
