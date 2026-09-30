import { useEffect, useState } from 'react'
import type { Bebida, Insumo, RecetaLinea } from '../../lib/calculos'
import { formatoCantidad } from '../../lib/format'
import { guardarPasos, guardarReceta } from '../../lib/store/remoteStore'
import { mensajeError } from '../../lib/errores'

interface Props {
  bebida: Bebida & { pasos: string[] }
  insumos: Record<string, Insumo>
}

type LineaEdicion = RecetaLinea & { cantidadTexto: string }

/**
 * Receta y pasos de una bebida, con edición en el lugar (v3 §4: ajustar los gramos del matcha sin
 * fricción). Guardar reemplaza la receta completa; las ventas ya registradas conservan su costo.
 */
export function RecetaEditor({ bebida, insumos }: Props) {
  const [editando, setEditando] = useState(false)
  const [lineas, setLineas] = useState<LineaEdicion[]>([])
  const [pasos, setPasos] = useState<string[]>([])
  const [nuevoInsumo, setNuevoInsumo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)

  useEffect(() => {
    setEditando(false)
    setMensaje(null)
  }, [bebida.nombre])

  function empezar() {
    setLineas(bebida.receta.map((l) => ({ ...l, cantidadTexto: String(l.cantidad) })))
    setPasos(bebida.pasos.length ? [...bebida.pasos] : [''])
    setMensaje(null)
    setEditando(true)
  }

  const unidadDe = (clave: string) => {
    const u = insumos[clave]?.unidad
    return u === 'pieza' ? 'pza' : u ?? ''
  }

  const invalida = lineas.some((l) => !(Number(l.cantidadTexto.replace(',', '.')) > 0))

  async function guardar() {
    setGuardando(true)
    try {
      await guardarReceta(
        bebida.nombre,
        lineas.map(({ cantidadTexto, ...l }) => ({ ...l, cantidad: Number(cantidadTexto.replace(',', '.')) })),
      )
      await guardarPasos(bebida.nombre, pasos)
      setEditando(false)
      setMensaje({ ok: true, texto: 'Receta guardada. Los márgenes y sugeridos ya usan las cantidades nuevas; las ventas pasadas no cambian.' })
    } catch (e) {
      setMensaje({ ok: false, texto: mensajeError(e) })
    } finally {
      setGuardando(false)
    }
  }

  const disponibles = Object.values(insumos)
    .filter((i) => !lineas.some((l) => l.insumoClave === i.clave))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  if (!editando) {
    return (
      <div className="border border-border rounded p-4 bg-surface flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm label-uppercase m-0">Receta (base 14 oz)</h3>
          <button className="text-sm font-semibold underline" onClick={empezar}>
            Editar
          </button>
        </div>
        <ul className="text-sm flex flex-col gap-1 m-0 p-0 list-none">
          {bebida.receta.map((r, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span>
                {insumos[r.insumoClave]?.nombre ?? r.insumoClave}
                {r.esLeche && <span className="text-xs text-muted"> · cambia por la leche elegida</span>}
              </span>
              <span className="text-muted tabular text-right">
                {formatoCantidad(r.cantidad, insumos[r.insumoClave]?.unidad)}
                {r.escalaConTamano && <span className="block text-xs">escala con tamaño</span>}
              </span>
            </li>
          ))}
        </ul>
        <div>
          <h3 className="text-sm label-uppercase mb-1">Preparación</h3>
          {bebida.pasos.length === 0 ? (
            <p className="text-sm text-muted m-0">Sin pasos capturados.</p>
          ) : (
            <ol className="text-sm m-0 pl-5 flex flex-col gap-1">
              {bebida.pasos.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          )}
        </div>
        {mensaje && <p className={`text-sm m-0 ${mensaje.ok ? 'text-ok' : 'text-ink-dark'}`}>{mensaje.texto}</p>}
      </div>
    )
  }

  return (
    <div className="border border-ink rounded p-4 bg-surface flex flex-col gap-3">
      <h3 className="text-sm label-uppercase m-0">Editar receta · {bebida.nombre}</h3>
      <p className="text-xs text-muted m-0">Cantidades del tamaño base (14 oz). "Escala" las multiplica por el factor de cada tamaño.</p>
      {lineas.map((l, idx) => (
        <div key={l.insumoClave} className="grid grid-cols-[1fr_6rem_auto] gap-2 items-center text-sm border-b border-border pb-2">
          <span className="min-w-0">
            {insumos[l.insumoClave]?.nombre ?? l.insumoClave}
            <label className="flex items-center gap-1 text-xs text-muted mt-0.5">
              <input
                type="checkbox"
                checked={l.escalaConTamano}
                onChange={(e) => setLineas((ls) => ls.map((x, i) => (i === idx ? { ...x, escalaConTamano: e.target.checked } : x)))}
              />
              escala con tamaño
            </label>
          </span>
          <span className="flex items-center gap-1">
            <input
              inputMode="decimal"
              className={`h-9 w-full border rounded px-2 bg-bg text-right tabular ${Number(l.cantidadTexto.replace(',', '.')) > 0 ? 'border-border' : 'border-ink-dark'}`}
              value={l.cantidadTexto}
              onChange={(e) => setLineas((ls) => ls.map((x, i) => (i === idx ? { ...x, cantidadTexto: e.target.value } : x)))}
            />
            <span className="text-xs text-muted w-6">{unidadDe(l.insumoClave)}</span>
          </span>
          <button className="text-muted text-lg px-1" onClick={() => setLineas((ls) => ls.filter((_, i) => i !== idx))} aria-label={`Quitar ${insumos[l.insumoClave]?.nombre}`}>
            ×
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <select className="h-10 flex-1 min-w-0 border border-border rounded px-2 bg-bg text-sm" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)}>
          <option value="">Agregar insumo…</option>
          {disponibles.map((i) => (
            <option key={i.clave} value={i.clave}>
              {i.nombre}
            </option>
          ))}
        </select>
        <button
          disabled={!nuevoInsumo}
          className="h-10 px-4 rounded border border-border text-sm font-semibold disabled:opacity-50"
          onClick={() => {
            setLineas((ls) => [...ls, { insumoClave: nuevoInsumo, cantidad: 1, cantidadTexto: '1', escalaConTamano: insumos[nuevoInsumo]?.unidad !== 'pieza', esLeche: false }])
            setNuevoInsumo('')
          }}
        >
          Agregar
        </button>
      </div>

      <h3 className="text-sm label-uppercase mt-2 mb-0">Preparación</h3>
      {pasos.map((p, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-sm text-muted w-5 pt-2 text-right">{i + 1}.</span>
          <textarea
            className="flex-1 min-h-[2.5rem] border border-border rounded px-2 py-1.5 bg-bg text-sm"
            rows={2}
            value={p}
            onChange={(e) => setPasos((ps) => ps.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button className="text-muted text-lg px-1" onClick={() => setPasos((ps) => ps.filter((_, j) => j !== i))} aria-label={`Quitar paso ${i + 1}`}>
            ×
          </button>
        </div>
      ))}
      <button className="text-sm underline self-start" onClick={() => setPasos((ps) => [...ps, ''])}>
        + Agregar paso
      </button>

      <div className="flex gap-2">
        <button disabled={guardando || invalida || lineas.length === 0} className="h-11 flex-1 rounded bg-ink text-bg font-semibold disabled:opacity-50" onClick={guardar}>
          {guardando ? 'Guardando…' : 'Guardar receta'}
        </button>
        <button className="h-11 px-4 rounded border border-border" onClick={() => setEditando(false)}>
          Cancelar
        </button>
      </div>
      {invalida && <p className="text-xs text-ink-dark m-0">Cada cantidad debe ser mayor a 0.</p>}
      {mensaje && !mensaje.ok && <p className="text-sm text-ink-dark m-0">No se guardó: {mensaje.texto}</p>}
    </div>
  )
}
