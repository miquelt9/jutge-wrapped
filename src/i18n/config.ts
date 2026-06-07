import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import es from "./locales/es.json"
import ca from "./locales/ca.json"

export const LANG_STORAGE_KEY = "jutge-wrapped-lang"

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ca", label: "Català" },
] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"]

const SUPPORTED_LANGUAGE_CODES = new Set<AppLanguage>(
  SUPPORTED_LANGUAGES.map((lang) => lang.code),
)

function isAppLanguage(value: string): value is AppLanguage {
  return SUPPORTED_LANGUAGE_CODES.has(value as AppLanguage)
}

export function detectBrowserLanguage(
  languages: readonly string[] = typeof navigator !== "undefined"
    ? navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language]
    : [],
): AppLanguage {
  for (const locale of languages) {
    const primary = locale.split("-")[0]?.toLowerCase()
    if (primary && isAppLanguage(primary)) return primary
  }
  return "en"
}

function readStoredLanguage(): AppLanguage | null {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY)
    if (raw && isAppLanguage(raw)) return raw
  } catch {
    /* ignore */
  }
  return null
}

export function resolveInitialLanguage(): AppLanguage {
  return readStoredLanguage() ?? detectBrowserLanguage()
}

export function applyDocumentLanguage(lang: string) {
  document.documentElement.lang = lang
}

const initialLang = resolveInitialLanguage()
applyDocumentLanguage(initialLang)

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    ca: { translation: ca },
  },
  lng: initialLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

i18n.on("languageChanged", (lang) => {
  applyDocumentLanguage(lang)
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
})

export default i18n
