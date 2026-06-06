import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import {
  HistogramColumn,
  histogramBarMaxHeight,
} from "@/components/HistogramColumn"
import type { DistributionItem } from "@/features/wrapped/types"

const CHART_HEIGHT_PX = 168

type Props = {
  days: DistributionItem[]
  peakKey?: string | null
}

export function WeekdayHistogram({ days, peakKey }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const maxCount = Math.max(...days.map((d) => d.count), 1)
  const barMaxHeight = histogramBarMaxHeight(CHART_HEIGHT_PX)

  return (
    <div
      className="w-full min-w-0"
      data-chart-interactive=""
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="border-jutge-border flex min-w-0 items-end justify-between gap-1 border-b px-1 sm:gap-2"
        style={{ height: CHART_HEIGHT_PX }}
      >
        {days.map((day, index) => {
          const isPeak = day.key === peakKey && day.count > 0
          const barHeight =
            day.count === 0
              ? 0
              : Math.max(6, Math.round((day.count / maxCount) * barMaxHeight))

          return (
            <HistogramColumn
              key={day.key}
              columnId={day.key}
              count={day.count}
              chartHeight={CHART_HEIGHT_PX}
              hoveredId={hoveredId}
              onHover={setHoveredId}
            >
              <motion.div
                className="w-full min-w-0"
                style={{
                  backgroundColor: isPeak
                    ? "var(--jutge-green)"
                    : "var(--jutge-blue)",
                  borderRadius: 0,
                }}
                initial={{ height: reduceMotion ? barHeight : 0 }}
                animate={{ height: barHeight }}
                transition={{
                  duration: reduceMotion ? 0 : 0.45,
                  delay: reduceMotion ? 0 : index * 0.06,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </HistogramColumn>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between gap-2 px-1">
        {days.map((day) => {
          const isPeak = day.key === peakKey && day.count > 0
          const isHovered = hoveredId === day.key
          return (
            <span
              key={day.key}
              className={`flex-1 text-center font-mono text-[11px] ${
                isPeak || isHovered
                  ? "text-jutge-text font-bold"
                  : "text-jutge-muted"
              }`}
            >
              {t(`weekdaysShort.${day.key}`, {
                defaultValue: day.label.slice(0, 3),
              })}
            </span>
          )
        })}
      </div>
    </div>
  )
}
