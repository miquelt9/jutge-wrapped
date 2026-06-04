import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { THEME_OPTIONS, type ThemeId } from "@/theme/themes"

type Props = {
  /** Use on dark nav bars (white text, light border). */
  onDark?: boolean
  compact?: boolean
  className?: string
}

export function ThemeSelect({
  onDark = false,
  compact = false,
  className = "",
}: Props) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const selectClass = onDark
    ? `jutge-theme-select jutge-theme-select-on-dark${compact ? " w-full min-w-[5.5rem] max-w-[9rem] px-1.5 text-xs sm:w-auto sm:min-w-[4.75rem] sm:max-w-none sm:px-2 sm:text-sm" : ""}`
    : compact
      ? "jutge-theme-select jutge-input w-full min-w-[5.5rem] max-w-[9rem] px-1.5 py-1 text-xs sm:w-auto sm:min-w-[4.75rem] sm:max-w-none sm:px-2 sm:py-1.5 sm:text-sm"
      : "jutge-theme-select jutge-input w-auto min-w-[9rem] py-1.5"

  return (
    <label
      className={`inline-flex min-w-0 items-center gap-2 text-sm ${className}`}
    >
      <span
        className={onDark || compact ? "sr-only" : "text-jutge-text font-bold"}
      >
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
            {t(`theme.options.${option.id}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
