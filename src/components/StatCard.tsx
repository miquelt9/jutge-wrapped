type Props = {
  label: string
  value: string
  hint?: string
  variant?:
    | "default"
    | "green"
    | "red"
    | "orange"
    | "blue"
    | "primary"
    | "neutral"
}

const variantClass = {
  default: "jutge-panel",
  green: "jutge-metric-green",
  red: "jutge-metric-red",
  orange: "jutge-metric-orange",
  blue: "jutge-metric-blue",
  primary: "jutge-metric-primary",
  neutral: "jutge-metric-neutral",
} as const

export function StatCard({ label, value, hint, variant = "default" }: Props) {
  const isColoredMetric = variant !== "default" && variant !== "neutral"
  return (
    <div className={`p-4 ${variantClass[variant]}`}>
      <p
        className={`text-xs font-bold uppercase ${isColoredMetric ? "text-white/90" : "text-jutge-muted"}`}
      >
        {label}
      </p>
      <p
        className={`jutge-score mt-1 text-lg ${isColoredMetric ? "text-white" : "text-jutge-text"}`}
      >
        {value}
      </p>
      {hint && (
        <p
          className={`mt-1 text-xs leading-snug ${isColoredMetric ? "text-white/80" : "text-jutge-muted"}`}
        >
          {hint}
        </p>
      )}
    </div>
  )
}
