import { useEffect, useMemo, useState } from 'react'
import { formatoCantidad, formatoMoneda } from '../../lib/format'
import { mensajeError } from '../../lib/errores'
import { cargarInventarios, cargarMermas, registrarMerma, type MermaRegistrada } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

const MOTIVOS = ['Se cayó / se derramó', 'Se echó a perder', 'Caducó', 'Cortesía', 'Prueba de receta', 'Otro']

type Rango = 'inventario' | 'semana' | 'mes'

export function Mermas() {
  const insumos = useStore((s) => s.insumos)
  const [rango, setRango] = useState<Rango>('inventario')
  const [desdeInventario, setDesdeInventario] = useState<{ fecha: Date; variacion: number } | null>(null)
  const [mermas, setMermas] = useState<MermaRegistrada[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    cargarInventarios(1)
      .then(([ultimo]) => setDesdeInventario(ultimo ? { fecha: new Date(ultimo.creadoEn), variacion: ultimo.valorDiferencia } : null))
      .catch(() => setDesdeInventario(null))
  }, [recarga])

  const desde = useMemo(() => {
    const hoy = new Date()
    if (rango === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    if (rango === 'semana' || !desdeInventario) {
      const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      lunes.setDate(lunes.getDate() + (lunes.getDay() === 0 ? -6 : 1 - lunes.getDay()))
      return lunes
    }
    return desdeInventario.fecha
  }, [rango, desdeInventario])

  useEffect(() => {
    let vigente = true
    setMermas(null)
    cargarMermas(desde, new Date())
      .then((m) => vigente && setMermas(m))
      .catch((e) => vigente && setError(mensajeError(e)))
    return () => {
      vigente = false
    }
  }, [desde, recarga])

  const total = (mermas ?? []).reduce((a, m) => a + m.costo, 0)
  const porMotivo = new Map<string, number>()
  const porInsumo = new Map<string, { cantidad: number; costo: number }>()
  for (const m of mermas ?? []) {
    const motivo = m.motivo.split(':')[0]
    porMotivo.set(motivo, (porMotivo.get(motivo) ?? 0) + m.costo)
    const i = porInsumo.get(m.insumoClave) ?? { cantidad: 0, costo: 0 }
    i.cantidad += m.cantidad
    i.costo += m.costo
    porInsumo.set(m.insumoClave, i)
  }

  return (
    <div className="flex flex-col gap-4">
      <RegistrarMerma onRegistrada={() => setRecarga((n) => n + 1)} />

      <div className="flex gap-2 flex-wrap text-sm">
        {(
          [
            ['inventario', desdeInventario ? 'Desde el último inventario' : 'Esta semana'],
            ['semana', 'Esta semana'],
            ['mes', 'Este mes'],
          ] as [Rango, string][]
        )
          .filter(([id], i, arr) => !(id === 'semana' && !desdeInventario && arr[0][1] === 'Esta semana'))
          .map(([id, nombre]) => (
            <button key={id} onClick={() => setRango(id)} className={`h-9 px-3 rounded border font-semibold ${rango === id ? 'bg-ink text-bg border-ink' : 'border-border'}`}>
              {nombre}
            </button>
          ))}
      </div>

      {error && <p className="text-sm text-ink-dark">No se pudieron leer las mermas: {error}</p>}
      {!mermas && !error && <p className="text-sm text-muted">Cargando…</p>}
      {mermas && (
        <>
          <section className="border border-border rounded p-4 bg-surface grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <div className="label-uppercase">Mermas registradas</div>
              <div className="tabular font-semibold text-lg">{formatoMoneda(total)}</div>
              <div className="text-xs text-muted">{mermas.length} registros</div>
            </div>
            <div>
              <div className="label-uppercase">No registrada (último inventario)</div>
              <div className={`tabular font-semibold text-lg ${desdeInventario && desdeInventario.variacion < -0.005 ? 'text-ink-dark' : ''}`}>
                {desdeInventario ? formatoMoneda(-Math.min(0, desdeInventario.variacion)) : '—'}
              </div>
              <div className="text-xs text-muted">{desdeInventario ? 'lo que faltó al contar' : 'haz tu primer inventario semanal'}</div>
            </div>
          </section>

          {porMotivo.size > 0 && (
            <section className="border border-border rounded p-4 bg-surface text-sm">
              <h2 className="text-sm label-uppercase mb-2">Por motivo</h2>
              {[...porMotivo.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([motivo, costo]) => (
                  <div key={motivo} className="flex items-center gap-2 py-1">
                    <span className="w-40 min-w-0">{motivo}</span>
                    <div className="flex-1 h-3 bg-card rounded overflow-hidden">
                      <div className="h-full bg-warn" style={{ width: `${(costo / Math.max(total, 0.01)) * 100}%` }} />
                    </div>
                    <span className="w-20 text-right tabular">{formatoMoneda(costo)}</span>
                  </div>
                ))}
            </section>
          )}

          {porInsumo.size > 0 && (
            <section className="border border-border rounded p-4 bg-surface text-sm">
              <h2 className="text-sm label-uppercase mb-2">Por insumo</h2>
              {[...porInsumo.entries()]
                .sort((a, b) => b[1].costo - a[1].costo)
                .map(([clave, v]) => (
                  <div key={clave} className="flex justify-between py-1 border-b border-border tabular">
                    <span>{insumos[clave]?.nombre ?? clave}</span>
                    <span>
                      {formatoCantidad(v.cantidad, insumos[clave]?.unidad)} · {formatoMoneda(v.costo)}
                    </span>
                  </div>
                ))}
            </section>
          )}

          <section className="border border-border rounded p-4 bg-surface text-sm">
            <h2 className="text-sm label-uppercase mb-2">Detalle</h2>
            {mermas.length === 0 && <p className="text-muted m-0">Sin mermas registradas en este periodo.</p>}
            {mermas.map((m, i) => (
              <div key={i} className="flex justify-between gap-2 py-1.5 border-b border-border">
                <span className="min-w-0">
                  {insumos[m.insumoClave]?.nombre ?? m.insumoClave}
                  <span className="block text-xs text-muted">
                    {new Date(m.fecha).toLocaleString('es-MX', { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {m.motivo}
                  </span>
                </span>
                <span className="text-right tabular whitespace-nowrap">
                  {formatoCantidad(m.cantidad, insumos[m.insumoClave]?.unidad)}
                  <span className="block text-xs text-muted">{formatoMoneda(m.costo)}</span>
                </span>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}

function RegistrarMerma({ onRegistrada }: { onRegistrada: () => void }) {
  const insumos = useStore((s) => Object.values(s.insumos).sort((a, b) => a.nombre.localeCompare(b.nombre)))
  const [abierto, setAbierto] = useState(false)
  const [clave, setClave] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const [detalle, setDetalle] = useState('')
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const insumo = insumos.find((i) => i.clave === clave)

  if (!abierto)
    return (
      <button className="h-12 rounded bg-ink text-bg font-semibold" onClick={() => setAbierto(true)}>
        Registrar merma
      </button>
    )

  async function guardar() {
    const n = Number(cantidad.replace(',', '.'))
    if (!clave) return setMensaje({ ok: false, texto: 'Elige el insumo' })
    if (!(n > 0)) return setMensaje({ ok: false, texto: 'Escribe cuánto se perdió' })
    setGuardando(true)
    try {
      await registrarMerma(clave, n, detalle.trim() ? `${motivo}: ${detalle.trim()}` : motivo)
      setMensaje({ ok: true, texto: `Merma registrada: ${formatoCantidad(n, insumo?.unidad)} de ${insumo?.nombre}.` })
      setCantidad('')
      setDetalle('')
      onRegistrada()
    } catch (e) {
      setMensaje({ ok: false, texto: mensajeError(e) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="border border-ink rounded p-4 bg-surface flex flex-col gap-3 text-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-sm label-uppercase m-0">Registrar merma</h2>
        <button className="text-muted text-xl px-2" onClick={() => setAbierto(false)} aria-label="Cerrar">
          ×
        </button>
      </div>
      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <label className="flex flex-col gap-1">
          Insumo
          <select className="h-11 border border-border rounded px-2 bg-bg" value={clave} onChange={(e) => setClave(e.target.value)}>
            <option value="">Elige…</option>
            {insumos.map((i) => (
              <option key={i.clave} value={i.clave}>
                {i.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Cantidad {insumo?.unidad ? `(${insumo.unidad === 'pieza' ? 'pza' : insumo.unidad})` : ''}
          <input inputMode="decimal" className="h-11 border border-border rounded px-2 bg-bg text-right tabular" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {MOTIVOS.map((m) => (
          <button key={m} onClick={() => setMotivo(m)} className={`h-9 px-3 rounded border text-xs font-semibold ${motivo === m ? 'bg-ink text-bg border-ink' : 'border-border'}`}>
            {m}
          </button>
        ))}
      </div>
      <input className="h-10 border border-border rounded px-2 bg-bg" placeholder="Detalle (opcional)" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
      <button disabled={guardando} className="h-11 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={guardar}>
        {guardando ? 'Guardando…' : 'Guardar merma'}
      </button>
      {mensaje && <p className={`m-0 ${mensaje.ok ? 'text-ok' : 'text-ink-dark'}`}>{mensaje.texto}</p>}
    </section>
  )
}
