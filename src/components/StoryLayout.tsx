import type { ReactNode } from "react"

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  children?: ReactNode
}

export function StoryLayout({ eyebrow, title, subtitle, children }: Props) {
  return (
    <div className="flex h-full flex-col justify-center gap-6 px-6 py-10 md:px-12">
      {eyebrow && <p className="jutge-eyebrow">{eyebrow}</p>}
      <h1 className="jutge-title">{title}</h1>
      {subtitle && <p className="jutge-subtitle">{subtitle}</p>}
      {children && <div className="flex-1">{children}</div>}
    </div>
  )
}
