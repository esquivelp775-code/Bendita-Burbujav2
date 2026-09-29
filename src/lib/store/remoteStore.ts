// Backend real — misma API pública que localStore.ts (mismos nombres de función, mismo shape de
// EstadoStore) pero respaldado por Supabase/Postgres en vez de localStorage. Las pantallas no saben
// cuál de los dos están usando: importan de src/lib/store/activeStore.ts, que elige uno u otro según
// si hay proyecto de Supabase configurado (src/lib/modo.ts).
import type {
  Adicional,
  AdicionalElegido,
  Bebida,
  Botana,
  CanalTipo,
  Categoria,
  ConfigPlataforma,
  ConfigPublico,
  ConsumoInsumo,
  DesgloseLinea,
  EscalaEvento,
  Insumo,
  Leche,
  Parametros,
  Tamano,
  Turno,
} from '../calculos'
import {
  charolasDelPedido,
  comisionEfectivaDe,
  desgloseBotana,
  desgloseLinea,
  evaluarAlertasReorden,
  resolverLineasConsumo,
} from '../calculos'
import { db } from '../offline/db'
import { configurarCola, encolarCancelacion, encolarPedido, onCambioCola, quitarPendiente, sincronizar, type ResumenCola } from '../offline/queue'
import { supabase } from '../supabase/client'
import { leerPaginado } from '../supabase/paginar'
import {
  cancelarPedido as rpcCancelarPedido,
  clientePorTelefonoONombre,
  movimientosDesdeConsumo,
  registrarCompra as rpcRegistrarCompra,
  registrarConteo as rpcRegistrarConteo,
  type FormaPago,
  type MovimientoPayload,
  type RegistrarPedidoPayload,
  type VentaLineaPayload,
} from '../supabase/ventas'

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
  botanaNombre?: string
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
  formaPago?: FormaPago
  folio?: string
  /** Guardado en el teléfono, todavía sin subir a la base. */
  porSubir?: boolean
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

/** Existencia agregada en la base (vista existencias_insumo): una fila por insumo, nunca el kárdex. */
export interface ExistenciaStore {
  existencia: number
  /** Objetivo manual del insumo o, si no hay, el automático por compras de 60 días. */
  stockObjetivoEfectivo: number | null
  /** Unidades físicas consumidas por ventas en los últimos 14 días. */
  consumo14d: number
}

/** Config de plataforma con sus componentes crudos; `comisionEfectiva` siempre se deriva de ellos. */
export interface ConfigPlataformaStore extends ConfigPlataforma {
  comisionBase: number
  uberOne: number
  uberOneProporcion: number
  marketing: number
}

export interface EstadoStore {
  parametros: Parametros
  turnos: Turno[]
  canales: CanalStore[]
  configPlataformaPorCanal: Record<string, ConfigPlataformaStore>
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
  existencias: Record<string, ExistenciaStore>
  activos: ActivoStore[]
  botanas: Record<string, Botana & { activa: boolean; descripcion?: string }>
  escalasEvento: EscalaEvento[]
  configEvento: ConfigEventoStore
  ultimoCanal?: string
  ultimoTamano?: string
  ultimaLeche?: string
  primerUsoCompleto: boolean
  cargando: boolean
  error?: string
  /** El último intento de hablar con la base falló: se está trabajando con lo guardado en el teléfono. */
  sinConexion: boolean
  /** Ventas guardadas en el teléfono que todavía no suben. */
  pendientesPorSubir: number
}

export interface ConfigEventoStore {
  minimoBebidas: number
  traslado: number
  equipoHieloDesechables: number
  horasMontaje: number
}

function estadoVacio(): EstadoStore {
  return {
    parametros: {
      ivaVenta: 0.16,
      indirectosPorBebida: 2,
      mermaDefault: 0.05,
      redondeoPrecio: 5,
      horaManoDeObraFueraDeTurno: 50,
      metaUtilidadSemanal: 6000,
      umbralReordenPorPrioridad: { alta: 0.3, media: 0.25, baja: 0.2 },
      margenPublicoMin: 0.27,
      margenPublicoMax: 0.34,
    },
    turnos: [],
    canales: [],
    configPlataformaPorCanal: {},
    configPublicoPorCanal: {},
    insumos: {},
    categorias: {},
    tamanos: {},
    bebidas: {},
    leches: {},
    adicionales: {},
    preciosApp: {},
    preciosPublico: {},
    pedidos: [],
    ventaLineas: [],
    existencias: {},
    activos: [],
    botanas: {},
    escalasEvento: [],
    configEvento: { minimoBebidas: 30, traslado: 400, equipoHieloDesechables: 300, horasMontaje: 3 },
    primerUsoCompleto: false,
    cargando: true,
    sinConexion: false,
    pendientesPorSubir: 0,
  }
}

let estado: EstadoStore = estadoVacio()
const escuchas = new Set<() => void>()

// Mapas id ↔ nombre/clave, para traducir hacia/desde Supabase. No son parte de EstadoStore.
let insumoIdPorClave: Record<string, string> = {}
let insumoClavePorId: Record<string, string> = {}
let bebidaIdPorNombre: Record<string, string> = {}
let bebidaNombrePorId: Record<string, string> = {}
let tamanoIdPorNombre: Record<string, string> = {}
let tamanoNombrePorId: Record<string, string> = {}
let canalIdPorNombre: Record<string, string> = {}
let canalNombrePorId: Record<string, string> = {}
let parametrosId: string | undefined
let adicionalIdPorNombre: Record<string, string> = {}
let lecheIdPorNombre: Record<string, string> = {}
let categoriaIdPorNombre: Record<string, string> = {}
let categoriaNombrePorId: Record<string, string> = {}
let botanaIdPorNombre: Record<string, string> = {}
let botanaNombrePorId: Record<string, string> = {}

/** Los mapas id ↔ nombre viajan en el snapshot: sin ellos no se puede armar un pedido sin señal. */
function exportarMapas() {
  return {
    insumoIdPorClave, insumoClavePorId, bebidaIdPorNombre, bebidaNombrePorId, tamanoIdPorNombre, tamanoNombrePorId,
    canalIdPorNombre, canalNombrePorId, parametrosId, adicionalIdPorNombre, lecheIdPorNombre, categoriaIdPorNombre,
    categoriaNombrePorId, botanaIdPorNombre, botanaNombrePorId,
  }
}

