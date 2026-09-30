import { useMemo, useState } from 'react'
import { formatoCantidad, formatoMoneda, formatoPorcentaje } from '../../lib/format'
import {
  cambiarEstadoEvento,
  cotizar,
  guardarEvento,
  registrarEventoRealizado,
  type EstadoEvento,
  type EventoStore,
  type LineaCotizacion,
} from '../../lib/store/remoteStore'
import type { FormaPago } from '../../lib/supabase/ventas'
import { useStore } from '../../lib/store/useStore'

const ETIQUETA_ESTADO: Record<EstadoEvento, string> = {
  cotizado: 'Cotizado',
  confirmado: 'Confirmado',
  realizado: 'Realizado · por cobrar',
  cobrado: 'Cobrado',
  cancelado: 'Cancelado',
}

const hoyTexto = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fechaLarga(f: string) {
  const [y, m, d] = f.split('-').map(Number)
  const t = new Date(y, m - 1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function EventosScreen() {
  const eventos = useStore((s) => s.eventos)
  const [abierto, setAbierto] = useState<EventoStore | 'nuevo' | null>(null)
  const hoy = hoyTexto()

  if (abierto) return <EditorEvento evento={abierto === 'nuevo' ? undefined : abierto} onCerrar={() => setAbierto(null)} />

  const grupos: { titulo: string; lista: EventoStore[] }[] = [
    { titulo: 'Por cobrar', lista: eventos.filter((e) => e.estado === 'realizado') },
    { titulo: 'Próximos', lista: eventos.filter((e) => (e.estado === 'cotizado' || e.estado === 'confirmado') && e.fecha >= hoy) },
    { titulo: 'Cotizaciones vencidas', lista: eventos.filter((e) => (e.estado === 'cotizado' || e.estado === 'confirmado') && e.fecha < hoy) },
    { titulo: 'Cerrados', lista: eventos.filter((e) => e.estado === 'cobrado' || e.estado === 'cancelado').reverse() },
  ]

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col gap-5">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-3xl m-0">Eventos</h1>
        <button className="h-11 px-4 rounded bg-ink text-bg font-semibold" onClick={() => setAbierto('nuevo')}>
          Cotizar evento
        </button>
      </div>
      {eventos.length === 0 && <p className="text-sm text-muted">Todavía no hay eventos. Cotiza uno para empezar.</p>}
      {grupos
        .filter((g) => g.lista.length > 0)
        .map((g) => (
          <section key={g.titulo} className="flex flex-col gap-2">
            <h2 className="text-sm label-uppercase m-0">{g.titulo}</h2>
            {g.lista.map((e) => {
              const n = e.lineas.reduce((a, l) => a + l.cantidad, 0)
              const total = e.lineas.reduce((a, l) => a + l.cantidad * l.precioUnitario, 0) + e.cargoServicio
              return (
                <button key={e.id} onClick={() => setAbierto(e)} className="text-left border border-border rounded p-3 bg-surface flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="font-display text-lg">{e.nombre}</span>
                    <span className="block text-xs text-muted">
                      {fechaLarga(e.fecha)}
                      {e.lugar ? ` · ${e.lugar}` : ''}
                      {e.clienteNombre ? ` · ${e.clienteNombre}` : ''}
                    </span>
                  </span>
                  <span className="text-right text-sm whitespace-nowrap">
                    <span className="tabular font-semibold block">{formatoMoneda(total)}</span>
                    <span className="text-xs text-muted">
                      {n} bebidas · {ETIQUETA_ESTADO[e.estado]}
                    </span>
                  </span>
                </button>
              )
            })}
          </section>
        ))}
    </div>
  )
}

function EditorEvento({ evento, onCerrar }: { evento?: EventoStore; onCerrar: () => void }) {
  const bebidas = useStore((s) => Object.values(s.bebidas).filter((b) => b.activa))
  const tamanos = useStore((s) =>
    Object.values(s.tamanos)
      .filter((t) => t.activo && (!t.canales || t.canales.includes('Evento')))
      .sort((a, b) => a.ml - b.ml),
  )
  const config = useStore((s) => s.configEvento)
  useStore((s) => s.preciosApp)

  const [nombre, setNombre] = useState(evento?.nombre ?? '')
  const [fecha, setFecha] = useState(evento?.fecha ?? hoyTexto())
  const [lugar, setLugar] = useState(evento?.lugar ?? '')
  const [clienteNombre, setClienteNombre] = useState(evento?.clienteNombre ?? '')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [anticipo, setAnticipo] = useState(String(evento?.anticipo ?? 0))
  const [notas, setNotas] = useState(evento?.notas ?? '')
  const [lineas, setLineas] = useState<LineaCotizacion[]>(
    evento?.lineas.map((l) => ({ bebidaNombre: l.bebidaNombre, tamanoNombre: l.tamanoNombre, cantidad: l.cantidad })) ?? [
      { bebidaNombre: bebidas[0]?.nombre ?? '', tamanoNombre: tamanos.find((t) => t.nombre === '16 oz')?.nombre ?? tamanos[0]?.nombre ?? '', cantidad: 30 },
    ],
  )
  const [cargoManual, setCargoManual] = useState<string | null>(evento ? String(evento.cargoServicio) : null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [realizando, setRealizando] = useState(false)
  const soloLectura = evento != null && evento.estado !== 'cotizado' && evento.estado !== 'confirmado'

  const cargoNumero = cargoManual != null && cargoManual.trim() !== '' ? Number(cargoManual) : undefined
  const cot = useMemo(() => {
    try {
      return { r: cotizar(lineas, cargoNumero), error: null as string | null }
    } catch (e) {
      return { r: null, error: e instanceof Error ? e.message : String(e) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lineas), cargoNumero, config])
  const r = cot.r

  const cambiarLinea = (i: number, cambios: Partial<LineaCotizacion>) => setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...cambios } : l)))

  async function guardar(estadoNuevo?: EstadoEvento) {
    setGuardando(true)
    setMensaje(null)
    try {
      const id = await guardarEvento({
        id: evento?.id,
        nombre,
        fecha,
        lugar,
        clienteNombre,
        clienteTelefono,
        cargoServicio: r?.cargoServicio ?? 0,
        anticipo: Number(anticipo) || 0,
        notas,
        lineas,
      })
      if (estadoNuevo) await cambiarEstadoEvento(id, estadoNuevo)
      setMensaje({ ok: true, texto: estadoNuevo === 'confirmado' ? 'Evento confirmado.' : 'Cotización guardada.' })
      if (!evento) onCerrar()
    } catch (e) {
      setMensaje({ ok: false, texto: e instanceof Error ? e.message : String(e) })
    } finally {
      setGuardando(false)
    }
  }

  const textoCotizacion = r && !r.bloqueadoPorMinimo
    ? [
        `*Bendita Burbuja · Cotización*`,
        `${nombre || 'Evento'} · ${fechaLarga(fecha)}${lugar ? ` · ${lugar}` : ''}`,
        '',
        ...r.lineas.map((l) => `${l.cantidad} × ${l.bebida} ${l.tamano} a ${formatoMoneda(l.precioUnitario)} = ${formatoMoneda(l.cantidad * l.precioUnitario)}`),
        r.cargoServicio > 0 ? `Cargo de servicio: ${formatoMoneda(r.cargoServicio)}` : '',
        `*Total: ${formatoMoneda(r.totalCliente)}* (IVA incluido)`,
        Number(anticipo) > 0 ? `Anticipo: ${formatoMoneda(Number(anticipo))}` : '',
      ]
        .filter((x) => x !== '')
        .join('\n')
    : ''

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex justify-between items-center gap-2 no-imprimir">
        <button className="text-sm underline" onClick={onCerrar}>
          ← Eventos
        </button>
        {evento && <span className="text-xs label-uppercase border border-border rounded px-2 py-1">{ETIQUETA_ESTADO[evento.estado]}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 no-imprimir">
        <label className="flex flex-col gap-1 text-sm col-span-2">
          Nombre del evento
          <input disabled={soloLectura} className="h-11 border border-border rounded px-3 bg-surface" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Boda de Ana y Luis" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fecha
          <input disabled={soloLectura} type="date" className="h-11 border border-border rounded px-2 bg-surface" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Lugar
          <input disabled={soloLectura} className="h-11 border border-border rounded px-3 bg-surface" value={lugar} onChange={(e) => setLugar(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Cliente
          <input disabled={soloLectura} className="h-11 border border-border rounded px-3 bg-surface" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Teléfono
          <input disabled={soloLectura} type="tel" className="h-11 border border-border rounded px-3 bg-surface" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} />
        </label>
      </div>

      <section className="border border-border rounded p-4 bg-surface flex flex-col gap-3 no-imprimir">
        <h2 className="text-sm label-uppercase m-0">Bebidas</h2>
        {lineas.map((l, i) => {
          const res = r?.lineas.find((x) => x.bebida === l.bebidaNombre && x.tamano === l.tamanoNombre)
          return (
            <div key={i} className="flex flex-col gap-1 border-b border-border pb-2">
              <div className="grid grid-cols-[1fr_5rem_4.5rem_auto] gap-2 items-center">
                <select disabled={soloLectura} className="h-10 min-w-0 border border-border rounded px-2 bg-bg text-sm" value={l.bebidaNombre} onChange={(e) => cambiarLinea(i, { bebidaNombre: e.target.value })}>
                  {bebidas.map((b) => (
                    <option key={b.nombre} value={b.nombre}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
                <select disabled={soloLectura} className="h-10 border border-border rounded px-1 bg-bg text-sm" value={l.tamanoNombre} onChange={(e) => cambiarLinea(i, { tamanoNombre: e.target.value })}>
                  {tamanos.map((t) => (
                    <option key={t.nombre} value={t.nombre}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
                <input
                  disabled={soloLectura}
                  inputMode="numeric"
                  aria-label="Cantidad"
                  className="h-10 border border-border rounded px-2 bg-bg text-right tabular"
                  value={l.cantidad || ''}
                  onChange={(e) => cambiarLinea(i, { cantidad: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                />
                {!soloLectura && (
                  <button className="text-muted text-lg px-1" onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))} aria-label="Quitar línea">
                    ×
                  </button>
                )}
              </div>
              {res && (
                <span className="text-xs text-muted tabular">
                  {formatoMoneda(res.precioUnitario)} c/u · cuesta {formatoMoneda(res.costoProduccion)} · margen sobre costo {formatoPorcentaje(res.margenSobreCosto, 0)} · te deja{' '}
                  {formatoMoneda(res.utilidadUnitaria)} c/u
                </span>
              )}
            </div>
          )
        })}
        {!soloLectura && (
          <button
            className="text-sm underline self-start"
            onClick={() => setLineas((ls) => [...ls, { bebidaNombre: bebidas[0]?.nombre ?? '', tamanoNombre: tamanos[0]?.nombre ?? '', cantidad: 10 }])}
          >
            + Agregar bebida
          </button>
        )}
      </section>

      {cot.error && <p className="text-sm text-ink-dark">{cot.error}</p>}
      {r && (
        <section className="border border-border rounded p-4 bg-surface flex flex-col gap-2 text-sm no-imprimir">
          <h2 className="text-sm label-uppercase m-0">Cotización</h2>
          {r.bloqueadoPorMinimo ? (
            <p className="text-ink-dark m-0">
              {r.n} bebidas: el mínimo para un evento es {config.minimoBebidas}.
            </p>
          ) : (
            <>
              <div className="flex justify-between">
                <span>
                  {r.n} bebidas · escala {r.escala.desde}
                  {r.escala.hasta ? `–${r.escala.hasta}` : '+'} (factor {r.escala.factor})
                </span>
                <span className="tabular">{formatoMoneda(r.subtotalBebidas)}</span>
              </div>
              <label className="flex justify-between items-center gap-2">
                Cargo de servicio
                <input
                  disabled={soloLectura}
                  inputMode="decimal"
                  className="w-28 h-9 border border-border rounded px-2 bg-bg text-right tabular"
                  value={cargoManual ?? String(r.escala.cargoServicio)}
                  onChange={(e) => setCargoManual(e.target.value)}
                />
              </label>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
                <span>El cliente paga</span>
                <span className="tabular">{formatoMoneda(r.totalCliente)}</span>
              </div>
              <div className="flex justify-between">
                <span>Te deja (después de traslado, equipo y {formatoCantidad(config.horasMontaje)} h de montaje)</span>
                <span className={`tabular font-semibold ${r.utilidadEvento < 0 ? 'text-ink-dark' : 'text-ok'}`}>{formatoMoneda(r.utilidadEvento)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Por bebida · en apps dejarían</span>
                <span className="tabular">
                  {formatoMoneda(r.utilidadPorBebida)} · {formatoMoneda(r.comparativoApps / Math.max(1, r.n))}
                </span>
              </div>
              {r.alertaMenosQueApps && <p className="text-warn m-0">Este evento te deja menos por bebida que las apps.</p>}
            </>
          )}
          <label className="flex justify-between items-center gap-2">
            Anticipo recibido
            <input disabled={soloLectura} inputMode="decimal" className="w-28 h-9 border border-border rounded px-2 bg-bg text-right tabular" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            Notas
            <input disabled={soloLectura} className="h-10 border border-border rounded px-2 bg-bg" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </label>
        </section>
      )}

      {/* Hoja imprimible (PDF) */}
      {r && !r.bloqueadoPorMinimo && (
        <div className="solo-imprimir">
          <h1 className="text-2xl font-display">Bendita Burbuja · Cotización</h1>
          <p>
            {nombre} · {fechaLarga(fecha)}
            {lugar ? ` · ${lugar}` : ''}
            {clienteNombre ? ` · ${clienteNombre}` : ''}
          </p>
          <table className="w-full text-sm">
            <tbody>
              {r.lineas.map((l, i) => (
                <tr key={i}>
                  <td>
                    {l.cantidad} × {l.bebida} {l.tamano}
                  </td>
                  <td className="text-right">{formatoMoneda(l.precioUnitario)}</td>
                  <td className="text-right">{formatoMoneda(l.cantidad * l.precioUnitario)}</td>
                </tr>
              ))}
              {r.cargoServicio > 0 && (
                <tr>
                  <td>Cargo de servicio</td>
                  <td />
                  <td className="text-right">{formatoMoneda(r.cargoServicio)}</td>
                </tr>
              )}
              <tr>
                <td className="font-semibold">Total (IVA incluido)</td>
                <td />
                <td className="text-right font-semibold">{formatoMoneda(r.totalCliente)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2 no-imprimir">
        {(!evento || evento.estado === 'cotizado' || evento.estado === 'confirmado') && (
          <button disabled={guardando || !r || r.bloqueadoPorMinimo} className="h-11 px-4 rounded bg-ink text-bg font-semibold disabled:opacity-50" onClick={() => void guardar()}>
            {guardando ? 'Guardando…' : 'Guardar cotización'}
          </button>
        )}
        {evento?.estado === 'cotizado' && (
          <button disabled={guardando} className="h-11 px-4 rounded border border-ink font-semibold" onClick={() => void guardar('confirmado')}>
            Confirmar evento
          </button>
        )}
        {evento?.estado === 'confirmado' && (
          <button className="h-11 px-4 rounded bg-ink text-bg font-semibold" onClick={() => setRealizando(true)}>
            Registrar como realizado
          </button>
        )}
        {evento?.estado === 'realizado' && (
          <button className="h-11 px-4 rounded bg-ink text-bg font-semibold" onClick={() => cambiarEstadoEvento(evento.id, 'cobrado').then(onCerrar)}>
            Marcar cobrado
          </button>
        )}
        {textoCotizacion && (
          <>
            <a className="h-11 px-4 rounded border border-border font-semibold flex items-center" href={`https://wa.me/?text=${encodeURIComponent(textoCotizacion)}`} target="_blank" rel="noreferrer">
              Mandar por WhatsApp
            </a>
            <button className="h-11 px-4 rounded border border-border font-semibold" onClick={() => window.print()}>
              PDF / imprimir
            </button>
          </>
        )}
        {evento && evento.estado !== 'cobrado' && evento.estado !== 'cancelado' && evento.estado !== 'realizado' && (
          <button className="h-11 px-4 text-sm underline text-ink-dark" onClick={() => cambiarEstadoEvento(evento.id, 'cancelado').then(onCerrar)}>
            Cancelar evento
          </button>
        )}
      </div>
      {mensaje && <p className={`text-sm m-0 ${mensaje.ok ? 'text-ok' : 'text-ink-dark'}`}>{mensaje.texto}</p>}
      {evento && (evento.estado === 'realizado' || evento.estado === 'cobrado') && (
        <p className="text-sm text-muted m-0">
          Costos reales: traslado {formatoMoneda(evento.trasladoReal)} · equipo {formatoMoneda(evento.equipoReal)} · {formatoCantidad(evento.horasMontaje)} h de montaje.
        </p>
      )}

      {realizando && evento && <ModalRealizado evento={evento} onCerrar={() => setRealizando(false)} onListo={onCerrar} />}
    </div>
  )
}

function ModalRealizado({ evento, onCerrar, onListo }: { evento: EventoStore; onCerrar: () => void; onListo: () => void }) {
  const config = useStore((s) => s.configEvento)
  const [traslado, setTraslado] = useState(String(config.traslado))
  const [equipo, setEquipo] = useState(String(config.equipoHieloDesechables))
  const [horas, setHoras] = useState(String(config.horasMontaje))
  const [formaPago, setFormaPago] = useState<FormaPago>('transferencia')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const n = evento.lineas.reduce((a, l) => a + l.cantidad, 0)
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={onCerrar}>
      <div className="bg-bg rounded-t md:rounded p-5 w-full md:max-w-sm flex flex-col gap-3 text-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display m-0">Evento realizado</h2>
        <p className="text-muted m-0">
          Se registran como vendidas las {n} bebidas cotizadas y el cargo de servicio; se descuenta su inventario y estos costos entran al desglose del día.
        </p>
        {[
          ['Traslado real ($)', traslado, setTraslado],
          ['Equipo, hielo y desechables ($)', equipo, setEquipo],
          ['Horas de montaje', horas, setHoras],
        ].map(([etiqueta, valor, fijar]) => (
          <label key={etiqueta as string} className="flex justify-between items-center gap-2">
            {etiqueta as string}
            <input inputMode="decimal" className="w-24 h-10 border border-border rounded px-2 bg-surface text-right tabular" value={valor as string} onChange={(e) => (fijar as (v: string) => void)(e.target.value)} />
          </label>
        ))}
        <div className="grid grid-cols-3 gap-2">
          {(['efectivo', 'transferencia', 'tarjeta'] as FormaPago[]).map((f) => (
            <button key={f} onClick={() => setFormaPago(f)} className={`h-10 rounded border text-xs font-semibold capitalize ${formaPago === f ? 'bg-ink text-bg border-ink' : 'border-border'}`}>
              {f}
            </button>
          ))}
        </div>
        <button
          disabled={guardando}
          className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60"
          onClick={async () => {
            setGuardando(true)
            try {
              await registrarEventoRealizado(evento.id, { trasladoReal: Number(traslado) || 0, equipoReal: Number(equipo) || 0, horasMontaje: Number(horas) || 0, formaPago })
              onListo()
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e))
            } finally {
              setGuardando(false)
            }
          }}
        >
          {guardando ? 'Registrando…' : 'Registrar'}
        </button>
        {error && <p className="text-ink-dark m-0">{error}</p>}
      </div>
    </div>
  )
}
