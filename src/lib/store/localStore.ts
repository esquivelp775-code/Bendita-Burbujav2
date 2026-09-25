// Backend local (localStorage) para poder usar y probar la app completa sin un proyecto real de
// Supabase todavía (ver plan de Fase 1: se pidió no crear el proyecto sin aprobación). Implementa
// las mismas operaciones que src/lib/supabase/{catalogo,ventas}.ts con las mismas reglas de negocio
// (mismo src/lib/calculos.ts), guardando en localStorage en vez de Postgres. El día que exista el
// proyecto, las pantallas cambian de `useStore`/`acciones` a los repositorios de supabase/ — la
// lógica de cálculo no se toca porque ya vive toda en calculos.ts.
import type {
  Adicional,
  AdicionalElegido,
  Bebida,
  CanalTipo,
  Categoria,
  ConfigPlataforma,
  ConfigPublico,
  DesgloseLinea,
  Insumo,
  Leche,
  Parametros,
  Tamano,
  Turno,
} from '../calculos'
import { costoCompraPonderado, desgloseLinea, evaluarAlertasReorden, resolverLineasConsumo } from '../calculos'
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
  datos,
  precioListaDe,
  precioPublicoDe,
} from '../fixtures'

export interface CanalStore {
  nombre: string
  tipo: CanalTipo
  color: string
  activo: boolean
}

export interface VentaLineaStore {
  id: string
  pedidoId: string
  fechaHora: string
  canalNombre: string
  tipo: 'bebida' | 'botana' | 'cargo_servicio'
  bebidaNombre?: string
  tamanoNombre?: string
  lecheNombre?: string
  adicionalesElegidos: AdicionalElegido[]
  cantidad: number
  desglose: DesgloseLinea
}

export interface PedidoStore {
  id: string
  fechaHora: string
  canalNombre: string
  envioCobrado: number
  costoEnvio: number
  estado: 'abierto' | 'cerrado' | 'cancelado'
  clienteNombre?: string
  eventoNombre?: string
}

export interface MovimientoStore {
  fecha: string
  insumoClave: string
  cantidad: number
  tipo: 'inicial' | 'compra' | 'venta' | 'cancelacion' | 'conteo' | 'merma' | 'ajuste'
  origenId?: string
  nota?: string
}

export interface ActivoStore {
  id: string
  nombre: string
  tipo: 'mobiliario' | 'equipo'
  costoNeto: number
  valorRescate: number
  fechaAlta: string
  vidaUtilMeses: number
  notas?: string
}

export interface PrecioManual {
  precio: number
  manual: boolean
}

interface EstadoStore {
  parametros: Parametros
  turnos: Turno[]
  canales: CanalStore[]
  configPlataformaPorCanal: Record<string, ConfigPlataforma>
  configPublicoPorCanal: Record<string, ConfigPublico>
  insumos: Record<string, Insumo>
  categorias: Record<string, Categoria>
  tamanos: Record<string, Tamano & { activo: boolean }>
  bebidas: Record<string, Bebida & { activa: boolean }>
  leches: Record<string, Leche>
  adicionales: Record<string, Adicional & { activo: boolean }>
  preciosApp: Record<string, Record<string, PrecioManual>>
  preciosPublico: Record<string, Record<string, PrecioManual>>
  pedidos: PedidoStore[]
  ventaLineas: VentaLineaStore[]
  movimientos: MovimientoStore[]
  activos: ActivoStore[]
  ultimoCanal?: string
  ultimoTamano?: string
  ultimaLeche?: string
  primerUsoCompleto: boolean
}

const STORAGE_KEY = 'bendita-burbuja-store-v1'

