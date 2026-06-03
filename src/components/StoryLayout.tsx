import type { ReactNode } from "react"

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  children?: ReactNode
  /** Use `start` when content is tall (e.g. calendar) so nothing is clipped at the top. */
  align?: "center" | "start"
}

export function StoryLayout({ eyebrow, title, subtitle, children, align = "center" }: Props) {
  return (
    <div
      className={`flex h-full min-h-0 min-w-0 max-w-full flex-col gap-6 overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10 md:px-12 ${
        align === "start" ? "justify-start" : "justify-center"
      }`}
    >
      {eyebrow && <p className="jutge-eyebrow">{eyebrow}</p>}
      <h1 className="jutge-title">{title}</h1>
      {subtitle && <p className="jutge-subtitle">{subtitle}</p>}
      {children && <div className="min-w-0 flex-1 max-w-full">{children}</div>}
    </div>
  )
}
