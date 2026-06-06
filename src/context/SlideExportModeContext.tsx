import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useReducedMotion } from "framer-motion"

type SlideExportModeContextValue = {
  exportMode: boolean
  setCaptureExportMode: (active: boolean) => void
}

const SlideExportModeContext = createContext<SlideExportModeContextValue>({
  exportMode: false,
  setCaptureExportMode: () => {},
})

export function SlideExportModeProvider({
  deckExportMode = false,
  children,
}: {
  deckExportMode?: boolean
  children: ReactNode
}) {
  const [captureExportMode, setCaptureExportMode] = useState(false)

  const value = useMemo(
    () => ({
      exportMode: deckExportMode || captureExportMode,
      setCaptureExportMode,
    }),
    [deckExportMode, captureExportMode],
  )

  return (
    <SlideExportModeContext.Provider value={value}>
      {children}
    </SlideExportModeContext.Provider>
  )
}

export function useSlideExportMode(): boolean {
  return useContext(SlideExportModeContext).exportMode
}

/** Like framer-motion's useReducedMotion, but also true while capturing a share image. */
export function useAppReducedMotion(): boolean {
  const systemReducedMotion = useReducedMotion()
  const { exportMode } = useContext(SlideExportModeContext)
  return !!(systemReducedMotion || exportMode)
}

/** Briefly enables export layout (e.g. desktop heatmap) while capturing a share image. */
export function useCaptureExportLayout() {
  const { setCaptureExportMode } = useContext(SlideExportModeContext)

  return useCallback(
    async <T,>(run: () => Promise<T>): Promise<T> => {
      setCaptureExportMode(true)
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      try {
        return await run()
      } finally {
        setCaptureExportMode(false)
      }
    },
    [setCaptureExportMode],
  )
}
