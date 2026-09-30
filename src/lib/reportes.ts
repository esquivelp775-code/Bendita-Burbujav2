// Reportes por rango (Ola 6). Puro: recibe lo que devuelve la RPC resumen_ventas (ya agregado en la
// base) y arma cada vista. El dinero sale de desgloseDelDia, igual que Hoy y el Desglose del día.
import { activoEnUso, desgloseDelDia, redondeoCentavos, type ActivoDia, type CanalTipo, type DesgloseDelDia, type FechasActivo, type LineaDia, type Parametros } from './calculos'

export interface FilaLinea {
  dia: string
  canal: string
  canal_tipo: CanalTipo
  tipo: 'bebida' | 'botana' | 'cargo_servicio'
  bebida: string | null
  botana: string | null
  tamano: string | null
  unidades: number
  venta: number
  iva: number
  comision: number
  insumos: number
  empaque: number
  vaso_tapa: number
  indirectos: number
  mano_obra: number
  utilidad: number
  retencion_isr: number
  retencion_iva: number
  deposito_esperado: number
}

export interface ResumenRango {
  lineas: FilaLinea[]
  horas: { dow: number; hora: number; bebidas: number | null; venta: number; utilidad: number }[]
  pedidos: { dia: string; canal: string; pedidos: number; envio_cobrado: number; costo_envio: number }[]
  eventos: { dia: string; traslado: number; equipo: number; horas: number }[]
}

export const aTextoDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function diasDelRango(desde: string, hasta: string): string[] {
  const [a, m, d] = desde.split('-').map(Number)
  const dias: string[] = []
  for (let f = new Date(a, m - 1, d, 12); aTextoDia(f) <= hasta; f = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1, 12)) dias.push(aTextoDia(f))
  return dias
}

function aLineaDia(f: FilaLinea): LineaDia {
  // Ya viene sumado por la base: se pasa como una sola "línea" de cantidad 1.
  return {
    tipo: f.tipo,
    canalTipo: f.canal_tipo,
    precio: f.venta,
    cantidad: 1,
    ivaTrasladado: f.iva,
    comision: f.comision,
    insumos: f.insumos,
    empaque: f.empaque,
    vasoTapa: f.vaso_tapa,
    indirectos: f.indirectos,
    manoDeObra: f.mano_obra,
    utilidad: f.utilidad,
  }
}

export interface TotalesRango extends DesgloseDelDia {
  bebidas: number
  pedidos: number
  dias: number
  porDia: { dia: string; ganancia: number; venta: number; bebidas: number }[]
}

/** Suma el desglose de cada día del rango (con equipo del día y costos reales de eventos). */
export function totalesDeRango(
  r: ResumenRango,
  desde: string,
  hasta: string,
  activos: (FechasActivo & ActivoDia)[],
  parametros: Parametros,
): TotalesRango {
  const campos: (keyof DesgloseDelDia)[] = ['venta', 'iva', 'comision', 'insumos', 'empaqueYVaso', 'indirectos', 'equipo', 'costosEvento', 'moMontaje', 'costoEnvios', 'manoDeObra', 'ganancia', 'teLlevas']
  const total = Object.fromEntries(campos.map((c) => [c, 0])) as Record<keyof DesgloseDelDia, number>
  const porDia: TotalesRango['porDia'] = []
  let bebidas = 0
  let pedidos = 0
  for (const dia of diasDelRango(desde, hasta)) {
    const lineas = r.lineas.filter((l) => l.dia === dia)
    const peds = r.pedidos.filter((p) => p.dia === dia)
    const [a, m, d] = dia.split('-').map(Number)
    const fecha = new Date(a, m - 1, d, 12)
    const dsg = desgloseDelDia(
      lineas.map(aLineaDia),
      peds.map((p) => ({ envioCobrado: p.envio_cobrado, costoEnvio: p.costo_envio })),
      r.eventos.filter((e) => e.dia === dia).map((e) => ({ trasladoReal: e.traslado, equipoReal: e.equipo, horasMontaje: e.horas })),
      activos.filter((x) => activoEnUso(x, fecha)),
      parametros,
      parametros.horaManoDeObraFueraDeTurno,
    )
    for (const c of campos) total[c] += dsg[c]
    const bebidasDia = lineas.filter((l) => l.tipo === 'bebida').reduce((acc, l) => acc + l.unidades, 0)
    bebidas += bebidasDia
    pedidos += peds.reduce((acc, p) => acc + p.pedidos, 0)
    porDia.push({ dia, ganancia: dsg.ganancia, venta: dsg.venta, bebidas: bebidasDia })
  }
  for (const c of campos) total[c] = redondeoCentavos(total[c])
  return { ...total, bebidas, pedidos, dias: porDia.length, porDia }
}

export interface Agregado {
  clave: string
  unidades: number
  venta: number
  utilidad: number
  deposito: number
  retenciones: number
}

