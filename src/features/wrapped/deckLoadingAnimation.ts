/** Average per-character delay for deck loading typing (ms). */
export const DECK_LOADING_CHAR_MS_AVG = 58
/** Extra time budget for a mid-line typing hesitation. */
export const DECK_LOADING_HESITATION_OVERHEAD_MS = 320
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

function letterIndices(text: string): number[] {
  const indices: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    if (LETTER.test(text[i] ?? "")) indices.push(i)
  }
  return indices
}

export function hesitationCountForLength(textLength: number): number {
  if (textLength < 10) return 0
  if (textLength < 18) return 1
  return 2
}

export function pickHesitationIndices(text: string): number[] {
  const count = hesitationCountForLength(text.length)
  if (count === 0) return []

  const candidates = letterIndices(text).filter(
    (index) => index > 2 && index < text.length - 2,
  )
  if (candidates.length === 0) return []

  const indices: number[] = []
  const used = new Set<number>()

  for (let n = 0; n < count; n += 1) {
    const pool = candidates.filter(
      (index) =>
        !used.has(index) &&
        !indices.some((picked) => Math.abs(picked - index) < 4),
    )
    if (pool.length === 0) break

    const pick = pool[hashString(`${text}:${n}`) % pool.length]!
    indices.push(pick)
    used.add(pick)
  }

  return indices.sort((a, b) => a - b)
}

export function hesitationPauseMs(): number {
  return randomBetween(260, 480)
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
  const hesitationMs =
    hesitationCountForLength(textLength) * DECK_LOADING_HESITATION_OVERHEAD_MS
  const glitchMs = textLength >= 12 ? DECK_LOADING_GLITCH_OVERHEAD_MS : 0
  return typingMs + pauseMs + hesitationMs + glitchMs
}
