// Módulo puro de cálculo — sección 5 de la especificación técnica.
// Sin React, sin Supabase, sin efectos secundarios. Todo el dinero de la app pasa por aquí.

export type CanalTipo = 'plataforma' | 'publico' | 'evento'
export type Prioridad = 'alta' | 'media' | 'baja'

export interface Insumo {
  clave: string
  nombre: string
  categoria: string
  /** Costo por unidad de receta, sin IVA, ya dividido entre (1 − merma). Fórmula 5.1. */
  costoUnitarioNeto: number
  /** Fracción de merma física (0 para piezas como vaso/tapa). */
  merma: number
  prioridad?: Prioridad
  umbralReorden?: number | null
  stockObjetivo?: number | null
  caducaAbiertoDias?: number | null
}

export interface Tamano {
  nombre: string
  ml: number
  factorEscala: number
  vasoInsumoClave: string
  /** Insumos que se descuentan al cerrar el vaso (p. ej. tapa+playo, o sólo película de selladora). */
  cierreInsumoClaves: string[]
  /** Nombres de canal donde este tamaño puede venderse. Si no se especifica, aplica a todos. */
  canales?: string[]
}

export interface Categoria {
  nombre: string
  minutosPreparacion: number
  utilidadObjetivo: number
}

export interface RecetaLinea {
  insumoClave: string
  cantidad: number
  escalaConTamano: boolean
  esLeche: boolean
}

export interface Bebida {
  nombre: string
  categoriaNombre: string
  llevaLeche: boolean
  receta: RecetaLinea[]
}

export interface Leche {
  nombre: string
  insumoClave: string
  sobreprecio: number
  esDefault: boolean
}

export interface AdicionalLinea {
  insumoClave: string
  cantidad: number
  esLeche: boolean
  cambiaPorSabor: boolean
}

export interface Adicional {
  nombre: string
  precio: number
  minutos: number
  receta: AdicionalLinea[]
  aplicaACategorias: string[]
  excluyeBebidas: string[]
  /** Mapa plano sabor → insumoClave, cuando el sabor no depende de la categoría de la bebida. */
  sabores?: Record<string, string>
  /** Mapa categoría → sabor → insumoClave, cuando el sabor depende de la categoría de la bebida. */
  saboresPorCategoria?: Record<string, Record<string, string>>
  /** Nombres de canal donde este adicional puede ofrecerse. Si no se especifica, aplica a todos. */
  canales?: string[]
}

export interface AdicionalElegido {
  nombre: string
  sabor?: string
}

export interface Turno {
  nombre: string
  /** 0 = domingo … 6 = sábado, igual que Date.getDay(). */
  dias: number[]
  inicio: string // "HH:MM"
  fin: string // "HH:MM"
  horaManoDeObra: number
  activo?: boolean
}

export interface ConfigPlataforma {
  comisionEfectiva: number
  ivaSobreComision: number
  retencionIsr: number
  retencionIva: number
}

export interface ConfigPublico {
  descuentoVsApp: number
  envioCobradoDefault: number
  costoEnvioDefault: number
}

export interface EscalaEvento {
  desde: number
  hasta: number | null
  factor: number
  cargoServicio: number
}

export interface Parametros {
  ivaVenta: number
  indirectosPorBebida: number
  mermaDefault: number
  redondeoPrecio: number
  horaManoDeObraFueraDeTurno: number
  metaUtilidadSemanal: number
  umbralReordenPorPrioridad: Record<Prioridad, number>
}

// ─── Redondeo ────────────────────────────────────────────────────────────

/** Múltiplo de 5 más cercano, empate hacia arriba. Ej. 42.50 → 45. */
export function redondeo5(x: number): number {
  return Math.round(x / 5) * 5
}

/** Redondeo a centavos, empate hacia arriba (round half up), tolerante a imprecisión flotante. */
export function redondeoCentavos(x: number): number {
  return Math.round((x + Number.EPSILON) * 100) / 100
}

// ─── 5.1 / 5.2 — Costo de insumos y compras ────────────────────────────────

/** costo_unitario_neto = costo_fisico_neto / (1 − merma) */
export function costoUnitarioNeto(costoFisicoNeto: number, merma: number): number {
  return costoFisicoNeto / (1 - merma)
}

export function costoEntradaNeto(precioPorPresentacion: number, iva: number, contenidoUtilPorPresentacion: number): number {
  return precioPorPresentacion / (1 + iva) / contenidoUtilPorPresentacion
}

