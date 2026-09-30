import { describe, expect, it } from 'vitest'
import type { Parametros } from './calculos'
import { aCsv, diasDelRango, lunesDe, matrizBebidaTamano, menuPorRentabilidad, mezclaTamanosPorSemana, porCanal, porTamano, totalesDeRango, type FilaLinea, type ResumenRango } from './reportes'

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

function fila(p: Partial<FilaLinea>): FilaLinea {
  return {
    dia: '2026-09-28',
    canal: 'Uber Eats',
    canal_tipo: 'plataforma',
    tipo: 'bebida',
    bebida: 'Taro Celestial',
    botana: null,
    tamano: '16 oz',
    unidades: 1,
    venta: 90,
    iva: 12.41,
    comision: 26.55,
    insumos: 18,
    empaque: 1,
    vaso_tapa: 3.1,
    indirectos: 2.24,
    mano_obra: 3.75,
    utilidad: 15.97,
    retencion_isr: 1.94,
    retencion_iva: 6.21,
    deposito_esperado: 48,
    ...p,
  }
}

const resumen: ResumenRango = {
  lineas: [
    fila({ unidades: 10, venta: 900, iva: 124.1, comision: 265.5, insumos: 180, empaque: 10, vaso_tapa: 31, indirectos: 22.4, mano_obra: 37.5, utilidad: 159.7, deposito_esperado: 480 }),
    fila({ dia: '2026-09-29', canal: 'Público en general', canal_tipo: 'publico', tamano: '20 oz', unidades: 5, venta: 325, iva: 44.83, comision: 0, insumos: 110, empaque: 5, vaso_tapa: 12.4, indirectos: 11.2, mano_obra: 18.75, utilidad: 122.82, retencion_isr: 0, retencion_iva: 0, deposito_esperado: 325 }),
    fila({ dia: '2026-09-29', canal: 'Público en general', canal_tipo: 'publico', bebida: 'Pecado Tropical', tamano: '14 oz', unidades: 20, venta: 800, iva: 110.34, comision: 0, insumos: 285, empaque: 20, vaso_tapa: 56, indirectos: 44.8, mano_obra: 50, utilidad: 233.86, retencion_isr: 0, retencion_iva: 0, deposito_esperado: 800 }),
  ],
  horas: [],
  pedidos: [
    { dia: '2026-09-28', canal: 'Uber Eats', pedidos: 8, envio_cobrado: 0, costo_envio: 0 },
    { dia: '2026-09-29', canal: 'Público en general', pedidos: 6, envio_cobrado: 70, costo_envio: 40 },
  ],
  eventos: [],
}
const activos = [{ fechaAlta: '2026-09-01', vidaUtilMeses: 12, costoNeto: 1550, valorRescate: 0 }]

describe('totalesDeRango', () => {
  it('suma el desglose día por día: ganancia = utilidad + margen de envío − equipo de cada día', () => {
    const t = totalesDeRango(resumen, '2026-09-28', '2026-09-29', activos, parametros)
    const equipoDia = 1550 / 12 / 30.4
    const margenEnvio = 70 / 1.16 - 40
    expect(t.ganancia).toBeCloseTo(159.7 + 122.82 + 233.86 + margenEnvio - 2 * equipoDia, 1)
    expect(t.venta).toBe(900 + 325 + 800 + 70)
    expect(t.bebidas).toBe(35)
    expect(t.pedidos).toBe(14)
    expect(t.dias).toBe(2)
    expect(t.porDia.map((d) => d.bebidas)).toEqual([10, 25])
  })
  it('un día sin ventas sólo resta el equipo', () => {
    const t = totalesDeRango({ lineas: [], horas: [], pedidos: [], eventos: [] }, '2026-09-30', '2026-09-30', activos, parametros)
    expect(t.ganancia).toBeCloseTo(-(1550 / 12 / 30.4), 2)
  })
})

describe('agrupaciones', () => {
  it('por canal y por tamaño, con filtro "sólo 16 y 20 oz"', () => {
    expect(porCanal(resumen).map((a) => [a.clave, a.unidades])).toEqual([
      ['Público en general', 25],
      ['Uber Eats', 10],
    ])
    expect(porTamano(resumen, ['16 oz', '20 oz']).map((a) => a.clave).sort()).toEqual(['16 oz', '20 oz'])
  })
  it('matriz bebida × tamaño', () => {
    const m = matrizBebidaTamano(resumen)
    expect(m['Taro Celestial']['16 oz'].unidades).toBe(10)
    expect(m['Pecado Tropical']['14 oz'].utilidad).toBeCloseTo(233.86)
  })
  it('mezcla de tamaños por semana (lunes)', () => {
    expect(lunesDe('2026-09-29')).toBe('2026-09-28')
    expect(lunesDe('2026-10-04')).toBe('2026-09-28') // domingo
    expect(mezclaTamanosPorSemana(resumen)).toEqual([{ semana: '2026-09-28', tamanos: { '16 oz': 10, '20 oz': 5, '14 oz': 20 } }])
  })
})

describe('menuPorRentabilidad', () => {
  it('clasifica contra la mediana de unidades y de utilidad por bebida', () => {
    const r: ResumenRango = {
      ...resumen,
      lineas: [
        fila({ bebida: 'A', unidades: 50, utilidad: 50 * 20 }),
        fila({ bebida: 'B', unidades: 50, utilidad: 50 * 8 }),
        fila({ bebida: 'C', unidades: 5, utilidad: 5 * 25 }),
        fila({ bebida: 'D', unidades: 5, utilidad: 5 * 6 }),
      ],
    }
    const m = Object.fromEntries(menuPorRentabilidad(r).map((x) => [x.bebida, x.cuadrante]))
    expect(m).toEqual({ A: 'estrella', B: 'popular', C: 'rentable', D: 'revisar' })
  })
})

describe('aCsv', () => {
  it('BOM para Excel, comillas cuando hace falta', () => {
    const csv = aCsv(['Bebida', 'Nota'], [['Taro, 16 oz', 'dijo "sí"'], ['Chai', null]])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('"Taro, 16 oz","dijo ""sí"""')
    expect(csv.endsWith('Chai,')).toBe(true)
  })
  it('rango de días', () => expect(diasDelRango('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']))
})
