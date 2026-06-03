import { useEffect, useState, type CSSProperties } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { formatSubmissions } from "@/i18n/plurals"
import type { HeatmapInsights, HeatmapYearBlock } from "@/features/wrapped/types"

const ROW_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
const CELL_PX_DESKTOP = 12
const CELL_GAP_PX_DESKTOP = 3
const CELL_PX_MOBILE = 10
const CELL_GAP_PX_MOBILE = 2
/** Height for diagonal month names above the week columns. */
const MONTH_LABEL_ROW_PX = 52

function useHeatmapCellMetrics() {
  const [metrics, setMetrics] = useState({
    cellPx: CELL_PX_DESKTOP,
    gapPx: CELL_GAP_PX_DESKTOP,
  })

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const update = () =>
      setMetrics(
        mq.matches
          ? { cellPx: CELL_PX_MOBILE, gapPx: CELL_GAP_PX_MOBILE }
          : { cellPx: CELL_PX_DESKTOP, gapPx: CELL_GAP_PX_DESKTOP },
      )
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return metrics
}

function heatColor(value: number, max: number): CSSProperties {
  if (value === 0) {
    return {
      borderRadius: 2,
      backgroundColor: "var(--jutge-heatmap-empty)",
      border: "1px solid var(--jutge-border)",
    }
  }
  const intensity = value / max
  const alpha = 0.15 + intensity * 0.85
  return {
    borderRadius: 2,
    backgroundColor: `color-mix(in srgb, var(--jutge-heatmap-active) ${Math.round(alpha * 100)}%, transparent)`,
    border: "none",
  }
}

function cellAriaLabel(value: number, dateLabel: string | null, t: TFunction): string {
  if (!dateLabel) return ""
  if (value === 0) return t("heatmap.noSubmissionsTooltip", { date: dateLabel })
  return t("heatmap.submissionTooltip", {
    count: formatSubmissions(t, value),
    date: dateLabel,
  })
}

type HeatmapCellProps = {
  value: number
  dateLabel: string | null
  maxValue: number
  cellId: string
  cellPx: number
  hoveredId: string | null
  onHover: (id: string | null) => void
}

function HeatmapCell({
  value,
  dateLabel,
  maxValue,
  cellId,
  cellPx,
  hoveredId,
  onHover,
}: HeatmapCellProps) {
  const { t } = useTranslation()
  const max = maxValue || 1
  const isHovered = hoveredId === cellId
  const label = cellAriaLabel(value, dateLabel, t)

  return (
    <div
      className="relative shrink-0"
      style={{ width: cellPx, height: cellPx }}
      onMouseEnter={() => onHover(cellId)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(cellId)}
      onBlur={() => onHover(null)}
      title={label || undefined}
      aria-label={label || undefined}
      tabIndex={0}
    >
      {isHovered && dateLabel && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-jutge-border bg-jutge-panel px-1.5 py-0.5 font-mono text-[9px] leading-tight text-jutge-text shadow-sm">
          {label}
        </span>
      )}
      <div
        className="h-full w-full"
        style={{
          ...heatColor(value, max),
        }}
      />
    </div>
  )
}

type WeekHeatmapGridProps = {
  block: HeatmapYearBlock
  maxValue: number
  showYearLabel: boolean
}

function WeekHeatmapGrid({ block, maxValue, showYearLabel }: WeekHeatmapGridProps) {
  const { t } = useTranslation()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { cellPx, gapPx } = useHeatmapCellMetrics()
  const { grid, labels, monthLabels } = block

  if (grid.length === 0 || !grid[0]?.length) {
    return <p className="text-sm text-jutge-muted">{t("heatmap.noActivity")}</p>
  }

  const weekCount = grid[0]!.length
  const gridWidthPx = weekCount * cellPx + (weekCount - 1) * gapPx

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-2">
      {showYearLabel && (
        <h3 className="w-full text-center font-mono text-sm font-bold text-jutge-text">
          {block.year}
        </h3>
      )}
      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden scroll-smooth px-1 pt-2 pb-4">
        <div className="mx-auto inline-flex min-w-0 flex-col gap-1">
          <div className="flex gap-2">
            <span className="w-8 shrink-0" aria-hidden />
            <div
              className="relative shrink-0 overflow-hidden"
              style={{ width: gridWidthPx, height: MONTH_LABEL_ROW_PX }}
            >
              {monthLabels.map((label, colIdx) =>
                label ? (
                  <span
                    key={colIdx}
                    className="pointer-events-none absolute bottom-0 origin-bottom-left truncate font-mono text-[10px] leading-none text-jutge-muted"
                    style={{
                      left: colIdx * (cellPx + gapPx),
                      maxWidth: cellPx + gapPx,
                      transform: "rotate(-45deg)",
                    }}
                  >
                    {label}
                  </span>
                ) : null,
              )}
            </div>
          </div>
          {grid.map((row, rowIdx) => (
            <div key={ROW_KEYS[rowIdx]} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-[11px] text-jutge-muted">
                {t(`weekdaysShort.${ROW_KEYS[rowIdx]}`)}
              </span>
              <div className="flex shrink-0" style={{ width: gridWidthPx, gap: gapPx }}>
                {row.map((value, colIdx) => {
                  const dateLabel = labels[rowIdx]?.[colIdx] ?? null
                  const cellId = `${block.year}-${rowIdx}-${colIdx}`
                  return (
                    <HeatmapCell
                      key={cellId}
                      cellId={cellId}
                      cellPx={cellPx}
                      value={value}
                      dateLabel={dateLabel}
                      maxValue={maxValue}
                      hoveredId={hoveredId}
                      onHover={setHoveredId}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** GitHub-style submission calendar for slide-level heatmap insights. */
export function ActivityCalendar({ heatmap }: { heatmap: HeatmapInsights }) {
  const { t } = useTranslation()

  if (heatmap.yearBlocks.length === 0) {
    return <p className="text-sm text-jutge-muted">{t("heatmap.noActivity")}</p>
  }

  const showYearLabels = heatmap.calendarMode === "multiYear"
  const globalMax = heatmap.maxCellValue || 1

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-8">
      {heatmap.yearBlocks.map((block) => (
        <WeekHeatmapGrid
          key={block.year}
          block={block}
          maxValue={globalMax}
          showYearLabel={showYearLabels}
        />
      ))}
    </div>
  )
}
