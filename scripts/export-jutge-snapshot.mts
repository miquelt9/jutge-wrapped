#!/usr/bin/env npx tsx
/**
 * Local-only utility: prompts for Jutge credentials and writes a JSON snapshot
 * to artifacts/ for design/debugging. Never commit artifacts/ or credentials.
 */
import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { JutgeApiClient, NotFoundError } from "../jutge_api_client.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")

function downloadToBase64(data: Uint8Array): string {
  return Buffer.from(data).toString("base64")
}

async function promptHidden(rl: ReturnType<typeof createInterface>, label: string): Promise<string> {
  const value = await rl.question(`${label}: `)
  return value.trim()
}

async function fetchAvatarOptional(client: JutgeApiClient) {
  try {
    return await client.student.profile.getAvatar()
  } catch (error) {
    if (error instanceof NotFoundError) return null
    throw error
  }
}

async function main() {
  const rl = createInterface({ input, output })
  console.log("Jutge Wrapped — local snapshot export")
  console.log("Credentials are used only for this request and are not saved.\n")

  const email = await promptHidden(rl, "Email")
  const password = await promptHidden(rl, "Password")
  rl.close()

  const client = new JutgeApiClient()
  console.log("\nLogging in…")
  const credentials = await client.login({ email, password })

  console.log("Fetching wrapped dataset…")
  const [
    profile,
    avatar,
    dashboard,
    submissions,
    level,
    absoluteRanking,
    homepageStats,
    hexColors,
    tables,
  ] = await Promise.all([
    client.student.profile.get(),
    fetchAvatarOptional(client),
    client.student.dashboard.getDashboard(),
    client.student.submissions.getAll(),
    client.student.dashboard.getLevel(),
    client.student.dashboard.getAbsoluteRanking(),
    client.misc.getHomepageStats(),
    client.misc.getHexColors(),
    client.tables.get(),
  ])

  if (!avatar) {
    console.log("Note: no custom avatar on this account (skipped).")
  }

  const period = {
    start: null as string | null,
    end: null as string | null,
    label: "All time",
  }

  const snapshot = {
    exportedAt: new Date().toISOString(),
    credentials: {
      user_uid: credentials.user_uid,
      expiration: credentials.expiration,
    },
    profile,
    avatar: avatar
      ? {
          mimeType: avatar.type,
          name: avatar.name,
          base64: downloadToBase64(avatar.data),
        }
      : null,
    dashboard,
    submissions,
    level,
    absoluteRanking,
    homepageStats,
    hexColors,
    tables,
    period,
  }

  const outDir = path.join(rootDir, "artifacts")
  await mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, `snapshot-${Date.now()}.json`)
  await writeFile(outPath, JSON.stringify(snapshot, null, 2), "utf-8")

  console.log(`\nSnapshot written to:\n  ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
