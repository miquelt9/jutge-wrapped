import type { ReactNode } from "react"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"

type Props = {
  chart: ReactNode
  aside: ReactNode
  /** Sidebar width in pixels when `wide` (default 220). */
  asideWidth?: number
}

/** Chart panel with a metric aside: stacked below `lg`, side-by-side at `lg+`. */
export function ChartMetricLayout({ chart, aside, asideWidth = 220 }: Props) {
  const variant = useLayoutVariant()

  if (variant === "wide") {
    return (
      <div
        className="grid items-stretch gap-6"
        style={{ gridTemplateColumns: `1fr ${asideWidth}px` }}
      >
        {chart}
        {aside}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {chart}
      {aside}
    </div>
  )
}
