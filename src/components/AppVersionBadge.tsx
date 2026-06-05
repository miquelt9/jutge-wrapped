import { getAppVersionLabel } from "@/lib/appVersion"

type Props = {
  className?: string
}

export function AppVersionBadge({ className = "" }: Props) {
  const label = getAppVersionLabel()

  return (
    <span
      className={`font-normal tabular-nums ${className}`.trim()}
      title={label === "dev" ? "Local development build" : undefined}
    >
      {label}
    </span>
  )
}