function importarMapas(m: ReturnType<typeof exportarMapas>) {
  ;({
    insumoIdPorClave, insumoClavePorId, bebidaIdPorNombre, bebidaNombrePorId, tamanoIdPorNombre, tamanoNombrePorId,
    canalIdPorNombre, canalNombrePorId, parametrosId, adicionalIdPorNombre, lecheIdPorNombre, categoriaIdPorNombre,
    categoriaNombrePorId, botanaIdPorNombre, botanaNombrePorId,
  } = m)
  botanaIdPorNombre ??= {}
  botanaNombrePorId ??= {}
}

// ─── Datos del servidor + cola del teléfono ─────────────────────────────────
// Lo que la app muestra (pedidos, líneas, existencias) es lo último que dijo la base MÁS lo que
// espera en la cola sin señal. Así una venta sin señal ya cuenta en Hoy, en la caja y en Inventario.

let servidor: Pick<EstadoStore, 'pedidos' | 'ventaLineas' | 'existencias'> = { pedidos: [], ventaLineas: [], existencias: {} }
let cola: ResumenCola = { pedidos: [], cancelaciones: [] }

function combinar(s: EstadoStore): EstadoStore {
  const cancelados = new Set(cola.cancelaciones)
  const idsServidor = new Set(servidor.pedidos.map((p) => p.id))
  const pedidos = servidor.pedidos.map((p) => (cancelados.has(p.id) ? { ...p, estado: 'cancelado' as const } : p))
  const ventaLineas = [...servidor.ventaLineas]
  const existencias: Record<string, ExistenciaStore> = { ...servidor.existencias }
  for (const pendiente of cola.pedidos) {
    const vista = pendiente.vista as { pedido: PedidoStore; lineas: VentaLineaStore[]; deltas: Record<string, number> } | undefined
    if (!vista || idsServidor.has(pendiente.id)) continue
    pedidos.push({ ...vista.pedido, porSubir: true })
    ventaLineas.push(...vista.lineas)
    for (const [clave, delta] of Object.entries(vista.deltas)) {
      const actual = existencias[clave] ?? { existencia: 0, stockObjetivoEfectivo: null, consumo14d: 0 }
      existencias[clave] = { ...actual, existencia: actual.existencia + delta, consumo14d: actual.consumo14d - Math.min(0, delta) }
    }
  }
  pedidos.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  return { ...s, pedidos, ventaLineas, existencias, pendientesPorSubir: cola.pedidos.length + cola.cancelaciones.length }
}

function actualizarServidor(parcial: Partial<typeof servidor>) {
  servidor = { ...servidor, ...parcial }
  set((s) => combinar(s))
}

let colaIniciada = false
/** Engancha la cola sin señal al store. Se llama una vez al arrancar la app (no en pruebas). */
export function iniciarStore(opciones: { asegurarSesion: () => Promise<boolean> }) {
  if (colaIniciada) return
  colaIniciada = true
  configurarCola({
    asegurarSesion: opciones.asegurarSesion,
    resolverCliente: (c) => clientePorTelefonoONombre(c.nombre, c.telefono),
    alSincronizar: () => void refrescarVentasYExistencias(),
  })
  onCambioCola((c) => {
    cola = c
    set((s) => combinar(s))
  })
}

async function refrescarVentasYExistencias() {
  try {
    const [{ pedidos, ventaLineas }, existencias] = await Promise.all([cargarVentas(), cargarExistencias()])
    actualizarServidor({ pedidos, ventaLineas, existencias })
    set((s) => ({ ...s, sinConexion: false }))
    void guardarSnapshot()
  } catch {
    set((s) => ({ ...s, sinConexion: true }))
  }
}

// ─── Snapshot en el teléfono (abrir sin señal) ──────────────────────────────

const CAMPOS_EFIMEROS = ['cargando', 'error', 'sinConexion', 'pendientesPorSubir'] as const

async function guardarSnapshot() {
  try {
    const copia: Record<string, unknown> = { ...estado, ...servidor }
    for (const c of CAMPOS_EFIMEROS) delete copia[c]
    await db.snapshot.put({ clave: 'estado', estado: copia, mapas: exportarMapas(), guardadoEn: Date.now() })
  } catch {
    /* sin IndexedDB (modo privado): la app sigue funcionando, sólo no abre sin señal */
  }
}

/** Sin sesión o sin red: la app sigue con lo guardado y lo dice en el encabezado. */
export function marcarSinConexion(sinConexion: boolean) {
  set((s) => ({ ...s, sinConexion }))
}

/** Carga lo último guardado en el teléfono. true si había algo (la app puede abrir sin esperar a la red). */
export async function hidratarDesdeSnapshot(): Promise<boolean> {
  try {
    const snap = await db.snapshot.get('estado')
    if (!snap) return false
    importarMapas(snap.mapas as ReturnType<typeof exportarMapas>)
    const guardado = snap.estado as EstadoStore
    servidor = { pedidos: guardado.pedidos ?? [], ventaLineas: guardado.ventaLineas ?? [], existencias: guardado.existencias ?? {} }
    set(() => combinar({ ...estadoVacio(), ...guardado, cargando: false, error: undefined, sinConexion: false }))
    return true
  } catch {
    return false
  }
}

function notificar() {
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
  notificar()
}

// ─── Carga inicial y refrescos ──────────────────────────────────────────────

async function cargarInsumos() {
  const { data, error } = await supabase.from('insumos').select('*')
  if (error) throw error
  const insumos: Record<string, Insumo> = {}
  insumoIdPorClave = {}
  insumoClavePorId = {}
  for (const row of data ?? []) {
    // El mapa id↔clave incluye inactivos (movimientos viejos pueden apuntarles); el catálogo no,
    // para que un insumo retirado no aparezca en inventario, compras ni alertas.
    insumoIdPorClave[row.clave] = row.id
    insumoClavePorId[row.id] = row.clave
    if (!row.activo) continue
    insumos[row.clave] = {
      clave: row.clave,
      nombre: row.nombre,
      categoria: row.categoria,
      unidad: row.unidad,
      costoUnitarioNeto: row.costo_fisico_neto / (1 - row.merma),
      merma: row.merma,
      prioridad: row.prioridad,
      umbralReorden: row.umbral_reorden,
      stockObjetivo: row.stock_objetivo,
      caducaAbiertoDias: row.caduca_abierto_dias,
      recompra: row.recompra ?? true,
    }
  }
  return insumos
}

