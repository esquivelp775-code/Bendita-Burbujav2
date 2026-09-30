import { useState } from 'react'
import { desgloseLinea, margenEnRango, margenSobrePrecio, precioSugerido, precioSugeridoPublico } from '../../lib/calculos'
import { formatoMoneda } from '../../lib/format'
import { precioAppVigente, precioPublicoVigente, setPrecio } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'
import { RecetaEditor } from './RecetaEditor'

const CANAL_PUBLICO = 'Público en general'
const CANALES_APP = ['Uber Eats', 'Rappi']
/** Tarifa de mano de obra con la que se costean los precios sugeridos y el margen de Público. */
const TARIFA_COSTEO = 50

export function RecetasScreen() {
  const bebidas = useStore((s) => Object.values(s.bebidas))
  // De chico a grande: la escalera del precio sugerido depende del orden.
  const tamanos = useStore((s) =>
    Object.values(s.tamanos)
      .filter((t) => t.activo)
      .sort((a, b) => a.ml - b.ml),
  )
  const tamanosPublico = tamanos.filter((t) => !t.canales || t.canales.includes(CANAL_PUBLICO))
  // El precio de lista 'app' aplica a Uber y Rappi: sólo tamaños que se venden ahí (el 14 oz no).
  const tamanosApp = tamanos.filter((t) => !t.canales || t.canales.some((c) => CANALES_APP.includes(c)))
  const adicionales = useStore((s) => s.adicionales)
  const turnos = useStore((s) => s.turnos)
  const configPublico = useStore((s) => s.configPublicoPorCanal[CANAL_PUBLICO])
  const categorias = useStore((s) => s.categorias)
  const insumos = useStore((s) => s.insumos)
  const leches = useStore((s) => s.leches)
  const parametros = useStore((s) => s.parametros)
  const preciosApp = useStore((s) => s.preciosApp)
  const configUber = useStore((s) => s.configPlataformaPorCanal['Uber Eats'])

  const [abierta, setAbierta] = useState<string | null>(bebidas[0]?.nombre ?? null)
  const [error, setError] = useState<string | null>(null)
  const bebida = bebidas.find((b) => b.nombre === abierta)
  const [edicion, setEdicion] = useState<Record<string, number>>({})
  const [edicionPublico, setEdicionPublico] = useState<Record<string, number>>({})
  const lecheDefault = bebida?.llevaLeche ? leches['Entera'] ?? Object.values(leches)[0] : undefined

  const sugeridosPublico = bebida
    ? precioSugeridoPublico({
        bebida,
        tamanos: tamanosPublico,
        lecheDefault,
        categoria: categorias[bebida.categoriaNombre],
        insumos,
        parametros,
        tarifaManoDeObra: TARIFA_COSTEO,
      })
    : {}

  /** Utilidad en Público a un precio dado, costeada a $50/h como en la regla de v3.1. */
  function utilidadPublico(tamanoNombre: string, precio: number): number | null {
    if (!bebida) return null
    try {
      return desgloseLinea({
        fechaHora: new Date(),
        canalTipo: 'publico',
        canalNombre: CANAL_PUBLICO,
        bebida,
        tamano: tamanos.find((t) => t.nombre === tamanoNombre)!,
        lecheElegida: lecheDefault,
        adicionalesElegidos: [],
        precioApp: 0,
        precioPublico: precio,
        insumos,
        adicionalesCatalogo: adicionales,
        categorias,
        parametros,
        turnos,
        configPublico,
        fueraDeTurno: true,
      }).utilidad
    } catch {
      return null
    }
  }

  /** Utilidad en Uber Eats a un precio dado, costeada a $50/h como el sugerido (spec §5.9). */
  function utilidadApp(tamanoNombre: string, precio: number): number | null {
    if (!bebida || !configUber) return null
    try {
      return desgloseLinea({
        fechaHora: new Date(),
        canalTipo: 'plataforma',
        canalNombre: 'Uber Eats',
        bebida,
        tamano: tamanos.find((t) => t.nombre === tamanoNombre)!,
        lecheElegida: lecheDefault,
        adicionalesElegidos: [],
        precioApp: precio,
        insumos,
        adicionalesCatalogo: adicionales,
        categorias,
        parametros,
        turnos,
        configPlataforma: configUber,
        fueraDeTurno: true,
      }).utilidad
    } catch {
      return null
    }
  }

  const sugeridos = bebida
    ? precioSugerido({
        bebida,
        tamanos: tamanosApp,
        lecheDefault,
        categoria: categorias[bebida.categoriaNombre],
        insumos,
        parametros,
        comisionEfectivaUber: configUber?.comisionEfectiva ?? 0.295,
        tarifaManoDeObraPromedio: TARIFA_COSTEO,
      })
    : {}

  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 max-w-5xl mx-auto">
      <div className="w-full md:w-64 flex-none flex flex-col gap-1">
        <h1 className="text-2xl mb-2">Recetas</h1>
        <label className="md:hidden flex flex-col gap-1 text-sm">
          Bebida
          <select className="h-11 border border-border rounded px-2 bg-surface" value={abierta ?? ''} onChange={(e) => setAbierta(e.target.value)}>
            {bebidas.map((b) => (
              <option key={b.nombre} value={b.nombre}>
                {b.nombre}
              </option>
            ))}
          </select>
        </label>
        {bebidas.map((b) => (
          <button
            key={b.nombre}
            onClick={() => setAbierta(b.nombre)}
            className={`hidden md:block text-left h-10 px-3 rounded ${b.nombre === abierta ? 'bg-ink text-bg font-semibold' : 'hover:bg-card'}`}
          >
            {b.nombre}
          </button>
        ))}
      </div>

      {bebida && (
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-2xl font-display">{bebida.nombre}</h2>
          <div className="border border-border rounded p-4 bg-surface">
            <h3 className="text-sm label-uppercase mb-3">Precio por tamaño (canal app)</h3>
            {error && <p className="text-sm text-ink-dark mb-2">{error}</p>}
            <div className="grid grid-cols-[3.5rem_5.5rem_1fr] md:grid-cols-4 gap-2 text-xs label-uppercase pb-2 border-b border-border">
              <span>Tamaño</span>
              <span className="text-right">Vigente</span>
              <span className="text-right">Sugerido</span>
              <span className="hidden md:block"></span>
            </div>
            {tamanosApp.map((t, idx) => {
              const vigente = precioAppVigente(bebida.nombre, t.nombre)
              const sugerido = sugeridos[t.nombre]
              const valorEdicion = edicion[t.nombre] ?? vigente
              const utilidad = utilidadApp(t.nombre, valorEdicion)
              const objetivo = categorias[bebida.categoriaNombre]?.utilidadObjetivo
              const anterior = idx > 0 ? tamanosApp[idx - 1] : null
              const utilidadAnterior = anterior ? utilidadApp(anterior.nombre, edicion[anterior.nombre] ?? precioAppVigente(bebida.nombre, anterior.nombre)) : null
              const esManual = preciosApp[bebida.nombre]?.[t.nombre]?.manual
              const avisos: string[] = []
              if (utilidad != null && objetivo != null && utilidad < objetivo)
                avisos.push(`En Uber deja ${formatoMoneda(utilidad)}, menos que el objetivo de ${bebida.categoriaNombre} (${formatoMoneda(objetivo)}).`)
              if (esManual && sugerido != null && sugerido > valorEdicion && utilidad != null)
                avisos.push(`El sugerido subió a ${formatoMoneda(sugerido)}; tu precio deja ${formatoMoneda(utilidad)}.`)
              if (utilidad != null && utilidadAnterior != null && utilidad < utilidadAnterior)
                avisos.push(`El ${t.nombre} deja menos que el ${anterior!.nombre} (${formatoMoneda(utilidad)} contra ${formatoMoneda(utilidadAnterior)}).`)
              return (
                <div key={t.nombre} className="grid grid-cols-[3.5rem_5.5rem_1fr] md:grid-cols-4 gap-2 items-center py-2 border-b border-border text-sm">
                  <span>{t.nombre}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="h-9 w-full border border-border rounded px-2 bg-bg text-right tabular"
                    value={valorEdicion}
                    onChange={(e) => setEdicion((prev) => ({ ...prev, [t.nombre]: Number(e.target.value) }))}
                  />
                  <span className="text-right text-muted tabular">{sugerido != null ? formatoMoneda(sugerido) : '—'}</span>
                  <div className="col-span-3 md:col-span-1 flex gap-4 justify-end">
                    <button
                      className="text-xs font-semibold underline"
                      onClick={() => setPrecio(bebida.nombre, t.nombre, 'app', valorEdicion, true).catch((e) => setError(e instanceof Error ? e.message : String(e)))}
                    >
                      Guardar
                    </button>
                    {sugerido != null && (
                      <button
                        className="text-xs text-muted underline"
                        onClick={() => {
                          setEdicion((prev) => {
                            const { [t.nombre]: _, ...resto } = prev
                            return resto
                          })
                          setPrecio(bebida.nombre, t.nombre, 'app', sugerido, false).catch((e) => setError(e instanceof Error ? e.message : String(e)))
                        }}
                      >
                        Restablecer al sugerido
                      </button>
                    )}
                  </div>
                  {utilidad != null && (
                    <span className="col-span-3 md:col-span-4 text-xs text-muted -mt-1">
                      En Uber deja {formatoMoneda(utilidad)}
                      {esManual === false && ' · precio sugerido'}
                    </span>
                  )}
                  {avisos.map((a) => (
                    <span key={a} className="col-span-3 md:col-span-4 text-xs text-warn">
                      {a}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="border border-border rounded p-4 bg-surface">
            <h3 className="text-sm label-uppercase mb-1">Precio a público</h3>
            <p className="text-xs text-muted mb-3">
              Margen = utilidad ÷ precio, costeado a ${TARIFA_COSTEO}/h. Rango: {Math.round(parametros.margenPublicoMin * 100)}–
              {Math.round(parametros.margenPublicoMax * 100)} %. El sugerido es sólo para comparar; no cambia el precio vigente.
            </p>
            <div className="grid grid-cols-5 gap-2 text-xs label-uppercase pb-2 border-b border-border">
              <span>Tamaño</span>
              <span className="text-right">Vigente</span>
              <span className="text-right">Margen</span>
              <span className="text-right">Sugerido</span>
              <span></span>
            </div>
            {tamanosPublico.map((t) => {
              const vigente = precioPublicoVigente(bebida.nombre, t.nombre)
              const valor = edicionPublico[t.nombre] ?? vigente
              const utilidad = utilidadPublico(t.nombre, valor)
              const margen = utilidad != null ? margenSobrePrecio(utilidad, valor) : null
              const enRango = margen != null && margenEnRango(margen, parametros)
              const sugerido = sugeridosPublico[t.nombre]
              return (
                <div key={t.nombre} className="grid grid-cols-5 gap-2 items-center py-2 border-b border-border text-sm">
                  <span>{t.nombre}</span>
                  <input
                    type="number"
                    className="h-9 border border-border rounded px-2 bg-bg text-right tabular"
                    value={valor}
                    onChange={(e) => setEdicionPublico((prev) => ({ ...prev, [t.nombre]: Number(e.target.value) }))}
                  />
                  <span className={`text-right tabular font-semibold ${enRango ? 'text-ok' : 'text-warn'}`}>
                    {margen != null ? `${(margen * 100).toFixed(1)} %` : '—'}
                    {margen != null && !enRango && <span className="block text-[11px] font-normal">fuera del rango de público</span>}
                  </span>
                  <span className="text-right text-muted tabular">{sugerido ? formatoMoneda(sugerido.precio) : '—'}</span>
                  <button
                    className="text-xs font-semibold underline justify-self-end"
                    onClick={() => setPrecio(bebida.nombre, t.nombre, 'publico', valor, true).catch((e) => setError(e instanceof Error ? e.message : String(e)))}
                  >
                    Guardar
                  </button>
                </div>
              )
            })}
          </div>

          <RecetaEditor bebida={bebida} insumos={insumos} />
        </div>
      )}
    </div>
  )
}
