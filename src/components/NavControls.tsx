import { LanguageSelect } from "@/components/LanguageSelect"
import { ThemeSelect } from "@/components/ThemeSelect"

type Props = {
  onDark?: boolean
  /** Narrower selects and tighter spacing for mobile nav bars. */
  compact?: boolean
  className?: string
}

export function NavControls({ onDark = false, compact = false, className = "" }: Props) {
  return (
    <div className={`flex min-w-0 items-center gap-1 sm:gap-2 ${className}`}>
      <LanguageSelect onDark={onDark} compact={compact} />
      <ThemeSelect onDark={onDark} compact={compact} />
    </div>
  )
}
