type Props = {
  total: number
  current: number
  /** Use on dark navbar */
  onDark?: boolean
}

export function ProgressDots({ total, current, onDark }: Props) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 ${
            i === current
              ? `w-6 ${onDark ? "bg-white" : "bg-jutge-blue"}`
              : `w-2 ${onDark ? "bg-white/35" : "bg-jutge-border"}`
          }`}
          style={{ borderRadius: 0 }}
        />
      ))}
    </div>
  )
}
