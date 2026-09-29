import { Link } from 'react-router-dom'
import { avanceSemana } from '../../lib/calculos'
import { formatoFecha, formatoMoneda } from '../../lib/format'
import { alertasInventario, finDia, inicioSemana, lineasValidasEnRango, resumenDia } from '../../lib/store/selectors'
import { useStore } from '../../lib/store/useStore'

export function HoyScreen() {
  const hoy = new Date()
  const resumen = useStore((s) => resumenDia(s, hoy))
  const parametros = useStore((s) => s.parametros)
  const alertas = useStore(alertasInventario)

  const gananciaSemana = useStore((s) => {
    const desde = inicioSemana(hoy)
    const lineas = lineasValidasEnRango(s, desde, finDia(hoy))
    return lineas.reduce((acc, l) => acc + l.desglose.utilidad * l.cantidad, 0)
  })

  const avance = avanceSemana(gananciaSemana, parametros.metaUtilidadSemanal)

  const topBebidas = [...resumen.porBebida.entries()].sort((a, b) => b[1].ganancia - a[1].ganancia).slice(0, 5)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl">{formatoFecha(hoy)}</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border border-border rounded p-5 bg-surface flex flex-col items-center gap-2 text-center">
          <span className="label-uppercase">Hoy te quedan</span>
          <span className="text-5xl font-display tabular">{formatoMoneda(resumen.desglose.teLlevas)}</span>
          <span className="text-sm text-muted tabular">
            {resumen.numeroLineas} bebidas vendidas · {formatoMoneda(resumen.desglose.venta)} de venta
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/desglose" className="h-14 rounded bg-ink text-bg font-semibold flex items-center justify-between px-5">
            Ver desglose del día <span>→</span>
          </Link>
          <div className="border border-border rounded p-4 bg-surface">
            <div className="flex justify-between text-xs label-uppercase mb-2">
              <span>Semana</span>
              <span>Meta {formatoMoneda(parametros.metaUtilidadSemanal)}</span>
            </div>
            <div className="h-2.5 bg-card border border-border rounded overflow-hidden">
              <div className="h-full bg-ok" style={{ width: `${Math.min(100, avance * 100)}%` }} />
            </div>
            <p className="text-sm text-muted mt-2">
              Esta semana te llevas <strong className="text-ok tabular">{formatoMoneda(gananciaSemana)}</strong>
            </p>
          </div>
        </div>
      </section>

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-3">Por canal · hoy</h2>
        <div className="grid grid-cols-4 gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Canal</span>
          <span className="text-right">Venta</span>
          <span className="text-right">Te dejó</span>
          <span className="text-right">Pedidos</span>
        </div>
        {[...resumen.porCanal.entries()].map(([nombre, r]) => (
          <div key={nombre} className="grid grid-cols-4 gap-2 items-center py-2 border-b border-border text-sm tabular">
            <span className="flex items-center gap-2 normal-case font-normal">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: r.color }} />
              {nombre}
            </span>
            <span className="text-right">{formatoMoneda(r.venta)}</span>
            <span className="text-right font-semibold text-ok">{formatoMoneda(r.ganancia)}</span>
            <span className="text-right text-muted">{r.pedidos}</span>
          </div>
        ))}
      </section>

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-3">Lo que más se vende</h2>
        {topBebidas.length === 0 && <p className="text-sm text-muted">Todavía no sale la primera bendición del día.</p>}
        {topBebidas.map(([nombre, r]) => (
          <div key={nombre} className="flex justify-between items-center py-2 border-b border-border text-sm">
            <span className="font-display text-lg">{nombre}</span>
            <div className="text-right tabular">
              <div className="font-semibold text-ok">{formatoMoneda(r.ganancia)}</div>
              <div className="text-xs text-muted">{r.unidades} unidades</div>
            </div>
          </div>
        ))}
      </section>

      <section className="border border-border rounded p-4 bg-surface">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm label-uppercase m-0">Atención</h2>
          <Link to="/inventario" className="text-sm font-semibold underline">
            Inventario →
          </Link>
        </div>
        {alertas.length === 0 && <p className="text-sm text-muted">Todo en orden. Ningún insumo debajo de su umbral.</p>}
        {alertas.slice(0, 8).map((a) => (
          <div key={a.insumoClave + a.tipo} className="flex justify-between items-center gap-2 py-2 border-b border-border text-sm">
            <span className={a.negativo ? 'text-ink-dark font-medium' : 'text-warn font-medium'}>
              {a.nombre}
              {a.negativo && <span className="block text-xs font-normal">En negativo: se vendió sin existencia registrada</span>}
            </span>
            <span className="label-uppercase border border-warn text-warn rounded px-1.5 py-0.5 whitespace-nowrap">{a.tipo}</span>
          </div>
        ))}
        {alertas.length > 8 && (
          <Link to="/inventario" className="block text-sm text-muted pt-2">
            y {alertas.length - 8} más en Inventario
          </Link>
        )}
      </section>
    </div>
  )
}
