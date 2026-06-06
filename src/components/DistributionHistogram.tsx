import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import type { DistributionItem } from "@/features/wrapped/types"

const CHART_HEIGHT_PX = 168

type Props = {
  items: DistributionItem[]
  peakKey?: string | null
  maxBars?: number
  /** Use each item's color (e.g. Jutge compiler hex) instead of blue/green */
  coloredBars?: boolean
}

function shortLabel(item: DistributionItem): string {
  const text = item.key.length <= 10 ? item.key : item.label
  return text.length > 12 ? `${text.slice(0, 11)}…` : text
}

export function DistributionHistogram({
  items,
  peakKey,
  maxBars = 6,
  coloredBars = false,
}: Props) {
  const reduceMotion = useReducedMotion()
  const bars = items.filter((i) => i.count > 0).slice(0, maxBars)
  const maxCount = Math.max(...bars.map((d) => d.count), 1)
  const peak = peakKey ?? bars[0]?.key

  return (
    <div>
      <div
        className="border-jutge-border flex items-end justify-between gap-2 border-b px-1"
        style={{ height: CHART_HEIGHT_PX }}
      >
        {bars.map((item, index) => {
          const isPeak = item.key === peak && item.count > 0
          const barHeight =
            item.count === 0
              ? 0
              : Math.max(
                  6,
                  Math.round((item.count / maxCount) * CHART_HEIGHT_PX),
                )
          const fill = coloredBars
            ? (item.color ?? "var(--jutge-orange)")
            : isPeak
              ? "var(--jutge-green)"
              : "var(--jutge-blue)"

          return (
            <div
              key={item.key}
              className="flex min-w-0 flex-1 flex-col items-center justify-end"
              style={{ height: CHART_HEIGHT_PX }}
            >
              {isPeak && (
                <span className="text-jutge-text mb-1 font-mono text-[10px] font-bold">
                  {item.count}
                </span>
              )}
              <motion.div
                className="w-full max-w-[64px] min-w-[18px]"
                style={{
                  backgroundColor: fill,
                  borderRadius: 0,
                  boxShadow: isPeak
                    ? "inset 0 0 0 2px var(--jutge-nav)"
                    : undefined,
                }}
                initial={{ height: reduceMotion ? barHeight : 0 }}
                animate={{ height: barHeight }}
                transition={{
                  duration: reduceMotion ? 0 : 0.45,
                  delay: reduceMotion ? 0 : index * 0.06,
                  ease: [0.4, 0, 0.2, 1],
                }}
                title={`${item.label}: ${item.count} submissions (${item.percent}%)`}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between gap-1 px-1">
        {bars.map((item) => {
          const isPeak = item.key === peak && item.count > 0
          return (
            <span
              key={item.key}
              className={`flex-1 truncate text-center font-mono text-[10px] leading-tight sm:text-[11px] ${
                isPeak ? "text-jutge-text font-bold" : "text-jutge-muted"
              }`}
              title={item.label}
            >
              {shortLabel(item)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
