import { useState } from 'react'
import { activoEnUso } from '../../lib/calculos'
import { formatoMoneda } from '../../lib/format'
import { actualizarActivo, altaActivo, type ActivoStore } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

const hoyTexto = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Borrador = Omit<ActivoStore, 'id'>

const vacio = (): Borrador => ({ nombre: '', tipo: 'equipo', costoNeto: 0, valorRescate: 0, vidaUtilMeses: 12, fechaAlta: hoyTexto(), ivaAcreditable: 0, notas: '' })

function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {etiqueta}
      {children}
      {ayuda && <span className="text-xs text-muted">{ayuda}</span>}
    </label>
  )
}

const claseInput = 'h-11 border border-border rounded px-3 bg-bg w-full min-w-0'

function FormularioActivo({ inicial, textoBoton, onGuardar }: { inicial: Borrador; textoBoton: string; onGuardar: (b: Borrador) => Promise<unknown> }) {
  const [b, setB] = useState<Borrador>(inicial)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const cambiar = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setB((x) => ({ ...x, [k]: v }))
  const num = (v: string) => (v === '' ? 0 : Number(v))

  async function guardar() {
    if (!b.nombre.trim()) return setError('Ponle nombre')
    if (!(b.costoNeto > 0)) return setError('El costo debe ser mayor a 0')
    if (!(b.vidaUtilMeses > 0)) return setError('La vida útil debe ser de al menos 1 mes')
    if (b.valorRescate > b.costoNeto) return setError('El valor de rescate no puede ser mayor al costo')
    setGuardando(true)
    try {
      await onGuardar({ ...b, nombre: b.nombre.trim(), notas: b.notas?.trim() || undefined })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Campo etiqueta="Nombre">
        <input className={claseInput} value={b.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Tipo">
          <select className={claseInput} value={b.tipo} onChange={(e) => cambiar('tipo', e.target.value as Borrador['tipo'])}>
            <option value="equipo">Equipo</option>
            <option value="mobiliario">Mobiliario</option>
          </select>
        </Campo>
        <Campo etiqueta="Fecha de alta">
          <input type="date" className={claseInput} value={b.fechaAlta} onChange={(e) => cambiar('fechaAlta', e.target.value)} />
        </Campo>
        <Campo etiqueta="Costo sin IVA ($)">
          <input type="number" inputMode="decimal" className={claseInput} value={b.costoNeto || ''} onChange={(e) => cambiar('costoNeto', num(e.target.value))} />
        </Campo>
        <Campo etiqueta="IVA acreditable ($)" ayuda="Sólo si tienes factura">
          <input type="number" inputMode="decimal" className={claseInput} value={b.ivaAcreditable || ''} onChange={(e) => cambiar('ivaAcreditable', num(e.target.value))} />
        </Campo>
        <Campo etiqueta="Vida útil (meses)">
          <input type="number" inputMode="numeric" className={claseInput} value={b.vidaUtilMeses || ''} onChange={(e) => cambiar('vidaUtilMeses', num(e.target.value))} />
        </Campo>
        <Campo etiqueta="Valor de rescate ($)" ayuda="Lo que valdría al final">
          <input type="number" inputMode="decimal" className={claseInput} value={b.valorRescate || ''} onChange={(e) => cambiar('valorRescate', num(e.target.value))} />
        </Campo>
      </div>
      <Campo etiqueta="Notas (opcional)">
        <input className={claseInput} value={b.notas ?? ''} onChange={(e) => cambiar('notas', e.target.value)} />
      </Campo>
      {b.costoNeto > 0 && b.vidaUtilMeses > 0 && (
        <p className="text-sm text-muted m-0">
          Depreciación: {formatoMoneda((b.costoNeto - b.valorRescate) / b.vidaUtilMeses)}/mes · {formatoMoneda((b.costoNeto - b.valorRescate) / b.vidaUtilMeses / 30.4)}/día
        </p>
      )}
      <button disabled={guardando} className="h-11 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={guardar}>
        {guardando ? 'Guardando…' : textoBoton}
      </button>
      {error && <p className="text-sm text-ink-dark m-0">{error}</p>}
    </div>
  )
}

export function EquipoScreen() {
  const activos = useStore((s) => s.activos)
  const [formKey, setFormKey] = useState(0)
  const [editando, setEditando] = useState<ActivoStore | null>(null)
  const [dandoDeBaja, setDandoDeBaja] = useState<ActivoStore | null>(null)
  const [fechaBaja, setFechaBaja] = useState(hoyTexto())
  const [mensaje, setMensaje] = useState<string | null>(null)
  const hoy = new Date()

  const enUso = activos.filter((a) => activoEnUso(a, hoy))
  const totalMes = enUso.reduce((acc, a) => acc + (a.costoNeto - a.valorRescate) / a.vidaUtilMeses, 0)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl">Equipo y mobiliario</h1>

      <section className="border border-border rounded p-4 bg-surface flex flex-col gap-3">
        <h2 className="text-sm label-uppercase m-0">Dar de alta</h2>
        <FormularioActivo
          key={formKey}
          inicial={vacio()}
          textoBoton="Agregar"
          onGuardar={async (b) => {
            await altaActivo(b)
            setFormKey((k) => k + 1)
            setMensaje(`${b.nombre} agregado.`)
          }}
        />
        {mensaje && <p className="text-sm text-ok m-0">{mensaje}</p>}
      </section>

      <section className="border border-border rounded p-4 bg-surface">
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="text-sm label-uppercase m-0">Depreciación mensual</h2>
          <span className="text-sm tabular">
            {formatoMoneda(totalMes)}/mes · {formatoMoneda(totalMes / 30.4)}/día
          </span>
        </div>
        {activos.length === 0 && <p className="text-sm text-muted">Sin activos capturados todavía.</p>}
        {activos.map((a) => {
          const usa = activoEnUso(a, hoy)
          return (
            <div key={a.id} className={`flex justify-between items-start gap-3 py-2 border-b border-border text-sm ${usa ? '' : 'opacity-60'}`}>
              <div className="min-w-0">
                <div>{a.nombre}</div>
                <div className="text-xs text-muted">
                  {a.tipo === 'equipo' ? 'Equipo' : 'Mobiliario'} · alta {a.fechaAlta} · {a.vidaUtilMeses} meses
                  {a.fechaBaja ? ` · baja ${a.fechaBaja}` : !usa ? ' · ya cumplió su vida útil' : ''}
                </div>
                <div className="flex gap-3 mt-1">
                  <button className="text-xs underline" onClick={() => setEditando(a)}>
                    Editar
                  </button>
                  {a.fechaBaja ? (
                    <button className="text-xs underline" onClick={() => void actualizarActivo(a.id, { fechaBaja: null })}>
                      Quitar baja
                    </button>
                  ) : (
                    <button className="text-xs underline text-ink-dark" onClick={() => setDandoDeBaja(a)}>
                      Dar de baja
                    </button>
                  )}
                </div>
              </div>
              <span className="tabular text-muted whitespace-nowrap">{formatoMoneda((a.costoNeto - a.valorRescate) / a.vidaUtilMeses)}/mes</span>
            </div>
          )
        })}
      </section>

      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={() => setEditando(null)}>
          <div className="bg-bg rounded-t md:rounded p-5 w-full md:max-w-lg max-h-[90vh] overflow-y-auto flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-display m-0">Editar · {editando.nombre}</h2>
              <button className="text-muted text-xl px-2" onClick={() => setEditando(null)} aria-label="Cerrar">
                ×
              </button>
            </div>
            <FormularioActivo
              inicial={{ ...editando }}
              textoBoton="Guardar cambios"
              onGuardar={async (b) => {
                await actualizarActivo(editando.id, b)
                setEditando(null)
              }}
            />
          </div>
        </div>
      )}

      {dandoDeBaja && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={() => setDandoDeBaja(null)}>
          <div className="bg-bg rounded-t md:rounded p-5 w-full md:max-w-sm flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display m-0">Dar de baja · {dandoDeBaja.nombre}</h2>
            <p className="text-sm text-muted m-0">No se borra: deja de contar en el equipo del día desde esta fecha.</p>
            <label className="flex flex-col gap-1 text-sm">
              Fecha de baja
              <input type="date" className={claseInput} value={fechaBaja} onChange={(e) => setFechaBaja(e.target.value)} />
            </label>
            <button
              className="h-11 rounded bg-ink text-bg font-semibold"
              onClick={() => void actualizarActivo(dandoDeBaja.id, { fechaBaja }).then(() => setDandoDeBaja(null))}
            >
              Dar de baja
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
