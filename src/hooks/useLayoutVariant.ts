import { useEffect, useState } from "react"
import { LAYOUT_WIDE_MEDIA } from "@/lib/layoutBreakpoints"

export type LayoutVariant = "stacked" | "wide"

export function useLayoutVariant(): LayoutVariant {
  const [variant, setVariant] = useState<LayoutVariant>(() =>
    typeof window !== "undefined" &&
    window.matchMedia(LAYOUT_WIDE_MEDIA).matches
      ? "wide"
      : "stacked",
  )

  useEffect(() => {
    const mq = window.matchMedia(LAYOUT_WIDE_MEDIA)
    const update = () => setVariant(mq.matches ? "wide" : "stacked")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return variant
}
