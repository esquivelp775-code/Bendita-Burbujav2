import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { InventarioSemanal } from './InventarioSemanal'
import { Mermas } from './Mermas'
import { Proveedores } from './Proveedores'
import { CampoNumero } from '../../components/CampoNumero'
import { compraSalioCara, generaAvisoCompra, sobrecostoVsReposicion, umbralReorden, type Insumo } from '../../lib/calculos'
import { formatoCantidad, formatoCostoUnitario, formatoMoneda, formatoPorcentaje } from '../../lib/format'
import {
  abrirInsumo,
  actualizarInsumo,
  cargarKardex,
  terminarApertura,
  datosExistencia,
  registrarConteoLocal,
  ajustarExistencia,
  registrarMerma,
  setStockObjetivo,
  type MovimientoKardex,
} from '../../lib/store/remoteStore'
import { alertasInventario, AVISOS_DE_COMPRA, listaDeCompras, type AvisoInventario } from '../../lib/store/selectors'
import { useStore } from '../../lib/store/useStore'
import { guardarPrecarga } from '../compras/precargaCompra'
import { mensajeError } from '../../lib/errores'

const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2 } as const

type PestanaInventario = 'existencias' | 'semanal' | 'mermas' | 'proveedores'
const PESTANAS_INVENTARIO: { id: PestanaInventario; nombre: string }[] = [
  { id: 'existencias', nombre: 'Existencias' },
  { id: 'semanal', nombre: 'Inventario semanal' },
  { id: 'mermas', nombre: 'Mermas' },
  { id: 'proveedores', nombre: 'Proveedores' },
]

const ETIQUETA_AVISO: Record<AvisoInventario['tipo'], string> = {
  'sin vasos': 'Sin vasos',
  vencido: 'Venció',
  agotado: 'Agotado',
  'por vencer': 'Por vencer',
  reorden: 'Reponer',
  cobertura: 'Menos de 3 días',
}

const ETIQUETA_MOVIMIENTO: Record<string, string> = {
  inicial: 'Inicial',
  compra: 'Compra',
  venta: 'Venta',
  cancelacion: 'Cancelación',
  conteo: 'Conteo',
  merma: 'Merma',
  ajuste: 'Ajuste',
}

function claseExistencia(existencia: number, aviso?: AvisoInventario) {
  if (existencia < 0 || aviso?.tipo === 'agotado') return 'text-ink-dark font-semibold'
  if (aviso) return 'text-warn font-semibold'
  return ''
}

