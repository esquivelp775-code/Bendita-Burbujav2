import { useEffect, useMemo, useState } from 'react'
import { formatoCantidad, formatoMoneda, formatoPorcentaje } from '../../lib/format'
import {
  aCsv,
  aTextoDia,
  horasPico,
  matrizBebidaTamano,
  menuPorRentabilidad,
  mezclaTamanosPorSemana,
  porCanal,
  porTamano,
  totalesDeRango,
  type Cuadrante,
  type ResumenRango,
} from '../../lib/reportes'
import {
  cargarDepositos,
  cargarHistorialCompras,
  exportarMovimientos,
  exportarVentas,
  registrarDeposito,
  resumenVentas,
  type DepositoStore,
} from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'
import { mensajeError } from '../../lib/errores'

type Pestana = 'resumen' | 'tamanos' | 'menu' | 'horas' | 'depositos' | 'exportar'
const PESTANAS: { id: Pestana; nombre: string }[] = [
  { id: 'resumen', nombre: 'Resumen' },
  { id: 'tamanos', nombre: 'Tamaños' },
  { id: 'menu', nombre: 'Menú' },
  { id: 'horas', nombre: 'Horas pico' },
  { id: 'depositos', nombre: 'Depósitos' },
  { id: 'exportar', nombre: 'Exportar' },
]

function rangoPredefinido(tipo: 'semana' | 'semanaPasada' | 'mes' | 'mesPasado'): [string, string] {
  const hoy = new Date()
  if (tipo === 'mes') return [aTextoDia(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), aTextoDia(hoy)]
  if (tipo === 'mesPasado') return [aTextoDia(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)), aTextoDia(new Date(hoy.getFullYear(), hoy.getMonth(), 0))]
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() + (hoy.getDay() === 0 ? -6 : 1 - hoy.getDay()))
  if (tipo === 'semana') return [aTextoDia(lunes), aTextoDia(hoy)]
  const lunesPasado = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() - 7)
  return [aTextoDia(lunesPasado), aTextoDia(new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() - 1))]
}

function descargar(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ReportesScreen() {
  const [pestana, setPestana] = useState<Pestana>('resumen')
  const [[desde, hasta], setRango] = useState<[string, string]>(rangoPredefinido('semana'))
  const [resumen, setResumen] = useState<ResumenRango | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)
    resumenVentas(desde, hasta)
      .then((r) => vigente && setResumen(r))
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [desde, hasta])

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <h1 className="text-3xl m-0">Reportes</h1>
      <div className="flex flex-wrap gap-2 items-center text-sm">
        {(
          [
            ['semana', 'Esta semana'],
            ['semanaPasada', 'Semana pasada'],
            ['mes', 'Este mes'],
            ['mesPasado', 'Mes pasado'],
          ] as const
        ).map(([tipo, nombre]) => {
          const r = rangoPredefinido(tipo)
          const activo = r[0] === desde && r[1] === hasta
          return (
            <button key={tipo} onClick={() => setRango(r)} className={`h-9 px-3 rounded border font-semibold ${activo ? 'bg-ink text-bg border-ink' : 'border-border'}`}>
              {nombre}
            </button>
          )
        })}
        <span className="flex items-center gap-1">
          <input type="date" aria-label="Desde" className="h-9 border border-border rounded px-2 bg-surface" value={desde} max={hasta} onChange={(e) => e.target.value && setRango([e.target.value, hasta])} />
          <span>a</span>
          <input type="date" aria-label="Hasta" className="h-9 border border-border rounded px-2 bg-surface" value={hasta} min={desde} onChange={(e) => e.target.value && setRango([desde, e.target.value])} />
        </span>
      </div>
      <div className="flex gap-1 border-b border-border overflow-x-auto" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`h-10 px-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${pestana === p.id ? 'border-ink' : 'border-transparent text-muted'}`}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-ink-dark">No se pudo leer el reporte: {error}</p>}
      {cargando && !resumen && <p className="text-sm text-muted">Cargando…</p>}
      {resumen && pestana === 'resumen' && <Resumen r={resumen} desde={desde} hasta={hasta} />}
      {resumen && pestana === 'tamanos' && <Tamanos r={resumen} />}
      {resumen && pestana === 'menu' && <Menu r={resumen} />}
      {resumen && pestana === 'horas' && <Horas r={resumen} />}
      {pestana === 'depositos' && <Depositos />}
      {pestana === 'exportar' && <Exportar desde={desde} hasta={hasta} />}
    </div>
  )
}

