import { describe, expect, it } from 'vitest'
import { activoEnUso, charolasDelPedido, desgloseBotana, porcionesPosibles, redondeoCentavos, type Insumo, type Parametros } from './calculos'

describe('activoEnUso (spec §5.12)', () => {
  const selladora = { fechaAlta: '2026-09-26', vidaUtilMeses: 12 }
  const dia = (s: string) => {
    const [a, m, d] = s.split('-').map(Number)
    return new Date(a, m - 1, d, 15, 0)
  }
  it('no cuenta antes del alta', () => expect(activoEnUso(selladora, dia('2026-09-25'))).toBe(false))
  it('cuenta desde el día de alta', () => expect(activoEnUso(selladora, dia('2026-09-26'))).toBe(true))
  it('deja de contar al cumplir su vida útil', () => {
    expect(activoEnUso(selladora, dia('2027-09-25'))).toBe(true)
    expect(activoEnUso(selladora, dia('2027-09-26'))).toBe(false)
  })
  it('la baja cuenta desde ese día', () => {
    const conBaja = { ...selladora, fechaBaja: '2026-12-01' }
    expect(activoEnUso(conBaja, dia('2026-11-30'))).toBe(true)
    expect(activoEnUso(conBaja, dia('2026-12-01'))).toBe(false)
  })
})

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

describe('charolasDelPedido (v3 §3)', () => {
  it('una bebida no lleva charola', () => expect(charolasDelPedido(1)).toBe(0))
  it('2 a 4 bebidas: una charola', () => {
    expect(charolasDelPedido(2)).toBe(1)
    expect(charolasDelPedido(4)).toBe(1)
  })
  it('5 bebidas: 2 charolas (caso de prueba de v3)', () => expect(charolasDelPedido(5)).toBe(2))
  it('9 bebidas: 3 charolas', () => expect(charolasDelPedido(9)).toBe(3))
  it('pedido sin bebidas (sólo botanas): ninguna', () => expect(charolasDelPedido(0)).toBe(0))
})

describe('porcionesPosibles — "te alcanza para…"', () => {
  const existencias: Record<string, number> = { leche: 1000, tapioca: 95, vaso: 3, etiqueta: 0 }
  const ex = (c: string) => existencias[c] ?? 0

  it('el insumo más escaso manda', () => {
    const r = porcionesPosibles(
      [
        { insumoClave: 'leche', cantidadFisica: -180 },
        { insumoClave: 'tapioca', cantidadFisica: -31.58 },
        { insumoClave: 'vaso', cantidadFisica: -1 },
      ],
      ex,
    )
    expect(r).toEqual({ porciones: 3, faltantes: [] })
  })

  it('señala lo que no alcanza para una sola porción', () => {
    const r = porcionesPosibles(
      [
        { insumoClave: 'leche', cantidadFisica: -180 },
        { insumoClave: 'etiqueta', cantidadFisica: -1 },
      ],
      ex,
    )
    expect(r.porciones).toBe(0)
    expect(r.faltantes).toEqual([{ insumoClave: 'etiqueta', necesita: 1, hay: 0 }])
  })

  it('suma el mismo insumo cuando aparece dos veces (receta + adicional)', () => {
    const r = porcionesPosibles(
      [
        { insumoClave: 'tapioca', cantidadFisica: -31.58 },
        { insumoClave: 'tapioca', cantidadFisica: -31.58 },
      ],
      ex,
    )
    expect(r.porciones).toBe(1)
  })

  it('existencia negativa cuenta como cero', () => {
    const r = porcionesPosibles([{ insumoClave: 'x', cantidadFisica: -1 }], () => -4)
    expect(r).toEqual({ porciones: 0, faltantes: [{ insumoClave: 'x', necesita: 1, hay: -4 }] })
  })

  it('sin consumo contable', () => expect(porcionesPosibles([], ex)).toEqual({ porciones: null, faltantes: [] }))
})

describe('desgloseBotana', () => {
  const bolsita: Insumo = { clave: 'botana_platano', nombre: 'Plátano deshidratado', categoria: 'botana', costoUnitarioNeto: 19 / 1.16, merma: 0 }
  const botana = { nombre: 'Plátano Deshidratado', precioApp: 50, precioPublico: 45, insumoClave: 'botana_platano' }
  const uber = { comisionEfectiva: 0.295, ivaSobreComision: 0.16, retencionIsr: 0.025, retencionIva: 0.08 }

  it('Público $45: sin comisión, utilidad = 45/1.16 − 19/1.16', () => {
    const d = desgloseBotana({ botana, canalTipo: 'publico', insumos: { botana_platano: bolsita }, parametros })
    expect(d.precio).toBe(45)
    expect(d.utilidad).toBe(22.41)
    expect(d.depositoEsperado).toBe(45)
    expect(d.consumo).toEqual([{ insumoClave: 'botana_platano', cantidad: 1 }])
  })

  it('Uber $50: comisión, retenciones y depósito; los tramos suman el precio', () => {
    const d = desgloseBotana({ botana, canalTipo: 'plataforma', insumos: { botana_platano: bolsita }, parametros, configPlataforma: uber })
    expect(d.comision).toBe(14.75)
    expect(d.utilidad).toBe(11.97)
    expect(d.depositoEsperado).toBe(28.36)
    expect(redondeoCentavos(d.ivaTrasladado + d.comision + d.insumos + d.utilidad)).toBe(50)
  })

  it('Evento: precio de lista × factor, redondeado a $5', () => {
    const d = desgloseBotana({ botana, canalTipo: 'evento', factorEvento: 0.9, insumos: { botana_platano: bolsita }, parametros })
    expect(d.precio).toBe(45)
  })
})
