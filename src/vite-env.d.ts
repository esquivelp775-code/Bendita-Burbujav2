/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Opcional: si se configuran, la app entra sola con estas credenciales al cargar, sin mostrar login. */
  readonly VITE_AUTO_LOGIN_EMAIL?: string
  readonly VITE_AUTO_LOGIN_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
