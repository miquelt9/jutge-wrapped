import { useRef, useState, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { FileJson } from "lucide-react"
import { useSnapshot } from "@/context/SnapshotContext"

type Props = {
  className?: string
  variant?: "default" | "onDark"
}

export function SnapshotLoadButton({ className = "", variant = "default" }: Props) {
  const { t } = useTranslation()
  const { loadFromFile, snapshotError, clearError } = useSnapshot()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    clearError()
    setLoading(true)
    try {
      await loadFromFile(file)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const btnClass =
    variant === "onDark"
      ? "jutge-btn-default border-white/30 bg-transparent text-white hover:bg-white/10"
      : "jutge-btn-default w-full"

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => void onFileChange(e)}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className={`${btnClass} flex items-center justify-center gap-2`}
      >
        <FileJson className="h-4 w-4" />
        {loading ? t("snapshot.loading") : t("snapshot.loadButton")}
      </button>
      {snapshotError && <p className="jutge-alert-danger mt-2">{snapshotError}</p>}
    </div>
  )
}
