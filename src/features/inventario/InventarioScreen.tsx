import { useState } from 'react'
import { cantidadSugeridaCompra, umbralReorden } from '../../lib/calculos'
import { formatoMoneda } from '../../lib/format'
import { existenciaInsumo, registrarConteoLocal } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2 } as const

export function InventarioScreen() {
  const insumos = useStore((s) => Object.values(s.insumos))
  const parametros = useStore((s) => s.parametros)
  const [conteoAbierto, setConteoAbierto] = useState<string | null>(null)

  const filas = insumos
    .map((i) => {
      const existencia = existenciaInsumo(i.clave)
      const umbral = umbralReorden(i, parametros)
      const stockObjetivo = i.stockObjetivo ?? null
      const enAlerta = stockObjetivo != null && existencia <= umbral * stockObjetivo
      const agotado = existencia <= 0
      return { insumo: i, existencia, umbral, stockObjetivo, enAlerta, agotado }
    })
    .sort((a, b) => PRIORIDAD_ORDEN[a.insumo.prioridad ?? 'media'] - PRIORIDAD_ORDEN[b.insumo.prioridad ?? 'media'])

  const conCompra = filas.filter((f) => f.enAlerta || f.agotado)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-3xl">Inventario</h1>

      {conCompra.length > 0 && (
        <section className="border border-warn rounded p-4 bg-surface">
          <h2 className="text-sm label-uppercase mb-3 text-warn">Lista de compras</h2>
          {conCompra.map((f) => {
            const cantidad =
              f.stockObjetivo != null ? cantidadSugeridaCompra({ stockObjetivo: f.stockObjetivo, existencia: f.existencia, contenidoUtilPorPresentacion: 1 }) : 0
            return (
              <div key={f.insumo.clave} className="flex justify-between py-2 border-b border-border text-sm">
                <span>{f.insumo.nombre}</span>
                <span className="text-warn tabular">{f.agotado ? 'Agotado' : `Reponer · faltan ${cantidad.toFixed(0)}`}</span>
              </div>
            )
          })}
        </section>
      )}

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-3">Existencia</h2>
        <div className="grid grid-cols-5 gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Insumo</span>
          <span>Prioridad</span>
          <span className="text-right">Existencia</span>
          <span className="text-right">Objetivo</span>
          <span></span>
        </div>
        {filas.map((f) => (
          <div key={f.insumo.clave} className="grid grid-cols-5 gap-2 items-center py-2 border-b border-border text-sm">
            <span className="normal-case font-normal">{f.insumo.nombre}</span>
            <span className="label-uppercase text-xs">{f.insumo.prioridad}</span>
            <span className={`text-right tabular ${f.agotado ? 'text-ink-dark font-semibold' : f.enAlerta ? 'text-warn font-semibold' : ''}`}>
              {f.existencia.toFixed(1)}
            </span>
            <span className="text-right tabular text-muted">{f.stockObjetivo != null ? f.stockObjetivo.toFixed(0) : '—'}</span>
            <button className="text-right text-xs font-semibold underline" onClick={() => setConteoAbierto(f.insumo.clave)}>
              Contar
            </button>
          </div>
        ))}
      </section>

      {conteoAbierto && (
        <ModalConteo
          insumoClave={conteoAbierto}
          existencia={existenciaInsumo(conteoAbierto)}
          onCerrar={() => setConteoAbierto(null)}
        />
      )}
    </div>
  )
}

function ModalConteo({ insumoClave, existencia, onCerrar }: { insumoClave: string; existencia: number; onCerrar: () => void }) {
  const [valor, setValor] = useState(existencia)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nombre = useStore((s) => s.insumos[insumoClave]?.nombre)

  async function guardar() {
    setGuardando(true)
    try {
      await registrarConteoLocal(insumoClave, valor, 'Conteo manual')
      onCerrar()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCerrar}>
      <div className="bg-bg rounded p-5 w-full max-w-sm flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display m-0">Conteo físico · {nombre}</h2>
        <p className="text-sm text-muted">Sistema dice: {formatoMoneda(existencia).replace('$', '')} unidades</p>
        <input
          type="number"
          className="h-12 border border-border rounded px-3 bg-surface text-lg"
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
        />
        <button disabled={guardando} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={guardar}>
          {guardando ? 'Guardando…' : 'Guardar conteo'}
        </button>
        {error && <p className="text-sm text-ink-dark">{error}</p>}
      </div>
    </div>
  )
}
