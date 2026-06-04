export const THEME_STORAGE_KEY = "jutge-wrapped-theme"

export const THEME_IDS = ["jutge", "dark", "fib", "upc"] as const
export type ThemeId = (typeof THEME_IDS)[number]

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value)
}

export type ThemeMeta = {
  id: ThemeId
}

export const THEME_OPTIONS: ThemeMeta[] = THEME_IDS.map((id) => ({ id }))

/** Map legacy localStorage values to current theme ids. */
export function migrateStoredTheme(raw: string | null): ThemeId {
  if (!raw) return "jutge"
  if (raw === "university") return "fib"
  if (raw === "spotify") return "jutge"
  if (isThemeId(raw)) return raw
  return "jutge"
}
