import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { WrappedPeriod } from "@/features/wrapped/period"

type WrappedContextValue = {
  period: WrappedPeriod | null
  setPeriod: (period: WrappedPeriod) => void
  clearPeriod: () => void
}

const WrappedContext = createContext<WrappedContextValue | null>(null)

export function WrappedProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<WrappedPeriod | null>(null)

  const setPeriod = useCallback((next: WrappedPeriod) => {
    setPeriodState(next)
  }, [])

  const clearPeriod = useCallback(() => {
    setPeriodState(null)
  }, [])

  const value = useMemo(
    () => ({ period, setPeriod, clearPeriod }),
    [period, setPeriod, clearPeriod],
  )

  return (
    <WrappedContext.Provider value={value}>{children}</WrappedContext.Provider>
  )
}

export function useWrappedPeriod() {
  const ctx = useContext(WrappedContext)
  if (!ctx)
    throw new Error("useWrappedPeriod must be used within WrappedProvider")
  return ctx
}
