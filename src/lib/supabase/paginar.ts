// PostgREST entrega como máximo 1,000 filas por consulta (Supabase → API → Max rows) y corta el resto
// sin avisar. Toda lectura que pueda crecer sin límite (ventas, movimientos) pasa por aquí.

export const TAMANO_BLOQUE = 1000

type Pagina<T> = PromiseLike<{ data: T[] | null; error: unknown }>

/**
 * Pide bloques consecutivos con `.range(desde, hasta)` hasta que uno llega incompleto.
 * `pedir` debe construir la consulta completa (con su orden estable) para cada bloque.
 */
export async function leerPaginado<T>(pedir: (desde: number, hasta: number) => Pagina<T>, tamanoBloque = TAMANO_BLOQUE): Promise<T[]> {
  const filas: T[] = []
  for (let desde = 0; ; desde += tamanoBloque) {
    const { data, error } = await pedir(desde, desde + tamanoBloque - 1)
    if (error) throw error
    const bloque = data ?? []
    filas.push(...bloque)
    if (bloque.length < tamanoBloque) return filas
  }
}