/** Promedio ponderado del costo físico neto tras una compra. Fórmula 5.2. */
export function costoCompraPonderado(
  existencia: number,
  costoFisicoNetoPrevio: number,
  presentaciones: number,
  contenidoUtilPorPresentacion: number,
  precioPorPresentacion: number,
  iva: number,
): number {
  const unidadesEntrada = presentaciones * contenidoUtilPorPresentacion
  const costoEntrada = costoEntradaNeto(precioPorPresentacion, iva, contenidoUtilPorPresentacion)
  if (existencia <= 0) return costoEntrada
  return (existencia * costoFisicoNetoPrevio + unidadesEntrada * costoEntrada) / (existencia + unidadesEntrada)
}

// ─── 5.3 — Tarifa de mano de obra ──────────────────────────────────────────

function minutosDesdeMedianoche(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Turno vigente para una fecha/hora, o la tarifa fuera de turno si no hay ninguno o se fuerza. */
export function tarifaManoDeObra(
  fechaHora: Date,
  turnos: Turno[],
  horaManoDeObraFueraDeTurno: number,
  forzarFueraDeTurno = false,
): number {
  if (forzarFueraDeTurno) return horaManoDeObraFueraDeTurno
  const dia = fechaHora.getDay()
  const minutos = fechaHora.getHours() * 60 + fechaHora.getMinutes()
  const turno = turnos.find(
    (t) =>
      (t.activo ?? true) &&
      t.dias.includes(dia) &&
      minutos >= minutosDesdeMedianoche(t.inicio) &&
      minutos < minutosDesdeMedianoche(t.fin),
  )
  return turno ? turno.horaManoDeObra : horaManoDeObraFueraDeTurno
}

// ─── Reglas de adicionales ──────────────────────────────────────────────

/** Un adicional sólo puede ofrecerse si su categoría aplica, la bebida no está excluida y el canal lo permite. */
export function adicionalAplica(adicional: Adicional, bebida: Bebida, canalNombre?: string): boolean {
  if (!adicional.aplicaACategorias.includes(bebida.categoriaNombre)) return false
  if (adicional.excluyeBebidas.includes(bebida.nombre)) return false
  if (adicional.canales && canalNombre && !adicional.canales.includes(canalNombre)) return false
  return true
}

/** Resuelve el insumo real de un sabor elegido para un adicional, según la categoría de la bebida. */
export function insumoDeSaborAdicional(adicional: Adicional, categoriaBebidaNombre: string, sabor: string): string {
  if (adicional.saboresPorCategoria) {
    const porCategoria = adicional.saboresPorCategoria[categoriaBebidaNombre]
    const insumoClave = porCategoria?.[sabor]
    if (!insumoClave) throw new Error(`${adicional.nombre}: el sabor "${sabor}" no aplica a la categoría "${categoriaBebidaNombre}"`)
    return insumoClave
  }
  if (adicional.sabores) {
    const insumoClave = adicional.sabores[sabor]
    if (!insumoClave) throw new Error(`${adicional.nombre}: el sabor "${sabor}" no existe`)
    return insumoClave
  }
  throw new Error(`${adicional.nombre} no tiene sabores configurados`)
}

// ─── Consumo de insumos (receta + adicionales) ─────────────────────────────

export interface ConsumoInsumo {
  insumoClave: string
  /** Cantidad nominal de receta, ya escalada por tamaño si aplica. Sin ajuste de merma. */
  cantidad: number
}

interface AdicionalResuelto {
  adicional: Adicional
  sabor?: string
}

function resolverAdicionalesElegidos(
  adicionalesElegidos: AdicionalElegido[],
  adicionalesCatalogo: Record<string, Adicional>,
  bebida: Bebida,
  canalNombre?: string,
): AdicionalResuelto[] {
  return adicionalesElegidos.map((el) => {
    const adicional = adicionalesCatalogo[el.nombre]
    if (!adicional) throw new Error(`Adicional desconocido: ${el.nombre}`)
    if (!adicionalAplica(adicional, bebida, canalNombre)) throw new Error(`"${adicional.nombre}" no aplica a "${bebida.nombre}"`)
    return { adicional, sabor: el.sabor }
  })
}

/** Líneas de consumo nominal (receta de la bebida + adicionales elegidos), con sustitución de leche/sabor resuelta. */
export function resolverLineasConsumo(
  bebida: Bebida,
  tamano: Tamano,
  lecheElegida: Leche | undefined,
  adicionalesResueltos: AdicionalResuelto[],
): ConsumoInsumo[] {
  if (bebida.llevaLeche && !lecheElegida) throw new Error(`"${bebida.nombre}" lleva leche: falta elegir leche`)

  const lineas: ConsumoInsumo[] = []

  for (const linea of bebida.receta) {
    const insumoClave = linea.esLeche && bebida.llevaLeche ? lecheElegida!.insumoClave : linea.insumoClave
    const cantidad = linea.cantidad * (linea.escalaConTamano ? tamano.factorEscala : 1)
    lineas.push({ insumoClave, cantidad })
  }

  for (const { adicional, sabor } of adicionalesResueltos) {
    for (const linea of adicional.receta) {
      let insumoClave: string
      if (linea.cambiaPorSabor) {
        if (!sabor) throw new Error(`"${adicional.nombre}" requiere elegir un sabor`)
        insumoClave = insumoDeSaborAdicional(adicional, bebida.categoriaNombre, sabor)
      } else if (linea.esLeche) {
        if (!lecheElegida) throw new Error(`"${adicional.nombre}" usa la leche elegida, pero la bebida no lleva leche`)
        insumoClave = lecheElegida.insumoClave
      } else {
        insumoClave = linea.insumoClave
      }
      lineas.push({ insumoClave, cantidad: linea.cantidad })
    }
  }

  return lineas
}

function costosPorConsumo(consumo: ConsumoInsumo[], insumos: Record<string, Insumo>) {
  let insumosTotal = 0
  let empaqueTotal = 0
  for (const { insumoClave, cantidad } of consumo) {
    const insumo = insumos[insumoClave]
    if (!insumo) throw new Error(`Insumo desconocido: ${insumoClave}`)
    const costo = cantidad * insumo.costoUnitarioNeto
    if (insumo.categoria === 'empaque') empaqueTotal += costo
    else insumosTotal += costo
  }
  return { insumosTotal, empaqueTotal }
}

function vasoTapaCosto(tamano: Tamano, insumos: Record<string, Insumo>): number {
  const vaso = insumos[tamano.vasoInsumoClave]
  if (!vaso) throw new Error(`Vaso no configurado para el tamaño "${tamano.nombre}"`)
  const cierreTotal = tamano.cierreInsumoClaves.reduce((acc, clave) => {
    const cierre = insumos[clave]
    if (!cierre) throw new Error(`Cierre "${clave}" no configurado para el tamaño "${tamano.nombre}"`)
    return acc + cierre.costoUnitarioNeto
  }, 0)
  return vaso.costoUnitarioNeto + cierreTotal
}

function minutosLinea(categoria: Categoria, adicionalesResueltos: AdicionalResuelto[]): number {
  return categoria.minutosPreparacion + adicionalesResueltos.reduce((acc, a) => acc + a.adicional.minutos, 0)
}

/**
 * Movimientos de inventario reales de una línea (fórmula 5.6): cada consumo se divide entre
 * (1 − merma) porque la merma es material que se compra y se tira, no sólo lo que llega al vaso.
 * Es una cantidad distinta (mayor) que la usada para costear la línea, que ya trae la merma
 * incorporada en `costoUnitarioNeto` (5.1). Incluye vaso y tapa (merma 0, son piezas).
 */
export function movimientosInventarioDeLinea(
  consumo: ConsumoInsumo[],
  tamano: Tamano,
  insumos: Record<string, Insumo>,
): { insumoClave: string; cantidadFisica: number }[] {
  const movimientos = consumo.map(({ insumoClave, cantidad }) => {
    const insumo = insumos[insumoClave]
    if (!insumo) throw new Error(`Insumo desconocido: ${insumoClave}`)
    return { insumoClave, cantidadFisica: -cantidad / (1 - insumo.merma) }
  })
  movimientos.push({ insumoClave: tamano.vasoInsumoClave, cantidadFisica: -1 })
  for (const clave of tamano.cierreInsumoClaves) {
    movimientos.push({ insumoClave: clave, cantidadFisica: -1 })
  }
  return movimientos
}

// ─── 5.4 — Precio por canal ────────────────────────────────────────────────

export interface PrecioPorCanalInput {
  canalTipo: CanalTipo
  precioApp: number
  precioPublico?: number
  extraLeche: number
  sumaAdicionales: number
  descuentoVsApp?: number
  factorEvento?: number
}

export function precioPorCanal(input: PrecioPorCanalInput): number {
  const { canalTipo, precioApp, precioPublico, extraLeche, sumaAdicionales, descuentoVsApp, factorEvento } = input
  if (canalTipo === 'plataforma') {
    return precioApp + extraLeche + sumaAdicionales
  }
  if (canalTipo === 'publico') {
    if (precioPublico == null || descuentoVsApp == null) throw new Error('precioPublico y descuentoVsApp son requeridos para canal público')
    return precioPublico + extraLeche + redondeo5(sumaAdicionales * (1 - descuentoVsApp))
  }
  if (factorEvento == null) throw new Error('factorEvento es requerido para canal evento')
  return redondeo5(precioApp * factorEvento) + redondeo5((extraLeche + sumaAdicionales) * factorEvento)
}

// ─── 5.5 — Desglose de una línea ───────────────────────────────────────────

export interface DesgloseLineaInput {
  fechaHora: Date
  canalTipo: CanalTipo
  /** Nombre del canal (p. ej. "Rappi", "Público en general"), usado para filtrar adicionales por canal. */
  canalNombre?: string
  bebida: Bebida
  tamano: Tamano
  lecheElegida?: Leche
  adicionalesElegidos: AdicionalElegido[]
  /** Precio de lista vigente (manual o sugerido) de la bebida en ese tamaño, canal 'app'. */
  precioApp: number
  /** Requerido si canalTipo === 'publico'. */
  precioPublico?: number
  /** Requerido si canalTipo === 'evento': factor de la escala del evento. */
  factorEvento?: number
  insumos: Record<string, Insumo>
  adicionalesCatalogo: Record<string, Adicional>
  categorias: Record<string, Categoria>
  parametros: Parametros
  turnos: Turno[]
  configPlataforma?: ConfigPlataforma
  configPublico?: ConfigPublico
  /** Fuerza la tarifa fuera de turno (eventos, ventas sueltas). Los eventos siempre la usan. */
  fueraDeTurno?: boolean
}

export interface DesgloseLinea {
  precio: number
  ivaTrasladado: number
  ingresoSinIva: number
  comision: number
  ivaComision: number
  insumos: number
  empaque: number
  vasoTapa: number
  indirectos: number
  minutos: number
  tarifaHora: number
  manoDeObra: number
  utilidad: number
  retencionIsr: number
  retencionIva: number
  depositoEsperado: number
  consumo: ConsumoInsumo[]
}

export function desgloseLinea(input: DesgloseLineaInput): DesgloseLinea {
  const {
    fechaHora,
    canalTipo,
    canalNombre,
    bebida,
    tamano,
    lecheElegida,
    adicionalesElegidos,
    precioApp,
    precioPublico,
    factorEvento,
    insumos,
    adicionalesCatalogo,
    categorias,
    parametros,
    turnos,
    configPlataforma,
    configPublico,
    fueraDeTurno,
  } = input

  const adicionalesResueltos = resolverAdicionalesElegidos(adicionalesElegidos, adicionalesCatalogo, bebida, canalNombre)

  const extraLeche = bebida.llevaLeche && lecheElegida ? lecheElegida.sobreprecio : 0
  const sumaAdicionales = adicionalesResueltos.reduce((acc, a) => acc + a.adicional.precio, 0)

  const precio = precioPorCanal({
    canalTipo,
    precioApp,
    precioPublico,
    extraLeche,
    sumaAdicionales,
    descuentoVsApp: configPublico?.descuentoVsApp,
    factorEvento,
  })

  const ivaVenta = parametros.ivaVenta
  const ingresoSinIva = precio / (1 + ivaVenta)
  const ivaTrasladado = precio - ingresoSinIva

  const esPlataforma = canalTipo === 'plataforma'
  const comision = esPlataforma ? precio * (configPlataforma?.comisionEfectiva ?? 0) : 0
  const ivaComision = esPlataforma ? comision * (configPlataforma?.ivaSobreComision ?? 0) : 0

  const consumo = resolverLineasConsumo(bebida, tamano, lecheElegida, adicionalesResueltos)
  const { insumosTotal, empaqueTotal } = costosPorConsumo(consumo, insumos)
  const vasoTapaTotal = vasoTapaCosto(tamano, insumos)
  const indirectos = parametros.indirectosPorBebida / (1 + ivaVenta)

  const categoria = categorias[bebida.categoriaNombre]
  if (!categoria) throw new Error(`Categoría desconocida: ${bebida.categoriaNombre}`)
  const minutos = minutosLinea(categoria, adicionalesResueltos)

  const tarifaHora = tarifaManoDeObra(fechaHora, turnos, parametros.horaManoDeObraFueraDeTurno, fueraDeTurno ?? canalTipo === 'evento')
  const manoDeObra = (minutos * tarifaHora) / 60

  const utilidadSinRedondear = ingresoSinIva - comision - insumosTotal - empaqueTotal - vasoTapaTotal - indirectos - manoDeObra

  const retencionIsr = esPlataforma ? ingresoSinIva * (configPlataforma?.retencionIsr ?? 0) : 0
  const retencionIva = esPlataforma ? ingresoSinIva * (configPlataforma?.retencionIva ?? 0) : 0

  const depositoEsperado = esPlataforma ? precio - comision - ivaComision - retencionIsr - retencionIva : precio

  return {
    precio: redondeoCentavos(precio),
    ivaTrasladado: redondeoCentavos(ivaTrasladado),
    ingresoSinIva: redondeoCentavos(ingresoSinIva),
    comision: redondeoCentavos(comision),
    ivaComision: redondeoCentavos(ivaComision),
    insumos: redondeoCentavos(insumosTotal),
    empaque: redondeoCentavos(empaqueTotal),
    vasoTapa: redondeoCentavos(vasoTapaTotal),
    indirectos: redondeoCentavos(indirectos),
    minutos,
    tarifaHora,
    manoDeObra: redondeoCentavos(manoDeObra),
    utilidad: redondeoCentavos(utilidadSinRedondear),
    retencionIsr: redondeoCentavos(retencionIsr),
    retencionIva: redondeoCentavos(retencionIva),
    depositoEsperado: redondeoCentavos(depositoEsperado),
    consumo,
  }
}

// ─── 5.7 — Envío (Público) ─────────────────────────────────────────────────

export interface DesgloseEnvio {
  envioSinIva: number
  ivaEnvio: number
  margenEnvio: number
}

export function desgloseEnvio(envioCobrado: number, costoEnvio: number, ivaVenta: number): DesgloseEnvio {
  const envioSinIva = envioCobrado / (1 + ivaVenta)
  const ivaEnvio = envioCobrado - envioSinIva
  const margenEnvio = envioSinIva - costoEnvio
  return {
    envioSinIva: redondeoCentavos(envioSinIva),
    ivaEnvio: redondeoCentavos(ivaEnvio),
    margenEnvio: redondeoCentavos(margenEnvio),
  }
}

// ─── 5.8 — Cotizador de eventos ─────────────────────────────────────────────

export interface LineaCotizacionInput {
  bebida: Bebida
  tamano: Tamano
  cantidad: number
  precioApp: number
  /** Requerida si la bebida lleva leche y no se usa `lecheDefault` del cotizador. */
  lecheElegida?: Leche
}

export interface LineaCotizacionResultado {
  bebida: string
  tamano: string
  cantidad: number
  precioUnitario: number
  utilidadUnitaria: number
  costoProduccion: number
  margenSobreCosto: number
}

export interface CotizarEventoInput {
  lineas: LineaCotizacionInput[]
  escalas: EscalaEvento[]
  minimoBebidas: number
  cargoServicioOverride?: number
  traslado: number
  equipoHieloDesechables: number
  horasMontaje: number
  /** Utilidad promedio por bebida de las apps en las últimas 4 semanas, o metas_del_modelo si no hay datos. */
  utilidadPromedioApps: number
  /** Leche a usar en bebidas que llevan leche cuando la línea no especifica una. Normalmente la de default. */
  lecheDefault?: Leche
  insumos: Record<string, Insumo>
  adicionalesCatalogo: Record<string, Adicional>
  categorias: Record<string, Categoria>
  parametros: Parametros
  turnos: Turno[]
  fechaHora: Date
}

export interface CotizarEventoResultado {
  n: number
  escala: EscalaEvento
  lineas: LineaCotizacionResultado[]
  subtotalBebidas: number
  cargoServicio: number
  totalCliente: number
  utilidadEvento: number
  utilidadPorBebida: number
  comparativoApps: number
  alertaMenosQueApps: boolean
  bloqueadoPorMinimo: boolean
}

export function cotizarEvento(input: CotizarEventoInput): CotizarEventoResultado {
  const n = input.lineas.reduce((acc, l) => acc + l.cantidad, 0)
  const bloqueadoPorMinimo = n < input.minimoBebidas

  if (bloqueadoPorMinimo) {
    const escalaMasBaja = [...input.escalas].sort((a, b) => a.desde - b.desde)[0]
    return {
      n,
      escala: escalaMasBaja,
      lineas: [],
      subtotalBebidas: 0,
      cargoServicio: escalaMasBaja?.cargoServicio ?? 0,
      totalCliente: 0,
      utilidadEvento: 0,
      utilidadPorBebida: 0,
      comparativoApps: redondeoCentavos(n * input.utilidadPromedioApps),
      alertaMenosQueApps: false,
      bloqueadoPorMinimo,
    }
  }

  const escala = input.escalas.find((e) => n >= e.desde && (e.hasta == null || n <= e.hasta))
  if (!escala) throw new Error(`No hay escala de evento configurada para ${n} bebidas`)

  const cargoServicio = input.cargoServicioOverride ?? escala.cargoServicio

  const lineasResultado: LineaCotizacionResultado[] = input.lineas.map((l) => {
    const desglose = desgloseLinea({
      fechaHora: input.fechaHora,
      canalTipo: 'evento',
      bebida: l.bebida,
      tamano: l.tamano,
      lecheElegida: l.lecheElegida ?? input.lecheDefault,
      adicionalesElegidos: [],
      precioApp: l.precioApp,
      factorEvento: escala.factor,
      insumos: input.insumos,
      adicionalesCatalogo: input.adicionalesCatalogo,
      categorias: input.categorias,
      parametros: input.parametros,
      turnos: input.turnos,
      fueraDeTurno: true,
    })
    const costoProduccion = desglose.insumos + desglose.empaque + desglose.vasoTapa
    const margenSobreCosto = costoProduccion > 0 ? desglose.precio / (1 + input.parametros.ivaVenta) / costoProduccion - 1 : 0
    return {
      bebida: l.bebida.nombre,
      tamano: l.tamano.nombre,
      cantidad: l.cantidad,
      precioUnitario: desglose.precio,
      utilidadUnitaria: desglose.utilidad,
      costoProduccion: redondeoCentavos(costoProduccion),
      margenSobreCosto,
    }
  })

  const subtotalBebidas = lineasResultado.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0)
  const totalCliente = subtotalBebidas + cargoServicio

  const tarifaFueraDeTurno = input.parametros.horaManoDeObraFueraDeTurno
  const utilidadLineas = lineasResultado.reduce((acc, l) => acc + l.utilidadUnitaria * l.cantidad, 0)
  const utilidadEvento =
    utilidadLineas + cargoServicio / (1 + input.parametros.ivaVenta) - input.traslado - input.equipoHieloDesechables - input.horasMontaje * tarifaFueraDeTurno
  const utilidadPorBebida = n > 0 ? utilidadEvento / n : 0
  const comparativoApps = n * input.utilidadPromedioApps

  return {
    n,
    escala,
    lineas: lineasResultado,
    subtotalBebidas: redondeoCentavos(subtotalBebidas),
    cargoServicio,
    totalCliente: redondeoCentavos(totalCliente),
    utilidadEvento: redondeoCentavos(utilidadEvento),
    utilidadPorBebida: redondeoCentavos(utilidadPorBebida),
    comparativoApps: redondeoCentavos(comparativoApps),
    alertaMenosQueApps: utilidadPorBebida < input.utilidadPromedioApps,
    bloqueadoPorMinimo,
  }
}

