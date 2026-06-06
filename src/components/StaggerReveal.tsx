import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { staggerContainer, staggerItem } from "./motionPresets"

type GroupProps = {
  children: ReactNode
  className?: string
}

export function StaggerGroup({ children, className }: GroupProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer(reduceMotion)}
    >
      {children}
    </motion.div>
  )
}

type ItemProps = {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: ItemProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div className={className} variants={staggerItem(reduceMotion)}>
      {children}
    </motion.div>
  )
}
