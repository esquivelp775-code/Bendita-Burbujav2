// Cola de ventas offline (IndexedDB vía Dexie). El pedido se guarda aquí primero, siempre —
// online o no — y se intenta subir de inmediato. Si falla (sin señal, error de red), se queda en
// la cola y se reintenta al volver la conexión. El id lo genera el cliente, así que reintentar
// nunca duplica (regla 5, registrar_pedido es idempotente por id).
import type { RegistrarPedidoPayload } from '../supabase/ventas'
import { registrarPedido } from '../supabase/ventas'
import { db } from './db'

export type EstadoSincronizacion = 'ocioso' | 'sincronizando'

type Escucha = (pendientes: number) => void

const escuchas = new Set<Escucha>()
let estado: EstadoSincronizacion = 'ocioso'

async function notificar() {
  const pendientes = await db.pedidosPendientes.count()
  for (const fn of escuchas) fn(pendientes)
}

export function onCambioPendientes(fn: Escucha): () => void {
  escuchas.add(fn)
  void notificar()
  return () => escuchas.delete(fn)
}

export async function encolarPedido(payload: RegistrarPedidoPayload): Promise<void> {
  await db.pedidosPendientes.put({ id: payload.pedido.id, payload, creadoEn: Date.now(), intentos: 0 })
  await notificar()
  void sincronizar()
}

export async function sincronizar(): Promise<{ ok: number; error: number }> {
  if (estado === 'sincronizando' || !navigator.onLine) return { ok: 0, error: 0 }
  estado = 'sincronizando'
  let ok = 0
  let error = 0
  try {
    const pendientes = await db.pedidosPendientes.orderBy('creadoEn').toArray()
    for (const pendiente of pendientes) {
      try {
        await registrarPedido(pendiente.payload)
        await db.pedidosPendientes.delete(pendiente.id)
        ok++
      } catch (e) {
        error++
        await db.pedidosPendientes.update(pendiente.id, {
          intentos: pendiente.intentos + 1,
          ultimoError: e instanceof Error ? e.message : String(e),
        })
      }
    }
  } finally {
    estado = 'ocioso'
    await notificar()
  }
  return { ok, error }
}

export async function reintentar(pedidoId: string): Promise<void> {
  await sincronizar()
  void pedidoId
}

export async function pendientesCount(): Promise<number> {
  return db.pedidosPendientes.count()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void sincronizar())
}
