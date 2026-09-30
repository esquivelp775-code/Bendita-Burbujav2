import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { corteDeCaja } from '../../lib/calculos'
import { formatoCantidad, formatoFecha, formatoMoneda } from '../../lib/format'
import { cargarCierre, cerrarDia, registrarConteoLocal } from '../../lib/store/remoteStore'
import { listaDeCompras, resumenDia, ventasPorFormaPago } from '../../lib/store/selectors'
import { useStore } from '../../lib/store/useStore'
import { mensajeError } from '../../lib/errores'

const aTexto = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const num = (t: string) => Number(t.replace(',', '.'))

export function CierreScreen() {
  const [fechaTexto, setFechaTexto] = useState(aTexto(new Date()))
  const [y, m, d] = fechaTexto.split('-').map(Number)
  const fecha = new Date(y, m - 1, d, 12)
  const resumen = useStore((s) => resumenDia(s, fecha))
  const pagos = useStore((s) => ventasPorFormaPago(s, fecha))
  const grupos = useStore(listaDeCompras)
  const insumosAlta = useStore((s) =>
    Object.values(s.insumos)
      .filter((i) => i.prioridad === 'alta' && i.recompra !== false)
      .sort((a, b) => a.nombre.localeCompare(b.nombre)),
  )
  const existencias = useStore((s) => s.existencias)

  const [fondo, setFondo] = useState('0')
  const [pagosEfectivo, setPagosEfectivo] = useState<string | null>(null)
  const [contado, setContado] = useState('')
  const [mermaTapioca, setMermaTapioca] = useState('')
  const [notas, setNotas] = useState('')
  const [conteos, setConteos] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [yaCerrado, setYaCerrado] = useState(false)

  // Si el día ya se cerró, se precarga para poder corregirlo.
  useEffect(() => {
    let vigente = true
    setYaCerrado(false)
    cargarCierre(fechaTexto)
      .then((c) => {
        if (!vigente || !c) return
        setYaCerrado(true)
        setMermaTapioca(c.mermaTapiocaG ? String(c.mermaTapiocaG) : '')
        setNotas(c.notas ?? '')
        if (c.efectivoContado != null) setContado(String(c.efectivoContado))
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [fechaTexto])

  const pagosEfectivoNum = pagosEfectivo != null ? num(pagosEfectivo) || 0 : pagos.enviosPagadosEnEfectivo
  const corte = corteDeCaja({
    fondoInicial: num(fondo) || 0,
    ventasEfectivo: pagos.efectivo,
    pagosEfectivo: pagosEfectivoNum,
    contado: contado.trim() === '' ? null : num(contado),
  })

  async function cerrar() {
    setGuardando(true)
    setMensaje(null)
    try {
      const contados = Object.entries(conteos).filter(([, v]) => v.trim() !== '' && Number.isFinite(num(v)) && num(v) >= 0)
      for (const [clave, v] of contados) await registrarConteoLocal(clave, num(v), `Conteo del cierre ${fechaTexto}`)
      await cerrarDia({
        fecha: fechaTexto,
        mermaTapiocaG: num(mermaTapioca) || 0,
        notas,
        efectivoEsperado: corte.esperado,
        efectivoContado: contado.trim() === '' ? undefined : num(contado),
      })
      setConteos({})
      setYaCerrado(true)
      setMensaje({ ok: true, texto: `Día cerrado.${contados.length ? ` ${contados.length} conteos registrados.` : ''}` })
    } catch (e) {
      setMensaje({ ok: false, texto: mensajeError(e) })
    } finally {
      setGuardando(false)
    }
  }

  const dsg = resumen.desglose
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-5">
      <div className="flex justify-between items-end gap-2 flex-wrap">
        <h1 className="text-3xl m-0">Cierre del día</h1>
        <input type="date" aria-label="Fecha del cierre" className="h-10 border border-border rounded px-2 bg-surface" value={fechaTexto} onChange={(e) => setFechaTexto(e.target.value)} />
      </div>
      <p className="text-sm text-muted m-0 -mt-3">
        {formatoFecha(fecha)}
        {yaCerrado && ' · ya se cerró; puedes corregirlo'}
      </p>

      <section className="border border-border rounded p-4 bg-surface grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="label-uppercase">Venta</div>
          <div className="tabular font-semibold">{formatoMoneda(dsg.venta)}</div>
        </div>
        <div>
          <div className="label-uppercase">Ganancia</div>
          <div className={`tabular font-semibold ${dsg.ganancia < 0 ? 'text-ink-dark' : 'text-ok'}`}>{formatoMoneda(dsg.ganancia)}</div>
        </div>
        <div>
          <div className="label-uppercase">Te llevas</div>
          <div className="tabular font-semibold">{formatoMoneda(dsg.teLlevas)}</div>
        </div>
        <div className="col-span-3 text-xs text-muted">
          {resumen.numeroBebidas} bebidas ·{' '}
          <Link className="underline" to="/desglose">
            ver desglose
          </Link>
        </div>
      </section>

      <section className="border border-border rounded p-4 bg-surface flex flex-col gap-2 text-sm">
        <h2 className="text-sm label-uppercase m-0">Corte de caja</h2>
        {[
          ['Efectivo', pagos.efectivo],
          ['Transferencia', pagos.transferencia],
          ['Tarjeta', pagos.tarjeta],
          ['Uber / Rappi (depositan ellos)', pagos.plataforma],
          ['Sin forma de pago registrada', pagos.sinRegistrar],
        ]
          .filter(([etiqueta, v]) => etiqueta === 'Efectivo' || (v as number) > 0)
          .map(([etiqueta, v]) => (
            <div key={etiqueta as string} className="flex justify-between">
              <span>{etiqueta as string}</span>
              <span className="tabular">{formatoMoneda(v as number)}</span>
            </div>
          ))}
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
          <label className="flex flex-col gap-1">
            Fondo inicial
            <input inputMode="decimal" className="h-10 border border-border rounded px-2 bg-bg tabular" value={fondo} onChange={(e) => setFondo(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            Pagaste en efectivo
            <input
              inputMode="decimal"
              className="h-10 border border-border rounded px-2 bg-bg tabular"
              value={pagosEfectivo ?? String(pagos.enviosPagadosEnEfectivo)}
              onChange={(e) => setPagosEfectivo(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            Contaste
            <input inputMode="decimal" className="h-10 border border-border rounded px-2 bg-bg tabular" value={contado} onChange={(e) => setContado(e.target.value)} />
          </label>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Debería haber</span>
          <span className="tabular">{formatoMoneda(corte.esperado)}</span>
        </div>
        {corte.diferencia != null && (
          <div className={`flex justify-between font-semibold ${corte.diferencia === 0 ? 'text-ok' : corte.diferencia < 0 ? 'text-ink-dark' : 'text-warn'}`}>
            <span>{corte.diferencia === 0 ? 'Cuadra' : corte.diferencia < 0 ? 'Falta' : 'Sobra'}</span>
            <span className="tabular">{formatoMoneda(Math.abs(corte.diferencia))}</span>
          </div>
        )}
      </section>

      <section className="border border-border rounded p-4 bg-surface flex flex-col gap-2 text-sm">
        <h2 className="text-sm label-uppercase m-0">Conteo rápido · prioridad alta</h2>
        <p className="text-xs text-muted m-0">Deja vacío lo que no contaste. Lo que escribas queda como ajuste por conteo.</p>
        {insumosAlta.map((i) => (
          <label key={i.clave} className="grid grid-cols-[1fr_6rem_6rem] gap-2 items-center">
            <span className="min-w-0">{i.nombre}</span>
            <span className="text-xs text-muted text-right tabular">sistema {formatoCantidad(existencias[i.clave]?.existencia ?? 0, i.unidad)}</span>
            <input
              inputMode="decimal"
              aria-label={`Conteo de ${i.nombre}`}
              className="h-9 border border-border rounded px-2 bg-bg text-right tabular"
              value={conteos[i.clave] ?? ''}
              onChange={(e) => setConteos((c) => ({ ...c, [i.clave]: e.target.value }))}
            />
          </label>
        ))}
      </section>

      <section className="border border-border rounded p-4 bg-surface flex flex-col gap-2 text-sm">
        <label className="flex justify-between items-center gap-2">
          Tapioca que sobró y se tiró (g secos)
          <input inputMode="decimal" className="w-24 h-10 border border-border rounded px-2 bg-bg text-right tabular" value={mermaTapioca} onChange={(e) => setMermaTapioca(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Notas del día
          <input className="h-10 border border-border rounded px-2 bg-bg" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>
      </section>

      {grupos.length > 0 && (
        <section className="border border-warn rounded p-4 bg-surface flex flex-col gap-1 text-sm">
          <h2 className="text-sm label-uppercase m-0 mb-1 text-warn">Lista de compras</h2>
          {grupos.map((g) => (
            <div key={g.proveedor}>
              <span className="font-semibold">{g.proveedor}</span>
              <span className="text-muted">
                {' '}
                · {g.renglones.map((r) => `${r.presentaciones} ${r.nombre}`).join(', ')}
                {g.total > 0 ? ` · ≈ ${formatoMoneda(g.total)}` : ''}
              </span>
            </div>
          ))}
          <Link to="/inventario" className="underline text-xs mt-1">
            Ir a Inventario
          </Link>
        </section>
      )}

      <button disabled={guardando} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={cerrar}>
        {guardando ? 'Cerrando…' : yaCerrado ? 'Guardar cambios del cierre' : 'Cerrar el día'}
      </button>
      {mensaje && <p className={`text-sm m-0 ${mensaje.ok ? 'text-ok' : 'text-ink-dark'}`}>{mensaje.texto}</p>}
    </div>
  )
}