function agrupar(filas: FilaLinea[], clave: (f: FilaLinea) => string | null): Agregado[] {
  const m = new Map<string, Agregado>()
  for (const f of filas) {
    const k = clave(f)
    if (k == null) continue
    const a = m.get(k) ?? { clave: k, unidades: 0, venta: 0, utilidad: 0, deposito: 0, retenciones: 0 }
    a.unidades += f.unidades
    a.venta += f.venta
    a.utilidad += f.utilidad
    a.deposito += f.deposito_esperado
    a.retenciones += f.retencion_isr + f.retencion_iva
    m.set(k, a)
  }
  return [...m.values()].sort((x, y) => y.utilidad - x.utilidad)
}

const bebidasDe = (r: ResumenRango) => r.lineas.filter((l) => l.tipo === 'bebida')

export const porCanal = (r: ResumenRango) => agrupar(r.lineas.filter((l) => l.tipo !== 'cargo_servicio'), (f) => f.canal)
export const porTamano = (r: ResumenRango, soloTamanos?: string[]) =>
  agrupar(bebidasDe(r).filter((f) => !soloTamanos || (f.tamano && soloTamanos.includes(f.tamano))), (f) => f.tamano)
export const porBebida = (r: ResumenRango) => agrupar(bebidasDe(r), (f) => f.bebida)
export const porBebidaYTamano = (r: ResumenRango) => agrupar(bebidasDe(r), (f) => (f.bebida && f.tamano ? `${f.bebida} ${f.tamano}` : null))

/** Matriz bebida × tamaño (unidades y utilidad). */
export function matrizBebidaTamano(r: ResumenRango) {
  const m: Record<string, Record<string, { unidades: number; utilidad: number }>> = {}
  for (const f of bebidasDe(r)) {
    if (!f.bebida || !f.tamano) continue
    m[f.bebida] ??= {}
    const c = (m[f.bebida][f.tamano] ??= { unidades: 0, utilidad: 0 })
    c.unidades += f.unidades
    c.utilidad += f.utilidad
  }
  return m
}

/** Lunes de la semana de un día "AAAA-MM-DD". */
export function lunesDe(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  const f = new Date(a, m - 1, d, 12)
  const dow = f.getDay()
  f.setDate(f.getDate() + (dow === 0 ? -6 : 1 - dow))
  return aTextoDia(f)
}

/** Mezcla de tamaños por semana (unidades): para las barras apiladas. */
export function mezclaTamanosPorSemana(r: ResumenRango) {
  const m = new Map<string, Record<string, number>>()
  for (const f of bebidasDe(r)) {
    if (!f.tamano) continue
    const semana = lunesDe(f.dia)
    const s = m.get(semana) ?? {}
    s[f.tamano] = (s[f.tamano] ?? 0) + f.unidades
    m.set(semana, s)
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([semana, tamanos]) => ({ semana, tamanos }))
}

export type Cuadrante = 'estrella' | 'popular' | 'rentable' | 'revisar'

/**
 * Menú por rentabilidad: cada bebida contra la mediana de unidades y de utilidad por bebida.
 * Estrella (se vende y deja), popular (se vende, deja poco), rentable (deja, se vende poco), revisar.
 */
export function menuPorRentabilidad(r: ResumenRango): { bebida: string; unidades: number; utilidadPorBebida: number; cuadrante: Cuadrante }[] {
  const filas = porBebida(r).filter((a) => a.unidades > 0)
  if (filas.length === 0) return []
  const mediana = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b)
    const mitad = Math.floor(s.length / 2)
    return s.length % 2 ? s[mitad] : (s[mitad - 1] + s[mitad]) / 2
  }
  const medUnidades = mediana(filas.map((f) => f.unidades))
  const medUtilidad = mediana(filas.map((f) => f.utilidad / f.unidades))
  return filas.map((f) => {
    const upb = f.utilidad / f.unidades
    const vende = f.unidades >= medUnidades
    const deja = upb >= medUtilidad
    return { bebida: f.clave, unidades: f.unidades, utilidadPorBebida: upb, cuadrante: vende && deja ? 'estrella' : vende ? 'popular' : deja ? 'rentable' : 'revisar' }
  })
}

/** Horas pico: matriz día de la semana (0 = domingo) × hora con bebidas vendidas. */
export function horasPico(r: ResumenRango) {
  const celdas: Record<string, { bebidas: number; utilidad: number }> = {}
  let max = 0
  for (const h of r.horas) {
    const k = `${h.dow}-${h.hora}`
    celdas[k] = { bebidas: h.bebidas ?? 0, utilidad: h.utilidad }
    max = Math.max(max, h.bebidas ?? 0)
  }
  const horas = r.horas.map((h) => h.hora)
  return { celdas, max, desde: horas.length ? Math.min(...horas) : 6, hasta: horas.length ? Math.max(...horas) : 20 }
}

/** CSV que Excel abre con acentos (BOM) y separador coma. */
export function aCsv(encabezados: string[], filas: (string | number | null | undefined)[][]): string {
  const celda = (v: string | number | null | undefined) => {
    if (v == null) return ''
    const t = typeof v === 'number' ? String(Math.round(v * 10000) / 10000) : v
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  return '﻿' + [encabezados, ...filas].map((f) => f.map(celda).join(',')).join('\r\n')
}
