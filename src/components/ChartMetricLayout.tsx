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
        className="grid w-full min-w-0 items-stretch gap-6"
        style={{ gridTemplateColumns: `minmax(0, 1fr) ${asideWidth}px` }}
      >
        <div className="min-w-0">{chart}</div>
        {aside}
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="w-full min-w-0">{chart}</div>
      {aside}
    </div>
  )
}
