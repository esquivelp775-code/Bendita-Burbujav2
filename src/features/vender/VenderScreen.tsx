import { useEffect, useRef, useState } from 'react'
import { formatoMoneda } from '../../lib/format'
import { datos } from '../../lib/fixtures'
import { calcularDesgloseItem, registrarPedidoConItems, type ItemCarrito } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'
import { BebidaPanel } from './BebidaPanel'

const CIERRE_POR_INACTIVIDAD_MS = 3 * 60 * 1000
const DESHACER_MS = 5000

export function VenderScreen() {
  const canales = useStore((s) => s.canales.filter((c) => c.activo))
  const bebidas = useStore((s) => Object.values(s.bebidas).filter((b) => b.activa))
  const ultimoCanal = useStore((s) => s.ultimoCanal)

  const [canalNombre, setCanalNombre] = useState(() => ultimoCanal ?? canales[0]?.nombre)
  const canal = canales.find((c) => c.nombre === canalNombre) ?? canales[0]

  const [panelBebida, setPanelBebida] = useState<(typeof bebidas)[number] | null>(null)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [envioCobrado, setEnvioCobrado] = useState(35)
  const [costoEnvio, setCostoEnvio] = useState(0)
  const [clienteNombre, setClienteNombre] = useState('')
  const [bebidasEvento, setBebidasEvento] = useState(30)
  const [deshacer, setDeshacer] = useState<{ item: ItemCarrito; venceEn: number } | null>(null)
  const timeoutInactividad = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutDeshacer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const configPublico = useStore((s) => (canal ? s.configPublicoPorCanal[canal.nombre] : undefined))

  useEffect(() => {
    if (configPublico) {
      setEnvioCobrado(configPublico.envioCobradoDefault)
      setCostoEnvio(configPublico.costoEnvioDefault)
    }
  }, [configPublico])

  const escalaEvento = (datos.evento.escalas as { desde: number; hasta: number | null; factor: number; cargo_servicio: number }[]).find(
    (e) => bebidasEvento >= e.desde && (e.hasta == null || bebidasEvento <= e.hasta),
  )
  const factorEvento = canal?.tipo === 'evento' ? escalaEvento?.factor : undefined

  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  async function cerrarPedido() {
    if (!canal || carrito.length === 0) return
    const itemsACerrar = carrito
    setCarrito([])
    setClienteNombre('')
    setGuardando(true)
    try {
      await registrarPedidoConItems({
        canalNombre: canal.nombre,
        items: itemsACerrar,
        envioCobrado: canal.tipo === 'publico' ? envioCobrado : undefined,
        costoEnvio: canal.tipo === 'publico' ? costoEnvio : undefined,
        clienteNombre: clienteNombre || undefined,
      })
      setErrorGuardado(null)
    } catch (e) {
      setErrorGuardado(e instanceof Error ? e.message : String(e))
      setCarrito(itemsACerrar) // no se guardó: lo regresamos al carrito para no perder la venta
    } finally {
      setGuardando(false)
    }
  }

  function resetInactividad() {
    if (timeoutInactividad.current) clearTimeout(timeoutInactividad.current)
    timeoutInactividad.current = setTimeout(() => cerrarPedido(), CIERRE_POR_INACTIVIDAD_MS)
  }

  useEffect(() => {
    resetInactividad()
    return () => {
      if (timeoutInactividad.current) clearTimeout(timeoutInactividad.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito])

  function cambiarCanal(nombre: string) {
    if (carrito.length > 0) cerrarPedido()
    setCanalNombre(nombre)
  }

  function agregarItem(item: ItemCarrito) {
    setCarrito((c) => [...c, item])
    setPanelBebida(null)
    resetInactividad()

    if (timeoutDeshacer.current) clearTimeout(timeoutDeshacer.current)
    setDeshacer({ item, venceEn: Date.now() + DESHACER_MS })
    timeoutDeshacer.current = setTimeout(() => setDeshacer(null), DESHACER_MS)
  }

  function deshacerUltimo() {
    setCarrito((c) => c.slice(0, -1))
    setDeshacer(null)
    if (timeoutDeshacer.current) clearTimeout(timeoutDeshacer.current)
  }

  if (!canal) {
    return <p className="p-6 text-muted">No hay canales activos. Actívalos en Ajustes.</p>
  }

  const total = carrito.reduce((acc, item) => {
    try {
      return acc + calcularDesgloseItem(canal.nombre, item).precio * item.cantidad
    } catch {
      return acc
    }
  }, 0)

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          {canales.map((c) => (
            <button
              key={c.nombre}
              onClick={() => cambiarCanal(c.nombre)}
              className={`h-10 px-4 rounded border text-sm font-semibold ${
                c.nombre === canal.nombre ? 'text-bg border-transparent' : 'border-border text-ink'
              }`}
              style={c.nombre === canal.nombre ? { backgroundColor: c.color } : undefined}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {canal.tipo === 'evento' && (
          <div className="flex items-center gap-2 text-sm bg-surface border border-border rounded p-3">
            <label htmlFor="bebidasEvento">Bebidas totales del evento:</label>
            <input
              id="bebidasEvento"
              type="number"
              min={1}
              className="w-20 h-9 border border-border rounded px-2 bg-bg"
              value={bebidasEvento}
              onChange={(e) => setBebidasEvento(Number(e.target.value))}
            />
            {escalaEvento ? (
              <span className="text-muted">factor {escalaEvento.factor} · cargo de servicio {formatoMoneda(escalaEvento.cargo_servicio)}</span>
            ) : (
              <span className="text-ink-dark">Mínimo {datos.evento.minimo_bebidas} bebidas para cotizar un evento.</span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {bebidas.map((b) => (
            <button
              key={b.nombre}
              onClick={() => setPanelBebida(b)}
              className="text-left border border-border rounded p-3 bg-surface hover:border-ink flex flex-col gap-1"
            >
              <span className="font-display text-lg leading-tight">{b.nombre}</span>
              <span className="label-uppercase">{b.categoriaNombre}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full md:w-80 flex-none flex flex-col gap-3 border border-border rounded p-4 bg-surface h-fit sticky top-4">
        <h2 className="text-lg font-display m-0">Pedido</h2>
        {carrito.length === 0 && <p className="text-sm text-muted">Toca una bebida para empezar.</p>}
        <div className="flex flex-col gap-2">
          {carrito.map((item, idx) => {
            let precio = 0
            try {
              precio = calcularDesgloseItem(canal.nombre, item).precio * item.cantidad
            } catch {
              /* ignore preview error */
            }
            return (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span>
                  {item.cantidad}× {item.bebida.nombre} {item.tamano.nombre}
                </span>
                <span className="tabular">{formatoMoneda(precio)}</span>
              </div>
            )
          })}
        </div>

        {canal.tipo === 'publico' && carrito.length > 0 && (
          <div className="flex flex-col gap-2 text-sm border-t border-border pt-2">
            <label className="flex justify-between items-center gap-2">
              Envío cobrado
              <input
                type="number"
                className="w-24 h-9 border border-border rounded px-2 bg-bg"
                value={envioCobrado}
                onChange={(e) => setEnvioCobrado(Number(e.target.value))}
              />
            </label>
            <label className="flex justify-between items-center gap-2">
              Costo de envío
              <input
                type="number"
                className="w-24 h-9 border border-border rounded px-2 bg-bg"
                value={costoEnvio}
                onChange={(e) => setCostoEnvio(Number(e.target.value))}
              />
            </label>
            <label className="flex justify-between items-center gap-2">
              Cliente (opcional)
              <input
                type="text"
                className="w-32 h-9 border border-border rounded px-2 bg-bg"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
              />
            </label>
          </div>
        )}

        {carrito.length > 0 && (
          <>
            <div className="flex justify-between items-center font-semibold border-t border-border pt-2">
              <span>Total</span>
              <span className="tabular">{formatoMoneda(total + (canal.tipo === 'publico' ? envioCobrado : 0))}</span>
            </div>
            <button onClick={cerrarPedido} disabled={guardando} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60">
              {guardando ? 'Guardando…' : 'Listo'}
            </button>
          </>
        )}
        {errorGuardado && <p className="text-sm text-ink-dark">No se pudo guardar: {errorGuardado}</p>}
      </div>

      {panelBebida && (
        <BebidaPanel
          bebida={panelBebida}
          canalNombre={canal.nombre}
          factorEvento={factorEvento}
          onAgregar={agregarItem}
          onCerrar={() => setPanelBebida(null)}
        />
      )}

      {deshacer && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-ink text-bg rounded px-4 py-3 flex items-center gap-4 shadow-lg z-50">
          <span className="text-sm">Agregado {deshacer.item.bebida.nombre}</span>
          <button onClick={deshacerUltimo} className="text-sm font-semibold underline">
            Deshacer
          </button>
        </div>
      )}
    </div>
  )
}
