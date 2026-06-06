import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"

type Props = {
  total: number
  current: number
  /** Use on dark navbar */
  onDark?: boolean
}

export function ProgressDots({ total, current, onDark }: Props) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => {
        const active = i === current
        return (
          <motion.span
            key={i}
            layout={!reduceMotion}
            className={`h-2 ${
              active
                ? onDark
                  ? "bg-white"
                  : "bg-jutge-blue"
                : onDark
                  ? "bg-white/35"
                  : "bg-jutge-border"
            }`}
            style={{ borderRadius: 0 }}
            animate={{ width: active ? 24 : 8, opacity: active ? 1 : 0.7 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 32 }
            }
          />
        )
      })}
    </div>
  )
}
