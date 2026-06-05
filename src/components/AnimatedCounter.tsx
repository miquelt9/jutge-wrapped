import { useEffect, useState } from "react"
import { animate, useReducedMotion } from "framer-motion"
import { EASE_OUT } from "./motionPresets"

const START_FRACTION = 0.12
const MIN_DURATION = 1.7
const MAX_DURATION = 3.4
const DURATION_PER_UNIT = 40

type Props = {
  value: number
  className?: string
  /** Fraction of the target value to start from (default 0.12). */
  startFraction?: number
  locale?: string
}

export function getCounterStartValue(
  value: number,
  startFraction: number,
): number {
  if (value <= 0) return 0
  const fromFraction = Math.floor(value * startFraction)
  return Math.min(value - 1, fromFraction)
}

export function getCounterDuration(value: number): number {
  const span = Math.abs(value)
  return Math.min(MAX_DURATION, MIN_DURATION + span / DURATION_PER_UNIT)
}

function formatPercentValue(value: number, decimals: number): string {
  if (decimals <= 0) return String(Math.round(value))
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

type AnimatedPercentProps = {
  value: number
  className?: string
  decimals?: number
  /** Explicit start (e.g. 100 for a count-down). Overrides startFraction. */
  from?: number
  startFraction?: number
  /** When false, omit the trailing % (e.g. when i18n supplies it). */
  showSuffix?: boolean
}

export function AnimatedPercent({
  value,
  className,
  decimals = 0,
  from,
  startFraction = START_FRACTION,
  showSuffix = true,
}: AnimatedPercentProps) {
  const reduceMotion = useReducedMotion()
  const startValue =
    from ??
    (decimals > 0
      ? Math.max(0, value * startFraction)
      : getCounterStartValue(value, startFraction))
  const [display, setDisplay] = useState(reduceMotion ? value : startValue)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      return
    }

    const fromValue =
      from ??
      (decimals > 0
        ? Math.max(0, value * startFraction)
        : getCounterStartValue(value, startFraction))
    const controls = animate(fromValue, value, {
      duration: getCounterDuration(Math.abs(fromValue - value)),
      ease: EASE_OUT,
      onUpdate: (latest) => setDisplay(latest),
    })

    return () => controls.stop()
  }, [decimals, from, reduceMotion, startFraction, value])

  const formatted = formatPercentValue(display, decimals)
  return (
    <span className={className}>
      {formatted}
      {showSuffix ? "%" : null}
    </span>
  )
}

/** Start a few percentage points above the target, capped at 100%. */
export function getDescendingPercentStart(value: number): number {
  if (value <= 0) return 100
  if (value >= 100) return value
  const offset = Math.min(15, Math.max(3, value * 1.5))
  return Math.min(100, value + offset)
}

/** Counts down from slightly above the target to the final top-user %. */
export function AnimatedDescendingPercent(
  props: Omit<AnimatedPercentProps, "from" | "startFraction">,
) {
  const { value, decimals = 2, ...rest } = props
  const from = getDescendingPercentStart(value)
  return (
    <AnimatedPercent value={value} from={from} decimals={decimals} {...rest} />
  )
}

export function AnimatedCounter({
  value,
  className,
  startFraction = START_FRACTION,
  locale,
}: Props) {
  const reduceMotion = useReducedMotion()
  const startValue = getCounterStartValue(value, startFraction)
  const [display, setDisplay] = useState(reduceMotion ? value : startValue)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      return
    }

    const from = getCounterStartValue(value, startFraction)
    const controls = animate(from, value, {
      duration: getCounterDuration(value),
      ease: EASE_OUT,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })

    return () => controls.stop()
  }, [reduceMotion, startFraction, value])

  return (
    <span className={className}>
      {display.toLocaleString(locale)}
    </span>
  )
}
