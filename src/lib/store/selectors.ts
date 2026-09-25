import { desgloseDelDia, type ActivoDia, type EventoDia, type LineaDia, type PedidoDia } from '../calculos'
import { existenciaInsumo, type EstadoStore, type VentaLineaStore } from './remoteStore'

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
    .filter((a) => !a.fechaAlta || new Date(a.fechaAlta) <= hasta)
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

  return { lineas, desglose, porCanal, porBebida, numeroLineas: lineas.reduce((a, l) => a + l.cantidad, 0) }
}

export function alertasActivas(s: EstadoStore) {
  const alertas: { insumoClave: string; tipo: string; nombre: string }[] = []
  for (const insumo of Object.values(s.insumos)) {
    const existencia = existenciaInsumo(insumo.clave)
    if (insumo.stockObjetivo == null) continue
    const umbral = insumo.umbralReorden ?? s.parametros.umbralReordenPorPrioridad[insumo.prioridad ?? 'media']
    if (existencia <= 0) alertas.push({ insumoClave: insumo.clave, tipo: 'agotado', nombre: insumo.nombre })
    else if (existencia <= umbral * insumo.stockObjetivo) alertas.push({ insumoClave: insumo.clave, tipo: 'reorden', nombre: insumo.nombre })
  }
  return alertas
}
