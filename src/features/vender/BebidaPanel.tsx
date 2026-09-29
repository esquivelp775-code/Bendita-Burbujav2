import { useMemo, useState } from 'react'
import { adicionalAplica, tamanosVendibles, type AdicionalElegido, type Bebida } from '../../lib/calculos'
import { formatoMoneda } from '../../lib/format'
import { calcularDesgloseItem, existenciaInsumo, type ItemCarrito } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

interface Props {
  bebida: Bebida
  canalNombre: string
  factorEvento?: number
  onAgregar: (item: ItemCarrito) => void
  onCerrar: () => void
}

export function BebidaPanel({ bebida, canalNombre, factorEvento, onAgregar, onCerrar }: Props) {
  const tamanos = useStore((s) =>
    tamanosVendibles(
      Object.values(s.tamanos)
        .filter((t) => t.activo)
        .sort((a, b) => a.ml - b.ml),
      canalNombre,
      s.insumos,
      existenciaInsumo,
    ),
  )
  const leches = useStore((s) => Object.values(s.leches))
  const adicionalesCatalogo = useStore((s) => s.adicionales)
  const ultimoTamano = useStore((s) => s.ultimoTamano)
  const ultimaLeche = useStore((s) => s.ultimaLeche)

  const [tamanoNombre, setTamanoNombre] = useState(
    () => tamanos.find((t) => t.nombre === ultimoTamano)?.nombre ?? tamanos[0]?.nombre,
  )
  const lecheDefault = leches.find((l) => l.nombre === ultimaLeche) ?? leches.find((l) => l.esDefault)
  const [lecheNombre, setLecheNombre] = useState(() => lecheDefault?.nombre)
  const [adicionalesElegidos, setAdicionalesElegidos] = useState<AdicionalElegido[]>([])
  const [cantidad, setCantidad] = useState(1)

  const adicionalesDisponibles = useMemo(
    () => Object.values(adicionalesCatalogo).filter((a) => a.activo && adicionalAplica(a, bebida, canalNombre)),
    [adicionalesCatalogo, bebida, canalNombre],
  )

  const tamano = tamanos.find((t) => t.nombre === tamanoNombre)
  const leche = bebida.llevaLeche ? leches.find((l) => l.nombre === lecheNombre) : undefined

  function toggleAdicional(nombre: string) {
    setAdicionalesElegidos((prev) => {
      const existe = prev.find((a) => a.nombre === nombre)
      if (existe) return prev.filter((a) => a.nombre !== nombre)
      return [...prev, { nombre }]
    })
  }

  function setSabor(nombre: string, sabor: string) {
    setAdicionalesElegidos((prev) => prev.map((a) => (a.nombre === nombre ? { ...a, sabor } : a)))
  }

  function saboresDe(nombre: string): string[] {
    const a = adicionalesCatalogo[nombre]
    if (a.saboresPorCategoria) return Object.keys(a.saboresPorCategoria[bebida.categoriaNombre] ?? {})
    if (a.sabores) return Object.keys(a.sabores)
    return []
  }

  let desglose: ReturnType<typeof calcularDesgloseItem> | null = null
  let error: string | null = null
  if (tamano) {
    try {
      desglose = calcularDesgloseItem(canalNombre, {
        fechaHora: new Date(),
        bebida,
        tamano,
        lecheElegida: leche,
        adicionalesElegidos,
        factorEvento,
      })
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  const puedeAgregar = !!tamano && !!desglose && !error && (!bebida.llevaLeche || !!leche)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={onCerrar}>
      <div
        className="bg-bg w-full md:max-w-lg md:rounded max-h-[90vh] overflow-y-auto p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-2xl m-0">{bebida.nombre}</h2>
          <button onClick={onCerrar} className="text-muted text-xl leading-none px-2" aria-label="Cerrar">
            ×
          </button>
        </div>

        <div>
          <div className="label-uppercase mb-1">Tamaño</div>
          <div className="flex gap-2 flex-wrap">
            {tamanos.map((t) => (
              <button
                key={t.nombre}
                onClick={() => setTamanoNombre(t.nombre)}
                className={`h-10 px-4 rounded border text-sm font-semibold ${
                  t.nombre === tamanoNombre ? 'bg-ink text-bg border-ink' : 'border-border text-ink'
                }`}
              >
                {t.nombre}
              </button>
            ))}
          </div>
        </div>

        {bebida.llevaLeche && (
          <div>
            <div className="label-uppercase mb-1">Leche</div>
            <div className="flex gap-2 flex-wrap">
              {leches.map((l) => (
                <button
                  key={l.nombre}
                  onClick={() => setLecheNombre(l.nombre)}
                  className={`h-10 px-4 rounded border text-sm font-semibold ${
                    l.nombre === lecheNombre ? 'bg-ink text-bg border-ink' : 'border-border text-ink'
                  }`}
                >
                  {l.nombre}
                  {l.sobreprecio > 0 ? ` (+${formatoMoneda(l.sobreprecio)})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {adicionalesDisponibles.length > 0 && (
          <div>
            <div className="label-uppercase mb-1">Adicionales</div>
            <div className="flex flex-col gap-2">
              {adicionalesDisponibles.map((a) => {
                const elegido = adicionalesElegidos.find((e) => e.nombre === a.nombre)
                const sabores = saboresDe(a.nombre)
                return (
                  <div key={a.nombre} className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!elegido} onChange={() => toggleAdicional(a.nombre)} />
                      {a.nombre} (+{formatoMoneda(a.precio)})
                    </label>
                    {elegido && sabores.length > 0 && (
                      <select
                        className="ml-6 h-9 border border-border rounded px-2 text-sm bg-surface"
                        value={elegido.sabor ?? ''}
                        onChange={(e) => setSabor(a.nombre, e.target.value)}
                      >
                        <option value="" disabled>
                          Elegir sabor…
                        </option>
                        {sabores.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <div className="label-uppercase mb-1">Cantidad</div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded border border-border" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>
              −
            </button>
            <span className="tabular w-6 text-center">{cantidad}</span>
            <button className="w-9 h-9 rounded border border-border" onClick={() => setCantidad((c) => c + 1)}>
              +
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-ink-dark">{error}</p>}

        {desglose && !error && (
          <p className="text-sm text-muted">
            Precio {formatoMoneda(desglose.precio * cantidad)} · te deja {formatoMoneda(desglose.utilidad * cantidad)}
          </p>
        )}

        <button
          disabled={!puedeAgregar}
          onClick={() => {
            if (!tamano) return
            onAgregar({ fechaHora: new Date(), bebida, tamano, lecheElegida: leche, adicionalesElegidos, cantidad, factorEvento })
          }}
          className="h-14 rounded bg-ink text-bg font-semibold text-base disabled:opacity-40"
        >
          Agregar al pedido{desglose ? ` · ${formatoMoneda(desglose.precio * cantidad)}` : ''}
        </button>
      </div>
    </div>
  )
}
