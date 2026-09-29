import { formatoFecha, formatoMoneda } from '../../lib/format'
import { resumenDia } from '../../lib/store/selectors'
import { useStore } from '../../lib/store/useStore'

function Fila({ etiqueta, valor, resaltar = false }: { etiqueta: string; valor: number; resaltar?: boolean }) {
  return (
    <div className={`flex justify-between py-2 border-b border-border text-sm ${resaltar ? 'font-semibold' : ''}`}>
      <span>{etiqueta}</span>
      <span className="tabular">{formatoMoneda(valor)}</span>
    </div>
  )
}

export function DesgloseScreen() {
  const hoy = new Date()
  const resumen = useStore((s) => resumenDia(s, hoy))
  const d = resumen.desglose

  const porBebidaOrdenado = [...resumen.porBebida.entries()].sort((a, b) => b[1].ganancia - a[1].ganancia)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-3xl">Desglose del día · {formatoFecha(hoy)}</h1>

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-2">Cascada</h2>
        <Fila etiqueta="Venta" valor={d.venta} resaltar />
        <Fila etiqueta="− IVA" valor={-d.iva} />
        <Fila etiqueta="− Comisión" valor={-d.comision} />
        <Fila etiqueta="− Insumos" valor={-d.insumos} />
        <Fila etiqueta="− Empaque y vaso" valor={-d.empaqueYVaso} />
        <Fila etiqueta="− Indirectos" valor={-d.indirectos} />
        <Fila etiqueta="− Equipo (depreciación)" valor={-d.equipo} />
        <Fila etiqueta="− Costos de eventos" valor={-d.costosEvento} />
        <Fila etiqueta="− Envíos pagados" valor={-d.costoEnvios} />
        <Fila etiqueta="− Mano de obra" valor={-d.manoDeObra} />
        <Fila etiqueta="= Ganancia" valor={d.ganancia} resaltar />
        <Fila etiqueta="Te llevas (ganancia + mano de obra)" valor={d.teLlevas} resaltar />
      </section>

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-3">Por canal</h2>
        <div className="grid grid-cols-4 gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Canal</span>
          <span className="text-right">Venta</span>
          <span className="text-right">Te dejó</span>
          <span className="text-right">Pedidos</span>
        </div>
        {[...resumen.porCanal.entries()].map(([nombre, r]) => (
          <div key={nombre} className="grid grid-cols-4 gap-2 py-2 border-b border-border text-sm tabular">
            <span className="normal-case font-normal">{nombre}</span>
            <span className="text-right">{formatoMoneda(r.venta)}</span>
            <span className="text-right font-semibold text-ok">{formatoMoneda(r.ganancia)}</span>
            <span className="text-right text-muted">{r.pedidos}</span>
          </div>
        ))}
      </section>

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-3">Por bebida y tamaño</h2>
        {porBebidaOrdenado.length === 0 && <p className="text-sm text-muted">Todavía no hay ventas hoy.</p>}
        <div className="grid grid-cols-4 gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Bebida</span>
          <span className="text-right">Unidades</span>
          <span className="text-right">Venta</span>
          <span className="text-right">Ganancia</span>
        </div>
        {porBebidaOrdenado.map(([nombre, r]) => (
          <div key={nombre} className="grid grid-cols-4 gap-2 py-2 border-b border-border text-sm tabular">
            <span className="normal-case font-normal">{nombre}</span>
            <span className="text-right">{r.unidades}</span>
            <span className="text-right">{formatoMoneda(r.venta)}</span>
            <span className="text-right font-semibold text-ok">{formatoMoneda(r.ganancia)}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
