import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { HistogramColumn } from "@/components/HistogramColumn"
import type { DistributionItem } from "@/features/wrapped/types"

const SHORT_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
}

const CHART_HEIGHT_PX = 168

type Props = {
  days: DistributionItem[]
  peakKey?: string | null
}

export function WeekdayHistogram({ days, peakKey }: Props) {
  const reduceMotion = useReducedMotion()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const maxCount = Math.max(...days.map((d) => d.count), 1)

  return (
    <div>
      <div
        className="flex items-end justify-between gap-2 border-b border-jutge-border px-1"
        style={{ height: CHART_HEIGHT_PX }}
      >
        {days.map((day, index) => {
          const isPeak = day.key === peakKey && day.count > 0
          const barHeight =
            day.count === 0
              ? 0
              : Math.max(6, Math.round((day.count / maxCount) * CHART_HEIGHT_PX))

          return (
            <HistogramColumn
              key={day.key}
              columnId={day.key}
              count={day.count}
              chartHeight={CHART_HEIGHT_PX}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              isPeak={isPeak}
            >
              <motion.div
                className="w-full min-w-[20px] max-w-[56px]"
                style={{
                  backgroundColor: isPeak ? "var(--jutge-green)" : "var(--jutge-blue)",
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
                isPeak || isHovered ? "font-bold text-jutge-text" : "text-jutge-muted"
              }`}
            >
              {SHORT_LABELS[day.key] ?? day.label.slice(0, 3)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
