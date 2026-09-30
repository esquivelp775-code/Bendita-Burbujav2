import {
  activoEnUso,
  cantidadSugeridaCompra,
  desgloseDelDia,
  evaluarAlertasReorden,
  generaAvisoCompra,
  tamanosAgotadosSinRecompra,
  type ActivoDia,
  type EventoDia,
  type LineaDia,
  type PedidoDia,
} from '../calculos'
import type { EstadoStore, VentaLineaStore } from './remoteStore'

function enRango(fechaIso: string, desde: Date, hasta: Date): boolean {
  const t = new Date(fechaIso).getTime()
  return t >= desde.getTime() && t <= hasta.getTime()
}

export function inicioDia(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

export function finDia(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(23, 59, 59, 999)
  return d
}

export function inicioSemana(fecha: Date): Date {
  const d = inicioDia(fecha)
  const dia = d.getDay() // 0 domingo
  const diff = dia === 0 ? -6 : 1 - dia // retrocede al lunes
  d.setDate(d.getDate() + diff)
  return d
}

export function lineasValidasEnRango(s: EstadoStore, desde: Date, hasta: Date): VentaLineaStore[] {
  const pedidosPorId = new Map(s.pedidos.map((p) => [p.id, p]))
  return s.ventaLineas.filter((l) => {
    const pedido = pedidosPorId.get(l.pedidoId)
    if (!pedido || pedido.estado === 'cancelado') return false
    return enRango(l.fechaHora, desde, hasta)
  })
}

function aLineaDia(l: VentaLineaStore, s: EstadoStore): LineaDia {
  const canal = s.canales.find((c) => c.nombre === l.canalNombre)
  return {
    tipo: l.tipo,
    canalTipo: canal?.tipo ?? 'publico',
    precio: l.desglose.precio,
    cantidad: l.cantidad,
    ivaTrasladado: l.desglose.ivaTrasladado,
    comision: l.desglose.comision,
    insumos: l.desglose.insumos,
    empaque: l.desglose.empaque,
    vasoTapa: l.desglose.vasoTapa,
    indirectos: l.desglose.indirectos,
    manoDeObra: l.desglose.manoDeObra,
    utilidad: l.desglose.utilidad,
  }
}

export function resumenDia(s: EstadoStore, fecha: Date) {
  const desde = inicioDia(fecha)
  const hasta = finDia(fecha)
  const lineas = lineasValidasEnRango(s, desde, hasta)
  const lineasDia = lineas.map((l) => aLineaDia(l, s))

  const pedidosDelDia = s.pedidos.filter((p) => p.estado !== 'cancelado' && enRango(p.fechaHora, desde, hasta))
  const pedidosDia: PedidoDia[] = pedidosDelDia.map((p) => ({ envioCobrado: p.envioCobrado, costoEnvio: p.costoEnvio }))

  const eventos: EventoDia[] = [] // Fase 2: eventos con costos reales capturados
  const activos: ActivoDia[] = s.activos
    .filter((a) => activoEnUso(a, fecha))
    .map((a) => ({ costoNeto: a.costoNeto, valorRescate: a.valorRescate, vidaUtilMeses: a.vidaUtilMeses }))

  const desglose = desgloseDelDia(lineasDia, pedidosDia, eventos, activos, s.parametros, s.parametros.horaManoDeObraFueraDeTurno)

  const porCanal = new Map<string, { venta: number; ganancia: number; pedidos: number; color: string }>()
  for (const canal of s.canales) porCanal.set(canal.nombre, { venta: 0, ganancia: 0, pedidos: 0, color: canal.color })
  for (const l of lineas) {
    const bucket = porCanal.get(l.canalNombre)
    if (!bucket) continue
    bucket.venta += l.desglose.precio * l.cantidad
    bucket.ganancia += l.desglose.utilidad * l.cantidad
  }
  for (const p of pedidosDelDia) {
    const bucket = porCanal.get(p.canalNombre)
    if (bucket) bucket.pedidos += 1
  }

  const porBebida = new Map<string, { unidades: number; venta: number; ganancia: number }>()
  for (const l of lineas) {
    if (!l.bebidaNombre) continue
    const clave = `${l.bebidaNombre} ${l.tamanoNombre}`
    const bucket = porBebida.get(clave) ?? { unidades: 0, venta: 0, ganancia: 0 }
    bucket.unidades += l.cantidad
    bucket.venta += l.desglose.precio * l.cantidad
    bucket.ganancia += l.desglose.utilidad * l.cantidad
    porBebida.set(clave, bucket)
  }

  return {
    lineas,
    desglose,
    porCanal,
    porBebida,
    numeroLineas: lineas.reduce((a, l) => a + l.cantidad, 0),
    numeroBebidas: lineas.filter((l) => l.tipo === 'bebida').reduce((a, l) => a + l.cantidad, 0),
  }
}

export interface ResumenSemana {
  /** Suma de la ganancia de cada día (ya descuenta equipo, eventos y envíos): coincide con el Desglose. */
  ganancia: number
  teLlevas: number
  bebidas: number
  /** Depreciación del equipo de lunes a domingo: lo que hay que cubrir para no perder (punto de equilibrio). */
  equipoSemana: number
  /** Utilidad promedio por bebida vendida esta semana (o null si todavía no hay ventas). */
  utilidadPorBebida: number | null
}

/** Semana lunes-domingo (spec §5.13) sumando el desglose de cada día hasta hoy. */
export function resumenSemana(s: EstadoStore, hoy: Date): ResumenSemana {
  let ganancia = 0
  let teLlevas = 0
  let bebidas = 0
  let utilidadBebidas = 0
  let equipoDia = 0
  for (let d = inicioSemana(hoy); d.getTime() <= finDia(hoy).getTime(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const r = resumenDia(s, d)
    ganancia += r.desglose.ganancia
    teLlevas += r.desglose.teLlevas
    bebidas += r.numeroBebidas
    utilidadBebidas += r.lineas.filter((l) => l.tipo === 'bebida').reduce((a, l) => a + l.desglose.utilidad * l.cantidad, 0)
    equipoDia = r.desglose.equipo
  }
  return {
    ganancia,
    teLlevas,
    bebidas,
    equipoSemana: equipoDia * 7,
    utilidadPorBebida: bebidas > 0 ? utilidadBebidas / bebidas : null,
  }
}

/** Tamaños que se dejaron de ofrecer en algún canal porque se acabó su vaso sin recompra (vaso de 14 oz). */
export function tamanosSinVasos(s: EstadoStore): string[] {
  const tamanos = Object.values(s.tamanos).filter((t) => t.activo)
  const agotados = new Set<string>()
  const existencia = (clave: string) => s.existencias[clave]?.existencia ?? 0
  for (const canal of s.canales) {
    for (const t of tamanosAgotadosSinRecompra(tamanos, canal.nombre, s.insumos, existencia)) agotados.add(t.nombre)
  }
  return [...agotados]
}

export interface RenglonCompra {
  insumoClave: string
  nombre: string
  tipo: TipoAviso
  /** Presentaciones a comprar (bolsas, litros, paquetes) para volver al objetivo; 1 si no hay objetivo. */
  presentaciones: number
  contenidoUtil: number
  presentacion?: string
  /** Con IVA, al último precio pagado; null si nunca se ha comprado. */
  costoEstimado: number | null
}

export interface GrupoCompra {
  proveedorId?: string
  proveedor: string
  renglones: RenglonCompra[]
  total: number
}

/**
 * Lista de compras (spec §5.10): por insumo con aviso, cantidad sugerida en presentaciones y costo
 * estimado con el último precio, agrupada por proveedor. "Sin proveedor" va al final.
 */
export function listaDeCompras(s: EstadoStore): GrupoCompra[] {
  const grupos = new Map<string, GrupoCompra>()
  for (const aviso of alertasInventario(s)) {
    if (aviso.tipo === 'sin vasos') continue
    const ficha = s.fichas[aviso.insumoClave]
    const objetivo = s.existencias[aviso.insumoClave]?.stockObjetivoEfectivo ?? null
    const contenidoUtil = ficha?.ultimaCompra?.contenidoUtil || ficha?.contenidoUtil || 1
    const presentaciones =
      objetivo != null
        ? Math.max(1, cantidadSugeridaCompra({ stockObjetivo: objetivo, existencia: Math.max(0, aviso.existencia), contenidoUtilPorPresentacion: contenidoUtil }))
        : 1
    const precio = ficha?.ultimaCompra?.precioPorPresentacion
    const proveedorId = ficha?.proveedorId
    const proveedor = s.proveedores.find((p) => p.id === proveedorId)?.nombre ?? 'Sin proveedor'
    const clave = proveedorId ?? '—'
    const grupo = grupos.get(clave) ?? { proveedorId, proveedor, renglones: [], total: 0 }
    const costoEstimado = precio != null ? presentaciones * precio : null
    grupo.renglones.push({
      insumoClave: aviso.insumoClave,
      nombre: aviso.nombre,
      tipo: aviso.tipo,
      presentaciones,
      contenidoUtil,
      presentacion: ficha?.presentacion,
      costoEstimado,
    })
    grupo.total += costoEstimado ?? 0
    grupos.set(clave, grupo)
  }
  return [...grupos.values()].sort((a, b) => (a.proveedorId ? 0 : 1) - (b.proveedorId ? 0 : 1) || a.proveedor.localeCompare(b.proveedor))
}

export type TipoAviso ='sin vasos' | 'agotado' | 'reorden' | 'cobertura'

export interface AvisoInventario {
  insumoClave: string
  tipo: TipoAviso
  nombre: string
  existencia: number
  /** true si la existencia quedó en negativo: se vendió algo que el sistema no tenía registrado. */
  negativo: boolean
}

const ORDEN_AVISO: Record<TipoAviso, number> = { 'sin vasos': 0, agotado: 1, reorden: 2, cobertura: 3 }
const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 } as const

/**
 * Única fuente de avisos de inventario: Hoy, Inventario, la navegación y la caja leen de aquí.
 * Agotado aplica aunque el insumo no tenga objetivo; reorden usa el objetivo efectivo (manual o
 * automático por compras); cobertura, el consumo de 14 días. Un insumo sin recompra sólo avisa
 * cuando su tamaño se deja de ofrecer.
 */
export function alertasInventario(s: EstadoStore): AvisoInventario[] {
  const avisos: AvisoInventario[] = []
  for (const tamano of tamanosSinVasos(s)) {
    const clave = s.tamanos[tamano].vasoInsumoClave
    avisos.push({ insumoClave: clave, tipo: 'sin vasos', nombre: `Se acabaron los vasos de ${tamano}`, existencia: 0, negativo: false })
  }
  for (const insumo of Object.values(s.insumos)) {
    if (!generaAvisoCompra(insumo)) continue
    const { existencia, stockObjetivoEfectivo, consumo14d } = s.existencias[insumo.clave] ?? { existencia: 0, stockObjetivoEfectivo: null, consumo14d: 0 }
    const tipos = evaluarAlertasReorden(
      { insumo, existencia, stockObjetivo: stockObjetivoEfectivo, consumoDiario14d: consumo14d / 14 },
      s.parametros,
      new Date(),
    ).map((a) => a.tipo)
    // Un agotado ya implica reorden y cobertura: se muestra un solo aviso por insumo, el más grave.
    const tipo = (['agotado', 'reorden', 'cobertura'] as const).find((t) => tipos.includes(t))
    if (tipo) avisos.push({ insumoClave: insumo.clave, tipo, nombre: insumo.nombre, existencia, negativo: existencia < 0 })
  }
  return avisos.sort(
    (a, b) =>
      ORDEN_AVISO[a.tipo] - ORDEN_AVISO[b.tipo] ||
      ORDEN_PRIORIDAD[s.insumos[a.insumoClave]?.prioridad ?? 'media'] - ORDEN_PRIORIDAD[s.insumos[b.insumoClave]?.prioridad ?? 'media'] ||
      a.nombre.localeCompare(b.nombre),
  )
}
