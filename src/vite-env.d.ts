/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JUTGE_API_URL?: string
  readonly VITE_JUTGE_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
