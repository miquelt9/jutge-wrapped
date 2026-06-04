import { useTranslation } from "react-i18next"
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/i18n/config"

type Props = {
  /** Use on dark nav bars (white text, light border). */
  onDark?: boolean
  compact?: boolean
  className?: string
}

export function LanguageSelect({
  onDark = false,
  compact = false,
  className = "",
}: Props) {
  const { i18n, t } = useTranslation()

  const selectClass = onDark
    ? `jutge-theme-select jutge-theme-select-on-dark${compact ? " w-[3.25rem] shrink-0 px-1 text-xs sm:w-auto sm:min-w-[4.25rem] sm:max-w-none sm:px-2 sm:text-sm" : ""}`
    : compact
      ? "jutge-theme-select jutge-input w-[3.25rem] shrink-0 px-1 py-1 text-xs sm:w-auto sm:min-w-[4.25rem] sm:max-w-none sm:px-2 sm:py-1.5 sm:text-sm"
      : "jutge-theme-select jutge-input w-auto min-w-[9rem] py-1.5"

  return (
    <label
      className={`inline-flex min-w-0 items-center gap-2 text-sm ${className}`}
    >
      <span
        className={onDark || compact ? "sr-only" : "text-jutge-text font-bold"}
      >
        {t("language.label")}
      </span>
      <select
        value={i18n.language}
        onChange={(e) =>
          void i18n.changeLanguage(e.target.value as AppLanguage)
        }
        aria-label={t("language.aria")}
        className={selectClass}
      >
        {SUPPORTED_LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {compact ? option.code.toUpperCase() : option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
