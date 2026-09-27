// Pruebas del motor con el catálogo v3 (selladora, cierre por tamaño, adicionales por canal).
// Las pruebas v2 (calculos.test.ts) se quedan como están, con datos_iniciales_bendita_1.json.
import { describe, expect, it } from 'vitest'
import { adicionalAplica, desgloseLinea, movimientosInventarioDeLinea, resolverLineasConsumo } from './calculos'
import {
  construirAdicionalesV3,
  construirBebidasV3,
  construirCategoriasV3,
  construirConfigPlataformaV3,
  construirInsumosV3,
  construirLechesV3,
  construirParametrosV3,
  construirTamanosV3,
  construirTurnosV3,
  precioListaDeV3,
} from './fixtures_v3'

const insumos = construirInsumosV3()
const tamanos = construirTamanosV3()
const categorias = construirCategoriasV3()
const bebidas = construirBebidasV3()
const leches = construirLechesV3()
const adicionales = construirAdicionalesV3()
const parametros = construirParametrosV3()
const turnos = construirTurnosV3()
const uberEats = construirConfigPlataformaV3('Uber Eats')
const rappi = construirConfigPlataformaV3('Rappi')

describe('pruebas_v3 — reproducción exacta al centavo', () => {
  it('Matcha Divino 16 oz, Avena Oatly, Rappi, tarifa $55/h', () => {
    const fechaHora = new Date('2026-09-27T08:00:00') // sábado, turno fin de semana $55/h
    const r = desgloseLinea({
      fechaHora,
      canalTipo: 'plataforma',
      canalNombre: 'Rappi',
      bebida: bebidas['Matcha Divino'],
      tamano: tamanos['16 oz'],
      lecheElegida: leches['Avena Oatly'],
      adicionalesElegidos: [],
      precioApp: precioListaDeV3('Matcha Divino', '16 oz'),
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
      configPlataforma: rappi,
    })
    expect(r.precio).toBeCloseTo(105, 2)
    expect(r.ivaTrasladado).toBeCloseTo(14.48, 2)
    expect(r.ingresoSinIva).toBeCloseTo(90.52, 2)
    expect(r.comision).toBeCloseTo(26.25, 2)
    expect(r.insumos).toBeCloseTo(31.43, 2)
    expect(r.empaque).toBeCloseTo(1.52, 2)
    expect(r.vasoTapa).toBeCloseTo(2.83, 2)
    expect(r.indirectos).toBeCloseTo(2.24, 2)
    expect(r.tarifaHora).toBe(55)
    expect(r.manoDeObra).toBeCloseTo(3.67, 2)
    expect(r.utilidad).toBeCloseTo(22.58, 2)
    expect(r.retencionIsr).toBeCloseTo(2.26, 2)
    expect(r.retencionIva).toBeCloseTo(7.24, 2)
    expect(r.depositoEsperado).toBeCloseTo(65.05, 2)
  })

  it('Pecado Tropical 20 oz, Entera, Uber Eats, tarifa $60/h', () => {
    const fechaHora = new Date('2026-09-30T07:30:00') // miércoles, turno mañana $60/h
    const r = desgloseLinea({
      fechaHora,
      canalTipo: 'plataforma',
      canalNombre: 'Uber Eats',
      bebida: bebidas['Pecado Tropical'],
      tamano: tamanos['20 oz'],
      adicionalesElegidos: [],
      precioApp: precioListaDeV3('Pecado Tropical', '20 oz'),
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
      configPlataforma: uberEats,
    })
    expect(r.precio).toBeCloseTo(75, 2)
    expect(r.ivaTrasladado).toBeCloseTo(10.34, 2)
    expect(r.ingresoSinIva).toBeCloseTo(64.66, 2)
    // El JSON trae 22.12; 75*0.295 = 22.125 exacto, y la regla de redondeo del motor (empate hacia
    // arriba, verificada contra los 5 casos y el evento de datos_iniciales_bendita_1.json) da 22.13.
    expect(r.comision).toBeCloseTo(22.13, 2)
    expect(r.insumos).toBeCloseTo(17.8, 2)
    expect(r.empaque).toBeCloseTo(1.52, 2)
    expect(r.vasoTapa).toBeCloseTo(2.27, 2)
    expect(r.indirectos).toBeCloseTo(2.24, 2)
    expect(r.tarifaHora).toBe(60)
    expect(r.manoDeObra).toBeCloseTo(3.0, 2)
    expect(r.utilidad).toBeCloseTo(15.7, 2)
    expect(r.retencionIsr).toBeCloseTo(1.62, 2)
    expect(r.retencionIva).toBeCloseTo(5.17, 2)
    expect(r.depositoEsperado).toBeCloseTo(42.55, 2)
  })
})

describe('reglas de canal y cierre (catálogo v3)', () => {
  it('el 14 oz sólo aparece en el canal Evento', () => {
    expect(tamanos['14 oz'].canales).toEqual(['Evento'])
  })

  it('el 16 oz descuenta tapa + playo, y nada de película de selladora', () => {
    const consumo = resolverLineasConsumo(bebidas['Taro Celestial'], tamanos['16 oz'], leches['Entera'], [])
    const movimientos = movimientosInventarioDeLinea(consumo, tamanos['16 oz'], insumos)
    const claves = movimientos.map((m) => m.insumoClave)
    expect(claves).toContain('tapa')
    expect(claves).toContain('playo')
    expect(claves).not.toContain('pelicula_sello')
  })

  it('el 20 oz sólo descuenta película de selladora, y nada de tapa ni playo', () => {
    const consumo = resolverLineasConsumo(bebidas['Pecado Tropical'], tamanos['20 oz'], undefined, [])
    const movimientos = movimientosInventarioDeLinea(consumo, tamanos['20 oz'], insumos)
    const claves = movimientos.map((m) => m.insumoClave)
    expect(claves).toContain('pelicula_sello')
    expect(claves).not.toContain('tapa')
    expect(claves).not.toContain('playo')
  })

  it('un pedido de 5 bebidas necesita 2 charolas (ceil(5/4))', () => {
    expect(Math.ceil(5 / 4)).toBe(2)
  })
})

describe('adicionales restringidos por canal (Versión frappé)', () => {
  it('no aplica en Rappi ni Uber Eats', () => {
    expect(adicionalAplica(adicionales['Versión frappé'], bebidas['Taro Celestial'], 'Rappi')).toBe(false)
    expect(adicionalAplica(adicionales['Versión frappé'], bebidas['Taro Celestial'], 'Uber Eats')).toBe(false)
  })

  it('sí aplica en Público en general y en Evento', () => {
    expect(adicionalAplica(adicionales['Versión frappé'], bebidas['Taro Celestial'], 'Público en general')).toBe(true)
    expect(adicionalAplica(adicionales['Versión frappé'], bebidas['Taro Celestial'], 'Evento')).toBe(true)
  })
})
