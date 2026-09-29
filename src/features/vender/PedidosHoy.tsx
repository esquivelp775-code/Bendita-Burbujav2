import { useState } from 'react'
import { formatoMoneda } from '../../lib/format'
import { cancelarPedido, type ItemCarrito, type PedidoStore, type VentaLineaStore } from '../../lib/store/remoteStore'
import { finDia, inicioDia } from '../../lib/store/selectors'
import { useStore } from '../../lib/store/useStore'

const ETIQUETA_PAGO: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta', plataforma: 'Plataforma' }

function hora(fechaIso: string) {
  return new Date(fechaIso).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
}

function describirLinea(l: VentaLineaStore) {
  const nombre = l.tipo === 'botana' ? l.botanaNombre : `${l.bebidaNombre} ${l.tamanoNombre ?? ''}`
  const extras = [l.lecheNombre && l.lecheNombre !== 'Entera' ? l.lecheNombre : null, ...l.adicionalesElegidos.map((a) => (a.sabor ? `${a.nombre} (${a.sabor})` : a.nombre))]
    .filter(Boolean)
    .join(', ')
  return `${l.cantidad}× ${nombre}${extras ? ` · ${extras}` : ''}`
}

interface Props {
  onRepetir: (canal: string, items: ItemCarrito[]) => void
}

export function PedidosHoy({ onRepetir }: Props) {
  const hoy = new Date()
  const pedidos = useStore((s) =>
    s.pedidos
      .filter((p) => {
        const t = new Date(p.fechaHora).getTime()
        return t >= inicioDia(hoy).getTime() && t <= finDia(hoy).getTime()
      })
      .reverse(),
  )
  const lineas = useStore((s) => s.ventaLineas)
  const catalogo = useStore((s) => s)
  const [confirmar, setConfirmar] = useState<PedidoStore | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [trabajando, setTrabajando] = useState(false)

  const lineasDe = (id: string) => lineas.filter((l) => l.pedidoId === id)

  function repetir(p: PedidoStore) {
    const items: ItemCarrito[] = []
    for (const l of lineasDe(p.id)) {
      if (l.tipo === 'botana' && l.botanaNombre && catalogo.botanas[l.botanaNombre]) {
        items.push({ tipo: 'botana', fechaHora: new Date(), botana: catalogo.botanas[l.botanaNombre], cantidad: l.cantidad })
      } else if (l.tipo === 'bebida' && l.bebidaNombre && l.tamanoNombre && catalogo.bebidas[l.bebidaNombre] && catalogo.tamanos[l.tamanoNombre]) {
        items.push({
          tipo: 'bebida',
          fechaHora: new Date(),
          bebida: catalogo.bebidas[l.bebidaNombre],
          tamano: catalogo.tamanos[l.tamanoNombre],
          lecheElegida: l.lecheNombre ? catalogo.leches[l.lecheNombre] : Object.values(catalogo.leches).find((x) => x.esDefault),
          adicionalesElegidos: l.adicionalesElegidos,
          cantidad: l.cantidad,
        })
      }
    }
    onRepetir(p.canalNombre, items)
  }

  async function cancelar(p: PedidoStore) {
    setTrabajando(true)
    try {
      const r = await cancelarPedido(p.id)
      setMensaje(
        r === 'en cola'
          ? 'Cancelado en el teléfono; se aplica en la base cuando vuelva la señal.'
          : r === 'quitado'
            ? 'Pedido quitado (todavía no se había subido).'
            : 'Pedido cancelado y su inventario regresó.',
      )
    } catch (e) {
      setMensaje(`No se pudo cancelar: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setTrabajando(false)
      setConfirmar(null)
    }
  }

  const activos = pedidos.filter((p) => p.estado !== 'cancelado')
  const totalDia = activos.reduce((acc, p) => acc + p.envioCobrado + lineasDe(p.id).reduce((a, l) => a + l.desglose.precio * l.cantidad, 0), 0)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted m-0">
        {activos.length} pedidos · {formatoMoneda(totalDia)}
      </p>
      {mensaje && <p className="text-sm border border-border rounded p-2 bg-surface m-0">{mensaje}</p>}
      {pedidos.length === 0 && <p className="text-sm text-muted">Todavía no hay pedidos hoy.</p>}
      {pedidos.map((p) => {
        const ls = lineasDe(p.id)
        const total = p.envioCobrado + ls.reduce((a, l) => a + l.desglose.precio * l.cantidad, 0)
        const cancelado = p.estado === 'cancelado'
        return (
          <div key={p.id} className={`border border-border rounded p-3 bg-surface flex flex-col gap-2 ${cancelado ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start gap-2">
              <div className="text-sm">
                <span className="font-semibold tabular">{hora(p.fechaHora)}</span> · {p.canalNombre}
                {p.clienteNombre && <span> · {p.clienteNombre}</span>}
                <div className="text-xs text-muted">
                  {[p.formaPago ? ETIQUETA_PAGO[p.formaPago] : null, p.folio ? `Folio ${p.folio}` : null, p.envioCobrado > 0 ? `Envío ${formatoMoneda(p.envioCobrado)}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold tabular ${cancelado ? 'line-through' : ''}`}>{formatoMoneda(total)}</div>
                {cancelado && <span className="text-xs text-ink-dark">Cancelado</span>}
                {p.porSubir && !cancelado && <span className="text-xs text-warn">Por subir</span>}
              </div>
            </div>
            <ul className="text-sm m-0 pl-0 list-none flex flex-col gap-0.5">
              {ls.map((l) => (
                <li key={l.id}>{describirLinea(l)}</li>
              ))}
            </ul>
            {!cancelado && (
              <div className="flex gap-4 justify-end">
                <button className="text-sm underline" onClick={() => repetir(p)}>
                  Repetir
                </button>
                <button className="text-sm underline text-ink-dark" onClick={() => setConfirmar(p)}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )
      })}

      {confirmar && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={() => setConfirmar(null)}>
          <div className="bg-bg rounded-t md:rounded p-5 w-full md:max-w-sm flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display m-0">¿Cancelar el pedido de las {hora(confirmar.fechaHora)}?</h2>
            <p className="text-sm text-muted m-0">
              No se borra: queda marcado como cancelado, deja de contar en tus ventas y el inventario que usó regresa.
            </p>
            <button disabled={trabajando} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={() => cancelar(confirmar)}>
              {trabajando ? 'Cancelando…' : 'Sí, cancelar pedido'}
            </button>
            <button className="h-11 rounded border border-border" onClick={() => setConfirmar(null)}>
              No, dejarlo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
