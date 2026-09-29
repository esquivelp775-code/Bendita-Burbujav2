// Catálogo v3.1: datos_bendita_v3.json con el delta de datos_bendita_v3_1_delta.json aplicado
// (14 oz también en Público, vaso de 14 oz sin recompra, precios nuevos a Público y rango de
// margen). Usado por las pruebas v3.1 y por scripts/seed-v31-from-json.ts.
import type { Insumo, Parametros, Tamano } from './calculos'
import { construirInsumosV3, construirParametrosV3, construirTamanosV3 } from './fixtures_v3'
import delta from '../../datos_bendita_v3_1_delta.json'

export const VASO_SIN_RECOMPRA = 'vaso_14_oz'

export function construirTamanosV31(): Record<string, Tamano> {
  const tamanos = construirTamanosV3()
  for (const [nombre, cambio] of Object.entries(delta.tamanos_cambios)) {
    tamanos[nombre] = { ...tamanos[nombre], canales: cambio.canales_ahora }
  }
  return tamanos
}

export function construirInsumosV31(): Record<string, Insumo> {
  const insumos = construirInsumosV3()
  insumos[VASO_SIN_RECOMPRA] = { ...insumos[VASO_SIN_RECOMPRA], recompra: false }
  return insumos
}

export function construirParametrosV31(): Parametros {
  return {
    ...construirParametrosV3(),
    margenPublicoMin: delta.regla_precio_publico.margen_min,
    margenPublicoMax: delta.regla_precio_publico.margen_max,
  }
}

export function precioPublicoV31(nombreBebida: string, tamano: string): number {
  const b = delta.bebidas.find((x) => x.nombre === nombreBebida)
  if (!b) throw new Error(`Bebida desconocida en el delta v3.1: ${nombreBebida}`)
  return (b.precio_publico_nuevo as Record<string, number>)[tamano]
}

export { delta as deltaV31 }