function construirEstadoInicial(): EstadoStore {
  const canales: CanalStore[] = (datos.canales as any[]).map((c) => ({
    nombre: c.nombre,
    tipo: c.tipo === 'plataforma' ? 'plataforma' : c.nombre === 'Evento' ? 'evento' : 'publico',
    color: c.color,
    activo: true,
  }))

  const configPlataformaPorCanal: Record<string, ConfigPlataforma> = {}
  const configPublicoPorCanal: Record<string, ConfigPublico> = {}
  for (const c of canales) {
    if (c.tipo === 'plataforma') configPlataformaPorCanal[c.nombre] = construirConfigPlataforma(c.nombre)
    if (c.tipo === 'publico') configPublicoPorCanal[c.nombre] = construirConfigPublico()
  }

  const tamanosBase = construirTamanos()
  const tamanos: EstadoStore['tamanos'] = {}
  for (const [nombre, t] of Object.entries(tamanosBase)) tamanos[nombre] = { ...t, activo: true }

  const bebidasBase = construirBebidas()
  const bebidas: EstadoStore['bebidas'] = {}
  for (const [nombre, b] of Object.entries(bebidasBase)) bebidas[nombre] = { ...b, activa: true }

  const adicionalesBase = construirAdicionales()
  const adicionales: EstadoStore['adicionales'] = {}
  for (const [nombre, a] of Object.entries(adicionalesBase)) adicionales[nombre] = { ...a, activo: true }

  const preciosApp: EstadoStore['preciosApp'] = {}
  const preciosPublico: EstadoStore['preciosPublico'] = {}
  for (const b of datos.bebidas as any[]) {
    preciosApp[b.nombre] = {}
    preciosPublico[b.nombre] = {}
    for (const tamanoNombre of Object.keys(b.precio_lista)) {
      preciosApp[b.nombre][tamanoNombre] = { precio: precioListaDe(b.nombre, tamanoNombre), manual: false }
      preciosPublico[b.nombre][tamanoNombre] = { precio: precioPublicoDe(b.nombre, tamanoNombre), manual: false }
    }
  }

  const movimientos: MovimientoStore[] = []
  for (const t of datos.tamanos as any[]) {
    if (t.stock_vasos_inicial) {
      movimientos.push({
        fecha: new Date().toISOString(),
        insumoClave: `vaso_${t.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        cantidad: t.stock_vasos_inicial,
        tipo: 'inicial',
        nota: 'Existencia inicial del catálogo',
      })
    }
  }

  return {
    parametros: construirParametros(),
    turnos: construirTurnos(),
    canales,
    configPlataformaPorCanal,
    configPublicoPorCanal,
    insumos: construirInsumos(),
    categorias: construirCategorias(),
    tamanos,
    bebidas,
    leches: construirLeches(),
    adicionales,
    preciosApp,
    preciosPublico,
    pedidos: [],
    ventaLineas: [],
    movimientos,
    activos: [],
    primerUsoCompleto: false,
  }
}

function cargarEstado(): EstadoStore {
  if (typeof localStorage === 'undefined') return construirEstadoInicial()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return construirEstadoInicial()
  try {
    return JSON.parse(raw) as EstadoStore
  } catch {
    return construirEstadoInicial()
  }
}

let estado: EstadoStore = cargarEstado()
const escuchas = new Set<() => void>()

function guardar() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
  }
  for (const fn of escuchas) fn()
}

export function subscribe(fn: () => void): () => void {
  escuchas.add(fn)
  return () => escuchas.delete(fn)
}

export function getEstado(): EstadoStore {
  return estado
}

function set(mutador: (borrador: EstadoStore) => EstadoStore) {
  estado = mutador(estado)
  guardar()
}

// ─── Derivados ──────────────────────────────────────────────────────────

export function existenciaInsumo(insumoClave: string): number {
  return estado.movimientos.filter((m) => m.insumoClave === insumoClave).reduce((acc, m) => acc + m.cantidad, 0)
}

export function tamanosActivos(): Tamano[] {
  return Object.values(estado.tamanos).filter((t) => t.activo)
}

export function bebidasActivas(): (Bebida & { activa: boolean })[] {
  return Object.values(estado.bebidas).filter((b) => b.activa)
}

export function adicionalesActivos(): (Adicional & { activo: boolean })[] {
  return Object.values(estado.adicionales).filter((a) => a.activo)
}

export function precioAppVigente(bebidaNombre: string, tamanoNombre: string): number {
  return estado.preciosApp[bebidaNombre]?.[tamanoNombre]?.precio ?? 0
}

export function precioPublicoVigente(bebidaNombre: string, tamanoNombre: string): number {
  return estado.preciosPublico[bebidaNombre]?.[tamanoNombre]?.precio ?? 0
}

// ─── Acciones — Ajustes ─────────────────────────────────────────────────

export function setTamanoActivo(nombre: string, activo: boolean) {
  set((s) => ({ ...s, tamanos: { ...s.tamanos, [nombre]: { ...s.tamanos[nombre], activo } } }))
}

export function setBebidaActiva(nombre: string, activa: boolean) {
  set((s) => ({ ...s, bebidas: { ...s.bebidas, [nombre]: { ...s.bebidas[nombre], activa } } }))
}

export function setAdicionalActivo(nombre: string, activo: boolean) {
  set((s) => ({ ...s, adicionales: { ...s.adicionales, [nombre]: { ...s.adicionales[nombre], activo } } }))
}

export function setCanalActivo(nombre: string, activo: boolean) {
  set((s) => ({ ...s, canales: s.canales.map((c) => (c.nombre === nombre ? { ...c, activo } : c)) }))
}

export function setPrecio(bebidaNombre: string, tamanoNombre: string, canalTipo: 'app' | 'publico', precio: number, manual = true) {
  set((s) => {
    const bucket = canalTipo === 'app' ? { ...s.preciosApp } : { ...s.preciosPublico }
    bucket[bebidaNombre] = { ...bucket[bebidaNombre], [tamanoNombre]: { precio, manual } }
    return canalTipo === 'app' ? { ...s, preciosApp: bucket } : { ...s, preciosPublico: bucket }
  })
}

export function actualizarConfigPlataforma(canalNombre: string, cambios: Partial<ConfigPlataforma>) {
  set((s) => ({
    ...s,
    configPlataformaPorCanal: {
      ...s.configPlataformaPorCanal,
      [canalNombre]: { ...s.configPlataformaPorCanal[canalNombre], ...cambios },
    },
  }))
}

export function actualizarConfigPublico(canalNombre: string, cambios: Partial<ConfigPublico>) {
  set((s) => ({
    ...s,
    configPublicoPorCanal: {
      ...s.configPublicoPorCanal,
      [canalNombre]: { ...s.configPublicoPorCanal[canalNombre], ...cambios },
    },
  }))
}

export function setUltimaSeleccion(canal?: string, tamano?: string, leche?: string) {
  set((s) => ({
    ...s,
    ultimoCanal: canal ?? s.ultimoCanal,
    ultimoTamano: tamano ?? s.ultimoTamano,
    ultimaLeche: leche ?? s.ultimaLeche,
  }))
}

export function completarPrimerUso() {
  set((s) => ({ ...s, primerUsoCompleto: true }))
}

// ─── Acciones — Venta ───────────────────────────────────────────────────

export interface ItemCarrito {
  fechaHora: Date
  bebida: Bebida
  tamano: Tamano
  lecheElegida?: Leche
  adicionalesElegidos: AdicionalElegido[]
  cantidad: number
  factorEvento?: number
}

/** Calcula el desglose de un ítem del carrito sin persistir nada — para el resumen en vivo del panel. */
export function calcularDesgloseItem(canalNombre: string, item: Omit<ItemCarrito, 'cantidad'>): DesgloseLinea {
  const canal = estado.canales.find((c) => c.nombre === canalNombre)
  if (!canal) throw new Error(`Canal desconocido: ${canalNombre}`)
  return desgloseLinea({
    fechaHora: item.fechaHora,
    canalTipo: canal.tipo,
    bebida: item.bebida,
    tamano: item.tamano,
    lecheElegida: item.lecheElegida,
    adicionalesElegidos: item.adicionalesElegidos,
    precioApp: precioAppVigente(item.bebida.nombre, item.tamano.nombre),
    precioPublico: precioPublicoVigente(item.bebida.nombre, item.tamano.nombre),
    factorEvento: item.factorEvento,
    insumos: estado.insumos,
    adicionalesCatalogo: estado.adicionales,
    categorias: estado.categorias,
    parametros: estado.parametros,
    turnos: estado.turnos,
    configPlataforma: canal.tipo === 'plataforma' ? estado.configPlataformaPorCanal[canal.nombre] : undefined,
    configPublico: canal.tipo === 'publico' ? estado.configPublicoPorCanal[canal.nombre] : undefined,
  })
}

export interface CerrarPedidoInput {
  canalNombre: string
  items: ItemCarrito[]
  eventoNombre?: string
  clienteNombre?: string
  envioCobrado?: number
  costoEnvio?: number
}

/** Cierra el pedido del carrito: una línea por ítem, movimientos de inventario de todas, una sola transacción local. */
export function registrarPedidoConItems(input: CerrarPedidoInput): string {
  const canal = estado.canales.find((c) => c.nombre === input.canalNombre)
  if (!canal) throw new Error(`Canal desconocido: ${input.canalNombre}`)

  const pedidoId = crypto.randomUUID()
  const fechaIso = new Date().toISOString()

  const pedido: PedidoStore = {
    id: pedidoId,
    fechaHora: fechaIso,
    canalNombre: canal.nombre,
    envioCobrado: input.envioCobrado ?? 0,
    costoEnvio: input.costoEnvio ?? 0,
    estado: 'cerrado',
    clienteNombre: input.clienteNombre,
    eventoNombre: input.eventoNombre,
  }

  const nuevasLineas: VentaLineaStore[] = []
  const nuevosMovimientos: MovimientoStore[] = []

  for (const item of input.items) {
    const desglose = calcularDesgloseItem(canal.nombre, item)
    const lineaFechaIso = item.fechaHora.toISOString()

    nuevasLineas.push({
      id: crypto.randomUUID(),
      pedidoId,
      fechaHora: lineaFechaIso,
      canalNombre: canal.nombre,
      tipo: 'bebida',
      bebidaNombre: item.bebida.nombre,
      tamanoNombre: item.tamano.nombre,
      lecheNombre: item.lecheElegida?.nombre,
      adicionalesElegidos: item.adicionalesElegidos,
      cantidad: item.cantidad,
      desglose,
    })

    const adicionalesResueltos = item.adicionalesElegidos.map((el) => ({ adicional: estado.adicionales[el.nombre], sabor: el.sabor }))
    const consumo = resolverLineasConsumo(item.bebida, item.tamano, item.lecheElegida, adicionalesResueltos)
    for (const c of consumo) {
      const merma = estado.insumos[c.insumoClave]?.merma ?? 0
      nuevosMovimientos.push({
        fecha: lineaFechaIso,
        insumoClave: c.insumoClave,
        cantidad: (-c.cantidad / (1 - merma)) * item.cantidad,
        tipo: 'venta',
        origenId: pedidoId,
      })
    }
    nuevosMovimientos.push(
      { fecha: lineaFechaIso, insumoClave: item.tamano.vasoInsumoClave, cantidad: -1 * item.cantidad, tipo: 'venta', origenId: pedidoId },
      { fecha: lineaFechaIso, insumoClave: item.tamano.cierreInsumoClave, cantidad: -1 * item.cantidad, tipo: 'venta', origenId: pedidoId },
    )
  }

  const ultimoItem = input.items[input.items.length - 1]

  set((s) => ({
    ...s,
    pedidos: [...s.pedidos, pedido],
    ventaLineas: [...s.ventaLineas, ...nuevasLineas],
    movimientos: [...s.movimientos, ...nuevosMovimientos],
    ultimoCanal: canal.nombre,
    ultimoTamano: ultimoItem?.tamano.nombre ?? s.ultimoTamano,
    ultimaLeche: ultimoItem?.lecheElegida?.nombre ?? s.ultimaLeche,
  }))

  return pedidoId
}

export function cancelarPedido(pedidoId: string) {
  set((s) => {
    const reversos: MovimientoStore[] = s.movimientos
      .filter((m) => m.origenId === pedidoId && m.tipo === 'venta')
      .map((m) => ({ fecha: new Date().toISOString(), insumoClave: m.insumoClave, cantidad: -m.cantidad, tipo: 'cancelacion', origenId: pedidoId }))
    return {
      ...s,
      pedidos: s.pedidos.map((p) => (p.id === pedidoId ? { ...p, estado: 'cancelado' } : p)),
      movimientos: [...s.movimientos, ...reversos],
    }
  })
}

// ─── Acciones — Inventario ──────────────────────────────────────────────

export function registrarCompraLocal(insumoClave: string, presentaciones: number, contenidoUtilPorPresentacion: number, precioPorPresentacion: number, iva?: number) {
  set((s) => {
    const insumo = s.insumos[insumoClave]
    const existencia = existenciaInsumo(insumoClave)
    const costoFisicoNetoPrevio = insumo.costoUnitarioNeto * (1 - insumo.merma)
    const ivaUsado = iva ?? 0
    const costoFisicoNetoNuevo = costoCompraPonderado(existencia, costoFisicoNetoPrevio, presentaciones, contenidoUtilPorPresentacion, precioPorPresentacion, ivaUsado)
    const costoUnitarioNetoNuevo = costoFisicoNetoNuevo / (1 - insumo.merma)

    const movimiento: MovimientoStore = {
      fecha: new Date().toISOString(),
      insumoClave,
      cantidad: presentaciones * contenidoUtilPorPresentacion,
      tipo: 'compra',
    }

    return {
      ...s,
      insumos: { ...s.insumos, [insumoClave]: { ...insumo, costoUnitarioNeto: costoUnitarioNetoNuevo } },
      movimientos: [...s.movimientos, movimiento],
    }
  })
}

export function registrarConteoLocal(insumoClave: string, cantidadContada: number, nota?: string) {
  const existencia = existenciaInsumo(insumoClave)
  const diferencia = cantidadContada - existencia
  if (diferencia === 0) return
  set((s) => ({
    ...s,
    movimientos: [...s.movimientos, { fecha: new Date().toISOString(), insumoClave, cantidad: diferencia, tipo: 'conteo', nota }],
  }))
}

export function altaActivo(activo: Omit<ActivoStore, 'id'>) {
  set((s) => ({ ...s, activos: [...s.activos, { ...activo, id: crypto.randomUUID() }] }))
}

export function alertasInsumo(insumoClave: string, consumoDiario14d = 0) {
  const insumo = estado.insumos[insumoClave]
  const existencia = existenciaInsumo(insumoClave)
  return evaluarAlertasReorden(
    { insumo, existencia, stockObjetivo: insumo.stockObjetivo ?? null, consumoDiario14d },
    estado.parametros,
    new Date(),
  )
}

export { construirEstadoInicial }
export type { EstadoStore }
