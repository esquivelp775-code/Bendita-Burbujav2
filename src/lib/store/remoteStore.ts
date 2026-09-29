// Backend real — misma API pública que localStore.ts (mismos nombres de función, mismo shape de
// EstadoStore) pero respaldado por Supabase/Postgres en vez de localStorage. Las pantallas no saben
// cuál de los dos están usando: importan de src/lib/store/activeStore.ts, que elige uno u otro según
// si hay proyecto de Supabase configurado (src/lib/modo.ts).
import type {
  Adicional,
  AdicionalElegido,
  Bebida,
  CanalTipo,
  Categoria,
  ConfigPlataforma,
  ConfigPublico,
  ConsumoInsumo,
  DesgloseLinea,
  Insumo,
  Leche,
  Parametros,
  RegistroPrecio,
  Tamano,
  Turno,
} from '../calculos'
import { desgloseLinea, evaluarAlertasReorden, precioVigenteEn, resolverLineasConsumo } from '../calculos'
import { supabase } from '../supabase/client'
import {
  cancelarPedido as rpcCancelarPedido,
  movimientosDesdeConsumo,
  registrarCompra as rpcRegistrarCompra,
  registrarConteo as rpcRegistrarConteo,
  registrarPedido as rpcRegistrarPedido,
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

export interface EstadoStore {
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
  movimientos: { fecha: string; insumoClave: string; cantidad: number; tipo: string; origenId?: string }[]
  activos: ActivoStore[]
  ultimoCanal?: string
  ultimoTamano?: string
  ultimaLeche?: string
  primerUsoCompleto: boolean
  cargando: boolean
  error?: string
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
    movimientos: [],
    activos: [],
    primerUsoCompleto: false,
    cargando: true,
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
  const { data, error } = await supabase.from('precios').select('*')
  if (error) throw error
  // Historial completo por bebida × tamaño × canal; el vigente es el más reciente que ya aplica hoy
  // (un precio con vigencia futura espera su fecha, y ninguno anterior se sobrescribe).
  const historial = new Map<string, { canal: string; bebida: string; tamano: string; registros: RegistroPrecio[] }>()
  for (const row of data ?? []) {
    const bebida = bebidaNombrePorId[row.bebida_id]
    const tamano = tamanoNombrePorId[row.tamano_id]
    if (!bebida || !tamano) continue
    const llave = `${row.canal_tipo}|${bebida}|${tamano}`
    if (!historial.has(llave)) historial.set(llave, { canal: row.canal_tipo, bebida, tamano, registros: [] })
    historial.get(llave)!.registros.push({ precio: row.precio, manual: row.manual, vigenteDesde: row.vigente_desde })
  }
  const preciosApp: EstadoStore['preciosApp'] = {}
  const preciosPublico: EstadoStore['preciosPublico'] = {}
  const ahora = new Date()
  for (const { canal, bebida, tamano, registros } of historial.values()) {
    const vigente = precioVigenteEn(registros, ahora)
    if (!vigente) continue
    const bucket = canal === 'app' ? preciosApp : preciosPublico
    bucket[bebida] ??= {}
    bucket[bebida][tamano] = { precio: vigente.precio, manual: vigente.manual }
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

  const configPlataformaPorCanal: Record<string, ConfigPlataforma> = {}
  for (const row of plataformaRows ?? []) {
    const nombre = canalNombrePorId[row.canal_id]
    if (!nombre) continue
    configPlataformaPorCanal[nombre] = {
      comisionEfectiva: row.comision_base + row.uber_one * row.uber_one_proporcion + row.marketing,
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

async function cargarVentas() {
  const [{ data: pedidosRows, error: e1 }, { data: lineasRows, error: e2 }] = await Promise.all([
    supabase.from('pedidos').select('*').order('fecha_hora'),
    supabase.from('venta_lineas').select('*'),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const pedidos: PedidoStore[] = (pedidosRows ?? []).map((p) => ({
    id: p.id,
    fechaHora: p.fecha_hora,
    canalNombre: canalNombrePorId[p.canal_id] ?? '',
    envioCobrado: p.envio_cobrado,
    costoEnvio: p.costo_envio,
    estado: p.estado,
  }))
  const pedidoPorId = new Map(pedidos.map((p) => [p.id, p]))

  const ventaLineas: VentaLineaStore[] = (lineasRows ?? []).map((l) => ({
    id: l.id,
    pedidoId: l.pedido_id,
    fechaHora: pedidoPorId.get(l.pedido_id)?.fechaHora ?? new Date().toISOString(),
    canalNombre: pedidoPorId.get(l.pedido_id)?.canalNombre ?? '',
    tipo: l.tipo,
    bebidaNombre: l.bebida_id ? bebidaNombrePorId[l.bebida_id] : undefined,
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

async function cargarMovimientos() {
  const { data, error } = await supabase.from('movimientos_inventario').select('*').order('fecha')
  if (error) throw error
  return (data ?? []).map((m) => ({
    fecha: m.fecha,
    insumoClave: insumoClavePorId[m.insumo_id] ?? '',
    cantidad: m.cantidad,
    tipo: m.tipo,
    origenId: m.origen_id ?? undefined,
  }))
}

export async function cargarTodo(): Promise<void> {
  set((s) => ({ ...s, cargando: true, error: undefined }))
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
    const { pedidos, ventaLineas } = await cargarVentas()
    const movimientos = await cargarMovimientos()

    set(() => ({
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
      pedidos,
      ventaLineas,
      movimientos,
      activos,
      primerUsoCompleto: true,
      cargando: false,
    }))
  } catch (e) {
    set((s) => ({ ...s, cargando: false, error: e instanceof Error ? e.message : String(e) }))
    throw e
  }
}

/** Limpia el estado (logout). */
export function limpiar() {
  estado = estadoVacio()
  notificar()
}

// ─── Derivados (idénticos a localStore) ────────────────────────────────────

export function existenciaInsumo(insumoClave: string): number {
  return estado.movimientos.filter((m) => m.insumoClave === insumoClave).reduce((acc, m) => acc + m.cantidad, 0)
}

export function precioAppVigente(bebidaNombre: string, tamanoNombre: string): number {
  return estado.preciosApp[bebidaNombre]?.[tamanoNombre]?.precio ?? 0
}

export function precioPublicoVigente(bebidaNombre: string, tamanoNombre: string): number {
  return estado.preciosPublico[bebidaNombre]?.[tamanoNombre]?.precio ?? 0
}

export function alertasInsumo(insumoClave: string, consumoDiario14d = 0) {
  const insumo = estado.insumos[insumoClave]
  const existencia = existenciaInsumo(insumoClave)
  return evaluarAlertasReorden({ insumo, existencia, stockObjetivo: insumo.stockObjetivo ?? null, consumoDiario14d }, estado.parametros, new Date())
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

export async function actualizarConfigPlataforma(canalNombre: string, cambios: Partial<ConfigPlataforma>) {
  const patch: Record<string, number> = {}
  if (cambios.comisionEfectiva != null) patch.comision_base = cambios.comisionEfectiva
  if (cambios.retencionIsr != null) patch.retencion_isr = cambios.retencionIsr
  if (cambios.retencionIva != null) patch.retencion_iva = cambios.retencionIva
  const { error } = await supabase.from('config_plataforma').update(patch).eq('canal_id', canalIdPorNombre[canalNombre])
  if (error) throw error
  set((s) => ({ ...s, configPlataformaPorCanal: { ...s.configPlataformaPorCanal, [canalNombre]: { ...s.configPlataformaPorCanal[canalNombre], ...cambios } } }))
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

export interface ItemCarrito {
  fechaHora: Date
  bebida: Bebida
  tamano: Tamano
  lecheElegida?: Leche
  adicionalesElegidos: AdicionalElegido[]
  cantidad: number
  factorEvento?: number
}

export function calcularDesgloseItem(canalNombre: string, item: Omit<ItemCarrito, 'cantidad'>): DesgloseLinea {
  const canal = estado.canales.find((c) => c.nombre === canalNombre)
  if (!canal) throw new Error(`Canal desconocido: ${canalNombre}`)
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

export async function registrarPedidoConItems(input: CerrarPedidoInput): Promise<string> {
  const canal = estado.canales.find((c) => c.nombre === input.canalNombre)
  if (!canal) throw new Error(`Canal desconocido: ${input.canalNombre}`)

  const pedidoId = crypto.randomUUID()
  const fechaIso = new Date().toISOString()

  const lineas: VentaLineaPayload[] = input.items.map((item) => {
    const desglose = calcularDesgloseItem(canal.nombre, item)
    const adicionalesResueltos = item.adicionalesElegidos.map((el) => ({ adicional: estado.adicionales[el.nombre], sabor: el.sabor }))
    const consumo: ConsumoInsumo[] = resolverLineasConsumo(item.bebida, item.tamano, item.lecheElegida, adicionalesResueltos)
    const mermaPorClave: Record<string, number> = {}
    for (const c of consumo) mermaPorClave[c.insumoClave] = estado.insumos[c.insumoClave]?.merma ?? 0
    const movimientos = movimientosDesdeConsumo(consumo, insumoIdPorClave, mermaPorClave)
    movimientos.push({ insumo_id: insumoIdPorClave[item.tamano.vasoInsumoClave], cantidad: -1 })
    for (const clave of item.tamano.cierreInsumoClaves) {
      movimientos.push({ insumo_id: insumoIdPorClave[clave], cantidad: -1 })
    }

    return {
      id: crypto.randomUUID(),
      tipo: 'bebida',
      bebida_id: bebidaIdPorNombre[item.bebida.nombre],
      tamano_id: tamanoIdPorNombre[item.tamano.nombre],
      leche_id: item.lecheElegida ? lecheIdPorNombre[item.lecheElegida.nombre] : undefined,
      adicionales: item.adicionalesElegidos.map((a) => ({ adicional_id: adicionalIdPorNombre[a.nombre], nombre: a.nombre, sabor: a.sabor, precio: estado.adicionales[a.nombre].precio })),
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
      movimientos: movimientos.map((m) => ({ ...m, cantidad: m.cantidad })),
    }
  })

  await rpcRegistrarPedido({
    pedido: {
      id: pedidoId,
      fecha_hora: fechaIso,
      canal_id: canalIdPorNombre[canal.nombre],
      envio_cobrado: input.envioCobrado ?? 0,
      costo_envio: input.costoEnvio ?? 0,
      estado: 'cerrado',
    },
    lineas,
  })

  const { pedidos, ventaLineas } = await cargarVentas()
  const movimientos = await cargarMovimientos()
  const ultimoItem = input.items[input.items.length - 1]
  set((s) => ({
    ...s,
    pedidos,
    ventaLineas,
    movimientos,
    ultimoCanal: canal.nombre,
    ultimoTamano: ultimoItem?.tamano.nombre ?? s.ultimoTamano,
    ultimaLeche: ultimoItem?.lecheElegida?.nombre ?? s.ultimaLeche,
  }))

  return pedidoId
}

export async function cancelarPedido(pedidoId: string) {
  await rpcCancelarPedido(pedidoId)
  const { pedidos, ventaLineas } = await cargarVentas()
  const movimientos = await cargarMovimientos()
  set((s) => ({ ...s, pedidos, ventaLineas, movimientos }))
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
  const movimientos = await cargarMovimientos()
  set((s) => ({ ...s, insumos, movimientos }))
}

export async function registrarConteoLocal(insumoClave: string, cantidadContada: number, nota?: string) {
  await rpcRegistrarConteo(insumoIdPorClave[insumoClave], cantidadContada, nota)
  const movimientos = await cargarMovimientos()
  set((s) => ({ ...s, movimientos }))
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
