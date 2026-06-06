import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Calendar, FileJson, Loader2, LogOut, MoreVertical } from "lucide-react"
import { LanguageSelect } from "@/components/LanguageSelect"
import { ThemeSelect } from "@/components/ThemeSelect"
import { downloadSnapshotJson } from "@/features/wrapped/snapshot"
import type { WrappedRawData } from "@/features/wrapped/types"

type Props = {
  raw: WrappedRawData
  onChangeDates: () => void
  onExit: () => void
  className?: string
}

function MenuActionRow({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="text-jutge-text hover:bg-jutge-btn-default-hover flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:opacity-40"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function DeckNavOverflowMenu({
  raw,
  onChangeDates,
  onExit,
  className = "",
}: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function close() {
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close()
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close()
    }

    window.addEventListener("mousedown", onPointerDown)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  async function handleDownloadJson() {
    setDownloading(true)
    try {
      await downloadSnapshotJson(raw)
      close()
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  const menuLabel = t("deck.menu")

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("deck.menuAria")}
        title={menuLabel}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((value) => !value)
        }}
        className="jutge-btn-default flex shrink-0 items-center gap-1 border-white/30 bg-transparent px-2 text-white hover:bg-white/10"
      >
        <MoreVertical className="h-4 w-4 shrink-0" />
        <span className="sr-only">{menuLabel}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="jutge-panel border-jutge-border absolute top-full right-0 z-50 mt-1 max-w-[calc(100vw-2rem)] min-w-[17rem] overflow-hidden border py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <MenuActionRow
            icon={
              downloading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 shrink-0" />
              )
            }
            label={
              downloading ? t("snapshot.downloading") : t("deck.downloadJson")
            }
            onClick={() => void handleDownloadJson()}
            disabled={downloading}
          />
          <MenuActionRow
            icon={<Calendar className="h-4 w-4 shrink-0" />}
            label={t("deck.changeDates")}
            onClick={() => {
              onChangeDates()
              close()
            }}
          />
          <div
            role="none"
            className="border-jutge-border border-t px-3 py-2"
          >
            <ThemeSelect className="w-full justify-between" />
          </div>
          <div role="none" className="px-3 py-2">
            <LanguageSelect className="w-full justify-between" />
          </div>
          <div role="none" className="border-jutge-border border-t">
            <MenuActionRow
              icon={<LogOut className="h-4 w-4 shrink-0" />}
              label={t("deck.exit")}
              onClick={() => {
                onExit()
                close()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
