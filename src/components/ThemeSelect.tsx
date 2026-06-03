import { useTranslation } from "react-i18next"
import { useTheme } from "@/context/ThemeContext"
import { THEME_OPTIONS, type ThemeId } from "@/theme/themes"

type Props = {
  /** Use on dark nav bars (white text, light border). */
  onDark?: boolean
  className?: string
}

export function ThemeSelect({ onDark = false, className = "" }: Props) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className={onDark ? "sr-only" : "font-bold text-jutge-text"}>{t("theme.label")}</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        aria-label={t("theme.aria")}
        className={
          onDark
            ? "jutge-theme-select jutge-theme-select-on-dark"
            : "jutge-theme-select jutge-input w-auto min-w-[9rem] py-1.5"
        }
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
