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
      className={`flex h-full min-h-0 flex-col gap-6 px-6 py-10 md:px-12 ${
        align === "start" ? "justify-start" : "justify-center"
      }`}
    >
      {eyebrow && <p className="jutge-eyebrow">{eyebrow}</p>}
      <h1 className="jutge-title">{title}</h1>
      {subtitle && <p className="jutge-subtitle">{subtitle}</p>}
      {children && <div className="flex-1">{children}</div>}
    </div>
  )
}
