/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL da API do SGP, ex.: https://sgp-provas-api.vercel.app */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
