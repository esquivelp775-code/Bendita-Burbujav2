import { useEffect, useMemo, useState } from 'react'
import { formatoCantidad, formatoMoneda, formatoPorcentaje } from '../../lib/format'
import { mensajeError } from '../../lib/errores'
import { cargarInventarios, guardarInventario, resumenInventario, type InventarioGuardado, type RenglonResumenInventario } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

const BORRADOR = 'bb-inventario-semanal-v1'
const aTexto = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const num = (t: string) => Number(t.replace(',', '.'))
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

function leerBorrador(): { fecha: string; conteos: Record<string, string>; notas: string } | null {
  try {
    const t = localStorage.getItem(BORRADOR)
    return t ? JSON.parse(t) : null
  } catch {
    return null
  }
}

export function InventarioSemanal() {
  const [historial, setHistorial] = useState<InventarioGuardado[] | null>(null)
  const [abierto, setAbierto] = useState<InventarioGuardado | null>(null)
  const [contando, setContando] = useState(() => leerBorrador() != null)
  const [error, setError] = useState<string | null>(null)

  const recargar = () =>
    cargarInventarios()
      .then(setHistorial)
      .catch((e) => setError(mensajeError(e)))
  useEffect(() => {
    void recargar()
  }, [])

  const ultimo = historial?.[0]
  if (abierto) return <DetalleInventario inv={abierto} onCerrar={() => setAbierto(null)} />
  if (contando)
    return (
      <Conteo
        desde={ultimo ? new Date(ultimo.creadoEn) : new Date(Date.now() - 7 * 86_400_000)}
        esPrimero={!ultimo}
        onCancelar={() => setContando(false)}
        onGuardado={(inv) => {
          setContando(false)
          void recargar().then(() => inv && setAbierto(inv))
        }}
      />
    )

  return (
    <div className="flex flex-col gap-4">
      <section className="border border-border rounded p-4 bg-surface flex flex-col gap-2 text-sm">
        <h2 className="text-sm label-uppercase m-0">Inventario semanal</h2>
        <p className="m-0 text-muted">
          Cuenta lo que tienes físicamente. La app compara cada insumo contra lo que debería haber (lo del inventario anterior + compras − ventas −
          mermas registradas) y te dice cuánto se perdió sin registrar, en cantidad y en pesos.
        </p>
        <p className="m-0">
          {ultimo ? (
            <>
              Último inventario: <strong>{fechaCorta(ultimo.creadoEn)}</strong> · variación {formatoMoneda(ultimo.valorDiferencia)}
            </>
          ) : (
            'Todavía no hay inventarios: el primero se compara contra los últimos 7 días.'
          )}
        </p>
        <button className="h-12 rounded bg-ink text-bg font-semibold" onClick={() => setContando(true)}>
          {leerBorrador() ? 'Seguir con el inventario en curso' : 'Empezar inventario semanal'}
        </button>
      </section>

      {error && <p className="text-sm text-ink-dark">No se pudo leer el historial: {error}</p>}
      {historial && historial.length > 0 && (
        <section className="border border-border rounded p-4 bg-surface text-sm">
          <h2 className="text-sm label-uppercase mb-2">Semana a semana</h2>
          <div className="grid grid-cols-[1fr_6rem_6rem_4rem] gap-2 text-xs label-uppercase pb-2 border-b border-border">
            <span>Fecha</span>
            <span className="text-right">Variación</span>
            <span className="text-right">Mermas</span>
            <span className="text-right">Contados</span>
          </div>
          {historial.map((h) => (
            <button key={h.id} onClick={() => setAbierto(h)} className="w-full grid grid-cols-[1fr_6rem_6rem_4rem] gap-2 py-2 border-b border-border text-left tabular">
              <span>{fechaCorta(h.creadoEn)}</span>
              <span className={`text-right ${h.valorDiferencia < -0.5 ? 'text-ink-dark' : h.valorDiferencia > 0.5 ? 'text-warn' : 'text-ok'}`}>{formatoMoneda(h.valorDiferencia)}</span>
              <span className="text-right text-muted">{formatoMoneda(h.valorMermas)}</span>
              <span className="text-right text-muted">{h.lineas.length}</span>
            </button>
          ))}
          <p className="text-xs text-muted mt-2 mb-0">Variación negativa = faltó (merma no registrada). Positiva = sobró (algo no se registró como venta o se contó de más).</p>
        </section>
      )}
    </div>
  )
}

