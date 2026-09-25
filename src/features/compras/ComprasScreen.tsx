import { useState } from 'react'
import { costoCompraPonderado } from '../../lib/calculos'
import { formatoMoneda } from '../../lib/format'
import { existenciaInsumo, registrarCompraLocal } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

export function ComprasScreen() {
  const insumos = useStore((s) => Object.values(s.insumos))
  const [insumoClave, setInsumoClave] = useState(insumos[0]?.clave ?? '')
  const [presentaciones, setPresentaciones] = useState(1)
  const [contenidoUtil, setContenidoUtil] = useState(1000)
  const [precio, setPrecio] = useState(0)
  const [iva, setIva] = useState(0.16)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const insumo = insumos.find((i) => i.clave === insumoClave)
  const existencia = insumo ? existenciaInsumo(insumo.clave) : 0
  const costoFisicoNetoPrevio = insumo ? insumo.costoUnitarioNeto * (1 - insumo.merma) : 0
  const costoNuevo = insumo ? costoCompraPonderado(existencia, costoFisicoNetoPrevio, presentaciones, contenidoUtil, precio, iva) : 0

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-3xl">Compras</h1>

      <label className="flex flex-col gap-1 text-sm">
        Insumo
        <select className="h-11 border border-border rounded px-2 bg-surface" value={insumoClave} onChange={(e) => setInsumoClave(e.target.value)}>
          {insumos.map((i) => (
            <option key={i.clave} value={i.clave}>
              {i.nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Presentaciones
          <input type="number" className="h-11 border border-border rounded px-2 bg-surface" value={presentaciones} onChange={(e) => setPresentaciones(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contenido útil por presentación
          <input type="number" className="h-11 border border-border rounded px-2 bg-surface" value={contenidoUtil} onChange={(e) => setContenidoUtil(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Precio por presentación
          <input type="number" className="h-11 border border-border rounded px-2 bg-surface" value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          IVA
          <input type="number" step="0.01" className="h-11 border border-border rounded px-2 bg-surface" value={iva} onChange={(e) => setIva(Number(e.target.value))} />
        </label>
      </div>

      <div className="border border-border rounded p-3 bg-surface text-sm flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-muted">Existencia actual</span>
          <span className="tabular">{existencia.toFixed(1)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Costo físico neto (promedio ponderado)</span>
          <span className="tabular">{formatoMoneda(costoNuevo)}</span>
        </div>
      </div>

      <button
        className="h-12 rounded bg-ink text-bg font-semibold"
        onClick={async () => {
          try {
            await registrarCompraLocal(insumoClave, presentaciones, contenidoUtil, precio, iva)
            setMensaje(`Compra registrada. Nuevo costo: ${formatoMoneda(costoNuevo)}`)
          } catch (e) {
            setMensaje(`Error: ${e instanceof Error ? e.message : String(e)}`)
          }
        }}
      >
        Registrar compra
      </button>

      {mensaje && <p className={`text-sm ${mensaje.startsWith('Error') ? 'text-ink-dark' : 'text-ok'}`}>{mensaje}</p>}
    </div>
  )
}
