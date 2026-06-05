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

function prefersHoverInteraction(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches
}

/** Bar column with submission count shown on hover (desktop) or tap (touch). */
export function HistogramColumn({
  columnId,
  count,
  chartHeight,
  hoveredId,
  onHover,
  children,
}: Props) {
  const showCount = hoveredId === columnId

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (prefersHoverInteraction()) return
    onHover(hoveredId === columnId ? null : columnId)
  }

  return (
    <div
      className="flex min-w-0 flex-1 cursor-default touch-manipulation flex-col justify-end"
      style={{ height: chartHeight }}
      data-histogram-column=""
      onMouseEnter={() => {
        if (prefersHoverInteraction()) onHover(columnId)
      }}
      onMouseLeave={() => {
        if (prefersHoverInteraction()) onHover(null)
      }}
      onClick={handleClick}
    >
      <div className="relative flex w-full flex-col items-center">
        {showCount && (
          <span className="text-jutge-text pointer-events-none absolute bottom-full left-1/2 z-10 mb-0.5 -translate-x-1/2 font-mono text-[10px] leading-none font-bold whitespace-nowrap">
            {count}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}
