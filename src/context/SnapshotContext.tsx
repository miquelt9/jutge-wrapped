import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import i18n from "@/i18n/config"
import { hydrateSnapshot } from "@/features/wrapped/snapshot"
import type { WrappedRawData } from "@/features/wrapped/types"
import { useWrappedPeriod } from "./WrappedContext"

type SnapshotContextValue = {
  snapshot: WrappedRawData | null
  snapshotError: string | null
  isSnapshotMode: boolean
  loadFromFile: (file: File) => Promise<void>
  loadFromJson: (json: unknown) => void
  clearSnapshot: () => void
  clearError: () => void
}

const SnapshotContext = createContext<SnapshotContextValue | null>(null)

export function SnapshotProvider({ children }: { children: ReactNode }) {
  const { setPeriod, clearPeriod } = useWrappedPeriod()
  const [snapshot, setSnapshot] = useState<WrappedRawData | null>(null)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const avatarUrlRef = useRef<string | null>(null)
  const devAutoloadDisabled = useRef(false)

  const revokeAvatar = useCallback(() => {
    if (avatarUrlRef.current) {
      URL.revokeObjectURL(avatarUrlRef.current)
      avatarUrlRef.current = null
    }
  }, [])

  const applySnapshot = useCallback(
    (raw: WrappedRawData) => {
      revokeAvatar()
      if (raw.avatarUrl) avatarUrlRef.current = raw.avatarUrl
      setSnapshot(raw)
      setPeriod(raw.period)
      setSnapshotError(null)
    },
    [revokeAvatar, setPeriod],
  )

  const loadFromJson = useCallback(
    (json: unknown) => {
      try {
        applySnapshot(hydrateSnapshot(json))
      } catch (err) {
        const message =
          err instanceof Error ? err.message : i18n.t("snapshot.readError")
        setSnapshotError(message)
        throw err
      }
    },
    [applySnapshot],
  )

  const loadFromFile = useCallback(
    async (file: File) => {
      const text = await file.text()
      let json: unknown
      try {
        json = JSON.parse(text) as unknown
      } catch {
        throw new Error(i18n.t("snapshot.invalidJson"))
      }
      loadFromJson(json)
    },
    [loadFromJson],
  )

  const clearSnapshot = useCallback(() => {
    devAutoloadDisabled.current = true
    revokeAvatar()
    setSnapshot(null)
    setSnapshotError(null)
    clearPeriod()
  }, [revokeAvatar, clearPeriod])

  const clearError = useCallback(() => setSnapshotError(null), [])

  useEffect(() => {
    const path = import.meta.env.VITE_SNAPSHOT_PATH
    if (!import.meta.env.DEV || !path || snapshot || devAutoloadDisabled.current) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(path)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as unknown
        if (!cancelled) loadFromJson(json)
      } catch (err) {
        if (!cancelled) {
          console.warn("[snapshot] VITE_SNAPSHOT_PATH load failed:", err)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadFromJson, snapshot])

  useEffect(() => () => revokeAvatar(), [revokeAvatar])

  const value = useMemo(
    () => ({
      snapshot,
      snapshotError,
      isSnapshotMode: snapshot !== null,
      loadFromFile,
      loadFromJson,
      clearSnapshot,
      clearError,
    }),
    [snapshot, snapshotError, loadFromFile, loadFromJson, clearSnapshot, clearError],
  )

  return <SnapshotContext.Provider value={value}>{children}</SnapshotContext.Provider>
}

export function useSnapshot() {
  const ctx = useContext(SnapshotContext)
  if (!ctx) throw new Error("useSnapshot must be used within SnapshotProvider")
  return ctx
}