// ─── 5.9 — Precio sugerido ──────────────────────────────────────────────────

export interface PrecioSugeridoInput {
  bebida: Bebida
  /** Tamaños activos ordenados de menor a mayor — la escalera se aplica en ese orden. */
  tamanos: Tamano[]
  lecheDefault?: Leche
  categoria: Categoria
  insumos: Record<string, Insumo>
  parametros: Parametros
  comisionEfectivaUber: number
  /** Tarifa promedio ($50/h) usada sólo para estimar el costo total del precio sugerido, 5.9. */
  tarifaManoDeObraPromedio: number
}

/**
 * Precio sugerido por tamaño, con escalera: cada tamaño debe dejar en Uber al menos $2.50 más de
 * utilidad que el tamaño anterior, subiendo de $5 en $5 hasta cumplirlo. Fórmula 5.9 (v3).
 */
export function precioSugerido(input: PrecioSugeridoInput): Record<string, number> {
  const { bebida, tamanos, lecheDefault, categoria, insumos, parametros, comisionEfectivaUber, tarifaManoDeObraPromedio } = input
  const denominador = 1 / (1 + parametros.ivaVenta) - comisionEfectivaUber
  const brechaMinimaEntreTamanos = 2.5

  const resultado: Record<string, number> = {}
  let anterior: { utilidad: number } | null = null

  for (const tamano of tamanos) {
    const consumo = resolverLineasConsumo(bebida, tamano, bebida.llevaLeche ? lecheDefault : undefined, [])
    const { insumosTotal, empaqueTotal } = costosPorConsumo(consumo, insumos)
    const vasoTapaTotal = vasoTapaCosto(tamano, insumos)
    const indirectos = parametros.indirectosPorBebida / (1 + parametros.ivaVenta)
    const manoDeObra = (categoria.minutosPreparacion * tarifaManoDeObraPromedio) / 60
    const costoTotal = insumosTotal + empaqueTotal + vasoTapaTotal + indirectos + manoDeObra

    let sugerido = redondeo5((costoTotal + categoria.utilidadObjetivo) / denominador)
    let utilidad = sugerido * denominador - costoTotal
    if (anterior != null) {
      while (utilidad < anterior.utilidad + brechaMinimaEntreTamanos) {
        sugerido += 5
        utilidad = sugerido * denominador - costoTotal
      }
    }
    resultado[tamano.nombre] = sugerido
    anterior = { utilidad }
  }

  return resultado
}

