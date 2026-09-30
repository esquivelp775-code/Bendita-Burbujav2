import { useEffect, useState } from 'react'
import { formatoFecha, formatoMoneda, formatoPorcentaje } from '../../lib/format'
import { inicioVentanaVentas, ventasDeRango, type EstadoStore } from '../../lib/store/remoteStore'
import { finDia, inicioDia, resumenDia } from '../../lib/store/selectors'
import { useStore } from '../../lib/store/useStore'
import { mensajeError } from '../../lib/errores'

type Resumen = ReturnType<typeof resumenDia>
type Ventas = Pick<EstadoStore, 'pedidos' | 'ventaLineas'>

const aTexto = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const deTexto = (t: string) => {
  const [y, m, d] = t.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Resumen de un día: de memoria si cae en la ventana (desde el lunes pasado); si no, lo pide a la base. */
function useResumenDia(fecha: Date): { resumen: Resumen | null; cargando: boolean; error: string | null } {
  const enVentana = fecha >= inicioVentanaVentas()
  const clave = aTexto(fecha)
  const [remotas, setRemotas] = useState<{ clave: string; ventas: Ventas } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (enVentana) return
    let vigente = true
    setError(null)
    ventasDeRango(inicioDia(fecha), finDia(fecha))
      .then((ventas) => vigente && setRemotas({ clave, ventas }))
      .catch((e) => vigente && setError(mensajeError(e)))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, enVentana])

  const ventas = remotas?.clave === clave ? remotas.ventas : null
  const resumen = useStore((s) => (enVentana ? resumenDia(s, fecha) : ventas ? resumenDia({ ...s, ...ventas }, fecha) : null))
  return { resumen, cargando: !enVentana && !ventas && !error, error }
}

function Fila({ etiqueta, valor, resaltar = false, detalle }: { etiqueta: string; valor: number; resaltar?: boolean; detalle?: string }) {
  return (
    <div className={`flex justify-between py-2 border-b border-border text-sm ${resaltar ? 'font-semibold' : ''}`}>
      <span>
        {etiqueta}
        {detalle && <span className="block text-xs text-muted font-normal">{detalle}</span>}
      </span>
      <span className="tabular">{formatoMoneda(valor)}</span>
    </div>
  )
}

function Cambio({ ahora, antes, moneda = true }: { ahora: number; antes: number; moneda?: boolean }) {
  const dif = ahora - antes
  if (Math.abs(dif) < 0.005) return <span className="text-muted">igual</span>
  const texto = moneda ? formatoMoneda(Math.abs(dif)) : String(Math.abs(dif))
  return <span className={dif > 0 ? 'text-ok' : 'text-ink-dark'}>{dif > 0 ? `+${texto}` : `−${texto}`}</span>
}

