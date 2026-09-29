// Payload de registrar_pedido / cancelar_pedido — ver supabase/migrations/0002_rpc.sql.
import type { ConsumoInsumo } from '../calculos'
import { supabase } from './client'

export interface MovimientoPayload {
  insumo_id: string
  cantidad: number
  costo_unitario?: number
}

export interface VentaLineaPayload {
  id: string
  tipo: 'bebida' | 'botana' | 'cargo_servicio'
  bebida_id?: string | null
  botana_id?: string | null
  tamano_id?: string | null
  leche_id?: string | null
  adicionales: { adicional_id: string; nombre: string; sabor?: string; precio: number }[]
  cantidad: number
  precio: number
  iva_trasladado: number
  ingreso_sin_iva: number
  comision: number
  iva_comision: number
  insumos: number
  empaque: number
  vaso_tapa: number
  indirectos: number
  minutos: number
  tarifa_hora: number
  mano_obra: number
  utilidad: number
  retencion_isr: number
  retencion_iva: number
  deposito_esperado: number
  movimientos: MovimientoPayload[]
}

export interface PedidoPayload {
  id: string
  fecha_hora: string
  canal_id: string
  turno_id?: string | null
  evento_id?: string | null
  cliente_id?: string | null
  envio_cobrado?: number
  costo_envio?: number
  folio_plataforma?: string | null
  estado: 'abierto' | 'cerrado' | 'cancelado'
  notas?: string | null
  forma_pago?: FormaPago | null
}

export type FormaPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'plataforma'

export interface RegistrarPedidoPayload {
  pedido: PedidoPayload
  lineas: VentaLineaPayload[]
  /** Movimientos que dependen del pedido completo y no de una línea (p. ej. charolas). */
  movimientos_pedido?: (MovimientoPayload & { nota?: string })[]
}

/** Convierte el consumo nominal (calculos.ts) + insumoId por clave en movimientos con merma aplicada (5.6). */
export function movimientosDesdeConsumo(
  consumo: ConsumoInsumo[],
  insumoIdPorClave: Record<string, string>,
  mermaPorClave: Record<string, number>,
): MovimientoPayload[] {
  return consumo.map(({ insumoClave, cantidad }) => {
    const merma = mermaPorClave[insumoClave] ?? 0
    return {
      insumo_id: insumoIdPorClave[insumoClave],
      cantidad: -cantidad / (1 - merma),
    }
  })
}

export async function registrarPedido(payload: RegistrarPedidoPayload): Promise<string> {
  const { data, error } = await supabase.rpc('registrar_pedido', { payload })
  if (error) throw error
  return data as string
}

export async function cancelarPedido(pedidoId: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_pedido', { p_pedido_id: pedidoId })
  if (error) throw error
}

export async function clientePorTelefonoONombre(nombre?: string, telefono?: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('cliente_por_telefono_o_nombre', { p_nombre: nombre ?? null, p_telefono: telefono ?? null })
  if (error) throw error
  return (data as string | null) ?? null
}

export interface CompraLineaPayload {
  insumo_id: string
  presentaciones: number
  contenido_util_por_presentacion: number
  precio_por_presentacion: number
  iva?: number
}

export interface RegistrarCompraPayload {
  fecha?: string
  proveedor_id?: string | null
  con_factura?: boolean
  notas?: string | null
  lineas: CompraLineaPayload[]
}

export async function registrarCompra(payload: RegistrarCompraPayload): Promise<string> {
  const { data, error } = await supabase.rpc('registrar_compra', { payload })
  if (error) throw error
  return data as string
}

export async function registrarConteo(insumoId: string, cantidadContada: number, nota?: string): Promise<void> {
  const { error } = await supabase.rpc('registrar_conteo', {
    p_insumo_id: insumoId,
    p_cantidad_contada: cantidadContada,
    p_nota: nota ?? null,
  })
  if (error) throw error
}