// ─── 5.10 — Reorden por prioridad y notificaciones ─────────────────────────

export type TipoAlertaInventario = 'reorden' | 'agotado' | 'caducidad' | 'cobertura'

export interface Alerta {
  insumoClave: string
  tipo: TipoAlertaInventario
}

export interface EstadoInsumo {
  insumo: Insumo
  existencia: number
  /** null si no hay stock objetivo (ni manual ni automático) — no se puede evaluar 'reorden'. */
  stockObjetivo: number | null
  consumoDiario14d: number
  aperturaAbiertaEn?: Date
}

export function umbralReorden(insumo: Insumo, parametros: Parametros): number {
  return insumo.umbralReorden ?? parametros.umbralReordenPorPrioridad[insumo.prioridad ?? 'media']
}

export function evaluarAlertasReorden(estado: EstadoInsumo, parametros: Parametros, hoy: Date): Alerta[] {
  const alertas: Alerta[] = []
  const { insumo, existencia, stockObjetivo, consumoDiario14d, aperturaAbiertaEn } = estado

  if (stockObjetivo != null && existencia <= umbralReorden(insumo, parametros) * stockObjetivo) {
    alertas.push({ insumoClave: insumo.clave, tipo: 'reorden' })
  }
  if (existencia <= 0) {
    alertas.push({ insumoClave: insumo.clave, tipo: 'agotado' })
  }
  if (consumoDiario14d > 0 && existencia / consumoDiario14d < 3) {
    alertas.push({ insumoClave: insumo.clave, tipo: 'cobertura' })
  }
  if (aperturaAbiertaEn && insumo.caducaAbiertoDias != null) {
    const diasTranscurridos = Math.floor((hoy.getTime() - aperturaAbiertaEn.getTime()) / 86_400_000)
    const diasRestantes = insumo.caducaAbiertoDias - diasTranscurridos
    if (diasRestantes <= 2) alertas.push({ insumoClave: insumo.clave, tipo: 'caducidad' })
  }
  return alertas
}