export function DesgloseScreen() {
  const [fechaTexto, setFechaTexto] = useState(aTexto(new Date()))
  const [agrupar, setAgrupar] = useState(false)
  const fecha = deTexto(fechaTexto)
  const semanaAntes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - 7, 12)
  const { resumen, cargando, error } = useResumenDia(fecha)
  const { resumen: anterior } = useResumenDia(semanaAntes)
  const canales = useStore((s) => s.canales)
  const esHoy = fechaTexto === aTexto(new Date())

  const mover = (dias: number) => setFechaTexto(aTexto(new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias, 12)))

  const encabezado = (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl m-0">Desglose del día</h1>
      <div className="flex items-center gap-2 flex-wrap">
        <button className="h-10 w-10 rounded border border-border" onClick={() => mover(-1)} aria-label="Día anterior">
          ←
        </button>
        <input
          type="date"
          aria-label="Fecha"
          className="h-10 border border-border rounded px-2 bg-surface"
          value={fechaTexto}
          max={aTexto(new Date())}
          onChange={(e) => e.target.value && setFechaTexto(e.target.value)}
        />
        <button className="h-10 w-10 rounded border border-border disabled:opacity-40" disabled={esHoy} onClick={() => mover(1)} aria-label="Día siguiente">
          →
        </button>
        {!esHoy && (
          <button className="text-sm underline" onClick={() => setFechaTexto(aTexto(new Date()))}>
            Hoy
          </button>
        )}
        <span className="text-sm text-muted">{formatoFecha(fecha)}</span>
      </div>
    </div>
  )

  if (error || cargando || !resumen) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-4">
        {encabezado}
        <p className={`text-sm ${error ? 'text-ink-dark' : 'text-muted'}`}>{error ? `No se pudieron leer las ventas de ese día: ${error}` : 'Cargando…'}</p>
      </div>
    )
  }

  const d = resumen.desglose
  const ventaLineas = resumen.lineas.reduce((a, l) => a + l.desglose.precio * l.cantidad, 0)
  const envioCobrado = d.venta - ventaLineas

  // Por bebida y tamaño (o agrupado por bebida)
  const grupos = new Map<string, { unidades: number; venta: number; ganancia: number }>()
  for (const l of resumen.lineas.filter((x) => x.tipo !== 'cargo_servicio')) {
    const nombre = l.tipo === 'botana' ? (l.botanaNombre ?? 'Botana') : agrupar ? (l.bebidaNombre ?? '') : `${l.bebidaNombre} ${l.tamanoNombre ?? ''}`
    const g = grupos.get(nombre) ?? { unidades: 0, venta: 0, ganancia: 0 }
    g.unidades += l.cantidad
    g.venta += l.desglose.precio * l.cantidad
    g.ganancia += l.desglose.utilidad * l.cantidad
    grupos.set(nombre, g)
  }
  const filas = [...grupos.entries()].sort((a, b) => b[1].ganancia - a[1].ganancia)
  const topUnidades = [...filas].sort((a, b) => b[1].unidades - a[1].unidades).slice(0, 5)

  // Plataformas: comisión, retenciones y depósito esperado
  const plataformas = canales
    .filter((c) => c.tipo === 'plataforma')
    .map((c) => {
      const ls = resumen.lineas.filter((l) => l.canalNombre === c.nombre)
      return {
        nombre: c.nombre,
        venta: ls.reduce((a, l) => a + l.desglose.precio * l.cantidad, 0),
        comision: ls.reduce((a, l) => a + (l.desglose.comision + l.desglose.ivaComision) * l.cantidad, 0),
        retenciones: ls.reduce((a, l) => a + (l.desglose.retencionIsr + l.desglose.retencionIva) * l.cantidad, 0),
        deposito: ls.reduce((a, l) => a + l.desglose.depositoEsperado * l.cantidad, 0),
      }
    })
    .filter((p) => p.venta > 0)

  // Bebidas por hora
  const porHora = new Map<number, number>()
  for (const l of resumen.lineas.filter((x) => x.tipo === 'bebida')) {
    const h = new Date(l.fechaHora).getHours()
    porHora.set(h, (porHora.get(h) ?? 0) + l.cantidad)
  }
  const horas = [...porHora.entries()].sort((a, b) => a[0] - b[0])
  const maxHora = Math.max(1, ...horas.map(([, n]) => n))

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto">
      {encabezado}

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-2">Cascada</h2>
        <Fila etiqueta="Venta" valor={d.venta} resaltar detalle={envioCobrado > 0.005 ? `incluye ${formatoMoneda(envioCobrado)} de envíos cobrados` : undefined} />
        <Fila etiqueta="− IVA" valor={-d.iva} />
        <Fila etiqueta="− Comisión" valor={-d.comision} />
        <Fila etiqueta="− Insumos" valor={-d.insumos} />
        <Fila etiqueta="− Empaque y vaso" valor={-d.empaqueYVaso} />
        <Fila etiqueta="− Indirectos" valor={-d.indirectos} />
        <Fila etiqueta="− Equipo (depreciación)" valor={-d.equipo} />
        <Fila etiqueta="− Costos de eventos" valor={-d.costosEvento} />
        <Fila etiqueta="− Envíos pagados" valor={-d.costoEnvios} />
        <Fila etiqueta="− Mano de obra" valor={-d.manoDeObra} detalle={d.moMontaje > 0 ? `incluye ${formatoMoneda(d.moMontaje)} de montaje de eventos` : undefined} />
        <Fila etiqueta="= Ganancia" valor={d.ganancia} resaltar />
        <Fila etiqueta="Te llevas (ganancia + mano de obra)" valor={d.teLlevas} resaltar />
        {d.venta > 0 && (
          <p className="text-xs text-muted mt-2 mb-0">
            Margen del día {formatoPorcentaje(d.ganancia / d.venta)} · {resumen.numeroBebidas} bebidas · ganancia por bebida{' '}
            {formatoMoneda(resumen.numeroBebidas ? d.ganancia / resumen.numeroBebidas : 0)}
          </p>
        )}
      </section>

      {anterior && (
        <section className="border border-border rounded p-4 bg-surface text-sm">
          <h2 className="text-sm label-uppercase mb-2">Contra el {formatoFecha(semanaAntes).toLowerCase()}</h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-muted">Venta</div>
              <div className="tabular">
                {formatoMoneda(d.venta)} <Cambio ahora={d.venta} antes={anterior.desglose.venta} />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Ganancia</div>
              <div className="tabular">
                {formatoMoneda(d.ganancia)} <Cambio ahora={d.ganancia} antes={anterior.desglose.ganancia} />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Bebidas</div>
              <div className="tabular">
                {resumen.numeroBebidas} <Cambio ahora={resumen.numeroBebidas} antes={anterior.numeroBebidas} moneda={false} />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-3">Por canal</h2>
        <div className="grid grid-cols-4 gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Canal</span>
          <span className="text-right">Venta</span>
          <span className="text-right">Te dejó</span>
          <span className="text-right">Pedidos</span>
        </div>
        {[...resumen.porCanal.entries()].map(([nombre, r]) => (
          <div key={nombre} className="grid grid-cols-4 gap-2 py-2 border-b border-border text-sm tabular">
            <span className="normal-case font-normal">{nombre}</span>
            <span className="text-right">{formatoMoneda(r.venta)}</span>
            <span className="text-right font-semibold text-ok">{formatoMoneda(r.ganancia)}</span>
            <span className="text-right text-muted">{r.pedidos}</span>
          </div>
        ))}
        {plataformas.length > 0 && (
          <div className="mt-3 flex flex-col gap-1 text-sm">
            <span className="text-xs label-uppercase">Depósitos esperados</span>
            {plataformas.map((p) => (
              <div key={p.nombre} className="flex justify-between gap-2">
                <span>
                  {p.nombre}
                  <span className="block text-xs text-muted">
                    comisión + IVA {formatoMoneda(p.comision)} · retenciones ISR/IVA {formatoMoneda(p.retenciones)}
                  </span>
                </span>
                <span className="tabular font-semibold">{formatoMoneda(p.deposito)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-border rounded p-4 bg-surface">
        <div className="flex justify-between items-center mb-3 gap-2">
          <h2 className="text-sm label-uppercase m-0">{agrupar ? 'Por bebida' : 'Por bebida y tamaño'}</h2>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={agrupar} onChange={(e) => setAgrupar(e.target.checked)} />
            Agrupar por bebida
          </label>
        </div>
        {filas.length === 0 && <p className="text-sm text-muted">No hubo ventas ese día.</p>}
        {filas.length > 0 && (
          <div className="grid grid-cols-[1fr_3rem_5rem_5rem] md:grid-cols-[1fr_4rem_6rem_6rem_4rem_6rem] gap-2 text-xs label-uppercase pb-2 border-b border-border">
            <span>Bebida</span>
            <span className="text-right">Unid.</span>
            <span className="text-right">Venta</span>
            <span className="text-right">Ganancia</span>
            <span className="hidden md:block text-right">Margen</span>
            <span className="hidden md:block text-right">Por bebida</span>
          </div>
        )}
        {filas.map(([nombre, r]) => (
          <div key={nombre} className="grid grid-cols-[1fr_3rem_5rem_5rem] md:grid-cols-[1fr_4rem_6rem_6rem_4rem_6rem] gap-2 py-2 border-b border-border text-sm tabular">
            <span className="normal-case font-normal min-w-0">{nombre}</span>
            <span className="text-right">{r.unidades}</span>
            <span className="text-right">{formatoMoneda(r.venta)}</span>
            <span className="text-right font-semibold text-ok">{formatoMoneda(r.ganancia)}</span>
            <span className="hidden md:block text-right text-muted">{r.venta > 0 ? formatoPorcentaje(r.ganancia / r.venta, 0) : '—'}</span>
            <span className="hidden md:block text-right text-muted">{formatoMoneda(r.ganancia / r.unidades)}</span>
          </div>
        ))}
      </section>

      {filas.length > 0 && (
        <section className="grid md:grid-cols-2 gap-4">
          <div className="border border-border rounded p-4 bg-surface text-sm">
            <h2 className="text-sm label-uppercase mb-2">Top 5 · más vendidas</h2>
            {topUnidades.map(([nombre, r], i) => (
              <div key={nombre} className="flex justify-between py-1">
                <span>
                  {i + 1}. {nombre}
                </span>
                <span className="tabular">{r.unidades}</span>
              </div>
            ))}
          </div>
          <div className="border border-border rounded p-4 bg-surface text-sm">
            <h2 className="text-sm label-uppercase mb-2">Top 5 · más ganancia</h2>
            {filas.slice(0, 5).map(([nombre, r], i) => (
              <div key={nombre} className="flex justify-between py-1">
                <span>
                  {i + 1}. {nombre}
                </span>
                <span className="tabular text-ok">{formatoMoneda(r.ganancia)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {horas.length > 0 && (
        <section className="border border-border rounded p-4 bg-surface text-sm">
          <h2 className="text-sm label-uppercase mb-2">Bebidas por hora</h2>
          {horas.map(([h, n]) => (
            <div key={h} className="flex items-center gap-2 py-0.5">
              <span className="w-12 tabular text-muted">{String(h).padStart(2, '0')}:00</span>
              <div className="flex-1 h-4 bg-card rounded overflow-hidden">
                <div className="h-full bg-ok" style={{ width: `${(n / maxHora) * 100}%` }} />
              </div>
              <span className="w-6 text-right tabular">{n}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
