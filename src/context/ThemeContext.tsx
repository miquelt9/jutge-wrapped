import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  migrateStoredTheme,
  THEME_STORAGE_KEY,
  type ThemeId,
} from "@/theme/themes"

type ThemeContextValue = {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    const migrated = migrateStoredTheme(raw)
    if (raw !== migrated) {
      localStorage.setItem(THEME_STORAGE_KEY, migrated)
    }
    return migrated
  } catch {
    /* private mode / blocked storage */
  }
  return "jutge"
}

function applyThemeToDocument(theme: ThemeId) {
  document.documentElement.setAttribute("data-theme", theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const initial = readStoredTheme()
    applyThemeToDocument(initial)
    return initial
  })

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next)
    applyThemeToDocument(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
