import { describe, expect, it } from 'vitest'
import { leerPaginado } from './paginar'

/** Simula PostgREST: nunca devuelve más de `maxFilas` aunque el rango pida más. */
function tablaFalsa(total: number, maxFilas = 1000) {
  const filas = Array.from({ length: total }, (_, i) => ({ i }))
  const rangos: [number, number][] = []
  const pedir = (desde: number, hasta: number) => {
    rangos.push([desde, hasta])
    return Promise.resolve({ data: filas.slice(desde, Math.min(hasta + 1, desde + maxFilas)), error: null })
  }
  return { pedir, rangos }
}

describe('leerPaginado', () => {
  it('trae más de 1,000 filas completas (regresión del límite de PostgREST)', async () => {
    const { pedir, rangos } = tablaFalsa(2345)
    const filas = await leerPaginado(pedir)
    expect(filas).toHaveLength(2345)
    expect(filas[2344]).toEqual({ i: 2344 })
    expect(rangos).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ])
  })

  it('con exactamente un bloque lleno pide uno más y se detiene en el vacío', async () => {
    const { pedir, rangos } = tablaFalsa(1000)
    expect(await leerPaginado(pedir)).toHaveLength(1000)
    expect(rangos).toHaveLength(2)
  })

  it('tabla vacía', async () => {
    const { pedir } = tablaFalsa(0)
    expect(await leerPaginado(pedir)).toEqual([])
  })

  it('propaga el error de la consulta', async () => {
    await expect(leerPaginado(() => Promise.resolve({ data: null, error: new Error('sin red') }))).rejects.toThrow('sin red')
  })
})
