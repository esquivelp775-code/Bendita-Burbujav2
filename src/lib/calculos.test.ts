import { describe, expect, it } from 'vitest'
import {
  adicionalAplica,
  cotizarEvento,
  desgloseLinea,
  precioSugerido,
  redondeo5,
} from './calculos'
import {
  construirAdicionales,
  construirBebidas,
  construirCategorias,
  construirConfigPlataforma,
  construirConfigPublico,
  construirInsumos,
  construirLeches,
  construirParametros,
  construirTamanos,
  construirTurnos,
  precioListaDe,
  precioPublicoDe,
} from './fixtures'

const insumos = construirInsumos()
const tamanos = construirTamanos()
const categorias = construirCategorias()
const bebidas = construirBebidas()
const leches = construirLeches()
const adicionales = construirAdicionales()
const parametros = construirParametros()
const turnos = construirTurnos()
const uberEats = construirConfigPlataforma('Uber Eats')
const rappi = construirConfigPlataforma('Rappi')
const configPublico = construirConfigPublico()

describe('redondeo5', () => {
  it('redondea al múltiplo de 5 más cercano, empate hacia arriba', () => {
    expect(redondeo5(42.5)).toBe(45)
    expect(redondeo5(63)).toBe(65)
    expect(redondeo5(58.5)).toBe(60)
    expect(redondeo5(90)).toBe(90)
  })
})

describe('pruebas_de_calculo — sección 9 de la especificación (exactas al centavo)', () => {
  it('1. Taro Celestial 14 oz, entera, Uber Eats, martes 14:00', () => {
    const d = desgloseLinea({
      fechaHora: new Date(2026, 8, 22, 14, 0), // martes
      canalTipo: 'plataforma',
      bebida: bebidas['Taro Celestial'],
      tamano: tamanos['14 oz'],
      lecheElegida: leches['Entera'],
      adicionalesElegidos: [],
      precioApp: precioListaDe('Taro Celestial', '14 oz'),
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
      configPlataforma: uberEats,
    })

    expect(d.precio).toBe(95.0)
    expect(d.utilidad).toBe(17.77)
    expect(d.depositoEsperado).toBe(53.89)
    expect(d.tarifaHora).toBe(45)
    expect(d.minutos).toBe(4)

    const sumaTramos =
      d.ivaTrasladado + d.comision + d.insumos + d.empaque + d.vasoTapa + d.indirectos + d.manoDeObra + d.utilidad
    expect(sumaTramos).toBeCloseTo(d.precio, 2)
  })

  it('2. Alma Blanca 14 oz, avena + espuma de vainilla (con avena), Rappi, sábado 08:00', () => {
    const d = desgloseLinea({
      fechaHora: new Date(2026, 8, 26, 8, 0), // sábado
      canalTipo: 'plataforma',
      bebida: bebidas['Alma Blanca'],
      tamano: tamanos['14 oz'],
      lecheElegida: leches['Avena Oatly'],
      adicionalesElegidos: [{ nombre: 'Espuma de vainilla' }],
      precioApp: precioListaDe('Alma Blanca', '14 oz'),
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
      configPlataforma: rappi,
    })

    expect(d.precio).toBe(115.0)
    expect(d.utilidad).toBe(30.95)
    expect(d.depositoEsperado).toBe(71.24)
    expect(d.tarifaHora).toBe(55)
    expect(d.minutos).toBe(3)

    // La espuma sobre una bebida con avena descuenta avena_oatly, no leche entera.
    const consumoEspumaLeche = d.consumo.filter((c) => c.insumoClave === 'avena_oatly')
    expect(consumoEspumaLeche.length).toBe(2) // la leche de la receta + la de la espuma
    expect(d.consumo.some((c) => c.insumoClave === 'leche')).toBe(false)

    const sumaTramos =
      d.ivaTrasladado + d.comision + d.insumos + d.empaque + d.vasoTapa + d.indirectos + d.manoDeObra + d.utilidad
    expect(sumaTramos).toBeCloseTo(d.precio, 2)
  })

  it('3. Pecado Tropical 16 oz + perlas de maracuyá + shot de frambuesa, Público, miércoles 07:30', () => {
    const d = desgloseLinea({
      fechaHora: new Date(2026, 8, 23, 7, 30), // miércoles
      canalTipo: 'publico',
      bebida: bebidas['Pecado Tropical'],
      tamano: tamanos['16 oz'],
      adicionalesElegidos: [
        { nombre: 'Perlas explosivas extra', sabor: 'Maracuyá' },
        { nombre: 'Shot de jarabe', sabor: 'Frambuesa' },
      ],
      precioApp: precioListaDe('Pecado Tropical', '16 oz'),
      precioPublico: precioPublicoDe('Pecado Tropical', '16 oz'),
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
      configPublico,
    })

    expect(d.precio).toBe(85.0)
    expect(d.utilidad).toBe(43.72)
    expect(d.depositoEsperado).toBe(85.0)
    expect(d.tarifaHora).toBe(60)
    expect(d.minutos).toBe(3.3)

    // Las perlas de maracuyá descuentan perla_maracuya (no mango) y el shot de frambuesa jarabe_frambuesa.
    expect(d.consumo.some((c) => c.insumoClave === 'perla_maracuya' && c.cantidad === 30)).toBe(true)
    expect(d.consumo.filter((c) => c.insumoClave === 'perla_mango').length).toBe(1) // sólo el de la receta base

    const sumaTramos =
      d.ivaTrasladado + d.comision + d.insumos + d.empaque + d.vasoTapa + d.indirectos + d.manoDeObra + d.utilidad
    expect(sumaTramos).toBeCloseTo(d.precio, 2)
  })

  it('4. Gloria de Vainilla 20 oz, deslactosada, Uber Eats, domingo 09:00', () => {
    const d = desgloseLinea({
      fechaHora: new Date(2026, 8, 27, 9, 0), // domingo
      canalTipo: 'plataforma',
      bebida: bebidas['Gloria de Vainilla'],
      tamano: tamanos['20 oz'],
      lecheElegida: leches['Deslactosada'],
      adicionalesElegidos: [],
      precioApp: precioListaDe('Gloria de Vainilla', '20 oz'),
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
      configPlataforma: uberEats,
    })

    expect(d.precio).toBe(85.0)
    expect(d.utilidad).toBe(18.92)
    expect(d.depositoEsperado).toBe(48.22)
    expect(d.tarifaHora).toBe(55)

    const sumaTramos =
      d.ivaTrasladado + d.comision + d.insumos + d.empaque + d.vasoTapa + d.indirectos + d.manoDeObra + d.utilidad
    expect(sumaTramos).toBeCloseTo(d.precio, 2)
  })

  it('5. Penitencia Fría 14 oz en evento de 100 bebidas, sábado 18:00', () => {
    const d = desgloseLinea({
      fechaHora: new Date(2026, 8, 26, 18, 0), // sábado, fuera de cualquier turno
      canalTipo: 'evento',
      bebida: bebidas['Penitencia Fría'],
      tamano: tamanos['14 oz'],
      adicionalesElegidos: [],
      precioApp: precioListaDe('Penitencia Fría', '14 oz'),
      factorEvento: 0.9, // escala 100-149
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
    })

    expect(d.precio).toBe(55.0)
    expect(d.utilidad).toBe(32.27)
    expect(d.depositoEsperado).toBe(55.0)
    expect(d.tarifaHora).toBe(50)
  })
})

