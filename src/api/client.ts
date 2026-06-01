import {
  JutgeApiClient,
  NotFoundError,
  UnauthorizedError,
  type Download,
} from "./jutgeClient"

export { JutgeApiClient, NotFoundError, UnauthorizedError }
export * from "./jutgeClient"

export type JutgeClientOptions = {
  apiUrl?: string
  forwardedHost?: string
}

export function createJutgeClient(options: JutgeClientOptions = {}): JutgeApiClient {
  const client = new JutgeApiClient()
  if (options.apiUrl) client.JUTGE_API_URL = options.apiUrl
  if (options.forwardedHost) {
    client.headers = { ...client.headers, "x-forwarded-host": options.forwardedHost }
  }
  return client
}

/** Returns null when the user has no custom Jutge avatar configured. */
export async function fetchStudentAvatar(client: JutgeApiClient): Promise<Download | null> {
  try {
    return await client.student.profile.getAvatar()
  } catch (error) {
    if (error instanceof NotFoundError) return null
    throw error
  }
}

export function downloadToBlobUrl(download: Download): string {
  const blob = new Blob([download.data as BlobPart], {
    type: download.type || "application/octet-stream",
  })
  return URL.createObjectURL(blob)
}

export function downloadToBase64(download: Download): string {
  const bytes = download.data
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

export type ApiErrorKind = "unauthorized" | "network" | "protocol" | "unknown"

export type MappedApiError = {
  kind: ApiErrorKind
  message: string
  raw?: unknown
}

export function mapApiError(error: unknown): MappedApiError {
  if (error instanceof UnauthorizedError) {
    return { kind: "unauthorized", message: error.message, raw: error }
  }
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) {
    return {
      kind: "network",
      message:
        "Could not reach the Jutge API. This is often caused by browser CORS restrictions or network issues.",
      raw: error,
    }
  }
  if (error instanceof Error) {
    const isProtocol = error.name === "ProtocolError" || /multipart|protocol/i.test(error.message)
    return {
      kind: isProtocol ? "protocol" : "unknown",
      message: error.message,
      raw: error,
    }
  }
  return { kind: "unknown", message: "An unexpected error occurred.", raw: error }
}
