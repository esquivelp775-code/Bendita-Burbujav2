// Mientras no exista el proyecto real de Supabase (pendiente de aprobación, ver plan de Fase 1),
// la app corre en modo local: todo pasa por src/lib/store/localStore.ts en vez de Postgres.
export const modoLocal = !import.meta.env.VITE_SUPABASE_URL