export function InventarioScreen() {
  const insumos = useStore((s) => Object.values(s.insumos))
  const avisos = useStore(alertasInventario)
  const grupos = useStore(listaDeCompras)
  useStore((s) => s.existencias)
  const [fichaAbierta, setFichaAbierta] = useState<string | null>(null)
  const navegar = useNavigate()
  const [params, setParams] = useSearchParams()
  const pestana = (params.get('ver') as PestanaInventario | null) ?? 'existencias'
  const cambiarPestana = (p: PestanaInventario) => setParams(p === 'existencias' ? {} : { ver: p }, { replace: true })

  const avisoPorClave = new Map(avisos.filter((a) => AVISOS_DE_COMPRA.includes(a.tipo)).map((a) => [a.insumoClave, a]))
  const filas = insumos
    .map((insumo) => ({ insumo, ...datosExistencia(insumo.clave), aviso: avisoPorClave.get(insumo.clave) }))
    .sort(
      (a, b) =>
        PRIORIDAD_ORDEN[a.insumo.prioridad ?? 'media'] - PRIORIDAD_ORDEN[b.insumo.prioridad ?? 'media'] || a.insumo.nombre.localeCompare(b.insumo.nombre),
    )
  const sinObjetivo = filas.filter((f) => f.stockObjetivoEfectivo == null && generaAvisoCompra(f.insumo)).length
  const totalLista = grupos.reduce((acc, g) => acc + g.total, 0)

  function convertirEnCompra(grupo: (typeof grupos)[number]) {
    guardarPrecarga({
      proveedorId: grupo.proveedorId,
      lineas: grupo.renglones.map((r) => ({ insumoClave: r.insumoClave, presentaciones: r.presentaciones })),
    })
    navegar('/compras')
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-3xl m-0">Inventario</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 -mt-2" role="tablist">
        {PESTANAS_INVENTARIO.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => cambiarPestana(p.id)}
            className={`h-11 rounded border text-sm font-semibold ${pestana === p.id ? 'bg-ink text-bg border-ink' : 'border-border bg-surface'}`}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {pestana === 'semanal' && <InventarioSemanal />}
      {pestana === 'mermas' && <Mermas />}
      {pestana === 'proveedores' && <Proveedores />}

      {pestana === 'existencias' && grupos.length > 0 && (
        <section className="border border-warn rounded p-4 bg-surface flex flex-col gap-4">
          <div className="flex justify-between items-baseline gap-2">
            <h2 className="text-sm label-uppercase m-0 text-warn">Lista de compras · {grupos.reduce((n, g) => n + g.renglones.length, 0)}</h2>
            {totalLista > 0 && <span className="text-sm tabular text-muted">≈ {formatoMoneda(totalLista)}</span>}
          </div>
          {grupos.map((g) => (
            <div key={g.proveedor} className="flex flex-col gap-1">
              <div className="flex justify-between items-center gap-2">
                <span className="font-semibold">{g.proveedor}</span>
                <button className="text-xs font-semibold underline" onClick={() => convertirEnCompra(g)}>
                  Convertir en compra
                </button>
              </div>
              {g.renglones.map((r) => (
                <button
                  key={r.insumoClave}
                  className="flex justify-between items-center gap-3 py-1.5 border-b border-border text-sm text-left"
                  onClick={() => setFichaAbierta(r.insumoClave)}
                >
                  <span>
                    {r.nombre}
                    <span className="block text-xs text-muted">
                      {r.presentaciones} × {r.presentacion ?? `${formatoCantidad(r.contenidoUtil)} por presentación`}
                    </span>
                  </span>
                  <span className="text-right whitespace-nowrap">
                    <span className="text-warn">{ETIQUETA_AVISO[r.tipo]}</span>
                    <span className="block text-xs tabular text-muted">{r.costoEstimado != null ? `≈ ${formatoMoneda(r.costoEstimado)}` : 'sin precio previo'}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </section>
      )}

      {pestana === 'existencias' && <AbiertosYTandas onAbrirFicha={setFichaAbierta} />}

      {pestana === 'existencias' && (
      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-1">Existencia</h2>
        <p className="text-xs text-muted mb-3">
          Toca "Editar" para modificar la existencia, registrar merma, ver movimientos o cambiar proveedor y objetivo.
          {sinObjetivo > 0 && ` ${sinObjetivo} sin objetivo: sólo avisan cuando se agotan.`}
        </p>
        <div className="hidden md:grid grid-cols-[1fr_5rem_8rem_8rem_4rem] gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Insumo</span>
          <span>Prioridad</span>
          <span className="text-right">Existencia</span>
          <span className="text-right">Objetivo</span>
          <span></span>
        </div>
        {filas.map((f) => (
          <button
            key={f.insumo.clave}
            onClick={() => setFichaAbierta(f.insumo.clave)}
            className="w-full text-left py-2 border-b border-border text-sm grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_5rem_8rem_8rem_4rem] gap-2 items-center"
          >
            <span className="min-w-0">
              {f.insumo.nombre}
              {!generaAvisoCompra(f.insumo) && <span className="ml-1 text-xs text-muted">· sin recompra</span>}
              <span className="md:hidden block text-xs text-muted">
                <span className="label-uppercase">{f.insumo.prioridad}</span> · objetivo{' '}
                {f.stockObjetivoEfectivo != null ? formatoCantidad(f.stockObjetivoEfectivo, f.insumo.unidad) : '—'}
              </span>
              {f.existencia < 0 && <span className="block text-xs text-ink-dark">Revisa: se vendió sin existencia registrada</span>}
            </span>
            <span className="hidden md:block label-uppercase text-xs">{f.insumo.prioridad}</span>
            <span className={`text-right tabular ${claseExistencia(f.existencia, f.aviso)}`}>{formatoCantidad(f.existencia, f.insumo.unidad)}</span>
            <span className="hidden md:block text-right tabular text-muted">
              {f.stockObjetivoEfectivo != null ? formatoCantidad(f.stockObjetivoEfectivo, f.insumo.unidad) : '—'}
              {f.stockObjetivoEfectivo != null && f.insumo.stockObjetivo == null && <span className="text-xs"> auto</span>}
            </span>
            <span className="justify-self-end h-8 px-2.5 rounded border border-border text-xs font-semibold flex items-center">Editar</span>
          </button>
        ))}
      </section>
      )}

      {fichaAbierta && <FichaInsumoModal insumoClave={fichaAbierta} onCerrar={() => setFichaAbierta(null)} />}
    </div>
  )
}

/** Lo abierto y las tandas (tapioca cocida, cold brew, almíbar) con cuándo vencen. */
function AbiertosYTandas({ onAbrirFicha }: { onAbrirFicha: (clave: string) => void }) {
  const aperturas = useStore((s) => s.aperturas)
  const insumos = useStore((s) => s.insumos)
  const avisos = useStore(alertasInventario)
  const [error, setError] = useState<string | null>(null)
  if (aperturas.length === 0) return null
  const avisoDe = new Map(avisos.filter((a) => a.aperturaId).map((a) => [a.aperturaId!, a]))
  return (
    <section className="border border-border rounded p-4 bg-surface flex flex-col gap-1">
      <h2 className="text-sm label-uppercase m-0 mb-2">Abierto y tandas</h2>
      {aperturas.map((a) => {
        const aviso = avisoDe.get(a.id)
        const insumo = insumos[a.insumoClave]
        const vence = a.caducaEn
          ? new Date(a.caducaEn).toLocaleString('es-MX', { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : insumo?.caducaAbiertoDias != null
            ? `${insumo.caducaAbiertoDias} días desde ${a.abiertoEn}`
            : 'sin caducidad'
        return (
          <div key={a.id} className="flex justify-between items-center gap-3 py-1.5 border-b border-border text-sm">
            <button className="text-left min-w-0" onClick={() => onAbrirFicha(a.insumoClave)}>
              {a.nota ? `${a.nota} · ` : ''}
              {insumo?.nombre ?? a.insumoClave}
              <span className={`block text-xs ${aviso?.tipo === 'vencido' ? 'text-ink-dark' : aviso ? 'text-warn' : 'text-muted'}`}>
                {aviso?.tipo === 'vencido' ? 'Venció' : aviso ? 'Vence pronto' : 'Vence'} · {vence}
              </span>
            </button>
            <button
              className="text-xs underline whitespace-nowrap"
              onClick={() =>
                terminarApertura(a.id)
                  .then(() => setError(null))
                  .catch((e) => setError(mensajeError(e)))
              }
            >
              Se terminó
            </button>
          </div>
        )
      })}
      {error && <p className="text-sm text-ink-dark m-0">No se guardó: {error}</p>}
    </section>
  )
}

function Abrir({ insumoClave, caducaAbiertoDias }: { insumoClave: string; caducaAbiertoDias?: number | null }) {
  const [horas, setHoras] = useState('4')
  const [nota, setNota] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const hacer = (p: Promise<unknown>, texto: string) =>
    p.then(() => setMensaje(texto)).catch((e) => setMensaje(`No se guardó: ${mensajeError(e)}`))
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <span className="label-uppercase">Abrir o preparar</span>
      {caducaAbiertoDias != null && (
        <button className="h-10 rounded border border-border font-semibold" onClick={() => hacer(abrirInsumo(insumoClave), `Registrado: vence en ${caducaAbiertoDias} días.`)}>
          Abrí uno (dura {caducaAbiertoDias} días)
        </button>
      )}
      <div className="grid grid-cols-[1fr_5rem_auto] gap-2 items-end">
        <label className="flex flex-col gap-1">
          Tanda (opcional)
          <input className="h-10 border border-border rounded px-2 bg-surface" placeholder="Tapioca cocida" value={nota} onChange={(e) => setNota(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Horas
          <input inputMode="decimal" className="h-10 border border-border rounded px-2 bg-surface" value={horas} onChange={(e) => setHoras(e.target.value)} />
        </label>
        <button
          className="h-10 px-3 rounded bg-ink text-bg font-semibold"
          onClick={() => {
            const h = Number(horas.replace(',', '.'))
            if (!(h > 0)) return setMensaje('Escribe cuántas horas dura')
            hacer(abrirInsumo(insumoClave, { horas: h, nota: nota || 'Tanda' }), `Tanda registrada: vence en ${h} h.`)
          }}
        >
          Nueva tanda
        </button>
      </div>
      {mensaje && <p className="text-xs m-0 text-muted">{mensaje}</p>}
    </div>
  )
}

function FichaInsumoModal({ insumoClave, onCerrar }: { insumoClave: string; onCerrar: () => void }) {
  const insumo = useStore((s) => s.insumos[insumoClave]) as Insumo | undefined
  const ficha = useStore((s) => s.fichas[insumoClave])
  const proveedores = useStore((s) => s.proveedores)
  const parametros = useStore((s) => s.parametros)
  const { existencia, stockObjetivoEfectivo, consumo14d } = useStore((s) => s.existencias[insumoClave] ?? { existencia: 0, stockObjetivoEfectivo: null, consumo14d: 0 })
  const [pestana, setPestana] = useState<'resumen' | 'movimientos' | 'conteo' | 'merma'>('resumen')
  const [error, setError] = useState<string | null>(null)
  if (!insumo) return null
  const unidad = insumo.unidad
  const sobrecosto = sobrecostoVsReposicion(ficha?.costoFisicoNeto ?? 0, ficha?.costoReposicion)
  const cara = compraSalioCara(ficha?.costoFisicoNeto ?? 0, ficha?.costoReposicion)
  const esManual = insumo.stockObjetivo != null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={onCerrar}>
      <div className="bg-bg rounded-t md:rounded p-5 w-full md:max-w-lg max-h-[90vh] overflow-y-auto flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-2">
          <div>
            <h2 className="text-lg font-display m-0">{insumo.nombre}</h2>
            <p className="text-sm text-muted m-0">
              Hay <span className={`tabular ${existencia <= 0 ? 'text-ink-dark font-semibold' : ''}`}>{formatoCantidad(existencia, unidad)}</span>
              {consumo14d > 0 && ` · usas ≈ ${formatoCantidad(consumo14d / 14, unidad)} al día`}
            </p>
          </div>
          <button onClick={onCerrar} className="text-muted text-xl leading-none px-2" aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="flex gap-1 border-b border-border text-sm" role="tablist">
          {(['resumen', 'conteo', 'merma', 'movimientos'] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={pestana === p}
              onClick={() => setPestana(p)}
              className={`h-9 px-3 border-b-2 -mb-px ${pestana === p ? 'border-ink font-semibold' : 'border-transparent text-muted'}`}
            >
              {{ resumen: 'Ficha', conteo: 'Modificar existencia', merma: 'Merma', movimientos: 'Movimientos' }[p]}
            </button>
          ))}
        </div>

        {pestana === 'resumen' && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted">Presentación</span>
              <span>{ficha?.presentacion ?? '—'}</span>
              <span className="text-muted">Costo actual</span>
              <span className="tabular">
                {formatoCostoUnitario(ficha?.costoFisicoNeto ?? 0)}/{unidad === 'pieza' ? 'pza' : unidad} <span className="text-xs text-muted">(sin IVA, promedio)</span>
              </span>
              {ficha?.ultimaCompra && (
                <>
                  <span className="text-muted">Última compra</span>
                  <span className="tabular">
                    {ficha.ultimaCompra.fecha} · {formatoMoneda(ficha.ultimaCompra.precioPorPresentacion)} por {formatoCantidad(ficha.ultimaCompra.contenidoUtil, unidad)}
                  </span>
                </>
              )}
            </div>

            {ficha?.costoReposicion != null && (
              <div className={`rounded p-3 border ${cara ? 'border-warn text-warn' : 'border-border'}`}>
                Si lo compras con tu proveedor: {formatoCostoUnitario(ficha.costoReposicion)}/{unidad === 'pieza' ? 'pza' : unidad}
                {ficha.proveedorReposicion && <span className="block text-xs">{ficha.proveedorReposicion}</span>}
                {cara && sobrecosto != null && (
                  <span className="block font-semibold mt-1">
                    Esta compra salió cara ({formatoPorcentaje(sobrecosto, 0)} más): repónla con {ficha.proveedorReposicion?.split('·')[0].trim() ?? 'tu proveedor'}.
                  </span>
                )}
              </div>
            )}

            <label className="flex flex-col gap-1">
              Proveedor
              <select
                className="h-10 border border-border rounded px-2 bg-surface"
                value={ficha?.proveedorId ?? ''}
                onChange={(e) =>
                  actualizarInsumo(insumoClave, { proveedorId: e.target.value || null })
                    .then(() => setError(null))
                    .catch((err) => setError(mensajeError(err)))
                }
              >
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>

            {generaAvisoCompra(insumo) && (
              <div className="grid grid-cols-2 gap-3">
                <CampoNumero
                  etiqueta={`Objetivo${esManual ? '' : ' (auto)'}`}
                  sufijo={unidad === 'pieza' ? 'pza' : unidad}
                  min={0}
                  valor={insumo.stockObjetivo ?? stockObjetivoEfectivo}
                  onGuardar={(v) => setStockObjetivo(insumoClave, v)}
                  onVaciar={() => setStockObjetivo(insumoClave, null)}
                  ayuda="Vacío = se calcula con tus compras"
                />
                <CampoNumero
                  etiqueta="Avisar al bajar de"
                  porcentaje
                  min={1}
                  max={100}
                  valor={insumo.umbralReorden ?? umbralReorden(insumo, parametros)}
                  onGuardar={(v) => actualizarInsumo(insumoClave, { umbralReorden: v })}
                  onVaciar={() => actualizarInsumo(insumoClave, { umbralReorden: null })}
                  ayuda={insumo.umbralReorden == null ? `El de prioridad ${insumo.prioridad}` : 'Vacío = el de su prioridad'}
                />
              </div>
            )}
            <CampoNumero
              etiqueta="Dura abierto (días)"
              min={0}
              valor={insumo.caducaAbiertoDias ?? null}
              onGuardar={(v) => actualizarInsumo(insumoClave, { caducaAbiertoDias: Math.round(v) })}
              onVaciar={() => actualizarInsumo(insumoClave, { caducaAbiertoDias: null })}
              ayuda="Para avisarte antes de que se eche a perder"
            />
            {esManual && (
              <button className="text-xs underline self-start" onClick={() => void setStockObjetivo(insumoClave, null)}>
                Volver al objetivo automático
              </button>
            )}
            <Abrir insumoClave={insumoClave} caducaAbiertoDias={insumo.caducaAbiertoDias} />
            {error && <p className="text-sm text-ink-dark m-0">No se guardó: {error}</p>}
          </div>
        )}

        {pestana === 'conteo' && <Conteo insumoClave={insumoClave} existencia={existencia} unidad={unidad} onListo={() => setPestana('resumen')} />}
        {pestana === 'merma' && <Merma insumoClave={insumoClave} unidad={unidad} onListo={() => setPestana('movimientos')} />}
        {pestana === 'movimientos' && <Kardex insumoClave={insumoClave} unidad={unidad} />}
      </div>
    </div>
  )
}

const MOTIVOS_AJUSTE = ['Conteo físico', 'Corrección de captura', 'Llegó mercancía sin registrar compra', 'Otro'] as const

/** Modificar la existencia a un valor exacto. La diferencia queda en el kárdex con su motivo; nada se borra. */
function Conteo({ insumoClave, existencia, unidad, onListo }: { insumoClave: string; existencia: number; unidad?: Insumo['unidad']; onListo: () => void }) {
  const [valor, setValor] = useState(String(Math.max(0, Math.round(existencia * 100) / 100)))
  const [motivo, setMotivo] = useState<(typeof MOTIVOS_AJUSTE)[number]>('Conteo físico')
  const [detalle, setDetalle] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const numero = Number(valor.replace(',', '.'))
  const diferencia = Number.isFinite(numero) ? numero - existencia : null
  async function guardar() {
    if (!Number.isFinite(numero) || numero < 0) return setError('Escribe una cantidad válida')
    setGuardando(true)
    try {
      const nota = detalle.trim() ? `${motivo}: ${detalle.trim()}` : motivo
      if (motivo === 'Conteo físico') await registrarConteoLocal(insumoClave, numero, nota)
      else await ajustarExistencia(insumoClave, numero, nota)
      onListo()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="m-0 text-muted">
        El sistema dice {formatoCantidad(existencia, unidad)}. Escribe cuánto hay en realidad; la diferencia queda registrada con su motivo en Movimientos.
      </p>
      <label className="flex flex-col gap-1">
        Existencia correcta
        <input type="text" inputMode="decimal" className="h-12 border border-border rounded px-3 bg-surface text-lg tabular" value={valor} onChange={(e) => setValor(e.target.value)} />
      </label>
      {diferencia != null && Math.abs(diferencia) > 1e-9 && (
        <span className={`text-xs tabular ${diferencia < 0 ? 'text-ink-dark' : 'text-ok'}`}>
          {diferencia < 0 ? 'Baja' : 'Sube'} {formatoCantidad(Math.abs(diferencia), unidad)}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {MOTIVOS_AJUSTE.map((m) => (
          <button key={m} onClick={() => setMotivo(m)} className={`h-9 px-3 rounded border text-xs font-semibold ${motivo === m ? 'bg-ink text-bg border-ink' : 'border-border'}`}>
            {m}
          </button>
        ))}
      </div>
      <input className="h-10 border border-border rounded px-2 bg-surface" placeholder="Detalle (opcional)" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
      <button disabled={guardando} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={guardar}>
        {guardando ? 'Guardando…' : 'Guardar existencia'}
      </button>
      {error && <p className="text-ink-dark m-0">{error}</p>}
    </div>
  )
}

const MOTIVOS = ['Se cayó / se derramó', 'Se echó a perder', 'Cortesía', 'Prueba de receta', 'Otro']

function Merma({ insumoClave, unidad, onListo }: { insumoClave: string; unidad?: Insumo['unidad']; onListo: () => void }) {
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const [detalle, setDetalle] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function guardar() {
    const numero = Number(cantidad.replace(',', '.'))
    if (!Number.isFinite(numero) || numero <= 0) return setError('Escribe cuánto se perdió')
    setGuardando(true)
    try {
      await registrarMerma(insumoClave, numero, detalle.trim() ? `${motivo}: ${detalle.trim()}` : motivo)
      onListo()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        Cuánto se perdió ({unidad === 'pieza' ? 'pza' : unidad})
        <input type="text" inputMode="decimal" className="h-12 border border-border rounded px-3 bg-surface text-lg tabular" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {MOTIVOS.map((m) => (
          <button key={m} onClick={() => setMotivo(m)} className={`h-9 px-3 rounded border text-xs font-semibold ${motivo === m ? 'bg-ink text-bg border-ink' : 'border-border'}`}>
            {m}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        Detalle (opcional)
        <input className="h-10 border border-border rounded px-2 bg-surface" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
      </label>
      <button disabled={guardando} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={guardar}>
        {guardando ? 'Guardando…' : 'Registrar merma'}
      </button>
      {error && <p className="text-ink-dark m-0">{error}</p>}
    </div>
  )
}

function Kardex({ insumoClave, unidad }: { insumoClave: string; unidad?: Insumo['unidad'] }) {
  const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([])
  const [pagina, setPagina] = useState(0)
  const [hayMas, setHayMas] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const TAMANO = 50

  useEffect(() => {
    let vigente = true
    setCargando(true)
    cargarKardex(insumoClave, pagina, TAMANO)
      .then((m) => {
        if (!vigente) return
        setMovimientos((prev) => (pagina === 0 ? m : [...prev, ...m]))
        setHayMas(m.length === TAMANO)
      })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [insumoClave, pagina])

  if (error) return <p className="text-sm text-ink-dark">No se pudieron leer los movimientos: {error}</p>
  return (
    <div className="flex flex-col text-sm">
      {movimientos.length === 0 && !cargando && <p className="text-muted">Sin movimientos todavía.</p>}
      {movimientos.map((m, i) => (
        <div key={i} className="flex justify-between gap-2 py-1.5 border-b border-border">
          <span className="min-w-0">
            {ETIQUETA_MOVIMIENTO[m.tipo] ?? m.tipo}
            <span className="block text-xs text-muted">
              {new Date(m.fecha).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              {m.nota ? ` · ${m.nota}` : ''}
            </span>
          </span>
          <span className={`tabular whitespace-nowrap ${m.cantidad < 0 ? 'text-ink-dark' : 'text-ok'}`}>
            {m.cantidad > 0 ? '+' : ''}
            {formatoCantidad(m.cantidad, unidad)}
          </span>
        </div>
      ))}
      {cargando && <p className="text-muted">Cargando…</p>}
      {hayMas && !cargando && movimientos.length > 0 && (
        <button className="h-10 underline" onClick={() => setPagina((p) => p + 1)}>
          Ver más
        </button>
      )}
    </div>
  )
}
