import { LanguageSelect } from "@/components/LanguageSelect"
import { ThemeSelect } from "@/components/ThemeSelect"

type Props = {
  onDark?: boolean
  /** Narrower selects and tighter spacing for mobile nav bars. */
  compact?: boolean
  className?: string
}

export function NavControls({ onDark = false, compact = false, className = "" }: Props) {
  if (!compact) {
    return (
      <div className={`flex min-w-0 items-center gap-2 ${className}`}>
        <LanguageSelect onDark={onDark} />
        <ThemeSelect onDark={onDark} />
      </div>
    )
  }

  return (
    <div
      className={`flex min-w-0 flex-1 items-center justify-end gap-1 sm:flex-none sm:gap-2 ${className}`}
    >
      <ThemeSelect
        onDark={onDark}
        compact
        className="order-1 min-w-0 flex-1 sm:order-2 sm:flex-none"
      />
      <LanguageSelect onDark={onDark} compact className="order-2 shrink-0 sm:order-1" />
    </div>
  )
}
