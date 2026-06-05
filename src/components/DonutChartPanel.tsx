import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLayoutVariant, type LayoutVariant } from "@/hooks/useLayoutVariant"

const MIN_DONUT_PX = 220
const MAX_DONUT_PX = 720
const MAX_DONUT_PX_STACKED = 360

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
  const [displaySize, setDisplaySize] = useState(MIN_DONUT_PX)
  const maxSize = variant === "wide" ? MAX_DONUT_PX : MAX_DONUT_PX_STACKED

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      const fit = Math.floor(Math.min(width, height))
      setDisplaySize(Math.max(MIN_DONUT_PX, Math.min(fit, maxSize)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [maxSize])

  return (
    <div
      className={`jutge-donut-panel ${
        variant === "wide"
          ? "jutge-donut-panel--hero"
          : "jutge-donut-panel--stacked"
      }`}
    >
      <div
        ref={ref}
        className={`jutge-donut-panel-body ${
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
    </div>
  )
}
