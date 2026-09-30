import { describe, expect, it } from 'vitest'
import { corteDeCaja, desgloseCargoServicio, desgloseDelDia, estadoCaducidad, venceApertura, type Parametros } from './calculos'

const parametros: Parametros = {
  ivaVenta: 0.16,
  indirectosPorBebida: 2.6,
  mermaDefault: 0.05,
  redondeoPrecio: 5,
  horaManoDeObraFueraDeTurno: 50,
  metaUtilidadSemanal: 6000,
  umbralReordenPorPrioridad: { alta: 0.3, media: 0.25, baja: 0.2 },
  margenPublicoMin: 0.27,
  margenPublicoMax: 0.34,
}

describe('desgloseCargoServicio', () => {
  it('$400 con IVA: 344.83 + 55.17, sin costos', () => {
    const d = desgloseCargoServicio(400, 0.16)
    expect(d.precio).toBe(400)
    expect(d.ingresoSinIva).toBe(344.83)
    expect(d.ivaTrasladado).toBe(55.17)
    expect(d.utilidad).toBe(0)
    expect(d.depositoEsperado).toBe(400)
  })

  it('en el desglose del día suma a la ganancia una sola vez (cargo sin IVA)', () => {
    const d = desgloseCargoServicio(400, 0.16)
    const dia = desgloseDelDia(
      [{ tipo: 'cargo_servicio', canalTipo: 'evento', precio: d.precio, cantidad: 1, ivaTrasladado: d.ivaTrasladado, comision: 0, insumos: 0, empaque: 0, vasoTapa: 0, indirectos: 0, manoDeObra: 0, utilidad: d.utilidad }],
      [],
      [],
      [],
      parametros,
      50,
    )
    expect(dia.ganancia).toBe(344.83)
    expect(dia.venta).toBe(400)
  })
})

describe('corteDeCaja', () => {
  it('fondo + efectivo cobrado − pagos en efectivo', () => {
    expect(corteDeCaja({ fondoInicial: 200, ventasEfectivo: 455, pagosEfectivo: 35 })).toEqual({ esperado: 620, diferencia: null })
  })
  it('diferencia: sobra (+) o falta (−)', () => {
    expect(corteDeCaja({ fondoInicial: 200, ventasEfectivo: 455, pagosEfectivo: 35, contado: 600 }).diferencia).toBe(-20)
    expect(corteDeCaja({ fondoInicial: 0, ventasEfectivo: 100, pagosEfectivo: 0, contado: 105 }).diferencia).toBe(5)
  })
})

describe('caducidad de aperturas y tandas', () => {
  const abierto = new Date(2026, 8, 29, 8, 0)
  it('leche: 5 días desde que se abrió', () => {
    expect(venceApertura(abierto, null, 5)).toEqual(new Date(2026, 9, 4, 8, 0))
  })
  it('la tanda manda sobre los días del insumo', () => {
    const tanda = new Date(2026, 8, 29, 12, 0)
    expect(venceApertura(abierto, tanda, 5)).toEqual(tanda)
  })
  it('sin caducidad configurada', () => expect(venceApertura(abierto, null, null)).toBeNull())
  it('leche por vencer a 2 días o menos', () => {
    const vence = new Date(2026, 9, 4, 8, 0)
    expect(estadoCaducidad(abierto, vence, new Date(2026, 9, 1, 8, 0))).toBe('vigente')
    expect(estadoCaducidad(abierto, vence, new Date(2026, 9, 2, 9, 0))).toBe('por vencer')
    expect(estadoCaducidad(abierto, vence, new Date(2026, 9, 4, 8, 1))).toBe('vencido')
  })
  it('tapioca cocida de 4 h: por vencer en la última hora', () => {
    const vence = new Date(2026, 8, 29, 12, 0)
    expect(estadoCaducidad(abierto, vence, new Date(2026, 8, 29, 10, 30))).toBe('vigente')
    expect(estadoCaducidad(abierto, vence, new Date(2026, 8, 29, 11, 15))).toBe('por vencer')
  })
})