export interface CantidadSugeridaInput {
  stockObjetivo: number
  existencia: number
  contenidoUtilPorPresentacion: number
}

/** Presentaciones a comprar para llegar al stock objetivo — lista de compras, 5.10. */
export function cantidadSugeridaCompra(input: CantidadSugeridaInput): number {
  const faltante = input.stockObjetivo - input.existencia
  if (faltante <= 0) return 0
  return Math.ceil(faltante / input.contenidoUtilPorPresentacion)
}

// ─── 5.11 / 5.12 — Desglose del día y equipo ────────────────────────────────

export interface LineaDia {
  tipo: 'bebida' | 'botana' | 'cargo_servicio'
  canalTipo: CanalTipo
  precio: number
  cantidad: number
  ivaTrasladado: number
  comision: number
  insumos: number
  empaque: number
  vasoTapa: number
  indirectos: number
  manoDeObra: number
  utilidad: number
}

export interface PedidoDia {
  envioCobrado: number
  costoEnvio: number
}

export interface EventoDia {
  trasladoReal: number
  equipoReal: number
  horasMontaje: number
}

export interface ActivoDia {
  costoNeto: number
  valorRescate: number
  vidaUtilMeses: number
}

/** Depreciación mensual prorrateada al día. Fórmula 5.12. */
export function equipoDelDia(activos: ActivoDia[]): number {
  return activos.reduce((acc, a) => acc + (a.costoNeto - a.valorRescate) / a.vidaUtilMeses / 30.4, 0)
}