function Conteo({ desde, esPrimero, onCancelar, onGuardado }: { desde: Date; esPrimero: boolean; onCancelar: () => void; onGuardado: (inv?: InventarioGuardado) => void }) {
  const insumos = useStore((s) => s.insumos)
  const borrador = leerBorrador()
  const [resumen, setResumen] = useState<Record<string, RenglonResumenInventario> | null>(null)
  const [conteos, setConteos] = useState<Record<string, string>>(borrador?.conteos ?? {})
  const [notas, setNotas] = useState(borrador?.notas ?? '')
  const [fecha] = useState(borrador?.fecha ?? aTexto(new Date()))
  const [buscar, setBuscar] = useState('')
  const [soloDiferencias, setSoloDiferencias] = useState(false)
  const [detalle, setDetalle] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    resumenInventario(desde)
      .then(setResumen)
      .catch((e) => setError(mensajeError(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El borrador se guarda en el teléfono a cada cambio.
  useEffect(() => {
    try {
      localStorage.setItem(BORRADOR, JSON.stringify({ fecha, conteos, notas }))
    } catch {
      /* sin almacenamiento */
    }
  }, [fecha, conteos, notas])

  const filas = useMemo(() => {
    if (!resumen) return []
    return Object.values(insumos)
      .filter((i) => resumen[i.clave])
      .map((i) => {
        const r = resumen[i.clave]
        const texto = conteos[i.clave] ?? ''
        const contado = texto.trim() === '' ? null : num(texto)
        const valido = contado != null && Number.isFinite(contado) && contado >= 0
        const diferencia = valido ? contado! - r.sistema : null
        return { insumo: i, r, texto, contado: valido ? contado : null, invalido: texto.trim() !== '' && !valido, diferencia, valor: diferencia != null ? diferencia * r.costoUnitario : null }
      })
      .sort((a, b) => a.insumo.categoria.localeCompare(b.insumo.categoria) || a.insumo.nombre.localeCompare(b.insumo.nombre))
  }, [resumen, insumos, conteos])

  const contados = filas.filter((f) => f.contado != null)
  const valorTotal = contados.reduce((a, f) => a + (f.valor ?? 0), 0)
  const faltante = contados.reduce((a, f) => a + Math.min(0, f.valor ?? 0), 0)
  const sobrante = contados.reduce((a, f) => a + Math.max(0, f.valor ?? 0), 0)
  const mermasValor = filas.reduce((a, f) => a + f.r.mermas * f.r.costoUnitario, 0)
  const visibles = filas.filter(
    (f) => (!buscar.trim() || f.insumo.nombre.toLowerCase().includes(buscar.trim().toLowerCase())) && (!soloDiferencias || (f.diferencia != null && Math.abs(f.diferencia) > 1e-9)),
  )
  const hayInvalidos = filas.some((f) => f.invalido)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await guardarInventario({
        fecha,
        desde,
        notas,
        lineas: contados.map((f) => ({ insumoClave: f.insumo.clave, ...f.r, contado: f.contado! })),
      })
      try {
        localStorage.removeItem(BORRADOR)
      } catch {
        /* nada */
      }
      const [inv] = await cargarInventarios(1)
      onGuardado(inv)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  function descartar() {
    try {
      localStorage.removeItem(BORRADOR)
    } catch {
      /* nada */
    }
    onCancelar()
  }

  if (error && !resumen) return <p className="text-sm text-ink-dark">No se pudo preparar el inventario: {error}</p>
  if (!resumen) return <p className="text-sm text-muted">Preparando inventario…</p>

  let categoria = ''
  return (
    <div className="flex flex-col gap-3 pb-40 md:pb-0">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-lg font-display m-0">Inventario del {fecha}</h2>
        <button className="text-sm underline" onClick={onCancelar}>
          Pausar
        </button>
      </div>
      <p className="text-xs text-muted m-0">
        Compara contra {esPrimero ? 'los últimos 7 días' : `el inventario del ${fechaCorta(desde.toISOString())}`}. Escribe lo que contaste; lo que dejes vacío no se
        toca. Se guarda en tu teléfono mientras cuentas.
      </p>
      <div className="flex gap-2 items-center flex-wrap">
        <input className="h-10 flex-1 min-w-[10rem] border border-border rounded px-3 bg-surface text-sm" placeholder="Buscar insumo…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={soloDiferencias} onChange={(e) => setSoloDiferencias(e.target.checked)} />
          Sólo con diferencia
        </label>
      </div>

      <div className="border border-border rounded bg-surface">
        {visibles.map((f) => {
          const cabecera = f.insumo.categoria !== categoria
          categoria = f.insumo.categoria
          const u = f.insumo.unidad
          const pct = f.diferencia != null && f.r.sistema > 0 ? f.diferencia / f.r.sistema : null
          return (
            <div key={f.insumo.clave}>
              {cabecera && <div className="px-3 pt-3 pb-1 label-uppercase text-xs bg-card">{categoria}</div>}
              <div className="px-3 py-2 border-b border-border text-sm">
                <div className="grid grid-cols-[1fr_6.5rem] gap-2 items-center">
                  <button className="text-left min-w-0" onClick={() => setDetalle(detalle === f.insumo.clave ? null : f.insumo.clave)}>
                    {f.insumo.nombre}
                    <span className="block text-xs text-muted">
                      debería haber <span className="tabular">{formatoCantidad(f.r.sistema, u)}</span> · ver cálculo
                    </span>
                  </button>
                  <input
                    inputMode="decimal"
                    aria-label={`Contado de ${f.insumo.nombre}`}
                    placeholder="contado"
                    className={`h-11 border rounded px-2 bg-bg text-right tabular ${f.invalido ? 'border-ink-dark' : 'border-border'}`}
                    value={f.texto}
                    onChange={(e) => setConteos((c) => ({ ...c, [f.insumo.clave]: e.target.value }))}
                  />
                </div>
                {f.diferencia != null && Math.abs(f.diferencia) > 1e-9 && (
                  <div className={`text-xs mt-1 tabular ${f.diferencia < 0 ? 'text-ink-dark' : 'text-warn'}`}>
                    {f.diferencia < 0 ? 'Faltan' : 'Sobran'} {formatoCantidad(Math.abs(f.diferencia), u)}
                    {pct != null ? ` (${formatoPorcentaje(Math.abs(pct), 0)})` : ''} · {formatoMoneda(Math.abs(f.valor ?? 0))}
                  </div>
                )}
                {f.diferencia != null && Math.abs(f.diferencia) <= 1e-9 && <div className="text-xs mt-1 text-ok">Cuadra</div>}
                {detalle === f.insumo.clave && (
                  <div className="text-xs text-muted mt-1 grid grid-cols-2 gap-x-3 tabular">
                    <span>Había (inventario anterior)</span>
                    <span className="text-right">{formatoCantidad(f.r.inicial, u)}</span>
                    <span>+ Compras</span>
                    <span className="text-right">{formatoCantidad(f.r.compras, u)}</span>
                    <span>− Ventas</span>
                    <span className="text-right">{formatoCantidad(f.r.ventas, u)}</span>
                    <span>− Mermas registradas</span>
                    <span className="text-right">{formatoCantidad(f.r.mermas, u)}</span>
                    {Math.abs(f.r.otros) > 1e-9 && (
                      <>
                        <span>± Ajustes y conteos</span>
                        <span className="text-right">{formatoCantidad(f.r.otros, u)}</span>
                      </>
                    )}
                    <span className="font-semibold">= Debería haber</span>
                    <span className="text-right font-semibold">{formatoCantidad(f.r.sistema, u)}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {visibles.length === 0 && <p className="text-sm text-muted p-3 m-0">Nada que mostrar con ese filtro.</p>}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Notas del inventario
        <input className="h-10 border border-border rounded px-2 bg-surface" value={notas} onChange={(e) => setNotas(e.target.value)} />
      </label>

      {/* Resumen fijo abajo */}
      <div className="fixed md:static left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 bg-bg border-t md:border border-border md:rounded p-3 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-2 tabular">
          <span>
            {contados.length} de {filas.length} contados
          </span>
          <span className={valorTotal < -0.005 ? 'text-ink-dark font-semibold' : valorTotal > 0.005 ? 'text-warn font-semibold' : 'text-ok font-semibold'}>
            Variación {formatoMoneda(valorTotal)}
          </span>
        </div>
        <div className="flex justify-between gap-2 text-xs text-muted tabular">
          <span>
            Faltante {formatoMoneda(-faltante)} · sobrante {formatoMoneda(sobrante)}
          </span>
          <span>Mermas registradas {formatoMoneda(mermasValor)}</span>
        </div>
        <div className="flex gap-2">
          <button disabled={guardando || contados.length === 0 || hayInvalidos} className="h-11 flex-1 rounded bg-ink text-bg font-semibold disabled:opacity-50" onClick={guardar}>
            {guardando ? 'Guardando…' : 'Guardar inventario'}
          </button>
          <button className="h-11 px-3 rounded border border-border text-xs" onClick={descartar}>
            Descartar
          </button>
        </div>
        {hayInvalidos && <p className="text-xs text-ink-dark m-0">Hay cantidades inválidas.</p>}
        {error && <p className="text-xs text-ink-dark m-0">No se guardó: {error}</p>}
      </div>
    </div>
  )
}

function DetalleInventario({ inv, onCerrar }: { inv: InventarioGuardado; onCerrar: () => void }) {
  const insumos = useStore((s) => s.insumos)
  const lineas = [...inv.lineas].sort((a, b) => a.diferencia * a.costoUnitario - b.diferencia * b.costoUnitario)
  const conDiferencia = lineas.filter((l) => Math.abs(l.diferencia) > 1e-9)
  return (
    <div className="flex flex-col gap-3 text-sm">
      <button className="text-sm underline self-start" onClick={onCerrar}>
        ← Inventarios
      </button>
      <section className="border border-border rounded p-4 bg-surface grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="label-uppercase">Variación</div>
          <div className={`tabular font-semibold ${inv.valorDiferencia < -0.005 ? 'text-ink-dark' : 'text-ok'}`}>{formatoMoneda(inv.valorDiferencia)}</div>
        </div>
        <div>
          <div className="label-uppercase">Mermas registradas</div>
          <div className="tabular font-semibold">{formatoMoneda(inv.valorMermas)}</div>
        </div>
        <div>
          <div className="label-uppercase">Pérdida total</div>
          <div className="tabular font-semibold">{formatoMoneda(inv.valorMermas - Math.min(0, inv.valorDiferencia))}</div>
        </div>
        <div className="col-span-3 text-xs text-muted">
          {fechaCorta(inv.creadoEn)} · {inv.lineas.length} insumos contados · {conDiferencia.length} con diferencia
          {inv.notas ? ` · ${inv.notas}` : ''}
        </div>
      </section>
      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-2">Por insumo (lo que más costó primero)</h2>
        <div className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Insumo</span>
          <span className="text-right">Debía</span>
          <span className="text-right">Contado</span>
          <span className="text-right">Dif. $</span>
        </div>
        {lineas.map((l) => {
          const u = insumos[l.insumoClave]?.unidad
          return (
            <div key={l.insumoClave} className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-2 py-1.5 border-b border-border tabular">
              <span className="min-w-0">
                {insumos[l.insumoClave]?.nombre ?? l.insumoClave}
                {Math.abs(l.diferencia) > 1e-9 && (
                  <span className={`block text-xs ${l.diferencia < 0 ? 'text-ink-dark' : 'text-warn'}`}>
                    {l.diferencia < 0 ? 'faltaron' : 'sobraron'} {formatoCantidad(Math.abs(l.diferencia), u)}
                    {l.mermas > 0 ? ` · mermas registradas ${formatoCantidad(l.mermas, u)}` : ''}
                  </span>
                )}
              </span>
              <span className="text-right text-muted">{formatoCantidad(l.sistema, u)}</span>
              <span className="text-right">{formatoCantidad(l.contado, u)}</span>
              <span className={`text-right ${l.diferencia < -1e-9 ? 'text-ink-dark' : l.diferencia > 1e-9 ? 'text-warn' : 'text-ok'}`}>{formatoMoneda(l.diferencia * l.costoUnitario)}</span>
            </div>
          )
        })}
      </section>
    </div>
  )
}
