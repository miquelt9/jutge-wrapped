import { useCallback, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { DistributionItem } from "@/features/wrapped/types"

/** SVG coordinate space; rendered size scales with container (max 400px). */
export const DISTRIBUTION_DONUT_SIZE = 400

function centerTitleFontSize(size: number, label: string): number {
  if (label.length > 8) return size * 0.09
  if (label.length > 5) return size * 0.1
  if (label.length > 4 || /[+]{2,}/.test(label)) return size * 0.095
  return size * 0.11
}

function formatCenterPercent(percent: number): string {
  const rounded = Math.round(percent * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

type Arc = {
  item: DistributionItem
  dash: number
  offset: number
  index: number
  color: string
  startDeg: number
  spanDeg: number
}

type Props = {
  items: DistributionItem[]
  size?: number
  getColor: (item: DistributionItem) => string
  centerItems: DistributionItem[]
  formatCenterLabel?: (item: DistributionItem) => string
  ariaLabel: string
}

function buildArcs(
  segments: DistributionItem[],
  total: number,
  circumference: number,
  getColor: (item: DistributionItem) => string,
): Arc[] {
  let offset = 0
  let startDeg = 0
  return segments.map((item, index) => {
    const dash = (item.count / total) * circumference
    const spanDeg = (dash / circumference) * 360
    const arc: Arc = {
      item,
      dash,
      offset,
      index,
      color: getColor(item),
      startDeg,
      spanDeg,
    }
    offset += dash
    startDeg += spanDeg
    return arc
  })
}

function hitTest(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  size: number,
  radius: number,
  strokeWidth: number,
  arcs: Arc[],
): Arc | null {
  const x = ((clientX - rect.left) / rect.width) * size
  const y = ((clientY - rect.top) / rect.height) * size
  const cx = size / 2
  const cy = size / 2
  const dist = Math.hypot(x - cx, y - cy)
  const inner = radius - strokeWidth / 2 - 4
  const outer = radius + strokeWidth / 2 + 8
  if (dist < inner || dist > outer) return null

  let angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI
  angle = (angle + 90 + 360) % 360

  for (const arc of arcs) {
    if (angle >= arc.startDeg && angle < arc.startDeg + arc.spanDeg) return arc
  }
  return arcs[arcs.length - 1] ?? null
}

export function DistributionDonut({
  items,
  size: coordinateSize = DISTRIBUTION_DONUT_SIZE,
  getColor,
  centerItems,
  formatCenterLabel = (item) => item.key,
  ariaLabel,
}: Props) {
  const size = coordinateSize
  const reduceMotion = useReducedMotion()
  const [selected, setSelected] = useState<DistributionItem | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const segments = useMemo(() => items.filter((i) => i.count > 0), [items])
  const total = segments.reduce((s, i) => s + i.count, 0) || 1

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38
  const strokeWidth = size * 0.095
  const circumference = 2 * Math.PI * radius
  const arcs = useMemo(
    () => buildArcs(segments, total, circumference, getColor),
    [segments, total, circumference, getColor],
  )

  const segmentDuration = reduceMotion ? 0 : 0.45
  const segmentStagger = reduceMotion ? 0 : 0.07
  const ringDoneAt = arcs.length * segmentStagger + segmentDuration

  const pickArc = useCallback(
    (clientX: number, clientY: number, svg: SVGSVGElement | null) => {
      if (!svg) return null
      return hitTest(
        clientX,
        clientY,
        svg.getBoundingClientRect(),
        size,
        radius,
        strokeWidth,
        arcs,
      )
    },
    [arcs, radius, size, strokeWidth],
  )

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const arc = pickArc(e.clientX, e.clientY, e.currentTarget)
    setHoveredKey(arc?.item.key ?? null)
  }

  const onPointerLeave = () => setHoveredKey(null)

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation()
    const arc = pickArc(e.clientX, e.clientY, e.currentTarget)
    if (arc) setSelected(arc.item)
  }

  const activeKey = selected?.key ?? hoveredKey

  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[min(400px,100%)]"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel}
        className="h-full w-full cursor-pointer touch-none"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
      >
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {arcs.map(({ item, dash, offset: segOffset, index, color }) => {
            const active = item.key === activeKey
            const w = active ? strokeWidth * 1.22 : strokeWidth
            return (
              <motion.circle
                key={item.key}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={w}
                strokeLinecap="butt"
                opacity={activeKey && !active ? 0.45 : 1}
                initial={{
                  strokeDasharray: `0 ${circumference}`,
                  strokeDashoffset: -segOffset,
                }}
                animate={{
                  strokeDasharray: `${dash} ${circumference - dash}`,
                  strokeDashoffset: -segOffset,
                }}
                transition={{
                  strokeDasharray: {
                    duration: segmentDuration,
                    delay: index * segmentStagger,
                    ease: [0.4, 0, 0.2, 1],
                  },
                  strokeWidth: { duration: 0.15 },
                  opacity: { duration: 0.15 },
                }}
              />
            )
          })}
        </g>
      </svg>

      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.key}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className="jutge-score max-w-full truncate leading-tight font-bold sm:whitespace-nowrap"
                style={{
                  fontSize: centerTitleFontSize(
                    size,
                    formatCenterLabel(selected),
                  ),
                  color: getColor(selected),
                }}
              >
                {formatCenterLabel(selected)}
              </p>
              <p
                className="jutge-score text-jutge-text mt-1 font-bold sm:whitespace-nowrap"
                style={{ fontSize: size * 0.082 }}
              >
                {formatCenterPercent(selected.percent)}
              </p>
              <p className="text-jutge-muted mt-1.5 text-[11px]">
                {selected.count} of {total}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                delay: reduceMotion ? 0 : ringDoneAt * 0.5,
                duration: 0.3,
              }}
              className="flex flex-col gap-0.5"
              style={{ fontSize: size * 0.05 }}
            >
              {centerItems.map((item, i) => (
                <motion.p
                  key={item.key}
                  className="jutge-score leading-tight"
                  style={{ color: getColor(item) }}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : ringDoneAt * 0.5 + i * 0.05,
                    duration: 0.2,
                  }}
                >
                  <span className="font-bold">{item.count}</span>{" "}
                  {formatCenterLabel(item)}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
