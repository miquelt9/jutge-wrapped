import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLayoutVariant, type LayoutVariant } from "@/hooks/useLayoutVariant"

const MIN_DONUT_PX_WIDE = 220
const MAX_DONUT_PX_WIDE = 680
const MIN_DONUT_PX_STACKED = 280
const MAX_DONUT_PX_STACKED = 440
const WIDE_SIZE_SCALE = 1

type Props = {
  children: (displaySize: number) => ReactNode
  /** Defaults to viewport-based stacked vs wide from `useLayoutVariant`. */
  variant?: LayoutVariant
}

/** Sizes a square donut chart to fit its panel; stacked layouts use a smaller max size. */
export function DonutChartPanel({ children, variant: variantProp }: Props) {
  const layoutVariant = useLayoutVariant()
  const variant = variantProp ?? layoutVariant
  const ref = useRef<HTMLDivElement>(null)
  const minSize = variant === "wide" ? MIN_DONUT_PX_WIDE : MIN_DONUT_PX_STACKED
  const maxSize = variant === "wide" ? MAX_DONUT_PX_WIDE : MAX_DONUT_PX_STACKED
  const [displaySize, setDisplaySize] = useState(minSize)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      const fit =
        variant === "wide"
          ? Math.floor(Math.min(width, height) * WIDE_SIZE_SCALE)
          : Math.floor(width)
      setDisplaySize(Math.max(minSize, Math.min(fit, maxSize)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [maxSize, minSize, variant])

  return (
    <div
      ref={ref}
      className={`jutge-donut-panel-body w-full ${
        variant === "wide" ? "jutge-donut-panel-body--hero" : ""
      }`}
    >
      <div
        className="mx-auto shrink-0"
        style={{ width: displaySize, height: displaySize }}
      >
        {children(displaySize)}
      </div>
    </div>
  )
}
