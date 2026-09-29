import { useState } from 'react'
import { CampoNumero } from '../../components/CampoNumero'
import { cantidadSugeridaCompra, generaAvisoCompra, umbralReorden, type Insumo } from '../../lib/calculos'
import { formatoCantidad } from '../../lib/format'
import { datosExistencia, registrarConteoLocal, setStockObjetivo } from '../../lib/store/remoteStore'
import { alertasInventario, type AvisoInventario } from '../../lib/store/selectors'
import { useStore } from '../../lib/store/useStore'

const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2 } as const

const ETIQUETA_AVISO: Record<AvisoInventario['tipo'], string> = {
  'sin vasos': 'Sin vasos',
  agotado: 'Agotado',
  reorden: 'Reponer',
  cobertura: 'Menos de 3 días',
}

function claseExistencia(existencia: number, aviso?: AvisoInventario) {
  if (existencia < 0) return 'text-ink-dark font-semibold'
  if (aviso?.tipo === 'agotado') return 'text-ink-dark font-semibold'
  if (aviso) return 'text-warn font-semibold'
  return ''
}

export function InventarioScreen() {
  const insumos = useStore((s) => Object.values(s.insumos))
  const avisos = useStore(alertasInventario)
  // Re-render cuando cambian existencias (datosExistencia lee del store).
  useStore((s) => s.existencias)
  const [conteoAbierto, setConteoAbierto] = useState<string | null>(null)
  const [objetivoAbierto, setObjetivoAbierto] = useState<string | null>(null)

  const avisoPorClave = new Map(avisos.filter((a) => a.tipo !== 'sin vasos').map((a) => [a.insumoClave, a]))
  const filas = insumos
    .map((insumo) => ({ insumo, ...datosExistencia(insumo.clave), aviso: avisoPorClave.get(insumo.clave) }))
    .sort(
      (a, b) =>
        PRIORIDAD_ORDEN[a.insumo.prioridad ?? 'media'] - PRIORIDAD_ORDEN[b.insumo.prioridad ?? 'media'] ||
        a.insumo.nombre.localeCompare(b.insumo.nombre),
    )
  const porComprar = avisos.filter((a) => a.tipo !== 'sin vasos')
  const sinObjetivo = filas.filter((f) => f.stockObjetivoEfectivo == null && generaAvisoCompra(f.insumo)).length

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-3xl">Inventario</h1>

      {porComprar.length > 0 && (
        <section className="border border-warn rounded p-4 bg-surface">
          <h2 className="text-sm label-uppercase mb-3 text-warn">Lista de compras · {porComprar.length}</h2>
          {porComprar.map((a) => {
            const insumo = insumos.find((i) => i.clave === a.insumoClave)
            const { stockObjetivoEfectivo } = datosExistencia(a.insumoClave)
            const faltan =
              stockObjetivoEfectivo != null
                ? cantidadSugeridaCompra({ stockObjetivo: stockObjetivoEfectivo, existencia: a.existencia, contenidoUtilPorPresentacion: 1 })
                : null
            return (
              <div key={a.insumoClave} className="flex justify-between items-center gap-3 py-2 border-b border-border text-sm">
                <span>
                  {a.nombre}
                  {a.negativo && <span className="block text-xs text-ink-dark">En negativo: se vendió sin existencia registrada</span>}
                </span>
                <span className="text-warn tabular text-right whitespace-nowrap">
                  {ETIQUETA_AVISO[a.tipo]}
                  {faltan != null && faltan > 0 && (
                    <span className="block text-xs">faltan {formatoCantidad(faltan, insumo?.unidad)}</span>
                  )}
                </span>
              </div>
            )
          })}
        </section>
      )}

      <section className="border border-border rounded p-4 bg-surface">
        <h2 className="text-sm label-uppercase mb-1">Existencia</h2>
        {sinObjetivo > 0 && (
          <p className="text-xs text-muted mb-3">
            {sinObjetivo} insumos sin objetivo: sólo avisan cuando se agotan. El objetivo se calcula solo con tus compras, o ponlo tú.
          </p>
        )}

        {/* Escritorio: tabla */}
        <div className="hidden md:grid grid-cols-[1fr_5rem_8rem_8rem_5rem] gap-2 text-xs label-uppercase pb-2 border-b border-border">
          <span>Insumo</span>
          <span>Prioridad</span>
          <span className="text-right">Existencia</span>
          <span className="text-right">Objetivo</span>
          <span></span>
        </div>
        {filas.map((f) => (
          <FilaInsumo
            key={f.insumo.clave}
            insumo={f.insumo}
            existencia={f.existencia}
            objetivo={f.stockObjetivoEfectivo}
            aviso={f.aviso}
            onContar={() => setConteoAbierto(f.insumo.clave)}
            onObjetivo={() => setObjetivoAbierto(f.insumo.clave)}
          />
        ))}
      </section>

      {conteoAbierto && <ModalConteo insumoClave={conteoAbierto} onCerrar={() => setConteoAbierto(null)} />}
      {objetivoAbierto && <ModalObjetivo insumoClave={objetivoAbierto} onCerrar={() => setObjetivoAbierto(null)} />}
    </div>
  )
}

