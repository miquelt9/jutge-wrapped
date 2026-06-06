import type { ReactNode, Ref, RefObject } from "react"
import type { GestureLock } from "../deckSwipeNavigation"

type Props = {
  offsetVw: -1 | 0 | 1
  translateX: number
  isAnimating: boolean
  swipeTransition: string
  gestureLock: GestureLock | null
  isCurrent?: boolean
  slideExportId?: string
  captureRef?: RefObject<HTMLDivElement | null>
  panelRef?: Ref<HTMLDivElement>
  children: ReactNode
}

export function DeckSlidePanel({
  offsetVw,
  translateX,
  isAnimating,
  swipeTransition,
  gestureLock,
  isCurrent = false,
  slideExportId,
  captureRef,
  panelRef,
  children,
}: Props) {
  const isDragging = translateX !== 0 || isAnimating

  return (
    <div
      ref={panelRef}
      aria-hidden={!isCurrent ? true : undefined}
      className={`absolute inset-0 ${isCurrent ? "" : "pointer-events-none"}`}
      style={{
        transform: `translate3d(calc(${offsetVw * 100}vw + ${translateX}px), 0, 0)`,
        transition: isAnimating ? swipeTransition : "none",
        willChange: isDragging ? "transform" : undefined,
        touchAction: isCurrent && gestureLock === "horizontal" ? "none" : undefined,
      }}
    >
      <div
        className={`h-full overflow-x-hidden ${
          isCurrent ? "jutge-deck-scroller overflow-y-auto" : "overflow-y-auto"
        }`}
      >
        <div
          ref={isCurrent ? captureRef : undefined}
          data-slide-export={isCurrent ? slideExportId : undefined}
          className="bg-jutge-bg flex min-h-full flex-col"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