async function cargarCategorias() {
  const { data, error } = await supabase.from('categorias').select('*').order('orden')
  if (error) throw error
  const categorias: Record<string, Categoria> = {}
  categoriaIdPorNombre = {}
  categoriaNombrePorId = {}
  for (const row of data ?? []) {
    categorias[row.nombre] = { nombre: row.nombre, minutosPreparacion: row.minutos_preparacion, utilidadObjetivo: row.utilidad_objetivo }
    categoriaIdPorNombre[row.nombre] = row.id
    categoriaNombrePorId[row.id] = row.nombre
  }
  return categorias
}

async function cargarTamanos() {
  const { data, error } = await supabase.from('tamanos').select('*')
  if (error) throw error
  const tamanos: EstadoStore['tamanos'] = {}
  tamanoIdPorNombre = {}
  tamanoNombrePorId = {}
  for (const row of data ?? []) {
    const cierreIds: string[] = row.insumo_cierre_ids ?? (row.insumo_cierre_id ? [row.insumo_cierre_id] : [])
    tamanos[row.nombre] = {
      nombre: row.nombre,
      ml: row.ml,
      factorEscala: row.factor_escala,
      vasoInsumoClave: insumoClavePorId[row.insumo_vaso_id],
      cierreInsumoClaves: cierreIds.map((id) => insumoClavePorId[id]),
      canales: row.canales ?? undefined,
      activo: row.activo,
    }
    tamanoIdPorNombre[row.nombre] = row.id
    tamanoNombrePorId[row.id] = row.nombre
  }
  return tamanos
}

