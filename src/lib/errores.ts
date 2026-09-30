// Los errores de Supabase (PostgrestError, AuthError) llegan como objetos con `message`, no siempre
// como instancias de Error: sin esto la app mostraba "[object Object]".

const SIN_RED = /failed to fetch|networkerror|network request failed|load failed|err_internet_disconnected/i

export function mensajeError(e: unknown): string {
  const crudo =
    e instanceof Error
      ? e.message
      : e && typeof e === 'object' && typeof (e as { message?: unknown }).message === 'string'
        ? (e as { message: string }).message
        : String(e)
  if (SIN_RED.test(crudo)) return 'Sin conexión: revisa tu señal e inténtalo de nuevo'
  return crudo
}

/** true si el error es por falta de red (para dejar la operación en la cola sin señal). */
export function esErrorDeRed(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const crudo = e instanceof Error ? e.message : e && typeof e === 'object' ? String((e as { message?: unknown }).message ?? '') : String(e)
  return SIN_RED.test(crudo)
}
