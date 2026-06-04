import { useEffect, useState, type CSSProperties } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { formatSubmissions } from "@/i18n/plurals"
import type {
  HeatmapInsights,
  HeatmapYearBlock,
} from "@/features/wrapped/types"

const ROW_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const
const CELL_PX_DESKTOP = 12
const CELL_GAP_PX_DESKTOP = 3
const CELL_PX_MOBILE = 14
const CELL_GAP_PX_MOBILE = 3
const MOBILE_MONTH_LABEL_WIDTH_PX = 56
/** Height for diagonal month names above the week columns. */
const MONTH_LABEL_ROW_PX = 52

function useHeatmapCellMetrics() {
  const [metrics, setMetrics] = useState({
    cellPx: CELL_PX_DESKTOP,
    gapPx: CELL_GAP_PX_DESKTOP,
    isMobile: false,
  })

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const update = () =>
      setMetrics(
        mq.matches
          ? {
              cellPx: CELL_PX_MOBILE,
              gapPx: CELL_GAP_PX_MOBILE,
              isMobile: true,
            }
          : {
              cellPx: CELL_PX_DESKTOP,
              gapPx: CELL_GAP_PX_DESKTOP,
              isMobile: false,
            },
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

function cellAriaLabel(
  value: number,
  dateLabel: string | null,
  t: TFunction,
): string {
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
  exportMode?: boolean
}

function HeatmapCell({
  value,
  dateLabel,
  maxValue,
  cellId,
  cellPx,
  hoveredId,
  onHover,
  exportMode = false,
}: HeatmapCellProps) {
  const { t } = useTranslation()
  const max = maxValue || 1
  const isHovered = hoveredId === cellId
  const label = cellAriaLabel(value, dateLabel, t)

  return (
    <div
      className="relative shrink-0"
      style={{ width: cellPx, height: cellPx }}
      onMouseEnter={exportMode ? undefined : () => onHover(cellId)}
      onMouseLeave={exportMode ? undefined : () => onHover(null)}
      onFocus={exportMode ? undefined : () => onHover(cellId)}
      onBlur={exportMode ? undefined : () => onHover(null)}
      title={exportMode ? undefined : label || undefined}
      aria-label={exportMode ? undefined : label || undefined}
      tabIndex={exportMode ? -1 : 0}
    >
      {!exportMode && isHovered && dateLabel && (
        <span className="border-jutge-border bg-jutge-panel text-jutge-text pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded border px-1.5 py-0.5 font-mono text-[9px] leading-tight whitespace-nowrap shadow-sm">
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
  exportMode?: boolean
}

type MobileWeekHeatmapGridProps = {
  block: HeatmapYearBlock
  maxValue: number
  showYearLabel: boolean
  cellPx: number
  gapPx: number
  hoveredId: string | null
  onHover: (id: string | null) => void
}

function shortWeekdayLabel(label: string): string {
  return label.slice(0, 2)
}

function MobileWeekHeatmapGrid({
  block,
  maxValue,
  showYearLabel,
  cellPx,
  gapPx,
  hoveredId,
  onHover,
}: MobileWeekHeatmapGridProps) {
  const { t } = useTranslation()
  const { grid, labels, monthLabels } = block

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-2">
      {showYearLabel && (
        <h3 className="text-jutge-text w-full text-center font-mono text-sm font-bold">
          {block.year}
        </h3>
      )}
      <div className="w-full max-w-full px-1 pt-2 pb-4">
        <div
          className="mx-auto flex w-fit min-w-0 flex-col"
          style={{ gap: gapPx }}
        >
          <div className="flex items-center" style={{ gap: gapPx }}>
            <span
              aria-hidden
              className="shrink-0"
              style={{
                width: MOBILE_MONTH_LABEL_WIDTH_PX,
                minWidth: MOBILE_MONTH_LABEL_WIDTH_PX,
              }}
            />
            {ROW_KEYS.map((rowKey) => {
              const label = t(`weekdaysShort.${rowKey}`)
              return (
                <span
                  key={rowKey}
                  className="text-jutge-muted flex items-center justify-center font-mono text-[9px] font-bold uppercase"
                  style={{ width: cellPx, minWidth: cellPx }}
                >
                  {shortWeekdayLabel(label)}
                </span>
              )
            })}
          </div>

          {Array.from({ length: grid[0]?.length ?? 0 }, (_, weekIdx) => (
            <div
              key={`${block.year}-${weekIdx}`}
              className="flex items-center"
              style={{ gap: gapPx }}
            >
              <span
                className="text-jutge-muted shrink-0 truncate pr-1 text-right text-[10px] font-bold tracking-wide uppercase"
                style={{
                  width: MOBILE_MONTH_LABEL_WIDTH_PX,
                  minWidth: MOBILE_MONTH_LABEL_WIDTH_PX,
                }}
              >
                {monthLabels[weekIdx] ?? ""}
              </span>
              <div className="flex items-center" style={{ gap: gapPx }}>
                {grid.map((row, rowIdx) => {
                  const dateLabel = labels[rowIdx]?.[weekIdx] ?? null
                  const cellId = `${block.year}-${rowIdx}-${weekIdx}`
                  return (
                    <HeatmapCell
                      key={cellId}
                      cellId={cellId}
                      cellPx={cellPx}
                      value={row[weekIdx] ?? 0}
                      dateLabel={dateLabel}
                      maxValue={maxValue}
                      hoveredId={hoveredId}
                      onHover={onHover}
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

function WeekHeatmapGrid({
  block,
  maxValue,
  showYearLabel,
  exportMode = false,
}: WeekHeatmapGridProps) {
  const { t } = useTranslation()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const responsiveMetrics = useHeatmapCellMetrics()
  const cellPx = exportMode ? CELL_PX_DESKTOP : responsiveMetrics.cellPx
  const gapPx = exportMode ? CELL_GAP_PX_DESKTOP : responsiveMetrics.gapPx
  const isMobile = !exportMode && responsiveMetrics.isMobile
  const { grid, labels, monthLabels } = block

  if (grid.length === 0 || !grid[0]?.length) {
    return <p className="text-jutge-muted text-sm">{t("heatmap.noActivity")}</p>
  }

  if (isMobile) {
    return (
      <MobileWeekHeatmapGrid
        block={block}
        maxValue={maxValue}
        showYearLabel={showYearLabel}
        cellPx={cellPx}
        gapPx={gapPx}
        hoveredId={hoveredId}
        onHover={setHoveredId}
      />
    )
  }

  const weekCount = grid[0]!.length
  const gridWidthPx = weekCount * cellPx + (weekCount - 1) * gapPx

  return (
    <div
      className={
        exportMode
          ? "flex max-w-full flex-col items-center gap-2"
          : "flex w-full max-w-full min-w-0 flex-col items-center gap-2 sm:w-auto"
      }
    >
      {showYearLabel && (
        <h3 className="text-jutge-text w-full text-center font-mono text-sm font-bold">
          {block.year}
        </h3>
      )}
      <div
        className={
          exportMode
            ? "max-w-full px-1 pt-2 pb-4"
            : "w-full max-w-full overflow-x-auto overflow-y-hidden scroll-smooth px-1 pt-2 pb-4 sm:w-auto"
        }
      >
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
                    className="text-jutge-muted pointer-events-none absolute bottom-0 origin-bottom-left truncate font-mono text-[10px] leading-none"
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
              <span className="text-jutge-muted w-8 shrink-0 text-[11px]">
                {t(`weekdaysShort.${ROW_KEYS[rowIdx]}`)}
              </span>
              <div
                className="flex shrink-0"
                style={{ width: gridWidthPx, gap: gapPx }}
              >
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
                      exportMode={exportMode}
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
export function ActivityCalendar({
  heatmap,
  exportMode = false,
}: {
  heatmap: HeatmapInsights
  exportMode?: boolean
}) {
  const { t } = useTranslation()

  if (heatmap.yearBlocks.length === 0) {
    return <p className="text-jutge-muted text-sm">{t("heatmap.noActivity")}</p>
  }

  const showYearLabels = heatmap.calendarMode === "multiYear"
  const globalMax = heatmap.maxCellValue || 1

  return (
    <div
      className={
        exportMode
          ? "flex max-w-full flex-col items-center gap-8"
          : "flex w-full max-w-full min-w-0 flex-col items-center gap-8 sm:w-auto"
      }
    >
      {heatmap.yearBlocks.map((block) => (
        <WeekHeatmapGrid
          key={block.year}
          block={block}
          maxValue={globalMax}
          showYearLabel={showYearLabels}
          exportMode={exportMode}
        />
      ))}
    </div>
  )
}