async function cargarBebidas() {
  const [{ data: bebidasRows, error: e1 }, { data: recetaRows, error: e2 }] = await Promise.all([
    supabase.from('bebidas').select('*').order('orden'),
    supabase.from('receta_lineas').select('*'),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const bebidas: EstadoStore['bebidas'] = {}
  bebidaIdPorNombre = {}
  bebidaNombrePorId = {}
  for (const row of bebidasRows ?? []) {
    bebidas[row.nombre] = {
      nombre: row.nombre,
      categoriaNombre: categoriaNombrePorId[row.categoria_id],
      llevaLeche: row.lleva_leche,
      activa: row.activa,
      receta: [],
    }
    bebidaIdPorNombre[row.nombre] = row.id
    bebidaNombrePorId[row.id] = row.nombre
  }
  for (const r of recetaRows ?? []) {
    const nombre = bebidaNombrePorId[r.bebida_id]
    if (!nombre) continue
    bebidas[nombre].receta.push({
      insumoClave: insumoClavePorId[r.insumo_id],
      cantidad: r.cantidad,
      escalaConTamano: r.escala_con_tamano,
      esLeche: r.es_leche,
    })
  }
  return bebidas
}

async function cargarLeches() {
  const { data, error } = await supabase.from('leches').select('*')
  if (error) throw error
  const leches: Record<string, Leche> = {}
  lecheIdPorNombre = {}
  for (const row of data ?? []) {
    leches[row.nombre] = { nombre: row.nombre, insumoClave: insumoClavePorId[row.insumo_id], sobreprecio: row.sobreprecio, esDefault: row.es_default }
    lecheIdPorNombre[row.nombre] = row.id
  }
  return leches
}

async function cargarAdicionales() {
  const [
    { data: adicionalesRows, error: e1 },
    { data: lineasRows, error: e2 },
    { data: categoriasRows, error: e3 },
    { data: exclusionesRows, error: e4 },
    { data: saboresRows, error: e5 },
  ] = await Promise.all([
    supabase.from('adicionales').select('*'),
    supabase.from('adicional_lineas').select('*'),
    supabase.from('adicional_categorias').select('*'),
    supabase.from('adicional_exclusiones').select('*'),
    supabase.from('adicional_sabores').select('*'),
  ])
  for (const e of [e1, e2, e3, e4, e5]) if (e) throw e

  const adicionales: EstadoStore['adicionales'] = {}
  adicionalIdPorNombre = {}
  const adicionalNombrePorId: Record<string, string> = {}
  for (const row of adicionalesRows ?? []) {
    adicionales[row.nombre] = {
      nombre: row.nombre,
      precio: row.precio,
      minutos: row.minutos,
      activo: row.activo,
      receta: [],
      aplicaACategorias: [],
      excluyeBebidas: [],
      canales: row.canales ?? undefined,
    }
    adicionalIdPorNombre[row.nombre] = row.id
    adicionalNombrePorId[row.id] = row.nombre
  }
  for (const r of lineasRows ?? []) {
    const nombre = adicionalNombrePorId[r.adicional_id]
    if (!nombre) continue
    adicionales[nombre].receta.push({ insumoClave: insumoClavePorId[r.insumo_id], cantidad: r.cantidad, esLeche: r.es_leche, cambiaPorSabor: r.cambia_por_sabor })
  }
  for (const c of categoriasRows ?? []) {
    const nombre = adicionalNombrePorId[c.adicional_id]
    if (!nombre) continue
    adicionales[nombre].aplicaACategorias.push(categoriaNombrePorId[c.categoria_id])
  }
  for (const ex of exclusionesRows ?? []) {
    const nombre = adicionalNombrePorId[ex.adicional_id]
    if (!nombre) continue
    adicionales[nombre].excluyeBebidas.push(bebidaNombrePorId[ex.bebida_id])
  }
  for (const s of saboresRows ?? []) {
    const nombre = adicionalNombrePorId[s.adicional_id]
    if (!nombre) continue
    const insumoClave = insumoClavePorId[s.insumo_id]
    if (s.categoria_id) {
      const categoriaNombre = categoriaNombrePorId[s.categoria_id]
      adicionales[nombre].saboresPorCategoria ??= {}
      adicionales[nombre].saboresPorCategoria![categoriaNombre] ??= {}
      adicionales[nombre].saboresPorCategoria![categoriaNombre][s.sabor] = insumoClave
    } else {
      adicionales[nombre].sabores ??= {}
      adicionales[nombre].sabores![s.sabor] = insumoClave
    }
  }
  return adicionales
}

async function cargarPrecios() {
  // La vista ya resuelve el vigente (el más reciente con vigente_desde <= now()); el historial se queda
  // en `precios` sin bajarlo entero. Un precio con vigencia futura entra al recargar después de su fecha.
  const { data, error } = await supabase.from('precios_vigentes').select('*')
  if (error) throw error
  const preciosApp: EstadoStore['preciosApp'] = {}
  const preciosPublico: EstadoStore['preciosPublico'] = {}
  for (const row of data ?? []) {
    const bebida = bebidaNombrePorId[row.bebida_id]
    const tamano = tamanoNombrePorId[row.tamano_id]
    if (!bebida || !tamano) continue
    const bucket = row.canal_tipo === 'app' ? preciosApp : preciosPublico
    bucket[bebida] ??= {}
    bucket[bebida][tamano] = { precio: row.precio, manual: row.manual }
  }
  return { preciosApp, preciosPublico }
}

async function cargarCanalesYConfig() {
  const [{ data: canalesRows, error: e1 }, { data: plataformaRows, error: e2 }, { data: publicoRows, error: e3 }] = await Promise.all([
    supabase.from('canales').select('*').order('orden'),
    supabase.from('config_plataforma').select('*'),
    supabase.from('config_publico').select('*'),
  ])
  if (e1) throw e1
  if (e2) throw e2
  if (e3) throw e3

  const canales: CanalStore[] = []
  canalIdPorNombre = {}
  canalNombrePorId = {}
  for (const row of canalesRows ?? []) {
    canales.push({ nombre: row.nombre, tipo: row.tipo, color: row.color ?? '#780F0D', activo: row.activo })
    canalIdPorNombre[row.nombre] = row.id
    canalNombrePorId[row.id] = row.nombre
  }

  const configPlataformaPorCanal: Record<string, ConfigPlataformaStore> = {}
  for (const row of plataformaRows ?? []) {
    const nombre = canalNombrePorId[row.canal_id]
    if (!nombre) continue
    const componentes = {
      comisionBase: row.comision_base,
      uberOne: row.uber_one ?? 0,
      uberOneProporcion: row.uber_one_proporcion ?? 0,
      marketing: row.marketing ?? 0,
    }
    configPlataformaPorCanal[nombre] = {
      ...componentes,
      comisionEfectiva: comisionEfectivaDe(componentes),
      ivaSobreComision: row.iva_sobre_comision,
      retencionIsr: row.retencion_isr,
      retencionIva: row.retencion_iva,
    }
  }
  const configPublicoPorCanal: Record<string, ConfigPublico> = {}
  for (const row of publicoRows ?? []) {
    const nombre = canalNombrePorId[row.canal_id]
    if (!nombre) continue
    configPublicoPorCanal[nombre] = { descuentoVsApp: row.descuento_vs_app, envioCobradoDefault: row.envio_cobrado_default, costoEnvioDefault: row.costo_envio_default }
  }

  return { canales, configPlataformaPorCanal, configPublicoPorCanal }
}

async function cargarParametros(): Promise<Parametros> {
  const { data, error } = await supabase.from('parametros').select('*').limit(1).single()
  if (error) throw error
  parametrosId = data.id
  return {
    ivaVenta: data.iva_venta,
    indirectosPorBebida: data.indirectos_por_bebida,
    mermaDefault: data.merma_default,
    redondeoPrecio: data.redondeo_precio,
    horaManoDeObraFueraDeTurno: data.hora_mano_obra_fuera_turno,
    metaUtilidadSemanal: data.meta_utilidad_semanal,
    umbralReordenPorPrioridad: { alta: data.umbral_alta, media: data.umbral_media, baja: data.umbral_baja },
    margenPublicoMin: data.margen_publico_min ?? 0.27,
    margenPublicoMax: data.margen_publico_max ?? 0.34,
  }
}

async function cargarTurnos(): Promise<Turno[]> {
  const { data, error } = await supabase.from('turnos').select('*').eq('activo', true)
  if (error) throw error
  return (data ?? []).map((t) => ({ nombre: t.nombre, dias: t.dias, inicio: t.inicio, fin: t.fin, horaManoDeObra: t.hora_mano_obra, activo: t.activo }))
}

async function cargarActivos(): Promise<ActivoStore[]> {
  const { data, error } = await supabase.from('activos').select('*').order('fecha_alta')
  if (error) throw error
  return (data ?? []).map((a) => ({
    id: a.id,
    nombre: a.nombre,
    tipo: a.tipo,
    costoNeto: a.costo_neto,
    valorRescate: a.valor_rescate,
    fechaAlta: a.fecha_alta,
    vidaUtilMeses: a.vida_util_meses,
    notas: a.notas ?? undefined,
  }))
}

async function cargarBotanas() {
  const { data, error } = await supabase.from('botanas').select('*').order('nombre')
  if (error) throw error
  const botanas: EstadoStore['botanas'] = {}
  botanaIdPorNombre = {}
  botanaNombrePorId = {}
  for (const row of data ?? []) {
    botanas[row.nombre] = {
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      precioApp: row.precio_app,
      precioPublico: row.precio_publico,
      insumoClave: row.insumo_id ? insumoClavePorId[row.insumo_id] : undefined,
      activa: row.activa,
    }
    botanaIdPorNombre[row.nombre] = row.id
    botanaNombrePorId[row.id] = row.nombre
  }
  return botanas
}

async function cargarEvento() {
  const [{ data: escalasRows, error: e1 }, { data: configRows, error: e2 }] = await Promise.all([
    supabase.from('evento_escalas').select('*').order('desde'),
    supabase.from('config_evento').select('*').limit(1),
  ])
  if (e1) throw e1
  if (e2) throw e2
  const escalasEvento: EscalaEvento[] = (escalasRows ?? []).map((e) => ({ desde: e.desde, hasta: e.hasta, factor: e.factor, cargoServicio: e.cargo_servicio }))
  const c = configRows?.[0]
  const configEvento: ConfigEventoStore = c
    ? { minimoBebidas: c.minimo_bebidas, traslado: c.traslado, equipoHieloDesechables: c.equipo_hielo_desechables, horasMontaje: c.horas_montaje }
    : estadoVacio().configEvento
  return { escalasEvento, configEvento }
}

/**
 * Inicio de la ventana de ventas que vive en memoria: el lunes de la semana pasada. Cubre Hoy, la
 * semana en curso y la comparación con la semana anterior; los rangos más largos van por RPC agregada.
 */
export function inicioVentanaVentas(hoy = new Date()): Date {
  const d = new Date(hoy)
  d.setHours(0, 0, 0, 0)
  const dia = d.getDay() // 0 domingo
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia) - 7)
  return d
}

