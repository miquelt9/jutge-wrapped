import { readFileSync } from "node:fs"
import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import basicSsl from "@vitejs/plugin-basic-ssl"

const repoBase = "/jutge-wrapped/"

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string }
const [major, minor = "0"] = pkg.version.split(".")
const defaultAppVersion = `${major}.${minor}`

/** Self-signed HTTPS for mobile LAN testing only (`npm run dev:host`). Not used in production. */
const devHttps = process.env.VITE_DEV_HTTPS === "true"

export default defineConfig({
  plugins: [...(devHttps ? [basicSsl()] : []), react(), tailwindcss()],
  base: process.env.GITHUB_PAGES === "true" ? repoBase : "/",
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(
      process.env.VITE_APP_VERSION ?? defaultAppVersion,
    ),
  },
  server: devHttps ? { host: true } : undefined,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
