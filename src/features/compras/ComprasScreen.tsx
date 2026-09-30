import { useEffect, useMemo, useState } from 'react'
import { compraSalioCara, costoCompraPonderado, costoEntradaNeto, sobrecostoVsReposicion } from '../../lib/calculos'
import { formatoCantidad, formatoCostoUnitario, formatoMoneda, formatoPorcentaje } from '../../lib/format'
import { cargarHistorialCompras, registrarCompraCompleta, type CompraHistorial } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'
import { tomarPrecarga } from './precargaCompra'

const hoyTexto = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Linea {
  clave: number
  insumoClave: string
  presentaciones: string
  contenidoUtil: string
  precio: string
  conIva: boolean
}

let siguienteClave = 1
const num = (t: string) => Number(t.replace(',', '.'))

export function ComprasScreen() {
  const [pestana, setPestana] = useState<'nueva' | 'historial'>('nueva')
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-3xl">Compras</h1>
      <div className="flex gap-1 border-b border-border" role="tablist">
        {(['nueva', 'historial'] as const).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={pestana === p}
            onClick={() => setPestana(p)}
            className={`h-10 px-4 text-sm font-semibold border-b-2 -mb-px ${pestana === p ? 'border-ink' : 'border-transparent text-muted'}`}
          >
            {p === 'nueva' ? 'Nueva compra' : 'Historial'}
          </button>
        ))}
      </div>
      {pestana === 'nueva' ? <NuevaCompra onGuardada={() => setPestana('historial')} /> : <Historial />}
    </div>
  )
}