async function cargarVentas() {
  const desde = inicioVentanaVentas().toISOString()
  const pedidosRows = await leerPaginado<any>((a, b) =>
    supabase.from('pedidos').select('*, clientes(nombre)').gte('fecha_hora', desde).order('fecha_hora').order('id').range(a, b),
  )
  const lineasRows = await leerPaginado<any>((a, b) =>
    supabase
      .from('venta_lineas')
      .select('*, pedidos!inner(fecha_hora)')
      .gte('pedidos.fecha_hora', desde)
      .order('id')
      .range(a, b),
  )

  const pedidos: PedidoStore[] = (pedidosRows ?? []).map((p) => ({
    id: p.id,
    fechaHora: p.fecha_hora,
    canalNombre: canalNombrePorId[p.canal_id] ?? '',
    envioCobrado: p.envio_cobrado,
    costoEnvio: p.costo_envio,
    estado: p.estado,
    formaPago: p.forma_pago ?? undefined,
    folio: p.folio_plataforma ?? undefined,
    clienteNombre: p.clientes?.nombre ?? undefined,
  }))
  const pedidoPorId = new Map(pedidos.map((p) => [p.id, p]))

  const ventaLineas: VentaLineaStore[] = (lineasRows ?? []).map((l) => ({
    id: l.id,
    pedidoId: l.pedido_id,
    fechaHora: pedidoPorId.get(l.pedido_id)?.fechaHora ?? new Date().toISOString(),
    canalNombre: pedidoPorId.get(l.pedido_id)?.canalNombre ?? '',
    tipo: l.tipo,
    bebidaNombre: l.bebida_id ? bebidaNombrePorId[l.bebida_id] : undefined,
    botanaNombre: l.botana_id ? botanaNombrePorId[l.botana_id] : undefined,
    tamanoNombre: l.tamano_id ? tamanoNombrePorId[l.tamano_id] : undefined,
    cantidad: l.cantidad,
    adicionalesElegidos: Array.isArray(l.adicionales) ? l.adicionales.map((a: any) => ({ nombre: a.nombre, sabor: a.sabor })) : [],
    desglose: {
      precio: l.precio,
      ivaTrasladado: l.iva_trasladado,
      ingresoSinIva: l.ingreso_sin_iva,
      comision: l.comision,
      ivaComision: l.iva_comision,
      insumos: l.insumos,
      empaque: l.empaque,
      vasoTapa: l.vaso_tapa,
      indirectos: l.indirectos,
      minutos: l.minutos,
      tarifaHora: l.tarifa_hora,
      manoDeObra: l.mano_obra,
      utilidad: l.utilidad,
      retencionIsr: l.retencion_isr,
      retencionIva: l.retencion_iva,
      depositoEsperado: l.deposito_esperado,
      consumo: [],
    },
  }))

  return { pedidos, ventaLineas }
}

async function cargarExistencias() {
  const { data, error } = await supabase.from('existencias_insumo').select('*')
  if (error) throw error
  const existencias: Record<string, ExistenciaStore> = {}
  for (const row of data ?? []) {
    const clave = insumoClavePorId[row.insumo_id]
    if (!clave) continue
    existencias[clave] = {
      existencia: row.existencia,
      stockObjetivoEfectivo: row.stock_objetivo_efectivo,
      consumo14d: row.consumo_14d,
    }
  }
  return existencias
}

/**
 * Carga todo de la base. Con `enSegundoPlano` (la app ya abrió desde el snapshot) no muestra la
 * pantalla de carga y, si falla la red, sigue con lo guardado y marca "sin conexión" en vez de error.
 */
export async function cargarTodo(opciones: { enSegundoPlano?: boolean } = {}): Promise<void> {
  if (!opciones.enSegundoPlano) set((s) => ({ ...s, cargando: true, error: undefined }))
  try {
    const parametros = await cargarParametros()
    const turnos = await cargarTurnos()
    const insumos = await cargarInsumos()
    const categorias = await cargarCategorias()
    const tamanos = await cargarTamanos()
    const bebidas = await cargarBebidas()
    const leches = await cargarLeches()
    const adicionales = await cargarAdicionales()
    const { preciosApp, preciosPublico } = await cargarPrecios()
    const { canales, configPlataformaPorCanal, configPublicoPorCanal } = await cargarCanalesYConfig()
    const activos = await cargarActivos()
    const botanas = await cargarBotanas()
    const { escalasEvento, configEvento } = await cargarEvento()
    const { pedidos, ventaLineas } = await cargarVentas()
    const existencias = await cargarExistencias()

    servidor = { pedidos, ventaLineas, existencias }
    set((s) =>
      combinar({
        ...s,
        parametros,
        turnos,
        canales,
        configPlataformaPorCanal,
        configPublicoPorCanal,
        insumos,
        categorias,
        tamanos,
        bebidas,
        leches,
        adicionales,
        preciosApp,
        preciosPublico,
        activos,
        botanas,
        escalasEvento,
        configEvento,
        primerUsoCompleto: true,
        cargando: false,
        error: undefined,
        sinConexion: false,
      }),
    )
    void guardarSnapshot()
    void sincronizar()
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e)
    if (opciones.enSegundoPlano) {
      set((s) => ({ ...s, cargando: false, sinConexion: true }))
      return
    }
    set((s) => ({ ...s, cargando: false, error: mensaje }))
    throw e
  }
}

/** Limpia el estado (logout). */
export function limpiar() {
  servidor = { pedidos: [], ventaLineas: [], existencias: {} }
  estado = estadoVacio()
  notificar()
}

// ─── Derivados (idénticos a localStore) ────────────────────────────────────

export function existenciaInsumo(insumoClave: string): number {
  return estado.existencias[insumoClave]?.existencia ?? 0
}

/** Objetivo efectivo (manual o automático por compras) y consumo de 14 días del insumo. */
export function datosExistencia(insumoClave: string): ExistenciaStore {
  return estado.existencias[insumoClave] ?? { existencia: 0, stockObjetivoEfectivo: null, consumo14d: 0 }
}

