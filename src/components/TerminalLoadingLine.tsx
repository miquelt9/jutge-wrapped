import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useReducedMotion } from "framer-motion"
import {
  charTypingDelay,
  pickStumbleIndex,
  pickTypoIndex,
  randomBetween,
  typoChar,
} from "@/features/wrapped/deckLoadingAnimation"
import {
  DECK_LOADING_DOT_CYCLES,
  DECK_LOADING_DOT_INTERVAL_MS,
} from "@/features/wrapped/useDeckLoadingUX"

function schedule(
  fn: () => void,
  ms: number,
  timeouts: number[],
): number {
  const id = window.setTimeout(fn, ms)
  timeouts.push(id)
  return id
}

export function TerminalLoadingLine() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const fullText = t("deck.loadingLine")
  const [displayText, setDisplayText] = useState("")
  const [dots, setDots] = useState(1)
  const [typingComplete, setTypingComplete] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const [cursorGlitch, setCursorGlitch] = useState(false)
  const [panelFlicker, setPanelFlicker] = useState(false)

  useEffect(() => {
    if (typingComplete || reduceMotion) return

    const blinkId = window.setInterval(() => {
      setCursorVisible((visible) => !visible)
    }, 530)

    return () => window.clearInterval(blinkId)
  }, [typingComplete, reduceMotion])

  useEffect(() => {
    if (reduceMotion) {
      setDisplayText(fullText)
      setTypingComplete(true)
      setDots(1)
      return
    }

    let cancelled = false
    const timeouts: number[] = []
    const typoIndex = pickTypoIndex(fullText)
    const stumbleIndex = pickStumbleIndex(fullText, typoIndex)
    const flickerIndex = Math.floor(fullText.length * 0.42)

    let index = 0
    let text = ""

    const finishTyping = () => {
      if (!cancelled) setTypingComplete(true)
    }

    const typeNext = () => {
      if (cancelled) return

      if (index >= fullText.length) {
        finishTyping()
        return
      }

      if (index === stumbleIndex && text.length >= 2) {
        text = text.slice(0, -2)
        setDisplayText(text)
        index -= 2
        setCursorGlitch(true)
        schedule(
          () => {
            setCursorGlitch(false)
            schedule(typeNext, randomBetween(220, 360), timeouts)
          },
          randomBetween(90, 150),
          timeouts,
        )
        return
      }

      const char = fullText[index] ?? ""
      const pauseBeforeChar =
        index > 0 && fullText[index - 1] === " " && Math.random() < 0.22

      const emitChar = () => {
        if (cancelled) return

        if (index === typoIndex) {
          const wrong = typoChar(char)
          text += wrong
          setDisplayText(text)
          schedule(
            () => {
              if (cancelled) return
              text = text.slice(0, -1)
              setDisplayText(text)
              schedule(
                () => {
                  if (cancelled) return
                  text += char
                  setDisplayText(text)
                  index += 1
                  schedule(typeNext, charTypingDelay(char), timeouts)
                },
                randomBetween(45, 95),
                timeouts,
              )
            },
            randomBetween(80, 150),
            timeouts,
          )
          return
        }

        if (index === flickerIndex) {
          setPanelFlicker(true)
          schedule(() => setPanelFlicker(false), 65, timeouts)
        }

        text += char
        setDisplayText(text)
        index += 1
        schedule(typeNext, charTypingDelay(char), timeouts)
      }

      if (pauseBeforeChar) {
        schedule(emitChar, randomBetween(120, 260), timeouts)
      } else {
        emitChar()
      }
    }

    setDisplayText("")
    setTypingComplete(false)
    setDots(1)
    setCursorVisible(true)
    setCursorGlitch(false)
    setPanelFlicker(false)

    schedule(typeNext, randomBetween(180, 420), timeouts)

    return () => {
      cancelled = true
      timeouts.forEach((id) => window.clearTimeout(id))
    }
  }, [fullText, reduceMotion])

  useEffect(() => {
    if (!typingComplete) return

    setDots(1)
    let step = 0
    const maxSteps = DECK_LOADING_DOT_CYCLES * 3
    const timeouts: number[] = []

    const tick = () => {
      step += 1
      setDots((step % 3) + 1)
      if (step >= maxSteps) return

      const jitter = randomBetween(-35, 55)
      schedule(tick, DECK_LOADING_DOT_INTERVAL_MS + jitter, timeouts)
    }

    schedule(tick, DECK_LOADING_DOT_INTERVAL_MS, timeouts)

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id))
    }
  }, [typingComplete, fullText])

  const suffix = typingComplete ? ".".repeat(dots) : ""
  const showCursor = !typingComplete && !reduceMotion

  return (
    <div
      className={`jutge-panel max-w-xl transition-opacity duration-75 ${panelFlicker ? "opacity-60" : "opacity-100"}`}
    >
      <div className="jutge-panel-body text-jutge-text font-mono text-sm">
        <span className="text-jutge-blue">&gt; </span>
        <span>
          {`${displayText}${suffix}`}
          {showCursor && (
            <span
              aria-hidden
              className={`text-jutge-blue ${cursorGlitch ? "opacity-40" : cursorVisible ? "opacity-100" : "opacity-0"}`}
            >
              {cursorGlitch ? "██" : "▌"}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
