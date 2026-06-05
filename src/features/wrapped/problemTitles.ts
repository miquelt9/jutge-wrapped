import { NotFoundError, type JutgeApiClient } from "@/api/client"

export type ProblemTitleMap = Record<string, string>

export function uniqueProblemIds(submissions: { problem_id: string }[]): string[] {
  return [...new Set(submissions.map((sub) => sub.problem_id))]
}

/** Returns a trimmed title when known and meaningfully different from the problem id. */
export function resolveProblemTitle(
  problemId: string,
  titles: ProblemTitleMap | undefined,
): string | null {
  const title = titles?.[problemId]?.trim()
  if (!title || title === problemId) return null
  return title
}

export async function fetchProblemTitles(
  client: JutgeApiClient,
  problemIds: string[],
): Promise<ProblemTitleMap> {
  const unique = uniqueProblemIds(
    problemIds.map((problem_id) => ({ problem_id })),
  )
  if (unique.length === 0) return {}

  const pairs = await Promise.all(
    unique.map(async (problemId) => {
      try {
        const problem = await client.problems.getProblem(problemId)
        const title = problem.title?.trim()
        return title ? ([problemId, title] as const) : null
      } catch (error) {
        if (error instanceof NotFoundError) return null
        throw error
      }
    }),
  )

  return Object.fromEntries(
    pairs.filter((entry): entry is readonly [string, string] => entry !== null),
  )
}