describe('reglas de adicionales — imposibilidades (sección 9)', () => {
  it('Tapioca extra es imposible en un café (sólo aplica a Bubble tea)', () => {
    expect(adicionalAplica(adicionales['Tapioca extra'], bebidas['Penitencia Fría'])).toBe(false)
  })

  it('Espuma de vainilla es imposible en Gloria de Vainilla (excluida, ya la trae)', () => {
    expect(adicionalAplica(adicionales['Espuma de vainilla'], bebidas['Gloria de Vainilla'])).toBe(false)
    expect(adicionalAplica(adicionales['Espuma de vainilla'], bebidas['Alma Blanca'])).toBe(true)
  })
})

describe('cotizacion_evento_ejemplo — 100 bebidas de 16 oz', () => {
  it('reproduce subtotal, total y utilidad del ejemplo', () => {
    const fechaHora = new Date(2026, 8, 26, 15, 0)
    const linea = (bebida: string, cantidad: number) => ({
      bebida: bebidas[bebida],
      tamano: tamanos['16 oz'],
      cantidad,
      precioApp: precioListaDe(bebida, '16 oz'),
    })

    const resultado = cotizarEvento({
      lineas: [
        linea('Taro Celestial', 30),
        linea('Matcha Divino', 10),
        linea('Pecado Tropical', 20),
        linea('Amén de Maracuyá', 10),
        linea('Penitencia Fría', 15),
        linea('Alma Blanca', 15),
      ],
      escalas: [
        { desde: 30, hasta: 59, factor: 1.0, cargoServicio: 600 },
        { desde: 60, hasta: 99, factor: 0.95, cargoServicio: 500 },
        { desde: 100, hasta: 149, factor: 0.9, cargoServicio: 400 },
        { desde: 150, hasta: 249, factor: 0.85, cargoServicio: 300 },
        { desde: 250, hasta: null, factor: 0.8, cargoServicio: 0 },
      ],
      minimoBebidas: 30,
      traslado: 400,
      equipoHieloDesechables: 300,
      horasMontaje: 3,
      utilidadPromedioApps: 18.5213,
      lecheDefault: leches['Entera'],
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
      fechaHora,
    })

    expect(resultado.n).toBe(100)
    expect(resultado.escala.factor).toBe(0.9)
    expect(resultado.subtotalBebidas).toBe(7525)
    expect(resultado.cargoServicio).toBe(400)
    expect(resultado.totalCliente).toBe(7925)
    expect(resultado.utilidadEvento).toBe(2988.68)
    expect(resultado.utilidadPorBebida).toBe(29.89)
    expect(resultado.comparativoApps).toBeCloseTo(1852.13, 1)
    // "conviene": true en el ejemplo — el evento deja más por bebida que las apps, sin alerta.
    expect(resultado.alertaMenosQueApps).toBe(false)
  })

  it('cotizar 45 bebidas usa la escala 30-59; cotizar 25 se bloquea', () => {
    const fechaHora = new Date(2026, 8, 26, 15, 0)
    const escalas = [
      { desde: 30, hasta: 59, factor: 1.0, cargoServicio: 600 },
      { desde: 60, hasta: 99, factor: 0.95, cargoServicio: 500 },
    ]
    const base = {
      escalas,
      minimoBebidas: 30,
      traslado: 400,
      equipoHieloDesechables: 300,
      horasMontaje: 3,
      utilidadPromedioApps: 18.5213,
      lecheDefault: leches['Entera'],
      insumos,
      adicionalesCatalogo: adicionales,
      categorias,
      parametros,
      turnos,
      fechaHora,
    }

    const con45 = cotizarEvento({
      ...base,
      lineas: [{ bebida: bebidas['Taro Celestial'], tamano: tamanos['16 oz'], cantidad: 45, precioApp: precioListaDe('Taro Celestial', '16 oz') }],
    })
    expect(con45.escala.desde).toBe(30)
    expect(con45.bloqueadoPorMinimo).toBe(false)

    const con25 = cotizarEvento({
      ...base,
      lineas: [{ bebida: bebidas['Taro Celestial'], tamano: tamanos['16 oz'], cantidad: 25, precioApp: precioListaDe('Taro Celestial', '16 oz') }],
    })
    expect(con25.bloqueadoPorMinimo).toBe(true)
  })
})

