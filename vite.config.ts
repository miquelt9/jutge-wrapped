import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import basicSsl from "@vitejs/plugin-basic-ssl"

const repoBase = "/jutge-wrapped/"

/** Self-signed HTTPS for mobile LAN testing only (`npm run dev:host`). Not used in production. */
const devHttps = process.env.VITE_DEV_HTTPS === "true"

export default defineConfig({
  plugins: [...(devHttps ? [basicSsl()] : []), react(), tailwindcss()],
  base: process.env.GITHUB_PAGES === "true" ? repoBase : "/",
  server: devHttps ? { host: true } : undefined,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
