import { useEffect, useRef, useState, type ReactNode } from "react"

const MIN_DONUT_PX = 220
const MAX_DONUT_PX = 720

type Props = {
  children: (displaySize: number) => ReactNode
}

/** Fills remaining slide space and sizes a square donut chart to fit. */
export function DonutChartPanel({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [displaySize, setDisplaySize] = useState(MIN_DONUT_PX)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      const fit = Math.floor(Math.min(width, height))
      setDisplaySize(
        Math.max(MIN_DONUT_PX, Math.min(fit, MAX_DONUT_PX)),
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  return (
    <div className="jutge-panel flex min-h-0 flex-1 flex-col">
      <div
        ref={ref}
        className="jutge-chart-panel-body flex min-h-[min(420px,calc(100dvh-18rem))] flex-1 items-center justify-center py-4 md:min-h-[min(520px,calc(100dvh-16rem))] md:py-6"
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
