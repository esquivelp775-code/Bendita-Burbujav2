import { useEffect, useRef, useState } from 'react'
import { tamanosAgotadosSinRecompra, type Bebida } from '../../lib/calculos'
import { intentarActualizar } from '../../lib/actualizacion'
import { formatoMoneda } from '../../lib/format'
import type { FormaPago } from '../../lib/supabase/ventas'
import { calcularDesgloseItem, existenciaInsumo, getEstado, registrarPedidoConItems, type ItemCarrito } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'
import { BebidaPanel } from './BebidaPanel'
import { guardarCarrito, leerCarrito } from './carritoGuardado'
import { PedidosHoy } from './PedidosHoy'

const CIERRE_POR_INACTIVIDAD_MS = 3 * 60 * 1000
const DESHACER_MS = 5000
const FORMAS_PAGO: { valor: FormaPago; etiqueta: string }[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
]

type Entrega = 'recoge' | 'envio' | null

function nombreItem(item: ItemCarrito) {
  if (item.tipo === 'botana') return item.botana.nombre
  const extras = [item.lecheElegida && !item.lecheElegida.esDefault ? item.lecheElegida.nombre : null, ...item.adicionalesElegidos.map((a) => a.nombre)].filter(Boolean)
  return `${item.bebida.nombre} ${item.tamano.nombre}${extras.length ? ` · ${extras.join(', ')}` : ''}`
}

function precioItem(canal: string, item: ItemCarrito): number {
  try {
    return calcularDesgloseItem(canal, item).precio * item.cantidad
  } catch {
    return 0
  }
}

