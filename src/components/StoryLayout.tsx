import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "./motionPresets"

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  children?: ReactNode
  /** Use `start` when content is tall (e.g. calendar) so nothing is clipped at the top. */
  align?: "center" | "start"
}

export function StoryLayout({
  eyebrow,
  title,
  subtitle,
  children,
  align = "center",
}: Props) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className={`flex h-full min-h-0 max-w-full min-w-0 flex-col gap-6 overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10 md:px-12 ${
        align === "start" ? "justify-start" : "justify-center"
      }`}
    >
      {eyebrow && (
        <motion.p
          className="jutge-eyebrow"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.04)}
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h1
        className="jutge-title"
        initial={fadeUpHidden(reduceMotion)}
        animate={fadeUpVisible()}
        transition={fadeUpTransition(reduceMotion, eyebrow ? 0.1 : 0.04)}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          className="jutge-subtitle"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, eyebrow ? 0.16 : 0.1)}
        >
          {subtitle}
        </motion.p>
      )}
      {children && (
        <motion.div
          className="flex max-w-full min-w-0 flex-1 flex-col min-h-0"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, eyebrow ? 0.22 : 0.16)}
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}
