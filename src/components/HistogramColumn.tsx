import type { ReactNode } from "react"

type Props = {
  columnId: string
  count: number
  chartHeight: number
  hoveredId: string | null
  onHover: (id: string | null) => void
  isPeak?: boolean
  children: ReactNode
}

/** Bar column with submission count shown on hover (or for peak when idle). */
export function HistogramColumn({
  columnId,
  count,
  chartHeight,
  hoveredId,
  onHover,
  isPeak,
  children,
}: Props) {
  const showCount = hoveredId === columnId || (hoveredId === null && isPeak)

  return (
    <div
      className="flex min-w-0 flex-1 cursor-default flex-col items-center justify-end"
      style={{ height: chartHeight }}
      onMouseEnter={() => onHover(columnId)}
      onMouseLeave={() => onHover(null)}
    >
      {showCount && (
        <span className="mb-1 font-mono text-[10px] font-bold text-jutge-text">{count}</span>
      )}
      {children}
    </div>
  )
}
