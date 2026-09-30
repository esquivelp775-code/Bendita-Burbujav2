import { useMemo, useState } from 'react'
import { adicionalAplica, porcionesPosibles, tamanosVendibles, type AdicionalElegido, type Bebida } from '../../lib/calculos'
import { formatoCantidad, formatoMoneda } from '../../lib/format'
import { calcularDesgloseItem, consumoFisicoDeItem, existenciaInsumo, type ItemBebida } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

interface Props {
  bebida: Bebida
  canalNombre: string
  factorEvento?: number
  onAgregar: (item: ItemBebida) => void
  onCerrar: () => void
}

export function BebidaPanel({ bebida, canalNombre, factorEvento, onAgregar, onCerrar }: Props) {
  // Re-render cuando cambian existencias (la cola sin señal también las mueve).
  useStore((s) => s.existencias)
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
  const insumos = useStore((s) => s.insumos)
  const adicionalesCatalogo = useStore((s) => s.adicionales)
  const ultimoTamano = useStore((s) => s.ultimoTamano)
  const ultimaLeche = useStore((s) => s.ultimaLeche)
  const pasos = useStore((s) => s.bebidas[bebida.nombre]?.pasos ?? [])

  const [tamanoNombre, setTamanoNombre] = useState(() => tamanos.find((t) => t.nombre === ultimoTamano)?.nombre ?? tamanos[0]?.nombre)
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

  function itemCon(t: typeof tamano): Omit<ItemBebida, 'cantidad'> | null {
    if (!t) return null
    return { tipo: 'bebida', fechaHora: new Date(), bebida, tamano: t, lecheElegida: leche, adicionalesElegidos, factorEvento }
  }

  function precioDeTamano(t: NonNullable<typeof tamano>): number | null {
    try {
      return calcularDesgloseItem(canalNombre, itemCon(t)!).precio
    } catch {
      return null
    }
  }

  function toggleAdicional(nombre: string) {
    setAdicionalesElegidos((prev) => (prev.find((a) => a.nombre === nombre) ? prev.filter((a) => a.nombre !== nombre) : [...prev, { nombre }]))
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

  const item = itemCon(tamano)
  let desglose: ReturnType<typeof calcularDesgloseItem> | null = null
  let error: string | null = null
  let alcance: ReturnType<typeof porcionesPosibles> | null = null
  if (item) {
    try {
      desglose = calcularDesgloseItem(canalNombre, item)
      alcance = porcionesPosibles(consumoFisicoDeItem({ ...item, cantidad: 1 }), existenciaInsumo)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  const puedeAgregar = !!item && !!desglose && !error && (!bebida.llevaLeche || !!leche)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={onCerrar}>
      <div
        className="bg-bg w-full md:max-w-lg md:rounded max-h-[90vh] overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex flex-col gap-4"
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
            {tamanos.map((t) => {
              const precio = precioDeTamano(t)
              return (
                <button
                  key={t.nombre}
                  onClick={() => setTamanoNombre(t.nombre)}
                  className={`min-h-10 px-4 py-1 rounded border text-sm font-semibold flex flex-col items-center leading-tight ${
                    t.nombre === tamanoNombre ? 'bg-ink text-bg border-ink' : 'border-border text-ink'
                  }`}
                >
                  {t.nombre}
                  {precio != null && <span className="text-xs font-normal tabular">{formatoMoneda(precio)}</span>}
                </button>
              )
            })}
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
                  className={`h-10 px-4 rounded border text-sm font-semibold ${l.nombre === lecheNombre ? 'bg-ink text-bg border-ink' : 'border-border text-ink'}`}
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
                    <label className="flex items-center gap-2 text-sm min-h-9">
                      <input type="checkbox" className="w-5 h-5" checked={!!elegido} onChange={() => toggleAdicional(a.nombre)} />
                      {a.nombre} (+{formatoMoneda(a.precio)})
                    </label>
                    {elegido && sabores.length > 0 && (
                      <select className="ml-7 h-9 border border-border rounded px-2 text-sm bg-surface" value={elegido.sabor ?? ''} onChange={(e) => setSabor(a.nombre, e.target.value)}>
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
            <button className="w-10 h-10 rounded border border-border" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Menos">
              −
            </button>
            <span className="tabular w-6 text-center">{cantidad}</span>
            <button className="w-10 h-10 rounded border border-border" onClick={() => setCantidad((c) => c + 1)} aria-label="Más">
              +
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-ink-dark m-0">{error}</p>}

        {alcance && alcance.faltantes.length > 0 && (
          <div className="text-sm border border-warn text-warn rounded p-3">
            {alcance.faltantes.map((f) => (
              <div key={f.insumoClave}>
                {insumos[f.insumoClave]?.nombre ?? f.insumoClave}: hay {formatoCantidad(f.hay, insumos[f.insumoClave]?.unidad)}, se necesitan{' '}
                {formatoCantidad(f.necesita, insumos[f.insumoClave]?.unidad)}.
              </div>
            ))}
            <div className="text-xs mt-1">Puedes vender igual; revisa tu inventario (compra o conteo).</div>
          </div>
        )}

        {desglose && !error && (
          <details className="text-sm border border-border rounded bg-surface">
            <summary className="px-3 py-2 cursor-pointer font-semibold">Ver preparación ({tamano?.nombre})</summary>
            <div className="px-3 pb-3 flex flex-col gap-2">
              <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
                {desglose.consumo.map((c, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{insumos[c.insumoClave]?.nombre ?? c.insumoClave}</span>
                    <span className="tabular text-muted">{formatoCantidad(c.cantidad, insumos[c.insumoClave]?.unidad)}</span>
                  </li>
                ))}
              </ul>
              {pasos.length > 0 && (
                <ol className="m-0 pl-5 flex flex-col gap-1">
                  {pasos.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              )}
            </div>
          </details>
        )}

        {desglose && !error && (
          <p className="text-sm text-muted m-0">
            Precio {formatoMoneda(desglose.precio * cantidad)} · te deja {formatoMoneda(desglose.utilidad * cantidad)}
            {alcance?.porciones != null && alcance.faltantes.length === 0 && (
              <span className={alcance.porciones < cantidad + 3 ? 'text-warn' : ''}> · te alcanza para {alcance.porciones}</span>
            )}
          </p>
        )}

        <button
          disabled={!puedeAgregar}
          onClick={() => item && onAgregar({ ...item, cantidad })}
          className="h-14 rounded bg-ink text-bg font-semibold text-base disabled:opacity-40"
        >
          Agregar al pedido{desglose ? ` · ${formatoMoneda(desglose.precio * cantidad)}` : ''}
        </button>
      </div>
    </div>
  )
}