function Resumen({ r, desde, hasta }: { r: ResumenRango; desde: string; hasta: string }) {
  const activos = useStore((s) => s.activos)
  const parametros = useStore((s) => s.parametros)
  const t = useMemo(() => totalesDeRango(r, desde, hasta, activos, parametros), [r, desde, hasta, activos, parametros])
  const canales = porCanal(r)
  const semanas = t.dias / 7
  const meta = parametros.metaUtilidadSemanal * semanas
  const utilidadPorBebida = (canal: string) => {
    const c = canales.find((x) => x.clave === canal)
    return c && c.unidades > 0 ? c.utilidad / c.unidades : null
  }
  const uber = utilidadPorBebida('Uber Eats')
  const publico = utilidadPorBebida('Público en general')
  const maxDia = Math.max(1, ...t.porDia.map((d) => Math.abs(d.ganancia)))

  return (
    <div className="flex flex-col gap-4">
      <section className="border border-border rounded p-4 bg-surface grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        {[
          ['Venta', formatoMoneda(t.venta)],
          ['Ganancia', formatoMoneda(t.ganancia)],
          ['Te llevas', formatoMoneda(t.teLlevas)],
          ['Bebidas', String(t.bebidas)],
        ].map(([e, v]) => (
          <div key={e}>
            <div className="label-uppercase">{e}</div>
            <div className="tabular font-semibold text-lg">{v}</div>
          </div>
        ))}
        <div className="col-span-2 md:col-span-4 text-xs text-muted">
          {t.pedidos} pedidos · ticket promedio {formatoMoneda(t.pedidos ? t.venta / t.pedidos : 0)} · ganancia por bebida {formatoMoneda(t.bebidas ? t.ganancia / t.bebidas : 0)}
        </div>
      </section>

      <section className="border border-border rounded p-4 bg-surface text-sm flex flex-col gap-2">
        <h2 className="text-sm label-uppercase m-0">Real contra meta</h2>
        <div className="flex justify-between">
          <span>
            Meta del periodo ({formatoCantidad(semanas)} semanas × {formatoMoneda(parametros.metaUtilidadSemanal)})
          </span>
          <span className="tabular">{formatoMoneda(meta)}</span>
        </div>
        <div className="h-2.5 bg-card border border-border rounded overflow-hidden">
          <div className="h-full bg-ok" style={{ width: `${Math.min(100, Math.max(0, (t.ganancia / Math.max(1, meta)) * 100))}%` }} />
        </div>
        <span className="text-muted">
          Llevas {formatoPorcentaje(Math.max(0, t.ganancia) / Math.max(1, meta), 0)} de la meta
          {t.bebidas > 0 && t.ganancia < meta ? ` · a este ritmo te faltan ≈ ${Math.ceil((meta - t.ganancia) / (t.ganancia / t.bebidas || 1))} bebidas` : ''}
        </span>
        <div className="flex flex-col gap-0.5 mt-2">
          {t.porDia.map((d) => (
            <div key={d.dia} className="flex items-center gap-2 text-xs">
              <span className="w-20 tabular text-muted">{d.dia.slice(5)}</span>
              <div className="flex-1 h-3 bg-card rounded overflow-hidden">
                <div className={`h-full ${d.ganancia < 0 ? 'bg-ink-dark' : 'bg-ok'}`} style={{ width: `${(Math.abs(d.ganancia) / maxDia) * 100}%` }} />
              </div>
              <span className="w-20 text-right tabular">{formatoMoneda(d.ganancia)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border rounded p-4 bg-surface text-sm">
        <h2 className="text-sm label-uppercase mb-2">Por canal</h2>
        <div className="grid grid-cols-[1fr_3.5rem_5.5rem_5.5rem_5rem] gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Canal</span>
          <span className="text-right">Unid.</span>
          <span className="text-right">Venta</span>
          <span className="text-right">Ganancia</span>
          <span className="text-right">Por unid.</span>
        </div>
        {canales.map((c) => (
          <div key={c.clave} className="grid grid-cols-[1fr_3.5rem_5.5rem_5.5rem_5rem] gap-2 py-1.5 border-b border-border tabular">
            <span className="min-w-0">{c.clave}</span>
            <span className="text-right">{c.unidades}</span>
            <span className="text-right">{formatoMoneda(c.venta)}</span>
            <span className="text-right text-ok">{formatoMoneda(c.utilidad)}</span>
            <span className="text-right text-muted">{formatoMoneda(c.utilidad / c.unidades)}</span>
          </div>
        ))}
        {canales.length === 0 && <p className="text-muted">Sin ventas en el periodo.</p>}
      </section>

      {uber != null && publico != null && (
        <section className="border border-border rounded p-4 bg-surface text-sm">
          <h2 className="text-sm label-uppercase mb-1">¿Me conviene contra Uber?</h2>
          <p className="m-0">
            En Público cada producto te deja <strong className="tabular">{formatoMoneda(publico)}</strong>; en Uber, <strong className="tabular">{formatoMoneda(uber)}</strong>.{' '}
            {publico >= uber
              ? `Público te deja ${formatoMoneda(publico - uber)} más por unidad: conviene empujarlo.`
              : `Uber te deja ${formatoMoneda(uber - publico)} más por unidad (revisa precios o envíos de Público).`}
          </p>
        </section>
      )}
    </div>
  )
}

function Tamanos({ r }: { r: ResumenRango }) {
  const [solo1620, setSolo1620] = useState(false)
  const filas = porTamano(r, solo1620 ? ['16 oz', '20 oz'] : undefined).sort((a, b) => a.clave.localeCompare(b.clave))
  const total = filas.reduce((a, f) => a + f.unidades, 0)
  const mezcla = mezclaTamanosPorSemana(r)
  const matriz = matrizBebidaTamano(r)
  const tamanos = [...new Set(r.lineas.filter((l) => l.tamano).map((l) => l.tamano!))].sort()
  const [verMatriz, setVerMatriz] = useState<'unidades' | 'utilidad'>('unidades')
  const colores = ['#780F0D', '#B8860B', '#4A6741', '#3B5B7A']

  return (
    <div className="flex flex-col gap-4">
      <section className="border border-border rounded p-4 bg-surface text-sm">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm label-uppercase m-0">Por tamaño</h2>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={solo1620} onChange={(e) => setSolo1620(e.target.checked)} />
            Sólo 16 y 20 oz
          </label>
        </div>
        <div className="grid grid-cols-[4rem_3.5rem_3.5rem_5.5rem_5.5rem_5rem] gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Tamaño</span>
          <span className="text-right">Unid.</span>
          <span className="text-right">%</span>
          <span className="text-right">Venta</span>
          <span className="text-right">Ganancia</span>
          <span className="text-right">Por bebida</span>
        </div>
        {filas.map((f) => (
          <div key={f.clave} className="grid grid-cols-[4rem_3.5rem_3.5rem_5.5rem_5.5rem_5rem] gap-2 py-1.5 border-b border-border tabular">
            <span>{f.clave}</span>
            <span className="text-right">{f.unidades}</span>
            <span className="text-right text-muted">{formatoPorcentaje(total ? f.unidades / total : 0, 0)}</span>
            <span className="text-right">{formatoMoneda(f.venta)}</span>
            <span className="text-right text-ok">{formatoMoneda(f.utilidad)}</span>
            <span className="text-right">{formatoMoneda(f.utilidad / f.unidades)}</span>
          </div>
        ))}
        {filas.length === 0 && <p className="text-muted">Sin ventas en el periodo.</p>}
      </section>

      {mezcla.length > 0 && (
        <section className="border border-border rounded p-4 bg-surface text-sm">
          <h2 className="text-sm label-uppercase mb-2">Mezcla de tamaños por semana</h2>
          {mezcla.map((s) => {
            const tot = Object.values(s.tamanos).reduce((a, b) => a + b, 0)
            return (
              <div key={s.semana} className="flex items-center gap-2 py-1">
                <span className="w-24 text-xs text-muted tabular">sem. {s.semana.slice(5)}</span>
                <div className="flex-1 h-5 flex rounded overflow-hidden">
                  {tamanos.map((t, i) =>
                    s.tamanos[t] ? <div key={t} title={`${t}: ${s.tamanos[t]}`} style={{ width: `${(s.tamanos[t] / tot) * 100}%`, background: colores[i % colores.length] }} /> : null,
                  )}
                </div>
                <span className="w-10 text-right tabular">{tot}</span>
              </div>
            )
          })}
          <div className="flex gap-3 mt-2 text-xs">
            {tamanos.map((t, i) => (
              <span key={t} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: colores[i % colores.length] }} />
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {Object.keys(matriz).length > 0 && (
        <section className="border border-border rounded p-4 bg-surface text-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-2 gap-2">
            <h2 className="text-sm label-uppercase m-0">Bebida × tamaño</h2>
            <select className="h-8 border border-border rounded px-2 bg-bg text-xs" value={verMatriz} onChange={(e) => setVerMatriz(e.target.value as 'unidades' | 'utilidad')}>
              <option value="unidades">Unidades</option>
              <option value="utilidad">Ganancia</option>
            </select>
          </div>
          <table className="w-full text-xs tabular">
            <thead>
              <tr>
                <th className="text-left font-normal text-muted">Bebida</th>
                {tamanos.map((t) => (
                  <th key={t} className="text-right font-normal text-muted">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(matriz)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([bebida, celdas]) => (
                  <tr key={bebida} className="border-t border-border">
                    <td className="py-1 pr-2">{bebida}</td>
                    {tamanos.map((t) => (
                      <td key={t} className="text-right py-1">
                        {celdas[t] ? (verMatriz === 'unidades' ? celdas[t].unidades : formatoMoneda(celdas[t].utilidad)) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

const CUADRANTES: Record<Cuadrante, { titulo: string; que: string }> = {
  estrella: { titulo: 'Estrellas', que: 'Se venden y dejan: cuídalas y ponlas al frente.' },
  popular: { titulo: 'Populares de poco margen', que: 'Se venden mucho pero dejan poco: revisa precio o receta.' },
  rentable: { titulo: 'Rentables poco vendidas', que: 'Dejan bien pero salen poco: promuévelas.' },
  revisar: { titulo: 'Por revisar', que: 'Ni se venden ni dejan: candidatas a salir del menú.' },
}

function Menu({ r }: { r: ResumenRango }) {
  const menu = menuPorRentabilidad(r)
  if (menu.length === 0) return <p className="text-sm text-muted">Sin ventas en el periodo.</p>
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {(Object.keys(CUADRANTES) as Cuadrante[]).map((c) => {
        const lista = menu.filter((m) => m.cuadrante === c)
        return (
          <section key={c} className={`border rounded p-4 bg-surface text-sm ${c === 'estrella' ? 'border-ok' : c === 'revisar' ? 'border-ink-dark' : 'border-border'}`}>
            <h2 className="text-sm label-uppercase m-0">{CUADRANTES[c].titulo}</h2>
            <p className="text-xs text-muted mt-1 mb-2">{CUADRANTES[c].que}</p>
            {lista.length === 0 && <p className="text-xs text-muted m-0">Ninguna.</p>}
            {lista.map((m) => (
              <div key={m.bebida} className="flex justify-between py-0.5">
                <span>{m.bebida}</span>
                <span className="tabular text-muted">
                  {m.unidades} · {formatoMoneda(m.utilidadPorBebida)}
                </span>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
function Horas({ r }: { r: ResumenRango }) {
  const { celdas, max, desde, hasta } = horasPico(r)
  if (max === 0) return <p className="text-sm text-muted">Sin ventas en el periodo.</p>
  const horas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)
  const orden = [1, 2, 3, 4, 5, 6, 0]
  return (
    <section className="border border-border rounded p-4 bg-surface text-xs overflow-x-auto">
      <h2 className="text-sm label-uppercase mb-2">Bebidas por día y hora</h2>
      <table className="tabular">
        <thead>
          <tr>
            <th />
            {horas.map((h) => (
              <th key={h} className="font-normal text-muted px-0.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orden.map((dow) => (
            <tr key={dow}>
              <td className="pr-2 text-muted">{DIAS[dow]}</td>
              {horas.map((h) => {
                const c = celdas[`${dow}-${h}`]
                const n = c?.bebidas ?? 0
                return (
                  <td key={h} className="p-0.5">
                    <div
                      title={`${DIAS[dow]} ${h}:00 · ${n} bebidas · ${formatoMoneda(c?.utilidad ?? 0)}`}
                      className="w-7 h-7 rounded flex items-center justify-center"
                      style={{ background: n ? `rgba(120, 15, 13, ${0.15 + 0.85 * (n / max)})` : 'transparent', color: n / max > 0.5 ? '#FEEFC4' : undefined }}
                    >
                      {n || ''}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Depositos() {
  const canales = useStore((s) => s.canales.filter((c) => c.tipo === 'plataforma'))
  const [depositos, setDepositos] = useState<DepositoStore[] | null>(null)
  const [esperados, setEsperados] = useState<Record<string, number>>({})
  const [form, setForm] = useState({ fecha: aTextoDia(new Date()), canalNombre: canales[0]?.nombre ?? '', monto: '', periodoDesde: '', periodoHasta: '', notas: '' })
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)

  async function recargar() {
    const lista = await cargarDepositos()
    setDepositos(lista)
    // Depósito esperado de cada periodo, del mismo resumen agregado de la base.
    const calc: Record<string, number> = {}
    for (const d of lista) {
      if (!d.periodoDesde || !d.periodoHasta) continue
      const r = await resumenVentas(d.periodoDesde, d.periodoHasta)
      calc[d.id] = r.lineas.filter((l) => l.canal === d.canalNombre).reduce((a, l) => a + l.deposito_esperado, 0)
    }
    setEsperados(calc)
  }
  useEffect(() => {
    recargar().catch((e) => setMensaje({ ok: false, texto: mensajeError(e) }))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <section className="border border-border rounded p-4 bg-surface flex flex-col gap-3 text-sm">
        <h2 className="text-sm label-uppercase m-0">Registrar depósito</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            Plataforma
            <select className="h-10 border border-border rounded px-2 bg-bg" value={form.canalNombre} onChange={(e) => setForm({ ...form, canalNombre: e.target.value })}>
              {canales.map((c) => (
                <option key={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Fecha del depósito
            <input type="date" className="h-10 border border-border rounded px-2 bg-bg" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            Ventas desde
            <input type="date" className="h-10 border border-border rounded px-2 bg-bg" value={form.periodoDesde} onChange={(e) => setForm({ ...form, periodoDesde: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            hasta
            <input type="date" className="h-10 border border-border rounded px-2 bg-bg" value={form.periodoHasta} onChange={(e) => setForm({ ...form, periodoHasta: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            Monto depositado ($)
            <input inputMode="decimal" className="h-10 border border-border rounded px-2 bg-bg" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            Notas
            <input className="h-10 border border-border rounded px-2 bg-bg" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </label>
        </div>
        <button
          className="h-11 rounded bg-ink text-bg font-semibold"
          onClick={() =>
            registrarDeposito({
              fecha: form.fecha,
              canalNombre: form.canalNombre,
              monto: Number(form.monto.replace(',', '.')),
              periodoDesde: form.periodoDesde || undefined,
              periodoHasta: form.periodoHasta || undefined,
              notas: form.notas,
            })
              .then(() => {
                setForm({ ...form, monto: '', notas: '' })
                setMensaje({ ok: true, texto: 'Depósito registrado.' })
                return recargar()
              })
              .catch((e) => setMensaje({ ok: false, texto: mensajeError(e) }))
          }
        >
          Registrar depósito
        </button>
        {mensaje && <p className={`m-0 ${mensaje.ok ? 'text-ok' : 'text-ink-dark'}`}>{mensaje.texto}</p>}
      </section>

      <section className="border border-border rounded p-4 bg-surface text-sm">
        <h2 className="text-sm label-uppercase mb-2">Depósitos contra lo esperado</h2>
        {!depositos && <p className="text-muted">Cargando…</p>}
        {depositos?.length === 0 && <p className="text-muted">Todavía no registras depósitos.</p>}
        {depositos?.map((d) => {
          const esperado = esperados[d.id]
          const dif = esperado != null ? d.monto - esperado : null
          return (
            <div key={d.id} className="flex justify-between gap-2 py-1.5 border-b border-border">
              <span>
                {d.fecha} · {d.canalNombre}
                <span className="block text-xs text-muted">
                  {d.periodoDesde ? `ventas del ${d.periodoDesde} al ${d.periodoHasta}` : 'sin periodo'}
                  {d.notas ? ` · ${d.notas}` : ''}
                </span>
              </span>
              <span className="text-right tabular">
                {formatoMoneda(d.monto)}
                {esperado != null && (
                  <span className={`block text-xs ${Math.abs(dif!) < 1 ? 'text-ok' : 'text-warn'}`}>
                    esperado {formatoMoneda(esperado)}
                    {Math.abs(dif!) >= 1 && ` · ${dif! > 0 ? 'sobran' : 'faltan'} ${formatoMoneda(Math.abs(dif!))}`}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function Exportar({ desde, hasta }: { desde: string; hasta: string }) {
  const insumos = useStore((s) => s.insumos)
  const existencias = useStore((s) => s.existencias)
  const [trabajando, setTrabajando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function hacer(nombre: string, fn: () => Promise<string>) {
    setTrabajando(nombre)
    setError(null)
    try {
      descargar(`bendita-${nombre}-${desde}_${hasta}.csv`, await fn())
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setTrabajando(null)
    }
  }

  const botones: { nombre: string; texto: string; fn: () => Promise<string> }[] = [
    {
      nombre: 'ventas',
      texto: 'Ventas (una fila por producto vendido)',
      fn: async () => {
        const filas = await exportarVentas(desde, hasta)
        return aCsv(
          ['fecha', 'hora', 'canal', 'pedido', 'estado', 'forma_pago', 'cliente', 'tipo', 'producto', 'tamano', 'leche', 'adicionales', 'cantidad', 'precio_unitario', 'total', 'iva', 'comision', 'insumos', 'empaque_vaso', 'indirectos', 'mano_obra', 'utilidad', 'retencion_isr', 'retencion_iva', 'deposito_esperado'],
          filas.map(({ linea: l, pedido: p }) => {
            const f = new Date(l.fechaHora)
            const q = l.cantidad
            const d = l.desglose
            return [
              aTextoDia(f),
              f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
              l.canalNombre,
              l.pedidoId.slice(0, 8),
              p?.estado,
              p?.formaPago,
              p?.clienteNombre,
              l.tipo,
              l.bebidaNombre ?? l.botanaNombre ?? (l.tipo === 'cargo_servicio' ? 'Cargo de servicio' : ''),
              l.tamanoNombre,
              l.lecheNombre,
              l.adicionalesElegidos.map((a) => (a.sabor ? `${a.nombre} (${a.sabor})` : a.nombre)).join(' + '),
              q,
              d.precio,
              d.precio * q,
              d.ivaTrasladado * q,
              d.comision * q,
              d.insumos * q,
              (d.empaque + d.vasoTapa) * q,
              d.indirectos * q,
              d.manoDeObra * q,
              d.utilidad * q,
              d.retencionIsr * q,
              d.retencionIva * q,
              d.depositoEsperado * q,
            ]
          }),
        )
      },
    },
    {
      nombre: 'compras',
      texto: 'Compras (últimas 500)',
      fn: async () => {
        const compras = (await cargarHistorialCompras(500)).filter((c) => c.fecha >= desde && c.fecha <= hasta)
        return aCsv(
          ['fecha', 'proveedor', 'con_factura', 'insumo', 'presentaciones', 'contenido_por_presentacion', 'precio_por_presentacion', 'iva', 'total'],
          compras.flatMap((c) => c.lineas.map((l) => [c.fecha, c.proveedor, c.conFactura ? 'sí' : 'no', insumos[l.insumoClave]?.nombre ?? l.insumoClave, l.presentaciones, l.contenidoUtil, l.precio, l.iva, l.presentaciones * l.precio])),
        )
      },
    },
    {
      nombre: 'movimientos',
      texto: 'Movimientos de inventario (kárdex)',
      fn: async () => {
        const movs = await exportarMovimientos(desde, hasta)
        return aCsv(
          ['fecha', 'insumo', 'tipo', 'cantidad', 'unidad', 'costo_unitario', 'nota'],
          movs.map((m) => [m.fecha, insumos[m.insumoClave]?.nombre ?? m.insumoClave, m.tipo, m.cantidad, insumos[m.insumoClave]?.unidad, m.costoUnitario, m.nota]),
        )
      },
    },
    {
      nombre: 'inventario',
      texto: 'Existencias de hoy',
      fn: async () =>
        aCsv(
          ['insumo', 'categoria', 'prioridad', 'existencia', 'unidad', 'objetivo'],
          Object.values(insumos)
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((i) => [i.nombre, i.categoria, i.prioridad, existencias[i.clave]?.existencia ?? 0, i.unidad, existencias[i.clave]?.stockObjetivoEfectivo ?? '']),
        ),
    },
  ]

  return (
    <section className="border border-border rounded p-4 bg-surface flex flex-col gap-2 text-sm">
      <h2 className="text-sm label-uppercase m-0">Exportar a CSV (Excel)</h2>
      <p className="text-xs text-muted m-0">
        Del {desde} al {hasta}. Excel abre estos archivos con acentos correctos.
      </p>
      {botones.map((b) => (
        <button key={b.nombre} disabled={trabajando != null} className="h-11 rounded border border-border font-semibold text-left px-3 disabled:opacity-50" onClick={() => hacer(b.nombre, b.fn)}>
          {trabajando === b.nombre ? 'Preparando…' : b.texto}
        </button>
      ))}
      {error && <p className="text-ink-dark m-0">No se pudo exportar: {error}</p>}
    </section>
  )
}