export function precioAppVigente(bebidaNombre: string, tamanoNombre: string): number {
  return estado.preciosApp[bebidaNombre]?.[tamanoNombre]?.precio ?? 0
}

export function precioPublicoVigente(bebidaNombre: string, tamanoNombre: string): number {
  return estado.preciosPublico[bebidaNombre]?.[tamanoNombre]?.precio ?? 0
}

export function alertasInsumo(insumoClave: string) {
  const insumo = estado.insumos[insumoClave]
  const { existencia, stockObjetivoEfectivo, consumo14d } = datosExistencia(insumoClave)
  return evaluarAlertasReorden(
    { insumo, existencia, stockObjetivo: stockObjetivoEfectivo, consumoDiario14d: consumo14d / 14 },
    estado.parametros,
    new Date(),
  )
}

// ─── Acciones — Ajustes ─────────────────────────────────────────────────

export async function setTamanoActivo(nombre: string, activo: boolean) {
  const { error } = await supabase.from('tamanos').update({ activo }).eq('id', tamanoIdPorNombre[nombre])
  if (error) throw error
  set((s) => ({ ...s, tamanos: { ...s.tamanos, [nombre]: { ...s.tamanos[nombre], activo } } }))
}

export async function setBebidaActiva(nombre: string, activa: boolean) {
  const { error } = await supabase.from('bebidas').update({ activa }).eq('id', bebidaIdPorNombre[nombre])
  if (error) throw error
  set((s) => ({ ...s, bebidas: { ...s.bebidas, [nombre]: { ...s.bebidas[nombre], activa } } }))
}

export async function setAdicionalActivo(nombre: string, activo: boolean) {
  const { error } = await supabase.from('adicionales').update({ activo }).eq('id', adicionalIdPorNombre[nombre])
  if (error) throw error
  set((s) => ({ ...s, adicionales: { ...s.adicionales, [nombre]: { ...s.adicionales[nombre], activo } } }))
}

export async function setCanalActivo(nombre: string, activo: boolean) {
  const { error } = await supabase.from('canales').update({ activo }).eq('id', canalIdPorNombre[nombre])
  if (error) throw error
  set((s) => ({ ...s, canales: s.canales.map((c) => (c.nombre === nombre ? { ...c, activo } : c)) }))
}

export async function setPrecio(bebidaNombre: string, tamanoNombre: string, canalTipo: 'app' | 'publico', precio: number, manual = true) {
  const { error } = await supabase.from('precios').insert({
    bebida_id: bebidaIdPorNombre[bebidaNombre],
    tamano_id: tamanoIdPorNombre[tamanoNombre],
    canal_tipo: canalTipo,
    precio,
    manual,
  })
  if (error) throw error
  set((s) => {
    const bucket = canalTipo === 'app' ? { ...s.preciosApp } : { ...s.preciosPublico }
    bucket[bebidaNombre] = { ...bucket[bebidaNombre], [tamanoNombre]: { precio, manual } }
    return canalTipo === 'app' ? { ...s, preciosApp: bucket } : { ...s, preciosPublico: bucket }
  })
}

type CambiosPlataforma = Partial<Pick<ConfigPlataformaStore, 'comisionBase' | 'uberOne' | 'uberOneProporcion' | 'marketing' | 'retencionIsr' | 'retencionIva'>>

/** Cada componente va a su columna; la comisión efectiva nunca se guarda, se deriva al leer. */
export async function actualizarConfigPlataforma(canalNombre: string, cambios: CambiosPlataforma) {
  const columnas: Record<keyof CambiosPlataforma, string> = {
    comisionBase: 'comision_base',
    uberOne: 'uber_one',
    uberOneProporcion: 'uber_one_proporcion',
    marketing: 'marketing',
    retencionIsr: 'retencion_isr',
    retencionIva: 'retencion_iva',
  }
  const patch: Record<string, number> = {}
  for (const [campo, valor] of Object.entries(cambios) as [keyof CambiosPlataforma, number | undefined][]) {
    if (valor != null) patch[columnas[campo]] = valor
  }
  const { error } = await supabase.from('config_plataforma').update(patch).eq('canal_id', canalIdPorNombre[canalNombre])
  if (error) throw error
  set((s) => {
    const nueva = { ...s.configPlataformaPorCanal[canalNombre], ...cambios }
    nueva.comisionEfectiva = comisionEfectivaDe(nueva)
    return { ...s, configPlataformaPorCanal: { ...s.configPlataformaPorCanal, [canalNombre]: nueva } }
  })
}

/** Hoy sólo el rango de margen de Público se edita desde Ajustes. */
export async function actualizarMargenPublico(cambios: Partial<Pick<Parametros, 'margenPublicoMin' | 'margenPublicoMax'>>) {
  const patch: Record<string, number> = {}
  if (cambios.margenPublicoMin != null) patch.margen_publico_min = cambios.margenPublicoMin
  if (cambios.margenPublicoMax != null) patch.margen_publico_max = cambios.margenPublicoMax
  const { error } = await supabase.from('parametros').update(patch).eq('id', parametrosId)
  if (error) throw error
  set((s) => ({ ...s, parametros: { ...s.parametros, ...cambios } }))
}

export async function actualizarConfigPublico(canalNombre: string, cambios: Partial<ConfigPublico>) {
  const patch: Record<string, number> = {}
  if (cambios.descuentoVsApp != null) patch.descuento_vs_app = cambios.descuentoVsApp
  if (cambios.envioCobradoDefault != null) patch.envio_cobrado_default = cambios.envioCobradoDefault
  if (cambios.costoEnvioDefault != null) patch.costo_envio_default = cambios.costoEnvioDefault
  const { error } = await supabase.from('config_publico').update(patch).eq('canal_id', canalIdPorNombre[canalNombre])
  if (error) throw error
  set((s) => ({ ...s, configPublicoPorCanal: { ...s.configPublicoPorCanal, [canalNombre]: { ...s.configPublicoPorCanal[canalNombre], ...cambios } } }))
}

// ─── Acciones — Venta ───────────────────────────────────────────────────

export interface ItemBebida {
  tipo: 'bebida'
  fechaHora: Date
  bebida: Bebida
  tamano: Tamano
  lecheElegida?: Leche
  adicionalesElegidos: AdicionalElegido[]
  cantidad: number
  factorEvento?: number
}

