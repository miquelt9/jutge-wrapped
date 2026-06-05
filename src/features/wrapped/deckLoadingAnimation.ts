/** Average per-character delay for deck loading typing (ms). */
export const DECK_LOADING_CHAR_MS_AVG = 58
/** Extra time budget for one typo + correction sequence. */
export const DECK_LOADING_TYPO_OVERHEAD_MS = 300
/** Extra time budget for a brief backspace-and-retry stumble. */
export const DECK_LOADING_STUMBLE_OVERHEAD_MS = 420
/** Extra time budget for a short panel flicker. */
export const DECK_LOADING_GLITCH_OVERHEAD_MS = 140
/** Rough pause budget per word boundary. */
export const DECK_LOADING_WORD_PAUSE_MS = 160

export function randomBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const LETTER = /[a-zA-ZàáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ]/

const QWERTY_NEIGHBORS: Record<string, string> = {
  a: "s",
  b: "v",
  c: "x",
  d: "f",
  e: "r",
  f: "g",
  g: "h",
  h: "j",
  i: "o",
  j: "k",
  k: "l",
  l: "k",
  m: "n",
  n: "m",
  o: "i",
  p: "o",
  q: "w",
  r: "t",
  s: "d",
  t: "r",
  u: "y",
  v: "c",
  w: "q",
  x: "c",
  y: "u",
  z: "x",
}

export function typoChar(char: string): string {
  const lower = char.toLowerCase()
  const neighbor = QWERTY_NEIGHBORS[lower]
  if (!neighbor) {
    const code = lower.charCodeAt(0)
    if (code >= 97 && code <= 122) {
      const shifted = String.fromCharCode(97 + ((code - 97 + 1) % 26))
      return char === lower ? shifted : shifted.toUpperCase()
    }
    return char
  }
  return char === lower ? neighbor : neighbor.toUpperCase()
}

function letterIndices(text: string): number[] {
  const indices: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    if (LETTER.test(text[i] ?? "")) indices.push(i)
  }
  return indices
}

export function pickTypoIndex(text: string): number | null {
  const candidates = letterIndices(text).filter((index) => index > 2)
  if (candidates.length < 5) return null
  return candidates[hashString(text) % candidates.length] ?? null
}

export function pickStumbleIndex(
  text: string,
  typoIndex: number | null,
): number | null {
  if (text.length < 18) return null

  const target = Math.floor(text.length * 0.58)
  const candidates = letterIndices(text).filter(
    (index) =>
      index > 4 &&
      index < text.length - 2 &&
      index !== typoIndex &&
      text[index - 1] === " ",
  )
  if (candidates.length === 0) return null

  let best = candidates[0]!
  let bestDistance = Math.abs(best - target)
  for (const index of candidates) {
    const distance = Math.abs(index - target)
    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  }
  return best
}

export function charTypingDelay(char: string): number {
  if (char === " ") return randomBetween(55, 95)
  if (/[.,;:!?]/.test(char)) return randomBetween(90, 170)
  return randomBetween(28, 72)
}

export function countWordBoundaries(text: string): number {
  let count = 0
  for (let i = 1; i < text.length; i += 1) {
    if (text[i - 1] === " ") count += 1
  }
  return count
}

export function deckLoadingAnimationBudgetMs(textLength: number): number {
  const typingMs = textLength * DECK_LOADING_CHAR_MS_AVG
  const pauseMs = Math.ceil(textLength / 6) * DECK_LOADING_WORD_PAUSE_MS * 0.15
  const typoMs = textLength >= 10 ? DECK_LOADING_TYPO_OVERHEAD_MS : 0
  const stumbleMs = textLength >= 18 ? DECK_LOADING_STUMBLE_OVERHEAD_MS : 0
  const glitchMs = textLength >= 12 ? DECK_LOADING_GLITCH_OVERHEAD_MS : 0
  return typingMs + pauseMs + typoMs + stumbleMs + glitchMs
}
