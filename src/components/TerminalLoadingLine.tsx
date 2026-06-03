import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  DECK_LOADING_CHAR_MS,
  DECK_LOADING_DOT_CYCLES,
  DECK_LOADING_DOT_INTERVAL_MS,
} from "@/features/wrapped/useDeckLoadingUX"

export function TerminalLoadingLine() {
  const { t } = useTranslation()
  const fullText = t("deck.loadingLine")
  const [visibleChars, setVisibleChars] = useState(0)
  const [dots, setDots] = useState(1)

  const typingComplete = visibleChars >= fullText.length

  useEffect(() => {
    setVisibleChars(0)
    setDots(1)

    let charIndex = 0
    const typeId = window.setInterval(() => {
      charIndex += 1
      setVisibleChars(charIndex)
      if (charIndex >= fullText.length) window.clearInterval(typeId)
    }, DECK_LOADING_CHAR_MS)

    return () => window.clearInterval(typeId)
  }, [fullText])

  useEffect(() => {
    if (!typingComplete) return

    setDots(1)
    let step = 0
    const maxSteps = DECK_LOADING_DOT_CYCLES * 3

    const id = window.setInterval(() => {
      step += 1
      setDots((step % 3) + 1)
      if (step >= maxSteps) window.clearInterval(id)
    }, DECK_LOADING_DOT_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [typingComplete, fullText])

  const suffix = typingComplete ? ".".repeat(dots) : ""

  return (
    <div className="jutge-panel max-w-xl">
      <div className="jutge-panel-body font-mono text-sm text-jutge-text">
        <span className="text-jutge-blue">&gt; </span>
        {`${fullText.slice(0, visibleChars)}${suffix}`}
      </div>
    </div>
  )
}