export interface DesgloseDelDia {
  venta: number
  iva: number
  comision: number
  insumos: number
  empaqueYVaso: number
  indirectos: number
  equipo: number
  costosEvento: number
  moMontaje: number
  costoEnvios: number
  manoDeObra: number
  ganancia: number
  teLlevas: number
}

/** Cascada del día (5.11): venta → IVA → comisión → insumos → empaque → indirectos → equipo → eventos → envíos → mano de obra → ganancia. */
export function desgloseDelDia(
  lineas: LineaDia[],
  pedidos: PedidoDia[],
  eventos: EventoDia[],
  activos: ActivoDia[],
  parametros: Parametros,
  tarifaFueraDeTurno: number,
): DesgloseDelDia {
  const ivaVenta = parametros.ivaVenta

  const ventaBebidas = lineas.reduce((acc, l) => acc + l.precio * l.cantidad, 0)
  const envioTotal = pedidos.reduce((acc, p) => acc + p.envioCobrado, 0)
  const venta = ventaBebidas + envioTotal

  const ivaLineas = lineas.reduce((acc, l) => acc + l.ivaTrasladado * l.cantidad, 0)
  const ivaEnvios = pedidos.reduce((acc, p) => acc + (p.envioCobrado - p.envioCobrado / (1 + ivaVenta)), 0)
  const iva = ivaLineas + ivaEnvios

  const comision = lineas.reduce((acc, l) => acc + l.comision * l.cantidad, 0)
  const insumos = lineas.reduce((acc, l) => acc + l.insumos * l.cantidad, 0)
  const empaqueYVaso = lineas.reduce((acc, l) => acc + (l.empaque + l.vasoTapa) * l.cantidad, 0)
  const indirectos = lineas.reduce((acc, l) => acc + l.indirectos * l.cantidad, 0)

  const equipo = equipoDelDia(activos)
  const costosEvento = eventos.reduce((acc, e) => acc + e.trasladoReal + e.equipoReal, 0)
  const moMontaje = eventos.reduce((acc, e) => acc + e.horasMontaje * tarifaFueraDeTurno, 0)
  const costoEnvios = pedidos.reduce((acc, p) => acc + p.costoEnvio, 0)

  const manoObraLineas = lineas.reduce((acc, l) => acc + l.manoDeObra * l.cantidad, 0)
  const manoDeObra = manoObraLineas + moMontaje

  const margenEnvio = pedidos.reduce((acc, p) => acc + (p.envioCobrado / (1 + ivaVenta) - p.costoEnvio), 0)
  const cargoServicioSinIva = lineas
    .filter((l) => l.tipo === 'cargo_servicio')
    .reduce((acc, l) => acc + (l.precio * l.cantidad) / (1 + ivaVenta), 0)

  const ganancia = lineas.reduce((acc, l) => acc + l.utilidad * l.cantidad, 0) + cargoServicioSinIva - equipo - costosEvento - moMontaje + margenEnvio
  const teLlevas = ganancia + manoDeObra

  return {
    venta: redondeoCentavos(venta),
    iva: redondeoCentavos(iva),
    comision: redondeoCentavos(comision),
    insumos: redondeoCentavos(insumos),
    empaqueYVaso: redondeoCentavos(empaqueYVaso),
    indirectos: redondeoCentavos(indirectos),
    equipo: redondeoCentavos(equipo),
    costosEvento: redondeoCentavos(costosEvento),
    moMontaje: redondeoCentavos(moMontaje),
    costoEnvios: redondeoCentavos(costoEnvios),
    manoDeObra: redondeoCentavos(manoDeObra),
    ganancia: redondeoCentavos(ganancia),
    teLlevas: redondeoCentavos(teLlevas),
  }
}

// ─── 5.13 — Semana y metas ──────────────────────────────────────────────────

export function avanceSemana(gananciaSemana: number, metaUtilidadSemanal: number): number {
  return metaUtilidadSemanal > 0 ? gananciaSemana / metaUtilidadSemanal : 0
}
