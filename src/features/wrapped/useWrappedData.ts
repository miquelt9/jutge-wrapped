import { useCallback, useEffect, useRef, useState } from "react"
import { downloadToBlobUrl, fetchStudentAvatar, mapApiError } from "@/api/client"
import type { JutgeApiClient } from "@/api/client"
import { buildWrappedInsights } from "./selectors"
import type { WrappedRawData } from "./types"
import {
  aggregateDashboardFromSubmissions,
  isAllTimePeriod,
  submissionInPeriod,
  type WrappedPeriod,
} from "./period"

export type WrappedLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; raw: WrappedRawData; insights: ReturnType<typeof buildWrappedInsights> }
  | { status: "error"; message: string; kind: ReturnType<typeof mapApiError>["kind"] }

export function useWrappedData(client: JutgeApiClient | null, period: WrappedPeriod | null) {
  const [state, setState] = useState<WrappedLoadState>({ status: "idle" })
  const avatarUrlRef = useRef<string | null>(null)

  const revokeAvatar = useCallback(() => {
    if (avatarUrlRef.current) {
      URL.revokeObjectURL(avatarUrlRef.current)
      avatarUrlRef.current = null
    }
  }, [])

  const load = useCallback(async () => {
    if (!client?.meta?.token || !period) {
      setState({ status: "idle" })
      return
    }

    setState({ status: "loading" })
    revokeAvatar()

    try {
      const [profile, avatarDownload, tables, hexColors, homepageStats, level, absoluteRanking] =
        await Promise.all([
          client.student.profile.get(),
          fetchStudentAvatar(client),
          client.tables.get(),
          client.misc.getHexColors(),
          client.misc.getHomepageStats(),
          client.student.dashboard.getLevel(),
          client.student.dashboard.getAbsoluteRanking(),
        ])

      let dashboard
      if (isAllTimePeriod(period)) {
        dashboard = await client.student.dashboard.getDashboard()
      } else {
        const allSubmissions = await client.student.submissions.getAll()
        const filtered = allSubmissions.filter((s) => submissionInPeriod(s, period))
        if (filtered.length === 0) {
          setState({
            status: "error",
            message: "No submissions found in the selected date range. Try a wider window.",
            kind: "unknown",
          })
          return
        }
        dashboard = aggregateDashboardFromSubmissions(filtered, tables)
      }

      const avatarUrl = avatarDownload ? downloadToBlobUrl(avatarDownload) : null
      if (avatarUrl) avatarUrlRef.current = avatarUrl

      const raw: WrappedRawData = {
        profile,
        avatarUrl,
        dashboard,
        level,
        absoluteRanking,
        homepageStats,
        hexColors,
        tables,
        period,
      }

      setState({
        status: "ready",
        raw,
        insights: buildWrappedInsights(raw),
      })
    } catch (error) {
      const mapped = mapApiError(error)
      setState({ status: "error", message: mapped.message, kind: mapped.kind })
    }
  }, [client, period, revokeAvatar])

  useEffect(() => {
    void load()
    return () => revokeAvatar()
  }, [load, revokeAvatar])

  return { state, reload: load }
}
