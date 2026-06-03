import type { ReactNode } from "react"

/** Space reserved above bars so hover counts do not overlap tall columns. */
export const HISTOGRAM_LABEL_RESERVE_PX = 20

export function histogramBarMaxHeight(chartHeight: number): number {
  return chartHeight - HISTOGRAM_LABEL_RESERVE_PX
}

type Props = {
  columnId: string
  count: number
  chartHeight: number
  hoveredId: string | null
  onHover: (id: string | null) => void
  children: ReactNode
}

/** Bar column with submission count shown above the bar on hover only. */
export function HistogramColumn({
  columnId,
  count,
  chartHeight,
  hoveredId,
  onHover,
  children,
}: Props) {
  const showCount = hoveredId === columnId

  return (
    <div
      className="flex min-w-0 flex-1 cursor-default flex-col justify-end"
      style={{ height: chartHeight }}
      onMouseEnter={() => onHover(columnId)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative flex w-full flex-col items-center">
        {showCount && (
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-0.5 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] font-bold leading-none text-jutge-text">
            {count}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}
