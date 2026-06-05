import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  downloadToBlobUrl,
  fetchStudentAvatar,
  mapApiError,
} from "@/api/client"
import type { JutgeApiClient, Submission } from "@/api/client"
import { fetchFullAwards } from "./awards"
import { fetchProblemTitles, uniqueProblemIds } from "./problemTitles"
import { buildWrappedInsights } from "./selectors"
import {
  hasSubmissionHistory,
  resolveSnapshotSubmissions,
} from "./snapshot"
import type { WrappedRawData } from "./types"
import {
  emptyRangeMessage,
  invalidRangeMessage,
  liveLoadFailureMessage,
  translateApiError,
} from "./errors"
import {
  aggregateDashboardFromSubmissions,
  dashboardForWrappedPeriod,
  isAllTimePeriod,
  isValidBoundedPeriod,
  submissionInPeriod,
  submissionsForWrappedPeriod,
  type WrappedPeriod,
} from "./period"

export type WrappedLoadErrorKind =
  | ReturnType<typeof mapApiError>["kind"]
  | "empty_range"
  | "invalid_range"

export type WrappedLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready"
      raw: WrappedRawData
      insights: ReturnType<typeof buildWrappedInsights>
    }
  | { status: "error"; message: string; kind: WrappedLoadErrorKind }

export function useWrappedData(
  client: JutgeApiClient | null,
  period: WrappedPeriod | null,
  snapshot: WrappedRawData | null = null,
) {
  const { i18n } = useTranslation()
  const [state, setState] = useState<WrappedLoadState>({ status: "idle" })
  const avatarUrlRef = useRef<string | null>(null)
  const readyRawRef = useRef<WrappedRawData | null>(null)

  const revokeAvatar = useCallback(() => {
    if (avatarUrlRef.current) {
      URL.revokeObjectURL(avatarUrlRef.current)
      avatarUrlRef.current = null
    }
  }, [])

  const load = useCallback(async () => {
    if (!period) {
      setState({ status: "idle" })
      readyRawRef.current = null
      return
    }

    if (!isAllTimePeriod(period) && !isValidBoundedPeriod(period)) {
      setState({
        status: "error",
        message: invalidRangeMessage(period),
        kind: "invalid_range",
      })
      readyRawRef.current = null
      return
    }

    if (snapshot) {
      revokeAvatar()
      const resolvedSubmissions = await resolveSnapshotSubmissions(
        snapshot,
        client,
      )
      const hasSubmissionList = hasSubmissionHistory(resolvedSubmissions)
      const dashboard = dashboardForWrappedPeriod(
        {
          dashboard: snapshot.dashboard,
          submissions: resolvedSubmissions,
          tables: snapshot.tables,
        },
        period,
      )
      if (
        !isAllTimePeriod(period) &&
        (dashboard.stats.number_of_submissions ?? 0) === 0
      ) {
        setState({
          status: "error",
          message: emptyRangeMessage(period, "snapshot", hasSubmissionList),
          kind: "empty_range",
        })
        readyRawRef.current = null
        return
      }
      let problemTitles = snapshot.problemTitles
      const periodSubmissions = submissionsForWrappedPeriod(
        resolvedSubmissions,
        period,
      )
      if (
        !problemTitles &&
        periodSubmissions?.length &&
        client?.meta?.token
      ) {
        try {
          problemTitles = await fetchProblemTitles(
            client,
            uniqueProblemIds(periodSubmissions),
          )
        } catch {
          problemTitles = undefined
        }
      }

      const raw: WrappedRawData = {
        ...snapshot,
        period,
        dashboard,
        submissions: periodSubmissions,
        problemTitles,
      }
      readyRawRef.current = raw
      setState({
        status: "ready",
        raw,
        insights: buildWrappedInsights(raw),
      })
      return
    }

    if (!client?.meta?.token) {
      setState({ status: "idle" })
      readyRawRef.current = null
      return
    }

    setState({ status: "loading" })
    revokeAvatar()
    readyRawRef.current = null

    try {
      const [
        profile,
        avatarDownload,
        tables,
        hexColors,
        homepageStats,
        level,
        absoluteRanking,
        briefAwards,
      ] = await Promise.all([
        client.student.profile.get(),
        fetchStudentAvatar(client),
        client.tables.get(),
        client.misc.getHexColors(),
        client.misc.getHomepageStats(),
        client.student.dashboard.getLevel(),
        client.student.dashboard.getAbsoluteRanking(),
        client.student.awards.getAll(),
      ])

      const awards = await fetchFullAwards(client, briefAwards)

      let dashboard
      let periodSubmissions: Submission[] | undefined
      if (isAllTimePeriod(period)) {
        const [dashboardResult, allSubmissions] = await Promise.all([
          client.student.dashboard.getDashboard(),
          client.student.submissions.getAll(),
        ])
        dashboard = dashboardResult
        periodSubmissions =
          allSubmissions.length > 0 ? allSubmissions : undefined
      } else {
        const allSubmissions = await client.student.submissions.getAll()
        const filtered = allSubmissions.filter((s) =>
          submissionInPeriod(s, period),
        )
        if (filtered.length === 0) {
          setState({
            status: "error",
            message:
              allSubmissions.length === 0
                ? liveLoadFailureMessage(0)
                : emptyRangeMessage(period, "live", true),
            kind: allSubmissions.length === 0 ? "unknown" : "empty_range",
          })
          return
        }
        dashboard = aggregateDashboardFromSubmissions(filtered, tables)
        periodSubmissions = filtered
      }

      const avatarUrl = avatarDownload
        ? downloadToBlobUrl(avatarDownload)
        : null
      if (avatarUrl) avatarUrlRef.current = avatarUrl

      let problemTitles: Record<string, string> | undefined
      if (periodSubmissions?.length) {
        try {
          problemTitles = await fetchProblemTitles(
            client,
            uniqueProblemIds(periodSubmissions),
          )
        } catch {
          problemTitles = undefined
        }
      }

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
        submissions: periodSubmissions,
        problemTitles,
        awards: awards && Object.keys(awards).length > 0 ? awards : undefined,
      }
      readyRawRef.current = raw

      setState({
        status: "ready",
        raw,
        insights: buildWrappedInsights(raw),
      })
    } catch (error) {
      const mapped = mapApiError(error)
      setState({
        status: "error",
        message: translateApiError(mapped),
        kind: mapped.kind,
      })
    }
  }, [client, period, snapshot, revokeAvatar])

  useEffect(() => {
    void load()
    return () => revokeAvatar()
  }, [load, revokeAvatar])

  useEffect(() => {
    setState((prev) => {
      if (prev.status === "ready" && readyRawRef.current) {
        return {
          status: "ready",
          raw: readyRawRef.current,
          insights: buildWrappedInsights(readyRawRef.current),
        }
      }
      if (prev.status === "error" && period) {
        if (prev.kind === "invalid_range") {
          return { ...prev, message: invalidRangeMessage(period) }
        }
        if (prev.kind === "empty_range") {
          const hasList =
            hasSubmissionHistory(readyRawRef.current?.submissions) ||
            hasSubmissionHistory(snapshot?.submissions)
          return {
            ...prev,
            message: emptyRangeMessage(
              period,
              snapshot ? "snapshot" : "live",
              hasList,
            ),
          }
        }
        if (prev.kind === "network") {
          return {
            ...prev,
            message: translateApiError({ kind: "network", message: "" }),
          }
        }
      }
      return prev
    })
  }, [i18n.language, period, snapshot])

  return { state, reload: load }
}
