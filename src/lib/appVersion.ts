/** Shown in the UI as `vX.Y` (injected at build time on GitHub Pages). */
export function getAppVersionLabel(): string {
  const version = import.meta.env.VITE_APP_VERSION?.trim()
  if (!version) return "dev"
  return version.startsWith("v") ? version : `v${version}`
}
