/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JUTGE_API_URL?: string
  readonly VITE_JUTGE_DOMAIN?: string
  readonly VITE_SNAPSHOT_PATH?: string
  readonly VITE_DEV_HTTPS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