function NuevaCompra({ onGuardada }: { onGuardada: () => void }) {
  const insumos = useStore((s) => s.insumos)
  const fichas = useStore((s) => s.fichas)
  const proveedores = useStore((s) => s.proveedores)
  const existencias = useStore((s) => s.existencias)
  const ordenados = useMemo(
    () => Object.values(insumos).sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)),
    [insumos],
  )

  const [fecha, setFecha] = useState(hoyTexto())
  const [proveedorId, setProveedorId] = useState('')
  const [conFactura, setConFactura] = useState(false)
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState<Linea[]>([])
  const [buscar, setBuscar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)

  function lineaPara(insumoClave: string, presentaciones = 1): Linea {
    const ficha = fichas[insumoClave]
    const u = ficha?.ultimaCompra
    const iva = u?.iva ?? ficha?.iva ?? 0.16
    return {
      clave: siguienteClave++,
      insumoClave,
      presentaciones: String(presentaciones),
      contenidoUtil: String(u?.contenidoUtil ?? ficha?.contenidoUtil ?? 1),
      precio: u ? String(u.precioPorPresentacion) : '',
      conIva: iva > 0,
    }
  }

  // "Convertir en compra" desde Inventario.
  useEffect(() => {
    const p = tomarPrecarga()
    if (!p) return
    if (p.proveedorId) setProveedorId(p.proveedorId)
    setLineas(p.lineas.filter((l) => insumos[l.insumoClave]).map((l) => lineaPara(l.insumoClave, l.presentaciones)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cambiar = (clave: number, cambios: Partial<Linea>) => setLineas((ls) => ls.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)))
  const agregar = (insumoClave: string) => {
    setLineas((ls) => [...ls, lineaPara(insumoClave)])
    setBuscar('')
  }

  const coincidencias = buscar.trim()
    ? ordenados.filter((i) => i.nombre.toLowerCase().includes(buscar.trim().toLowerCase()) && !lineas.some((l) => l.insumoClave === i.clave)).slice(0, 8)
    : []

  const errores = lineas.map((l) => {
    if (!(num(l.presentaciones) > 0)) return 'Cantidad inválida'
    if (!(num(l.contenidoUtil) > 0)) return 'Contenido inválido'
    if (!(num(l.precio) >= 0) || l.precio.trim() === '') return 'Falta el precio'
    return null
  })
  const total = lineas.reduce((acc, l) => acc + (num(l.presentaciones) || 0) * (num(l.precio) || 0), 0)
  const puedeGuardar = lineas.length > 0 && errores.every((e) => e == null) && !guardando

  async function guardar() {
    setGuardando(true)
    setMensaje(null)
    try {
      await registrarCompraCompleta({
        fecha,
        proveedorId: proveedorId || undefined,
        conFactura,
        notas: notas.trim() || undefined,
        lineas: lineas.map((l) => ({
          insumoClave: l.insumoClave,
          presentaciones: num(l.presentaciones),
          contenidoUtilPorPresentacion: num(l.contenidoUtil),
          precioPorPresentacion: num(l.precio),
          iva: l.conIva ? 0.16 : 0,
        })),
      })
      setLineas([])
      setNotas('')
      setMensaje({ ok: true, texto: `Compra registrada: ${lineas.length} ${lineas.length === 1 ? 'insumo' : 'insumos'}, ${formatoMoneda(total)}.` })
      onGuardada()
    } catch (e) {
      setMensaje({ ok: false, texto: e instanceof Error ? e.message : String(e) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Fecha
          <input type="date" className="h-11 border border-border rounded px-2 bg-surface" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Proveedor
          <select className="h-11 border border-border rounded px-2 bg-surface" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="w-5 h-5" checked={conFactura} onChange={(e) => setConFactura(e.target.checked)} />
        Con factura (el IVA se puede acreditar)
      </label>

      <div className="flex flex-col gap-3">
        {lineas.map((l, i) => {
          const insumo = insumos[l.insumoClave]
          const ficha = fichas[l.insumoClave]
          const unidad = insumo?.unidad === 'pieza' ? 'pza' : insumo?.unidad
          const costoEntrada = num(l.contenidoUtil) > 0 && l.precio.trim() !== '' ? costoEntradaNeto(num(l.precio), l.conIva ? 0.16 : 0, num(l.contenidoUtil)) : null
          const existencia = existencias[l.insumoClave]?.existencia ?? 0
          const promedio =
            costoEntrada != null && ficha
              ? costoCompraPonderado(Math.max(0, existencia), ficha.costoFisicoNeto, num(l.presentaciones) || 0, num(l.contenidoUtil), num(l.precio), l.conIva ? 0.16 : 0)
              : null
          const cara = costoEntrada != null && compraSalioCara(costoEntrada, ficha?.costoReposicion)
          const sobre = costoEntrada != null ? sobrecostoVsReposicion(costoEntrada, ficha?.costoReposicion) : null
          return (
            <div key={l.clave} className="border border-border rounded p-3 bg-surface flex flex-col gap-2 text-sm">
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold">{insumo?.nombre ?? l.insumoClave}</span>
                <button className="text-muted text-lg leading-none px-1" onClick={() => setLineas((ls) => ls.filter((x) => x.clave !== l.clave))} aria-label={`Quitar ${insumo?.nombre}`}>
                  ×
                </button>
              </div>
              {ficha?.presentacion && <span className="text-xs text-muted -mt-1">Presentación habitual: {ficha.presentacion}</span>}
              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col gap-1">
                  Cuántas
                  <input inputMode="decimal" className="h-10 border border-border rounded px-2 bg-bg tabular" value={l.presentaciones} onChange={(e) => cambiar(l.clave, { presentaciones: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1">
                  {unidad} por cada una
                  <input inputMode="decimal" className="h-10 border border-border rounded px-2 bg-bg tabular" value={l.contenidoUtil} onChange={(e) => cambiar(l.clave, { contenidoUtil: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1">
                  Precio c/u ($)
                  <input inputMode="decimal" className="h-10 border border-border rounded px-2 bg-bg tabular" value={l.precio} onChange={(e) => cambiar(l.clave, { precio: e.target.value })} />
                </label>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs text-muted">El precio</span>
                {[true, false].map((v) => (
                  <button key={String(v)} onClick={() => cambiar(l.clave, { conIva: v })} className={`h-8 px-3 rounded border text-xs font-semibold ${l.conIva === v ? 'bg-ink text-bg border-ink' : 'border-border'}`}>
                    {v ? 'incluye IVA 16 %' : 'no lleva IVA'}
                  </button>
                ))}
              </div>
              {errores[i] ? (
                <span className="text-xs text-ink-dark">{errores[i]}</span>
              ) : (
                costoEntrada != null && (
                  <span className="text-xs text-muted tabular">
                    Entra a {formatoCostoUnitario(costoEntrada)}/{unidad} sin IVA · {formatoCantidad((num(l.presentaciones) || 0) * num(l.contenidoUtil), insumo?.unidad)} · costo promedio queda en{' '}
                    {promedio != null ? `${formatoCostoUnitario(promedio)}/${unidad}` : '—'}
                  </span>
                )
              )}
              {cara && sobre != null && (
                <span className="text-xs border border-warn text-warn rounded p-2">
                  Esta compra salió cara ({formatoPorcentaje(sobre, 0)} más que {formatoCostoUnitario(ficha!.costoReposicion!)}/{unidad}): repónla con{' '}
                  {ficha?.proveedorReposicion?.split('·')[0].trim() ?? 'tu proveedor'}.
                </span>
              )}
            </div>
          )
        })}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Agregar insumo
        <input className="h-11 border border-border rounded px-3 bg-surface" placeholder="Escribe para buscar…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </label>
      {coincidencias.length > 0 && (
        <div className="border border-border rounded bg-surface -mt-2">
          {coincidencias.map((i) => (
            <button key={i.clave} className="w-full text-left px-3 py-2 border-b border-border text-sm last:border-b-0" onClick={() => agregar(i.clave)}>
              {i.nombre} <span className="text-xs text-muted">· {i.categoria}</span>
            </button>
          ))}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Notas (opcional)
        <input className="h-10 border border-border rounded px-2 bg-surface" value={notas} onChange={(e) => setNotas(e.target.value)} />
      </label>

      {lineas.length > 0 && (
        <div className="flex justify-between font-semibold border-t border-border pt-2">
          <span>Total del ticket</span>
          <span className="tabular">{formatoMoneda(total)}</span>
        </div>
      )}
      <button disabled={!puedeGuardar} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-50" onClick={guardar}>
        {guardando ? 'Guardando…' : 'Registrar compra'}
      </button>
      {mensaje && <p className={`text-sm m-0 ${mensaje.ok ? 'text-ok' : 'text-ink-dark'}`}>{mensaje.texto}</p>}
    </div>
  )
}

function Historial() {
  const insumos = useStore((s) => s.insumos)
  const [compras, setCompras] = useState<CompraHistorial[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    cargarHistorialCompras()
      .then(setCompras)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])
  if (error) return <p className="text-sm text-ink-dark">No se pudo leer el historial: {error}</p>
  if (!compras) return <p className="text-sm text-muted">Cargando…</p>
  if (compras.length === 0) return <p className="text-sm text-muted">Todavía no hay compras.</p>
  return (
    <div className="flex flex-col gap-3">
      {compras.map((c) => {
        const total = c.lineas.reduce((acc, l) => acc + l.presentaciones * l.precio, 0)
        return (
          <div key={c.id} className="border border-border rounded p-3 bg-surface text-sm flex flex-col gap-1">
            <div className="flex justify-between gap-2">
              <span className="font-semibold">
                {c.fecha} · {c.proveedor ?? 'Sin proveedor'}
                {c.conFactura && <span className="text-xs text-muted"> · con factura</span>}
              </span>
              <span className="tabular font-semibold">{formatoMoneda(total)}</span>
            </div>
            {c.lineas.map((l, i) => (
              <div key={i} className="flex justify-between gap-2 text-muted">
                <span>
                  {l.presentaciones} × {insumos[l.insumoClave]?.nombre ?? l.insumoClave} ({formatoCantidad(l.contenidoUtil, insumos[l.insumoClave]?.unidad)})
                </span>
                <span className="tabular">{formatoMoneda(l.presentaciones * l.precio)}</span>
              </div>
            ))}
            {c.notas && <span className="text-xs text-muted">{c.notas}</span>}
          </div>
        )
      })}
    </div>
  )
}