export function VenderScreen() {
  const canales = useStore((s) => s.canales.filter((c) => c.activo))
  const bebidas = useStore((s) => Object.values(s.bebidas).filter((b) => b.activa))
  const botanas = useStore((s) => Object.values(s.botanas).filter((b) => b.activa))
  const ultimoCanal = useStore((s) => s.ultimoCanal)
  const escalasEvento = useStore((s) => s.escalasEvento)
  const configEvento = useStore((s) => s.configEvento)
  const pedidosHoy = useStore((s) => {
    const inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
    return s.pedidos.filter((p) => p.estado !== 'cancelado' && new Date(p.fechaHora) >= inicio).length
  })

  const [guardado] = useState(() => ({ current: leerCarrito(getEstado()) }))
  const [vista, setVista] = useState<'vender' | 'pedidos'>('vender')
  const [canalNombre, setCanalNombre] = useState(() => guardado.current?.canal ?? ultimoCanal ?? canales[0]?.nombre)
  const canal = canales.find((c) => c.nombre === canalNombre) ?? canales[0]

  const [panelBebida, setPanelBebida] = useState<Bebida | null>(null)
  const [carrito, setCarrito] = useState<ItemCarrito[]>(() => guardado.current?.items ?? [])
  const [entrega, setEntrega] = useState<Entrega>(null)
  const [envioCobrado, setEnvioCobrado] = useState(35)
  const [costoEnvio, setCostoEnvio] = useState(0)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo')
  const [folio, setFolio] = useState('')
  const [bebidasEvento, setBebidasEvento] = useState(30)
  const [eventoId, setEventoId] = useState<string>('')
  const eventosHoy = useStore((s) => {
    const d = new Date()
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return s.eventos.filter((e) => e.fecha === hoy && (e.estado === 'confirmado' || e.estado === 'realizado'))
  })
  const [deshacer, setDeshacer] = useState<{ item: ItemCarrito } | null>(null)
  const [canalPorCambiar, setCanalPorCambiar] = useState<string | null>(null)
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const timeoutInactividad = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutDeshacer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sinVasos = useStore((s) =>
    canal ? tamanosAgotadosSinRecompra(Object.values(s.tamanos).filter((t) => t.activo), canal.nombre, s.insumos, existenciaInsumo) : [],
  )
  const configPublico = useStore((s) => (canal ? s.configPublicoPorCanal[canal.nombre] : undefined))

  useEffect(() => {
    if (configPublico) {
      setEnvioCobrado(configPublico.envioCobradoDefault)
      setCostoEnvio(configPublico.costoEnvioDefault)
    }
  }, [configPublico])

  // El carrito vive en el teléfono: sobrevive a recargas y actualizaciones.
  useEffect(() => {
    if (!canal) return
    guardarCarrito(canal.nombre, carrito)
    // Si había una versión nueva esperando a que no hubiera pedido abierto, este es el momento.
    if (carrito.length === 0) intentarActualizar()
  }, [carrito, canal])

  const eventoDelDia = eventosHoy.find((e) => e.id === eventoId)
  const totalEvento = eventoDelDia ? eventoDelDia.lineas.reduce((a, l) => a + l.cantidad, 0) : bebidasEvento
  const escalaEvento = escalasEvento.find((e) => totalEvento >= e.desde && (e.hasta == null || totalEvento <= e.hasta))
  const factorEvento = canal?.tipo === 'evento' ? escalaEvento?.factor : undefined

  const faltaEntrega = canal?.tipo === 'publico' && entrega == null
  const faltaEscala = canal?.tipo === 'evento' && !escalaEvento
  const puedeCerrar = carrito.length > 0 && !faltaEntrega && !faltaEscala

  function limpiarPedido() {
    setCarrito([])
    setClienteNombre('')
    setClienteTelefono('')
    setFolio('')
    setEntrega(null)
    setFormaPago('efectivo')
    setHojaAbierta(false)
  }

  async function cerrarPedido(): Promise<boolean> {
    if (!canal || !puedeCerrar) return false
    try {
      await registrarPedidoConItems({
        canalNombre: canal.nombre,
        items: canal.tipo === 'evento' ? carrito.map((i) => ({ ...i, factorEvento })) : carrito,
        envioCobrado: canal.tipo === 'publico' && entrega === 'envio' ? envioCobrado : 0,
        costoEnvio: canal.tipo === 'publico' && entrega === 'envio' ? costoEnvio : 0,
        clienteNombre: canal.tipo === 'publico' ? clienteNombre : undefined,
        clienteTelefono: canal.tipo === 'publico' ? clienteTelefono : undefined,
        formaPago: canal.tipo === 'plataforma' ? 'plataforma' : formaPago,
        folio: canal.tipo === 'plataforma' ? folio : undefined,
        eventoId: canal.tipo === 'evento' && eventoId ? eventoId : undefined,
      })
      setErrorGuardado(null)
      limpiarPedido()
      setAviso(navigator.onLine ? 'Pedido guardado' : 'Guardado en el teléfono · se sube cuando vuelva la señal')
      setTimeout(() => setAviso(null), 3000)
      return true
    } catch (e) {
      setErrorGuardado(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  // Cierre automático tras 3 min sin actividad, sólo si el pedido está completo.
  useEffect(() => {
    if (timeoutInactividad.current) clearTimeout(timeoutInactividad.current)
    if (carrito.length > 0 && puedeCerrar) timeoutInactividad.current = setTimeout(() => void cerrarPedido(), CIERRE_POR_INACTIVIDAD_MS)
    return () => {
      if (timeoutInactividad.current) clearTimeout(timeoutInactividad.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito, puedeCerrar, entrega, formaPago, clienteNombre, clienteTelefono, folio])

  function pedirCambioCanal(nombre: string) {
    if (nombre === canal?.nombre) return
    if (carrito.length > 0) {
      setCanalPorCambiar(nombre)
      return
    }
    setCanalNombre(nombre)
    setEntrega(null)
  }

  async function resolverCambioCanal(accion: 'guardar' | 'descartar' | 'seguir') {
    const destino = canalPorCambiar
    setCanalPorCambiar(null)
    if (!destino || accion === 'seguir') return
    if (accion === 'guardar' && !(await cerrarPedido())) return
    if (accion === 'descartar') limpiarPedido()
    setCanalNombre(destino)
    setEntrega(null)
  }

  function agregarItem(item: ItemCarrito) {
    setCarrito((c) => [...c, item])
    setPanelBebida(null)
    if (timeoutDeshacer.current) clearTimeout(timeoutDeshacer.current)
    setDeshacer({ item })
    timeoutDeshacer.current = setTimeout(() => setDeshacer(null), DESHACER_MS)
  }

  function deshacerUltimo() {
    setCarrito((c) => c.slice(0, -1))
    setDeshacer(null)
    if (timeoutDeshacer.current) clearTimeout(timeoutDeshacer.current)
  }

  function cambiarCantidad(indice: number, delta: number) {
    setCarrito((c) => c.map((item, i) => (i === indice ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item)))
  }

  function quitarItem(indice: number) {
    setCarrito((c) => c.filter((_, i) => i !== indice))
  }

  function repetir(canalDestino: string, items: ItemCarrito[]) {
    if (carrito.length > 0) {
      setErrorGuardado('Termina o descarta el pedido abierto antes de repetir otro.')
      setVista('vender')
      return
    }
    setCanalNombre(canalDestino)
    setEntrega(null)
    setCarrito(items)
    setVista('vender')
  }

  if (!canal) {
    return <p className="p-6 text-muted">No hay canales activos. Actívalos en Ajustes.</p>
  }

  const conFactor = (item: ItemCarrito): ItemCarrito => (canal.tipo === 'evento' ? { ...item, factorEvento } : item)
  const total = carrito.reduce((acc, item) => acc + precioItem(canal.nombre, conFactor(item)), 0) + (canal.tipo === 'publico' && entrega === 'envio' ? envioCobrado : 0)
  const unidades = carrito.reduce((acc, i) => acc + i.cantidad, 0)

  const bandeja = (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-display m-0">Pedido · {canal.nombre}</h2>
      {carrito.length === 0 && <p className="text-sm text-muted m-0">Toca una bebida para empezar.</p>}
      <div className="flex flex-col gap-2">
        {carrito.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center gap-2 text-sm border-b border-border pb-2">
            <span className="min-w-0 flex-1">{nombreItem(item)}</span>
            <span className="flex items-center gap-1">
              <button className="w-8 h-8 rounded border border-border" onClick={() => cambiarCantidad(idx, -1)} aria-label="Uno menos">
                −
              </button>
              <span className="tabular w-5 text-center">{item.cantidad}</span>
              <button className="w-8 h-8 rounded border border-border" onClick={() => cambiarCantidad(idx, 1)} aria-label="Uno más">
                +
              </button>
            </span>
            <span className="tabular w-16 text-right">{formatoMoneda(precioItem(canal.nombre, conFactor(item)))}</span>
            <button className="w-8 h-8 text-muted text-lg" onClick={() => quitarItem(idx)} aria-label={`Quitar ${nombreItem(item)}`}>
              ×
            </button>
          </div>
        ))}
      </div>

      {carrito.length > 0 && canal.tipo === 'publico' && (
        <div className="flex flex-col gap-2 text-sm">
          <span className="label-uppercase">Entrega</span>
          <div className="grid grid-cols-2 gap-2">
            {(['recoge', 'envio'] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEntrega(e)}
                className={`h-11 rounded border font-semibold ${entrega === e ? 'bg-ink text-bg border-ink' : 'border-border'}`}
              >
                {e === 'recoge' ? 'Recoge ($0)' : `Envío (${formatoMoneda(envioCobrado)})`}
              </button>
            ))}
          </div>
          {entrega === 'envio' && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                Envío cobrado
                <input type="number" inputMode="decimal" className="h-10 border border-border rounded px-2 bg-bg" value={envioCobrado} onChange={(e) => setEnvioCobrado(Number(e.target.value))} />
              </label>
              <label className="flex flex-col gap-1">
                Le pagas al repartidor
                <input type="number" inputMode="decimal" className="h-10 border border-border rounded px-2 bg-bg" value={costoEnvio} onChange={(e) => setCostoEnvio(Number(e.target.value))} />
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              Cliente (opcional)
              <input className="h-10 border border-border rounded px-2 bg-bg" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              Teléfono (opcional)
              <input type="tel" inputMode="tel" className="h-10 border border-border rounded px-2 bg-bg" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} />
            </label>
          </div>
        </div>
      )}

      {carrito.length > 0 && canal.tipo !== 'plataforma' && (
        <div className="flex flex-col gap-1 text-sm">
          <span className="label-uppercase">Forma de pago</span>
          <div className="grid grid-cols-3 gap-2">
            {FORMAS_PAGO.map((f) => (
              <button
                key={f.valor}
                onClick={() => setFormaPago(f.valor)}
                className={`h-10 rounded border text-xs font-semibold ${formaPago === f.valor ? 'bg-ink text-bg border-ink' : 'border-border'}`}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}

      {carrito.length > 0 && canal.tipo === 'plataforma' && (
        <label className="flex flex-col gap-1 text-sm">
          Folio de {canal.nombre} (opcional)
          <input className="h-10 border border-border rounded px-2 bg-bg" value={folio} onChange={(e) => setFolio(e.target.value)} />
        </label>
      )}

      {carrito.length > 0 && (
        <>
          <div className="flex justify-between items-center font-semibold border-t border-border pt-2">
            <span>Total</span>
            <span className="tabular">{formatoMoneda(total)}</span>
          </div>
          {faltaEntrega && <p className="text-xs text-warn m-0">Elige si recoge o lleva envío.</p>}
          {faltaEscala && <p className="text-xs text-warn m-0">Un evento necesita mínimo {configEvento.minimoBebidas} bebidas.</p>}
          <button onClick={() => void cerrarPedido()} disabled={!puedeCerrar} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-50">
            Listo
          </button>
        </>
      )}
      {errorGuardado && <p className="text-sm text-ink-dark m-0">No se pudo guardar: {errorGuardado}</p>}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 md:p-6">
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex gap-1 border-b border-border" role="tablist">
          {(['vender', 'pedidos'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={vista === v}
              onClick={() => setVista(v)}
              className={`h-10 px-4 text-sm font-semibold border-b-2 -mb-px ${vista === v ? 'border-ink text-ink' : 'border-transparent text-muted'}`}
            >
              {v === 'vender' ? 'Vender' : `Pedidos de hoy · ${pedidosHoy}`}
            </button>
          ))}
        </div>

        {vista === 'pedidos' ? (
          <PedidosHoy onRepetir={repetir} />
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              {canales.map((c) => (
                <button
                  key={c.nombre}
                  onClick={() => pedirCambioCanal(c.nombre)}
                  className={`h-10 px-4 rounded border text-sm font-semibold ${c.nombre === canal.nombre ? 'text-bg border-transparent' : 'border-border text-ink'}`}
                  style={c.nombre === canal.nombre ? { backgroundColor: c.color } : undefined}
                >
                  {c.nombre}
                </button>
              ))}
            </div>

            {sinVasos.map((t) => (
              <div key={t.nombre} className="text-sm bg-surface border border-warn text-warn rounded p-3">
                Se acabaron los vasos de {t.nombre}. Ya no se ofrece en {canal.nombre}; vuelve solo si registras una compra de vasos de {t.nombre}.
              </div>
            ))}

            {canal.tipo === 'evento' && (
              <div className="flex items-center gap-2 flex-wrap text-sm bg-surface border border-border rounded p-3">
                {eventosHoy.length > 0 && (
                  <label className="flex items-center gap-2 w-full">
                    Evento:
                    <select className="h-9 flex-1 min-w-0 border border-border rounded px-2 bg-bg" value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
                      <option value="">Venta suelta (sin evento)</option>
                      {eventosHoy.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre} · {e.lineas.reduce((a, l) => a + l.cantidad, 0)} bebidas
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label htmlFor="bebidasEvento">Bebidas totales del evento:</label>
                <input
                  id="bebidasEvento"
                  type="number"
                  min={1}
                  disabled={!!eventoDelDia}
                  className="w-20 h-9 border border-border rounded px-2 bg-bg disabled:opacity-60"
                  value={totalEvento}
                  onChange={(e) => setBebidasEvento(Number(e.target.value))}
                />
                {escalaEvento ? (
                  <span className="text-muted">
                    factor {escalaEvento.factor} · cargo de servicio {formatoMoneda(escalaEvento.cargoServicio)}
                  </span>
                ) : (
                  <span className="text-ink-dark">Mínimo {configEvento.minimoBebidas} bebidas para cotizar un evento.</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {bebidas.map((b) => (
                <button key={b.nombre} onClick={() => setPanelBebida(b)} className="text-left border border-border rounded p-3 bg-surface hover:border-ink flex flex-col gap-1">
                  <span className="font-display text-lg leading-tight">{b.nombre}</span>
                  <span className="label-uppercase">{b.categoriaNombre}</span>
                </button>
              ))}
            </div>

            {botanas.length > 0 && (
              <>
                <h2 className="text-sm label-uppercase m-0">Botanas</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {botanas.map((b) => {
                    const item: ItemCarrito = conFactor({ tipo: 'botana', fechaHora: new Date(), botana: b, cantidad: 1 })
                    const hay = b.insumoClave ? existenciaInsumo(b.insumoClave) : null
                    return (
                      <button key={b.nombre} onClick={() => agregarItem(item)} className="text-left border border-border rounded p-3 bg-surface hover:border-ink flex flex-col gap-1">
                        <span className="font-display text-lg leading-tight">{b.nombre}</span>
                        <span className="text-sm tabular">{formatoMoneda(precioItem(canal.nombre, item))}</span>
                        {hay != null && hay <= 0 && <span className="text-xs text-warn">Sin existencia registrada</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Escritorio: bandeja a la derecha */}
      <div className="hidden md:flex w-80 flex-none flex-col border border-border rounded p-4 bg-surface h-fit sticky top-4">{bandeja}</div>

      {/* Celular: barra fija sobre la navegación que abre la bandeja */}
      {vista === 'vender' && carrito.length > 0 && !hojaAbierta && (
        <button
          onClick={() => setHojaAbierta(true)}
          className="md:hidden fixed left-3 right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 h-14 rounded bg-ink text-bg font-semibold flex items-center justify-between px-4 shadow-lg"
        >
          <span>
            Pedido · {unidades} {unidades === 1 ? 'producto' : 'productos'}
          </span>
          <span className="tabular">{formatoMoneda(total)} →</span>
        </button>
      )}
      {hojaAbierta && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setHojaAbierta(false)}>
          <div className="bg-bg w-full max-h-[85vh] overflow-y-auto rounded-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button className="text-muted text-xl px-2" onClick={() => setHojaAbierta(false)} aria-label="Cerrar pedido">
                ×
              </button>
            </div>
            {bandeja}
          </div>
        </div>
      )}

      {panelBebida && (
        <BebidaPanel bebida={panelBebida} canalNombre={canal.nombre} factorEvento={factorEvento} onAgregar={agregarItem} onCerrar={() => setPanelBebida(null)} />
      )}

      {canalPorCambiar && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={() => void resolverCambioCanal('seguir')}>
          <div className="bg-bg rounded-t md:rounded p-5 w-full md:max-w-sm flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display m-0">Tienes un pedido abierto en {canal.nombre}</h2>
            <p className="text-sm text-muted m-0">
              {unidades} {unidades === 1 ? 'producto' : 'productos'} · {formatoMoneda(total)}. ¿Qué hacemos antes de pasar a {canalPorCambiar}?
            </p>
            <button disabled={!puedeCerrar} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-50" onClick={() => void resolverCambioCanal('guardar')}>
              Guardar pedido
            </button>
            {!puedeCerrar && <p className="text-xs text-warn m-0">{faltaEntrega ? 'Falta elegir recoge o envío.' : 'Falta completar el pedido.'}</p>}
            <button className="h-11 rounded border border-border" onClick={() => void resolverCambioCanal('descartar')}>
              Descartarlo
            </button>
            <button className="h-11 rounded text-sm underline" onClick={() => void resolverCambioCanal('seguir')}>
              Seguir en {canal.nombre}
            </button>
          </div>
        </div>
      )}

      {(deshacer || aviso) && (
        <div className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 bg-ink text-bg rounded px-4 py-3 flex items-center gap-4 shadow-lg z-50">
          {deshacer ? (
            <>
              <span className="text-sm">Agregado {deshacer.item.tipo === 'botana' ? deshacer.item.botana.nombre : deshacer.item.bebida.nombre}</span>
              <button onClick={deshacerUltimo} className="text-sm font-semibold underline">
                Deshacer
              </button>
            </>
          ) : (
            <span className="text-sm">{aviso}</span>
          )}
        </div>
      )}
    </div>
  )
}
