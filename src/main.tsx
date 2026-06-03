import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/i18n/config"
import { migrateStoredTheme, THEME_STORAGE_KEY } from "@/theme/themes"
import "./index.css"
import App from "./App"

try {
  const raw = localStorage.getItem(THEME_STORAGE_KEY)
  const theme = migrateStoredTheme(raw)
  document.documentElement.setAttribute("data-theme", theme)
  if (raw !== theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
} catch {
  document.documentElement.setAttribute("data-theme", "jutge")
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
