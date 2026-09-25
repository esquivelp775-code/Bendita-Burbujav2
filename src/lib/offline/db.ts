import Dexie, { type Table } from 'dexie'
import type { RegistrarPedidoPayload } from '../supabase/ventas'

export interface PedidoPendiente {
  /** Mismo id que payload.pedido.id — clave de idempotencia. */
  id: string
  payload: RegistrarPedidoPayload
  creadoEn: number
  intentos: number
  ultimoError?: string
}

class BenditaBurbujaDb extends Dexie {
  pedidosPendientes!: Table<PedidoPendiente, string>

  constructor() {
    super('bendita-burbuja')
    this.version(1).stores({
      pedidosPendientes: 'id, creadoEn',
    })
  }
}

export const db = new BenditaBurbujaDb()