/** Utilidad en Uber Eats a un precio dado, para verificar la brecha mínima entre tamaños (regla v3). */
function utilidadEnUber(bebida: (typeof bebidas)[string], tamano: (typeof tamanos)[string], lecheElegida: ReturnType<typeof construirLeches>[string] | undefined, precio: number) {
  return desgloseLinea({
    fechaHora: new Date('2026-09-27T12:00:00'),
    canalTipo: 'plataforma',
    bebida,
    tamano,
    lecheElegida,
    adicionalesElegidos: [],
    precioApp: precio,
    insumos,
    adicionalesCatalogo: adicionales,
    categorias,
    parametros,
    turnos,
    configPlataforma: uberEats,
  }).utilidad
}

describe('precio sugerido — escalera por tamaño (5.9, regla v3)', () => {
  it('Pecado Tropical: precios múltiplos de 5 y el 20 oz deja al menos $2.50 más que el 16 oz en Uber', () => {
    const tamanosOrdenados = [tamanos['14 oz'], tamanos['16 oz'], tamanos['20 oz']]
    const sugerido = precioSugerido({
      bebida: bebidas['Pecado Tropical'],
      tamanos: tamanosOrdenados,
      categoria: categorias['Soda italiana'],
      insumos,
      parametros,
      comisionEfectivaUber: uberEats.comisionEfectiva,
      tarifaManoDeObraPromedio: 50,
    })
    for (const t of tamanosOrdenados) expect(sugerido[t.nombre] % 5).toBe(0)

    const u16 = utilidadEnUber(bebidas['Pecado Tropical'], tamanos['16 oz'], undefined, sugerido['16 oz'])
    const u14 = utilidadEnUber(bebidas['Pecado Tropical'], tamanos['14 oz'], undefined, sugerido['14 oz'])
    const u20 = utilidadEnUber(bebidas['Pecado Tropical'], tamanos['20 oz'], undefined, sugerido['20 oz'])
    expect(u16 - u14).toBeGreaterThanOrEqual(2.5 - 1e-9)
    expect(u20 - u16).toBeGreaterThanOrEqual(2.5 - 1e-9)
  })

  it('Taro Celestial: precios múltiplos de 5 y el 20 oz deja al menos $2.50 más que el 16 oz en Uber', () => {
    const tamanosOrdenados = [tamanos['14 oz'], tamanos['16 oz'], tamanos['20 oz']]
    const sugerido = precioSugerido({
      bebida: bebidas['Taro Celestial'],
      tamanos: tamanosOrdenados,
      lecheDefault: leches['Entera'],
      categoria: categorias['Bubble tea'],
      insumos,
      parametros,
      comisionEfectivaUber: uberEats.comisionEfectiva,
      tarifaManoDeObraPromedio: 50,
    })
    for (const t of tamanosOrdenados) expect(sugerido[t.nombre] % 5).toBe(0)

    const u16 = utilidadEnUber(bebidas['Taro Celestial'], tamanos['16 oz'], leches['Entera'], sugerido['16 oz'])
    const u14 = utilidadEnUber(bebidas['Taro Celestial'], tamanos['14 oz'], leches['Entera'], sugerido['14 oz'])
    const u20 = utilidadEnUber(bebidas['Taro Celestial'], tamanos['20 oz'], leches['Entera'], sugerido['20 oz'])
    expect(u16 - u14).toBeGreaterThanOrEqual(2.5 - 1e-9)
    expect(u20 - u16).toBeGreaterThanOrEqual(2.5 - 1e-9)
  })
})
