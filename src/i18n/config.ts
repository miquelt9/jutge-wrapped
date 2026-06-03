import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import es from "./locales/es.json"
import ca from "./locales/ca.json"

export const LANG_STORAGE_KEY = "jutge-wrapped-lang"

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ca", label: "Català" },
] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"]

function readStoredLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY)
    if (raw === "es" || raw === "ca" || raw === "en") return raw
  } catch {
    /* ignore */
  }
  return "en"
}

export function applyDocumentLanguage(lang: string) {
  document.documentElement.lang = lang
}

const initialLang = readStoredLanguage()
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
