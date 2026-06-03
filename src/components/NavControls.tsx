import { LanguageSelect } from "@/components/LanguageSelect"
import { ThemeSelect } from "@/components/ThemeSelect"

type Props = {
  onDark?: boolean
  className?: string
}

export function NavControls({ onDark = false, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LanguageSelect onDark={onDark} />
      <ThemeSelect onDark={onDark} />
    </div>
  )
}
