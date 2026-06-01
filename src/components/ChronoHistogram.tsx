import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { HistogramColumn } from "@/components/HistogramColumn"

const CHART_HEIGHT_PX = 140

type HourPoint = { hour: number; count: number }

type Props = {
  hours: HourPoint[]
  peakHour: number
}

export function ChronoHistogram({ hours, peakHour }: Props) {
  const reduceMotion = useReducedMotion()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const maxCount = Math.max(...hours.map((h) => h.count), 1)

  return (
    <div>
      <div
        className="flex items-end justify-between gap-px border-b border-jutge-border"
        style={{ height: CHART_HEIGHT_PX }}
      >
        {hours.map(({ hour, count }, index) => {
          const columnId = String(hour)
          const isPeak = hour === peakHour && count > 0
          const barHeight =
            count === 0 ? 0 : Math.max(3, Math.round((count / maxCount) * CHART_HEIGHT_PX))

          return (
            <HistogramColumn
              key={hour}
              columnId={columnId}
              count={count}
              chartHeight={CHART_HEIGHT_PX}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              isPeak={isPeak}
            >
              <motion.div
                className="w-full min-w-[4px]"
                style={{
                  backgroundColor: count > 0 ? "var(--jutge-blue)" : "transparent",
                  borderRadius: 0,
                }}
                initial={{ height: reduceMotion ? barHeight : 0 }}
                animate={{ height: barHeight }}
                transition={{
                  duration: reduceMotion ? 0 : 0.35,
                  delay: reduceMotion ? 0 : index * 0.02,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </HistogramColumn>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between gap-px">
        {hours.map(({ hour }) => {
          const isHovered = hoveredId === String(hour)
          return hour % 3 === 0 ? (
            <span
              key={hour}
              className={`flex-1 text-center font-mono text-[9px] ${
                isHovered ? "font-bold text-jutge-text" : "text-jutge-muted"
              }`}
            >
              {String(hour).padStart(2, "0")}
            </span>
          ) : (
            <span key={hour} className="flex-1" aria-hidden />
          )
        })}
      </div>
    </div>
  )
}