function FilaInsumo({
  insumo,
  existencia,
  objetivo,
  aviso,
  onContar,
  onObjetivo,
}: {
  insumo: Insumo
  existencia: number
  objetivo: number | null
  aviso?: AvisoInventario
  onContar: () => void
  onObjetivo: () => void
}) {
  const sinRecompra = !generaAvisoCompra(insumo)
  const objetivoTexto =
    objetivo != null ? (
      <button className="underline decoration-dotted" onClick={onObjetivo}>
        {formatoCantidad(objetivo, insumo.unidad)}
        {insumo.stockObjetivo == null && <span className="text-xs text-muted"> auto</span>}
      </button>
    ) : sinRecompra ? (
      '—'
    ) : (
      <button className="text-xs font-semibold underline" onClick={onObjetivo}>
        Poner objetivo
      </button>
    )

  return (
    <div className="py-2 border-b border-border text-sm">
      {/* Móvil: tarjeta */}
      <div className="md:hidden flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div>
            {insumo.nombre}
            {sinRecompra && <span className="ml-1 text-xs text-muted">· sin recompra</span>}
          </div>
          <div className="text-xs text-muted flex gap-2 flex-wrap items-center">
            <span className="label-uppercase">{insumo.prioridad}</span>
            <span>· objetivo {objetivoTexto}</span>
          </div>
          {existencia < 0 && <div className="text-xs text-ink-dark">Revisa: se vendió sin existencia registrada</div>}
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className={`tabular ${claseExistencia(existencia, aviso)}`}>{formatoCantidad(existencia, insumo.unidad)}</span>
          <button className="text-xs font-semibold underline" onClick={onContar}>
            Contar
          </button>
        </div>
      </div>

      {/* Escritorio: fila de tabla */}
      <div className="hidden md:grid grid-cols-[1fr_5rem_8rem_8rem_5rem] gap-2 items-center">
        <span>
          {insumo.nombre}
          {sinRecompra && <span className="ml-2 text-xs text-muted">· sin recompra</span>}
          {existencia < 0 && <span className="block text-xs text-ink-dark">Revisa: se vendió sin existencia registrada</span>}
        </span>
        <span className="label-uppercase text-xs">{insumo.prioridad}</span>
        <span className={`text-right tabular ${claseExistencia(existencia, aviso)}`}>{formatoCantidad(existencia, insumo.unidad)}</span>
        <span className="text-right tabular text-muted">{objetivoTexto}</span>
        <button className="text-right text-xs font-semibold underline" onClick={onContar}>
          Contar
        </button>
      </div>
    </div>
  )
}

function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50" onClick={onCerrar}>
      <div className="bg-bg rounded-t md:rounded p-5 w-full md:max-w-sm flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-lg font-display m-0">{titulo}</h2>
          <button onClick={onCerrar} className="text-muted text-xl leading-none px-2" aria-label="Cerrar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalConteo({ insumoClave, onCerrar }: { insumoClave: string; onCerrar: () => void }) {
  const insumo = useStore((s) => s.insumos[insumoClave])
  const existencia = useStore((s) => s.existencias[insumoClave]?.existencia ?? 0)
  const [valor, setValor] = useState(String(Math.max(0, existencia)))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar() {
    const numero = Number(valor.replace(',', '.'))
    if (!Number.isFinite(numero) || numero < 0) {
      setError('Escribe una cantidad válida')
      return
    }
    setGuardando(true)
    try {
      await registrarConteoLocal(insumoClave, numero, 'Conteo manual')
      onCerrar()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={`Conteo físico · ${insumo?.nombre ?? ''}`} onCerrar={onCerrar}>
      <p className="text-sm text-muted m-0">El sistema dice: {formatoCantidad(existencia, insumo?.unidad)}</p>
      <label className="flex flex-col gap-1 text-sm">
        Lo que contaste {insumo?.unidad ? `(${formatoCantidad(0, insumo.unidad).replace('0 ', '')})` : ''}
        <input
          type="text"
          inputMode="decimal"
          className="h-12 border border-border rounded px-3 bg-surface text-lg tabular"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </label>
      <button disabled={guardando} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={guardar}>
        {guardando ? 'Guardando…' : 'Guardar conteo'}
      </button>
      {error && <p className="text-sm text-ink-dark m-0">{error}</p>}
    </Modal>
  )
}

function ModalObjetivo({ insumoClave, onCerrar }: { insumoClave: string; onCerrar: () => void }) {
  const insumo = useStore((s) => s.insumos[insumoClave])
  const objetivoEfectivo = useStore((s) => s.existencias[insumoClave]?.stockObjetivoEfectivo ?? null)
  const parametros = useStore((s) => s.parametros)
  const esManual = insumo?.stockObjetivo != null
  const umbral = insumo ? umbralReorden(insumo, parametros) : 0.3

  return (
    <Modal titulo={`Objetivo · ${insumo?.nombre ?? ''}`} onCerrar={onCerrar}>
      <p className="text-sm text-muted m-0">
        Cuánto quieres tener después de surtir. Avisa para reponer cuando baja del {Math.round(umbral * 100)} %
        {insumo?.umbralReorden == null ? ' (según su prioridad)' : ''}.
        {!esManual && objetivoEfectivo != null && ' Hoy se calcula solo con tu compra más grande de los últimos 60 días.'}
      </p>
      <CampoNumero
        etiqueta="Objetivo"
        sufijo={insumo?.unidad === 'pieza' ? 'pza' : insumo?.unidad}
        min={0}
        valor={insumo?.stockObjetivo ?? objetivoEfectivo}
        onGuardar={(v) => setStockObjetivo(insumoClave, v)}
        onVaciar={() => setStockObjetivo(insumoClave, null)}
        ayuda="Déjalo vacío para que se calcule solo con tus compras."
      />
      {esManual && (
        <button className="text-sm underline self-start" onClick={() => setStockObjetivo(insumoClave, null).then(onCerrar)}>
          Volver al cálculo automático
        </button>
      )}
    </Modal>
  )
}
