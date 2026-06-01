type Props = {
  label: string
  value: string
  hint?: string
  variant?: "default" | "green" | "red" | "orange" | "blue"
}

const variantClass = {
  default: "jutge-panel",
  green: "jutge-metric-green",
  red: "jutge-metric-red",
  orange: "jutge-metric-orange",
  blue: "jutge-metric-blue",
} as const

export function StatCard({ label, value, hint, variant = "default" }: Props) {
  const isMetric = variant !== "default"
  return (
    <div className={`p-4 ${variantClass[variant]}`}>
      <p className={`text-xs font-bold uppercase ${isMetric ? "text-white/90" : "text-jutge-muted"}`}>
        {label}
      </p>
      <p
        className={`jutge-score mt-1 text-lg ${isMetric ? "text-white" : "text-jutge-text"}`}
      >
        {value}
      </p>
      {hint && (
        <p className={`mt-1 text-xs leading-snug ${isMetric ? "text-white/80" : "text-jutge-muted"}`}>
          {hint}
        </p>
      )}
    </div>
  )
}
