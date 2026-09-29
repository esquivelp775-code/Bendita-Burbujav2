import Dexie, { type Table } from 'dexie'
import type { RegistrarPedidoPayload } from '../supabase/ventas'

/** Cómo se ve el pedido en la app mientras sube: permite mostrarlo en Hoy y Pedidos antes de sincronizar. */
export interface VistaPedidoPendiente {
  pedido: unknown
  lineas: unknown[]
  /** Cambios de existencia por clave de insumo (negativos al vender). */
  deltas: Record<string, number>
}

export interface PedidoPendiente {
  /** Mismo id que payload.pedido.id — clave de idempotencia. */
  id: string
  payload: RegistrarPedidoPayload
  /** Lo que se necesita para pintar el pedido sin red. */
  vista?: VistaPedidoPendiente
  /** Datos del cliente a crear/reusar antes de subir el pedido (sin señal no se puede resolver su id). */
  cliente?: { nombre?: string; telefono?: string }
  creadoEn: number
  intentos: number
  ultimoError?: string
}

export interface CancelacionPendiente {
  /** id del pedido ya subido que se canceló sin señal. */
  id: string
  creadoEn: number
  intentos: number
  ultimoError?: string
}

export interface Snapshot {
  clave: 'estado'
  estado: unknown
  mapas: unknown
  guardadoEn: number
}

class BenditaBurbujaDb extends Dexie {
  pedidosPendientes!: Table<PedidoPendiente, string>
  cancelacionesPendientes!: Table<CancelacionPendiente, string>
  snapshot!: Table<Snapshot, string>

  constructor() {
    super('bendita-burbuja')
    this.version(1).stores({
      pedidosPendientes: 'id, creadoEn',
    })
    this.version(2).stores({
      pedidosPendientes: 'id, creadoEn',
      cancelacionesPendientes: 'id, creadoEn',
      snapshot: 'clave',
    })
  }
}

export const db = new BenditaBurbujaDb()
