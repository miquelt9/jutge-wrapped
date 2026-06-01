import { useState, type CSSProperties } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { HistogramColumn } from "@/components/HistogramColumn"
import type { HeatmapInsights, HeatmapMonthCell } from "@/features/wrapped/types"

const ROW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const CELL_PX = 12
const CELL_GAP_PX = 3
const MONTH_CHART_HEIGHT_PX = 140
const MONTH_SCROLL_THRESHOLD = 24

type WeekGridProps = {
  mode: "week"
  grid: number[][]
  labels: (string | null)[][]
  monthLabels: (string | null)[]
  maxValue: number
}

type MonthGridProps = {
  mode: "month"
  bars: HeatmapMonthCell[]
  maxValue: number
}

export type HeatmapGridProps = WeekGridProps | MonthGridProps

function heatColor(value: number, max: number): CSSProperties {
  if (value === 0) {
    return {
      borderRadius: 0,
      backgroundColor: "var(--jutge-heatmap-empty)",
      border: "1px solid var(--jutge-border)",
    }
  }
  const intensity = value / max
  const alpha = 0.15 + intensity * 0.85
  return {
    borderRadius: 0,
    backgroundColor: `color-mix(in srgb, var(--jutge-green) ${Math.round(alpha * 100)}%, transparent)`,
    border: "none",
  }
}

function WeekHeatmapGrid({ grid, labels, monthLabels, maxValue }: WeekGridProps) {
  if (grid.length === 0 || !grid[0]?.length) {
    return <p className="text-sm text-jutge-muted">No activity data yet.</p>
  }

  const max = maxValue || 1
  const weekCount = grid[0]!.length
  const gridWidthPx = weekCount * CELL_PX + (weekCount - 1) * CELL_GAP_PX

  return (
    <div className="max-w-full overflow-x-auto scroll-smooth">
      <div className="inline-flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-8 shrink-0" aria-hidden />
          <div
            className="flex shrink-0 gap-[3px]"
            style={{ width: gridWidthPx }}
          >
            {monthLabels.map((label, colIdx) => (
              <span
                key={colIdx}
                className="flex-1 truncate text-center font-mono text-[9px] leading-none text-jutge-muted"
                style={{ minWidth: CELL_PX }}
              >
                {label ?? ""}
              </span>
            ))}
          </div>
        </div>
        {grid.map((row, rowIdx) => (
          <div key={ROW_LABELS[rowIdx]} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-[11px] text-jutge-muted">{ROW_LABELS[rowIdx]}</span>
            <div className="flex shrink-0 gap-[3px]" style={{ width: gridWidthPx }}>
              {row.map((value, colIdx) => {
                const label = labels[rowIdx]?.[colIdx]
                const title =
                  value > 0 && label ? `${label}: ${value} submission${value === 1 ? "" : "s"}` : undefined
                return (
                  <div
                    key={colIdx}
                    title={title}
                    className="shrink-0"
                    style={{
                      width: CELL_PX,
                      height: CELL_PX,
                      ...heatColor(value, max),
                    }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthHeatmapGrid({ bars, maxValue }: MonthGridProps) {
  const reduceMotion = useReducedMotion()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (bars.length === 0) {
    return <p className="text-sm text-jutge-muted">No activity data yet.</p>
  }

  const max = maxValue || 1
  const peakTotal = Math.max(...bars.map((b) => b.total), 0)
  const needsScroll = bars.length > MONTH_SCROLL_THRESHOLD
  const labelEveryOther = bars.length > MONTH_SCROLL_THRESHOLD

  const chart = (
    <>
      <div
        className={`flex items-end gap-1 border-b border-jutge-border px-1 ${
          needsScroll ? "min-w-max" : ""
        }`}
        style={{ height: MONTH_CHART_HEIGHT_PX }}
      >
        {bars.map((bar, index) => {
          const columnId = `${bar.year}-${bar.month}`
          const isPeak = bar.total === peakTotal && bar.total > 0
          const barHeight =
            bar.total === 0
              ? 0
              : Math.max(4, Math.round((bar.total / max) * MONTH_CHART_HEIGHT_PX))

          return (
            <HistogramColumn
              key={columnId}
              columnId={columnId}
              count={bar.total}
              chartHeight={MONTH_CHART_HEIGHT_PX}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              isPeak={isPeak}
            >
              <motion.div
                title={`${bar.label}: ${bar.total} submission${bar.total === 1 ? "" : "s"}`}
                className="w-full min-w-[14px] max-w-[28px]"
                style={heatColor(bar.total, max)}
                initial={{ height: reduceMotion ? barHeight : 0 }}
                animate={{ height: barHeight }}
                transition={{
                  duration: reduceMotion ? 0 : 0.4,
                  delay: reduceMotion ? 0 : index * 0.02,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </HistogramColumn>
          )
        })}
      </div>
      <div
        className={`mt-2 flex gap-1 px-1 ${needsScroll ? "min-w-max" : ""}`}
      >
        {bars.map((bar, index) => {
          const columnId = `${bar.year}-${bar.month}`
          const isHovered = hoveredId === columnId
          const isPeak = bar.total === peakTotal && bar.total > 0
          const everyOther = index % 2 === 0
          const showMobile = !labelEveryOther || everyOther
          const showDesktop = bars.length <= 36 || everyOther
          return (
            <span
              key={columnId}
              className={`min-w-[14px] max-w-[28px] flex-1 truncate text-center font-mono text-[9px] sm:text-[10px] ${
                isPeak || isHovered ? "font-bold text-jutge-text" : "text-jutge-muted"
              } ${showMobile ? "" : "max-sm:invisible"} ${showDesktop ? "sm:visible" : "invisible sm:visible"}`}
            >
              {bar.label}
            </span>
          )
        })}
      </div>
    </>
  )

  if (needsScroll) {
    return <div className="max-w-full overflow-x-auto scroll-smooth">{chart}</div>
  }

  return chart
}

export function HeatmapGrid(props: HeatmapGridProps) {
  if (props.mode === "month") {
    return <MonthHeatmapGrid {...props} />
  }
  return <WeekHeatmapGrid {...props} />
}

/** Convenience wrapper for slide-level heatmap insights. */
export function ActivityCalendar({ heatmap }: { heatmap: HeatmapInsights }) {
  if (heatmap.calendarMode === "month") {
    return (
      <HeatmapGrid mode="month" bars={heatmap.monthlyBars} maxValue={heatmap.maxMonthValue} />
    )
  }
  return (
    <HeatmapGrid
      mode="week"
      grid={heatmap.calendarGrid}
      labels={heatmap.calendarLabels}
      monthLabels={heatmap.weekMonthLabels}
      maxValue={heatmap.maxCellValue}
    />
  )
}
