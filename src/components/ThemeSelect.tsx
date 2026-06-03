import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { THEME_OPTIONS, type ThemeId } from "@/theme/themes"

type Props = {
  /** Use on dark nav bars (white text, light border). */
  onDark?: boolean
  compact?: boolean
  className?: string
}

export function ThemeSelect({ onDark = false, compact = false, className = "" }: Props) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const selectClass = onDark
    ? `jutge-theme-select jutge-theme-select-on-dark${compact ? " max-w-[4.25rem] px-1 text-xs" : ""}`
    : compact
      ? "jutge-theme-select jutge-input w-auto max-w-[4.25rem] px-1 py-1 text-xs"
      : "jutge-theme-select jutge-input w-auto min-w-[9rem] py-1.5"

  return (
    <label className={`inline-flex min-w-0 items-center gap-2 text-sm ${className}`}>
      <span className={onDark || compact ? "sr-only" : "font-bold text-jutge-text"}>
        {t("theme.label")}
      </span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        aria-label={t("theme.aria")}
        className={selectClass}
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
