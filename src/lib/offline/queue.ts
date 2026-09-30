// Cola de ventas sin señal (IndexedDB vía Dexie). Todo pedido se guarda aquí primero — con o sin
// señal — y se intenta subir de inmediato. Si falla se queda y se reintenta al volver la conexión y
// cada 30 s. El id lo genera el cliente, así que reintentar nunca duplica (regla 5: registrar_pedido
// es idempotente por id). Las cancelaciones de pedidos ya subidos también esperan aquí.
import type { RegistrarPedidoPayload } from '../supabase/ventas'
import { cancelarPedido, registrarPedido } from '../supabase/ventas'
import { db, type PedidoPendiente, type VistaPedidoPendiente } from './db'
import { mensajeError } from '../errores'

export interface ResumenCola {
  pedidos: PedidoPendiente[]
  cancelaciones: string[]
}

type Escucha = (cola: ResumenCola) => void

const escuchas = new Set<Escucha>()
let sincronizando = false
/** Resuelve el id del cliente justo antes de subir (lo registra remoteStore para no importar Supabase aquí dos veces). */
let resolverCliente: ((c: { nombre?: string; telefono?: string }) => Promise<string | null>) | null = null
/** Se llama tras subir algo, para que el store recargue ventas y existencias del servidor. */
let alSincronizar: (() => void) | null = null
/** Antes de subir, asegura que haya sesión (p. ej. reintenta el auto-login al volver la señal). */
let asegurarSesion: (() => Promise<boolean>) | null = null

export function configurarCola(opciones: {
  resolverCliente?: typeof resolverCliente
  alSincronizar?: typeof alSincronizar
  asegurarSesion?: typeof asegurarSesion
}) {
  if (opciones.resolverCliente !== undefined) resolverCliente = opciones.resolverCliente
  if (opciones.alSincronizar !== undefined) alSincronizar = opciones.alSincronizar
  if (opciones.asegurarSesion !== undefined) asegurarSesion = opciones.asegurarSesion
}

export async function leerCola(): Promise<ResumenCola> {
  const [pedidos, cancelaciones] = await Promise.all([
    db.pedidosPendientes.orderBy('creadoEn').toArray(),
    db.cancelacionesPendientes.orderBy('creadoEn').toArray(),
  ])
  return { pedidos, cancelaciones: cancelaciones.map((c) => c.id) }
}

async function notificar() {
  const cola = await leerCola()
  for (const fn of escuchas) fn(cola)
}

export function onCambioCola(fn: Escucha): () => void {
  escuchas.add(fn)
  void leerCola().then(fn)
  return () => escuchas.delete(fn)
}

export async function encolarPedido(
  payload: RegistrarPedidoPayload,
  vista?: VistaPedidoPendiente,
  cliente?: { nombre?: string; telefono?: string },
): Promise<void> {
  await db.pedidosPendientes.put({ id: payload.pedido.id, payload, vista, cliente, creadoEn: Date.now(), intentos: 0 })
  await notificar()
  void sincronizar()
}

/** Quita un pedido que todavía no subía. true si estaba en la cola (entonces no hace falta cancelarlo en el servidor). */
export async function quitarPendiente(pedidoId: string): Promise<boolean> {
  const existia = (await db.pedidosPendientes.get(pedidoId)) != null
  if (existia) {
    await db.pedidosPendientes.delete(pedidoId)
    await notificar()
  }
  return existia
}

export async function encolarCancelacion(pedidoId: string): Promise<void> {
  await db.cancelacionesPendientes.put({ id: pedidoId, creadoEn: Date.now(), intentos: 0 })
  await notificar()
  void sincronizar()
}

export async function sincronizar(): Promise<{ ok: number; error: number }> {
  if (sincronizando || (typeof navigator !== 'undefined' && !navigator.onLine)) return { ok: 0, error: 0 }
  const { pedidos, cancelaciones } = await leerCola()
  if (pedidos.length === 0 && cancelaciones.length === 0) return { ok: 0, error: 0 }
  sincronizando = true
  let ok = 0
  let error = 0
  try {
    if (asegurarSesion && !(await asegurarSesion())) return { ok: 0, error: 0 }
    for (const pendiente of pedidos) {
      try {
        let payload = pendiente.payload
        if (pendiente.cliente && !payload.pedido.cliente_id && resolverCliente) {
          const clienteId = await resolverCliente(pendiente.cliente)
          payload = { ...payload, pedido: { ...payload.pedido, cliente_id: clienteId } }
        }
        await registrarPedido(payload)
        await db.pedidosPendientes.delete(pendiente.id)
        ok++
      } catch (e) {
        error++
        await db.pedidosPendientes.update(pendiente.id, {
          intentos: pendiente.intentos + 1,
          ultimoError: mensajeError(e),
        })
      }
    }
    for (const pedidoId of cancelaciones) {
      try {
        await cancelarPedido(pedidoId)
        await db.cancelacionesPendientes.delete(pedidoId)
        ok++
      } catch (e) {
        error++
        const actual = await db.cancelacionesPendientes.get(pedidoId)
        await db.cancelacionesPendientes.update(pedidoId, {
          intentos: (actual?.intentos ?? 0) + 1,
          ultimoError: mensajeError(e),
        })
      }
    }
  } finally {
    sincronizando = false
    await notificar()
    if (ok > 0) alSincronizar?.()
  }
  return { ok, error }
}

export async function pendientesCount(): Promise<number> {
  const [p, c] = await Promise.all([db.pedidosPendientes.count(), db.cancelacionesPendientes.count()])
  return p + c
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void sincronizar())
  setInterval(() => void sincronizar(), 30_000)
}
