import { useState } from 'react'
import { formatoMoneda } from '../../lib/format'
import { altaActivo } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

export function EquipoScreen() {
  const activos = useStore((s) => s.activos)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'mobiliario' | 'equipo'>('equipo')
  const [costoNeto, setCostoNeto] = useState(0)
  const [vidaUtilMeses, setVidaUtilMeses] = useState(36)
  const [valorRescate, setValorRescate] = useState(0)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl">Equipo y mobiliario</h1>

      <section className="border border-border rounded p-4 bg-surface flex flex-col gap-3">
        <h2 className="text-sm label-uppercase">Dar de alta</h2>
        <input className="h-11 border border-border rounded px-3 bg-bg" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <select className="h-11 border border-border rounded px-3 bg-bg" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
            <option value="equipo">Equipo</option>
            <option value="mobiliario">Mobiliario</option>
          </select>
          <input
            type="number"
            className="h-11 border border-border rounded px-3 bg-bg"
            placeholder="Costo neto"
            value={costoNeto}
            onChange={(e) => setCostoNeto(Number(e.target.value))}
          />
          <input
            type="number"
            className="h-11 border border-border rounded px-3 bg-bg"
            placeholder="Vida útil (meses)"
            value={vidaUtilMeses}
            onChange={(e) => setVidaUtilMeses(Number(e.target.value))}
          />
          <input
            type="number"
            className="h-11 border border-border rounded px-3 bg-bg"
            placeholder="Valor de rescate"
            value={valorRescate}
            onChange={(e) => setValorRescate(Number(e.target.value))}
          />
        </div>
        <button
          className="h-11 rounded bg-ink text-bg font-semibold"
          onClick={async () => {
            if (!nombre) return
            try {
              await altaActivo({ nombre, tipo, costoNeto, valorRescate, vidaUtilMeses, fechaAlta: new Date().toISOString().slice(0, 10) })
              setNombre('')
              setCostoNeto(0)
              setError(null)
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e))
            }
          }}
        >
          Agregar
        </button>
        {error && <p className="text-sm text-ink-dark">{error}</p>}
      </section>

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-2">Depreciación mensual</h2>
        {activos.length === 0 && <p className="text-sm text-muted">Sin activos capturados todavía.</p>}
        {activos.map((a) => (
          <div key={a.id} className="flex justify-between py-2 border-b border-border text-sm">
            <span>{a.nombre}</span>
            <span className="tabular text-muted">{formatoMoneda((a.costoNeto - a.valorRescate) / a.vidaUtilMeses)}/mes</span>
          </div>
        ))}
      </section>
    </div>
  )
}