export interface ItemBotana {
  tipo: 'botana'
  fechaHora: Date
  botana: Botana
  cantidad: number
  factorEvento?: number
}

export type ItemCarrito = ItemBebida | ItemBotana

type SinCantidad<T> = T extends unknown ? Omit<T, 'cantidad'> : never

export function calcularDesgloseItem(canalNombre: string, item: SinCantidad<ItemCarrito>): DesgloseLinea {
  const canal = estado.canales.find((c) => c.nombre === canalNombre)
  if (!canal) throw new Error(`Canal desconocido: ${canalNombre}`)
  const configPlataforma = canal.tipo === 'plataforma' ? estado.configPlataformaPorCanal[canal.nombre] : undefined
  if (item.tipo === 'botana') {
    return desgloseBotana({
      botana: item.botana,
      canalTipo: canal.tipo,
      factorEvento: item.factorEvento,
      insumos: estado.insumos,
      parametros: estado.parametros,
      configPlataforma,
    })
  }
  return desgloseLinea({
    fechaHora: item.fechaHora,
    canalTipo: canal.tipo,
    canalNombre: canal.nombre,
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
    configPlataforma,
    configPublico: canal.tipo === 'publico' ? estado.configPublicoPorCanal[canal.nombre] : undefined,
  })
}

/** Movimientos físicos por unidad de un producto (con merma, 5.6): receta + adicionales + vaso + cierre, o la bolsita. */
function movimientosDeItem(item: ItemCarrito): MovimientoPayload[] {
  if (item.tipo === 'botana') {
    return item.botana.insumoClave ? [{ insumo_id: insumoIdPorClave[item.botana.insumoClave], cantidad: -1 }] : []
  }
  const adicionalesResueltos = item.adicionalesElegidos.map((el) => ({ adicional: estado.adicionales[el.nombre], sabor: el.sabor }))
  const consumo: ConsumoInsumo[] = resolverLineasConsumo(item.bebida, item.tamano, item.lecheElegida, adicionalesResueltos)
  const mermaPorClave: Record<string, number> = {}
  for (const c of consumo) mermaPorClave[c.insumoClave] = estado.insumos[c.insumoClave]?.merma ?? 0
  const movimientos = movimientosDesdeConsumo(consumo, insumoIdPorClave, mermaPorClave)
  movimientos.push({ insumo_id: insumoIdPorClave[item.tamano.vasoInsumoClave], cantidad: -1 })
  for (const clave of item.tamano.cierreInsumoClaves) movimientos.push({ insumo_id: insumoIdPorClave[clave], cantidad: -1 })
  return movimientos
}

/** Consumo físico de una unidad por clave de insumo — para "te alcanza para…" en la caja. */
export function consumoFisicoDeItem(item: ItemCarrito): { insumoClave: string; cantidadFisica: number }[] {
  return movimientosDeItem(item).map((m) => ({ insumoClave: insumoClavePorId[m.insumo_id], cantidadFisica: m.cantidad }))
}

export interface CerrarPedidoInput {
  canalNombre: string
  items: ItemCarrito[]
  clienteNombre?: string
  clienteTelefono?: string
  envioCobrado?: number
  costoEnvio?: number
  formaPago?: FormaPago
  folio?: string
}

const CLAVE_CHAROLA = 'charola_4'

/**
 * Guarda el pedido primero en el teléfono y lo sube en cuanto se puede (idempotente por id). Devuelve
 * de inmediato: la venta ya cuenta en Hoy, la caja e Inventario aunque no haya señal.
 */
