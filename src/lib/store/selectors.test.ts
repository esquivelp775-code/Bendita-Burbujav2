import { describe, expect, it } from 'vitest'
import { comisionEfectivaDe, type Insumo } from '../calculos'
import type { EstadoStore, ExistenciaStore } from './remoteStore'
import { alertasInventario } from './selectors'

function insumo(clave: string, extra: Partial<Insumo> = {}): Insumo {
  return { clave, nombre: clave, categoria: 'insumo', costoUnitarioNeto: 1, merma: 0, prioridad: 'media', ...extra }
}

function estado(insumos: Insumo[], existencias: Record<string, Partial<ExistenciaStore>>): EstadoStore {
  return {
    parametros: {
      ivaVenta: 0.16,
      indirectosPorBebida: 2.6,
      mermaDefault: 0.05,
      redondeoPrecio: 5,
      horaManoDeObraFueraDeTurno: 50,
      metaUtilidadSemanal: 6000,
      umbralReordenPorPrioridad: { alta: 0.3, media: 0.25, baja: 0.2 },
      margenPublicoMin: 0.27,
      margenPublicoMax: 0.34,
    },
    turnos: [],
    canales: [{ nombre: 'Público en general', tipo: 'publico', color: '#000', activo: true }],
    configPlataformaPorCanal: {},
    configPublicoPorCanal: {},
    insumos: Object.fromEntries(insumos.map((i) => [i.clave, i])),
    categorias: {},
    tamanos: {
      '14 oz': { nombre: '14 oz', ml: 414, factorEscala: 1, vasoInsumoClave: 'vaso_14', cierreInsumoClaves: [], canales: ['Público en general'], activo: true },
    },
    bebidas: {},
    leches: {},
    adicionales: {},
    preciosApp: {},
    preciosPublico: {},
    pedidos: [],
    ventaLineas: [],
    existencias: Object.fromEntries(
      Object.entries(existencias).map(([k, v]) => [k, { existencia: 0, stockObjetivoEfectivo: null, consumo14d: 0, ...v }]),
    ),
    activos: [],
    botanas: {},
    escalasEvento: [],
    configEvento: { minimoBebidas: 30, traslado: 400, equipoHieloDesechables: 300, horasMontaje: 3 },
    primerUsoCompleto: true,
    cargando: false,
    sinConexion: false,
    pendientesPorSubir: 0,
  }
}

describe('alertasInventario — una sola fuente para Hoy, Inventario y la caja', () => {
  it('avisa agotado aunque el insumo no tenga objetivo (antes Hoy decía "Todo en orden")', () => {
    const avisos = alertasInventario(estado([insumo('leche', { prioridad: 'alta' })], { leche: { existencia: 0 } }))
    expect(avisos).toEqual([{ insumoClave: 'leche', tipo: 'agotado', nombre: 'leche', existencia: 0, negativo: false }])
  })

  it('marca negativo cuando se vendió sin existencia registrada', () => {
    const [aviso] = alertasInventario(estado([insumo('etiqueta')], { etiqueta: { existencia: -1 } }))
    expect(aviso.tipo).toBe('agotado')
    expect(aviso.negativo).toBe(true)
  })

  it('reorden con el objetivo automático (compras), un solo aviso por insumo', () => {
    const avisos = alertasInventario(estado([insumo('tapioca', { prioridad: 'alta' })], { tapioca: { existencia: 150, stockObjetivoEfectivo: 600 } }))
    expect(avisos.map((a) => a.tipo)).toEqual(['reorden'])
  })

  it('cobertura: menos de 3 días según el consumo de 14 días', () => {
    const avisos = alertasInventario(estado([insumo('popote')], { popote: { existencia: 20, stockObjetivoEfectivo: 50, consumo14d: 140 } }))
    expect(avisos.map((a) => a.tipo)).toEqual(['cobertura'])
  })

  it('sin aviso con existencia sana; el vaso sin recompra sólo avisa al dejar de ofrecerse su tamaño', () => {
    const vaso = insumo('vaso_14', { recompra: false, prioridad: 'alta' })
    expect(alertasInventario(estado([vaso, insumo('hielo')], { vaso_14: { existencia: 5, stockObjetivoEfectivo: 70 }, hielo: { existencia: 900 } }))).toEqual([])
    const avisos = alertasInventario(estado([vaso], { vaso_14: { existencia: 0 } }))
    expect(avisos.map((a) => [a.tipo, a.nombre])).toEqual([['sin vasos', 'Se acabaron los vasos de 14 oz']])
  })

  it('ordena agotados antes que reorden, y prioridad alta primero', () => {
    const avisos = alertasInventario(
      estado([insumo('azucar', { prioridad: 'baja' }), insumo('cafe', { prioridad: 'alta' }), insumo('tapioca', { prioridad: 'alta' })], {
        azucar: { existencia: 0 },
        cafe: { existencia: 0 },
        tapioca: { existencia: 100, stockObjetivoEfectivo: 600 },
      }),
    )
    expect(avisos.map((a) => a.insumoClave)).toEqual(['cafe', 'azucar', 'tapioca'])
  })
})

describe('comisionEfectivaDe — nunca se guarda, se deriva de sus componentes', () => {
  it('Uber: 29 % + 1 % de Uber One en la mitad de los pedidos = 29.5 %', () => {
    expect(comisionEfectivaDe({ comisionBase: 0.29, uberOne: 0.01, uberOneProporcion: 0.5, marketing: 0 })).toBeCloseTo(0.295, 10)
  })
  it('editar un componente no arrastra los demás (regresión: antes cada edición sumaba 0.5 %)', () => {
    const uber = { comisionBase: 0.29, uberOne: 0.01, uberOneProporcion: 0.5, marketing: 0 }
    const editada = { ...uber, comisionBase: 0.29 }
    expect(comisionEfectivaDe(editada)).toBeCloseTo(comisionEfectivaDe(uber), 10)
  })
})