export async function registrarPedidoConItems(input: CerrarPedidoInput): Promise<string> {
  const canal = estado.canales.find((c) => c.nombre === input.canalNombre)
  if (!canal) throw new Error(`Canal desconocido: ${input.canalNombre}`)
  if (input.items.length === 0) throw new Error('El pedido está vacío')

  const pedidoId = crypto.randomUUID()
  const fechaIso = new Date().toISOString()
  const deltas: Record<string, number> = {}
  const sumarDelta = (insumoId: string, cantidad: number) => {
    const clave = insumoClavePorId[insumoId]
    if (clave) deltas[clave] = (deltas[clave] ?? 0) + cantidad
  }

  const lineasVista: VentaLineaStore[] = []
  const lineas: VentaLineaPayload[] = input.items.map((item) => {
    const desglose = calcularDesgloseItem(canal.nombre, item)
    const movimientos = movimientosDeItem(item)
    for (const m of movimientos) sumarDelta(m.insumo_id, m.cantidad * item.cantidad)
    const id = crypto.randomUUID()
    const adicionales =
      item.tipo === 'bebida'
        ? item.adicionalesElegidos.map((a) => ({ adicional_id: adicionalIdPorNombre[a.nombre], nombre: a.nombre, sabor: a.sabor, precio: estado.adicionales[a.nombre].precio }))
        : []
    lineasVista.push({
      id,
      pedidoId,
      fechaHora: fechaIso,
      canalNombre: canal.nombre,
      tipo: item.tipo,
      bebidaNombre: item.tipo === 'bebida' ? item.bebida.nombre : undefined,
      botanaNombre: item.tipo === 'botana' ? item.botana.nombre : undefined,
      tamanoNombre: item.tipo === 'bebida' ? item.tamano.nombre : undefined,
      lecheNombre: item.tipo === 'bebida' ? item.lecheElegida?.nombre : undefined,
      adicionalesElegidos: item.tipo === 'bebida' ? item.adicionalesElegidos : [],
      cantidad: item.cantidad,
      desglose,
    })
    return {
      id,
      tipo: item.tipo,
      bebida_id: item.tipo === 'bebida' ? bebidaIdPorNombre[item.bebida.nombre] : undefined,
      botana_id: item.tipo === 'botana' ? botanaIdPorNombre[item.botana.nombre] : undefined,
      tamano_id: item.tipo === 'bebida' ? tamanoIdPorNombre[item.tamano.nombre] : undefined,
      leche_id: item.tipo === 'bebida' && item.lecheElegida ? lecheIdPorNombre[item.lecheElegida.nombre] : undefined,
      adicionales,
      cantidad: item.cantidad,
      precio: desglose.precio,
      iva_trasladado: desglose.ivaTrasladado,
      ingreso_sin_iva: desglose.ingresoSinIva,
      comision: desglose.comision,
      iva_comision: desglose.ivaComision,
      insumos: desglose.insumos,
      empaque: desglose.empaque,
      vaso_tapa: desglose.vasoTapa,
      indirectos: desglose.indirectos,
      minutos: desglose.minutos,
      tarifa_hora: desglose.tarifaHora,
      mano_obra: desglose.manoDeObra,
      utilidad: desglose.utilidad,
      retencion_isr: desglose.retencionIsr,
      retencion_iva: desglose.retencionIva,
      deposito_esperado: desglose.depositoEsperado,
      movimientos,
    }
  })

  // v3 §3: charolas por pedido (no por línea); su costo ya va prorrateado en indirectos.
  const movimientosPedido: RegistrarPedidoPayload['movimientos_pedido'] = []
  const bebidasDelPedido = input.items.filter((i) => i.tipo === 'bebida').reduce((acc, i) => acc + i.cantidad, 0)
  const charolas = charolasDelPedido(bebidasDelPedido)
  if (charolas > 0 && insumoIdPorClave[CLAVE_CHAROLA]) {
    movimientosPedido.push({ insumo_id: insumoIdPorClave[CLAVE_CHAROLA], cantidad: -charolas, nota: `${bebidasDelPedido} bebidas` })
    sumarDelta(insumoIdPorClave[CLAVE_CHAROLA], -charolas)
  }

  const esPlataforma = canal.tipo === 'plataforma'
  const payload: RegistrarPedidoPayload = {
    pedido: {
      id: pedidoId,
      fecha_hora: fechaIso,
      canal_id: canalIdPorNombre[canal.nombre],
      envio_cobrado: input.envioCobrado ?? 0,
      costo_envio: input.costoEnvio ?? 0,
      estado: 'cerrado',
      forma_pago: esPlataforma ? 'plataforma' : (input.formaPago ?? null),
      folio_plataforma: esPlataforma ? input.folio?.trim() || null : null,
    },
    lineas,
    movimientos_pedido: movimientosPedido,
  }
  const pedidoVista: PedidoStore = {
    id: pedidoId,
    fechaHora: fechaIso,
    canalNombre: canal.nombre,
    envioCobrado: input.envioCobrado ?? 0,
    costoEnvio: input.costoEnvio ?? 0,
    estado: 'cerrado',
    clienteNombre: input.clienteNombre?.trim() || undefined,
    formaPago: payload.pedido.forma_pago ?? undefined,
    folio: payload.pedido.folio_plataforma ?? undefined,
  }
  const cliente =
    input.clienteNombre?.trim() || input.clienteTelefono?.trim()
      ? { nombre: input.clienteNombre?.trim() || undefined, telefono: input.clienteTelefono?.trim() || undefined }
      : undefined

  await encolarPedido(payload, { pedido: pedidoVista, lineas: lineasVista, deltas }, cliente)

  const ultimaBebida = [...input.items].reverse().find((i): i is ItemBebida => i.tipo === 'bebida')
  set((s) => ({
    ...s,
    ultimoCanal: canal.nombre,
    ultimoTamano: ultimaBebida?.tamano.nombre ?? s.ultimoTamano,
    ultimaLeche: ultimaBebida?.lecheElegida?.nombre ?? s.ultimaLeche,
  }))
  return pedidoId
}

/**
 * Cancelar no borra (regla 6): marca el pedido y revierte su inventario. Si el pedido todavía no
 * subía, basta con sacarlo de la cola. Si ya subió y no hay señal, la cancelación espera en la cola.
 */
export async function cancelarPedido(pedidoId: string): Promise<'quitado' | 'cancelado' | 'en cola'> {
  if (await quitarPendiente(pedidoId)) return 'quitado'
  try {
    await rpcCancelarPedido(pedidoId)
    await refrescarVentasYExistencias()
    return 'cancelado'
  } catch (e) {
    const sinRed = !navigator.onLine || (e instanceof Error && /fetch|network|red/i.test(e.message))
    if (!sinRed) throw e
    await encolarCancelacion(pedidoId)
    return 'en cola'
  }
}

// ─── Acciones — Inventario ──────────────────────────────────────────────

export async function registrarCompraLocal(insumoClave: string, presentaciones: number, contenidoUtilPorPresentacion: number, precioPorPresentacion: number, iva?: number) {
  await rpcRegistrarCompra({
    lineas: [
      {
        insumo_id: insumoIdPorClave[insumoClave],
        presentaciones,
        contenido_util_por_presentacion: contenidoUtilPorPresentacion,
        precio_por_presentacion: precioPorPresentacion,
        iva,
      },
    ],
  })
  const insumos = await cargarInsumos()
  set((s) => ({ ...s, insumos }))
  actualizarServidor({ existencias: await cargarExistencias() })
}

/** Objetivo manual del insumo; null regresa al automático (máxima existencia tras compras de 60 días). */
export async function setStockObjetivo(insumoClave: string, stockObjetivo: number | null) {
  const { error } = await supabase.from('insumos').update({ stock_objetivo: stockObjetivo }).eq('id', insumoIdPorClave[insumoClave])
  if (error) throw error
  set((s) => ({ ...s, insumos: { ...s.insumos, [insumoClave]: { ...s.insumos[insumoClave], stockObjetivo } } }))
  actualizarServidor({ existencias: await cargarExistencias() })
}

// ─── Cuenta ─────────────────────────────────────────────────────────────

export async function cambiarContrasena(nueva: string) {
  if (nueva.length < 8) throw new Error('Usa al menos 8 caracteres')
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) throw error
}

export async function registrarConteoLocal(insumoClave: string, cantidadContada: number, nota?: string) {
  await rpcRegistrarConteo(insumoIdPorClave[insumoClave], cantidadContada, nota)
  actualizarServidor({ existencias: await cargarExistencias() })
}

export async function altaActivo(activo: Omit<ActivoStore, 'id'>) {
  const { data, error } = await supabase
    .from('activos')
    .insert({
      nombre: activo.nombre,
      tipo: activo.tipo,
      costo_neto: activo.costoNeto,
      valor_rescate: activo.valorRescate,
      fecha_alta: activo.fechaAlta,
      vida_util_meses: activo.vidaUtilMeses,
      notas: activo.notas ?? null,
    })
    .select()
    .single()
  if (error) throw error
  set((s) => ({ ...s, activos: [...s.activos, { ...activo, id: data.id }] }))
}
