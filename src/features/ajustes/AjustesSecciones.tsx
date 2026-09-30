import { useState } from 'react'
import { CampoNumero } from '../../components/CampoNumero'
import {
  actualizarConfigEvento,
  actualizarParametros,
  actualizarTamano,
  guardarEscala,
  guardarProveedor,
  guardarTurno,
  type ProveedorStore,
  type TurnoStore,
} from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] // 0 = domingo, igual que Date.getDay()
const NOMBRE_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function Tarjeta({ titulo, children, ayuda }: { titulo: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <section className="border border-border rounded p-4 bg-surface flex flex-col gap-3">
      <h2 className="text-sm label-uppercase m-0">{titulo}</h2>
      {ayuda && <p className="text-xs text-muted m-0 -mt-1">{ayuda}</p>}
      {children}
    </section>
  )
}

function MensajeError({ texto }: { texto: string | null }) {
  return texto ? <p className="text-sm text-ink-dark m-0">No se guardó: {texto}</p> : null
}

// ── Parámetros generales (A2) ──
export function SeccionParametros() {
  const p = useStore((s) => s.parametros)
  return (
    <Tarjeta titulo="Parámetros generales" ayuda="Se aplican a las ventas nuevas; lo ya vendido conserva sus números.">
      <div className="grid grid-cols-2 gap-3">
        <CampoNumero etiqueta="Meta de ganancia semanal" sufijo="$" min={0} valor={p.metaUtilidadSemanal} onGuardar={(v) => actualizarParametros({ metaUtilidadSemanal: v })} />
        <CampoNumero etiqueta="Indirectos por bebida (con IVA)" sufijo="$" min={0} valor={p.indirectosPorBebida} onGuardar={(v) => actualizarParametros({ indirectosPorBebida: v })} />
        <CampoNumero etiqueta="Tarifa fuera de turno" sufijo="$/h" min={0} valor={p.horaManoDeObraFueraDeTurno} onGuardar={(v) => actualizarParametros({ horaManoDeObraFueraDeTurno: v })} />
        <CampoNumero etiqueta="IVA de venta" porcentaje min={0} max={100} valor={p.ivaVenta} onGuardar={(v) => actualizarParametros({ ivaVenta: v })} />
      </div>
      <p className="text-xs text-muted m-0">Avisar para reponer cuando un insumo baja de este % de su objetivo:</p>
      <div className="grid grid-cols-3 gap-3">
        <CampoNumero etiqueta="Prioridad alta" porcentaje min={1} max={100} valor={p.umbralReordenPorPrioridad.alta} onGuardar={(v) => actualizarParametros({ umbralAlta: v })} />
        <CampoNumero etiqueta="Media" porcentaje min={1} max={100} valor={p.umbralReordenPorPrioridad.media} onGuardar={(v) => actualizarParametros({ umbralMedia: v })} />
        <CampoNumero etiqueta="Baja" porcentaje min={1} max={100} valor={p.umbralReordenPorPrioridad.baja} onGuardar={(v) => actualizarParametros({ umbralBaja: v })} />
      </div>
    </Tarjeta>
  )
}

// ── Turnos (A3) ──
function EditorTurno({ turno, onListo }: { turno?: TurnoStore; onListo: () => void }) {
  const [t, setT] = useState<Omit<TurnoStore, 'id'> & { id?: string }>(
    turno ?? { nombre: '', dias: [1, 2, 3, 4, 5], inicio: '07:00', fin: '10:00', horaManoDeObra: 50, activo: true },
  )
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const alternarDia = (d: number) => setT((x) => ({ ...x, dias: x.dias.includes(d) ? x.dias.filter((y) => y !== d) : [...x.dias, d].sort() }))
  return (
    <div className="flex flex-col gap-2 border border-border rounded p-3 bg-bg">
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input className="h-10 border border-border rounded px-2 bg-surface" value={t.nombre} onChange={(e) => setT({ ...t, nombre: e.target.value })} />
      </label>
      <div className="flex gap-1">
        {DIAS.map((d, i) => (
          <button
            key={i}
            onClick={() => alternarDia(i)}
            aria-label={NOMBRE_DIA[i]}
            aria-pressed={t.dias.includes(i)}
            className={`w-9 h-9 rounded border text-xs font-semibold ${t.dias.includes(i) ? 'bg-ink text-bg border-ink' : 'border-border'}`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          Inicio
          <input type="time" className="h-10 border border-border rounded px-2 bg-surface" value={t.inicio} onChange={(e) => setT({ ...t, inicio: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          Fin
          <input type="time" className="h-10 border border-border rounded px-2 bg-surface" value={t.fin} onChange={(e) => setT({ ...t, fin: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          $/hora
          <input inputMode="decimal" className="h-10 border border-border rounded px-2 bg-surface" value={t.horaManoDeObra} onChange={(e) => setT({ ...t, horaManoDeObra: Number(e.target.value) || 0 })} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={t.activo ?? true} onChange={(e) => setT({ ...t, activo: e.target.checked })} />
        Activo
      </label>
      <div className="flex gap-2">
        <button
          disabled={guardando}
          className="h-10 flex-1 rounded bg-ink text-bg font-semibold disabled:opacity-50"
          onClick={async () => {
            setGuardando(true)
            try {
              await guardarTurno(t)
              onListo()
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e))
            } finally {
              setGuardando(false)
            }
          }}
        >
          Guardar turno
        </button>
        <button className="h-10 px-3 rounded border border-border" onClick={onListo}>
          Cancelar
        </button>
      </div>
      <MensajeError texto={error} />
    </div>
  )
}

export function SeccionTurnos() {
  const turnos = useStore((s) => s.turnos)
  const [editando, setEditando] = useState<string | 'nuevo' | null>(null)
  return (
    <Tarjeta titulo="Turnos" ayuda="La mano de obra de cada venta se costea con la tarifa del turno en que ocurre; fuera de turno, con la tarifa general.">
      {turnos.map((t) =>
        editando === t.id ? (
          <EditorTurno key={t.id} turno={t} onListo={() => setEditando(null)} />
        ) : (
          <div key={t.id} className={`flex justify-between items-center gap-2 text-sm border-b border-border pb-2 ${t.activo === false ? 'opacity-60' : ''}`}>
            <span>
              {t.nombre}
              <span className="block text-xs text-muted">
                {t.dias.map((d) => DIAS[d]).join(' ')} · {t.inicio}–{t.fin} · ${t.horaManoDeObra}/h{t.activo === false ? ' · inactivo' : ''}
              </span>
            </span>
            <button className="text-xs underline" onClick={() => setEditando(t.id)}>
              Editar
            </button>
          </div>
        ),
      )}
      {editando === 'nuevo' ? (
        <EditorTurno onListo={() => setEditando(null)} />
      ) : (
        <button className="text-sm underline self-start" onClick={() => setEditando('nuevo')}>
          + Agregar turno
        </button>
      )}
    </Tarjeta>
  )
}

// ── Eventos (A4) ──
export function SeccionEventos() {
  const config = useStore((s) => s.configEvento)
  const escalas = useStore((s) => s.escalasEvento)
  const [error, setError] = useState<string | null>(null)
  return (
    <Tarjeta titulo="Eventos" ayuda="El precio de evento parte del precio de lista y baja por volumen según la escala.">
      <div className="grid grid-cols-2 gap-3">
        <CampoNumero etiqueta="Mínimo de bebidas" min={1} valor={config.minimoBebidas} onGuardar={(v) => actualizarConfigEvento({ minimoBebidas: Math.round(v) })} />
        <CampoNumero etiqueta="Traslado" sufijo="$" min={0} valor={config.traslado} onGuardar={(v) => actualizarConfigEvento({ traslado: v })} />
        <CampoNumero etiqueta="Equipo, hielo y desechables" sufijo="$" min={0} valor={config.equipoHieloDesechables} onGuardar={(v) => actualizarConfigEvento({ equipoHieloDesechables: v })} />
        <CampoNumero etiqueta="Horas de montaje" sufijo="h" min={0} valor={config.horasMontaje} onGuardar={(v) => actualizarConfigEvento({ horasMontaje: v })} />
      </div>
      <div className="text-xs label-uppercase grid grid-cols-4 gap-2 pt-2">
        <span>Desde</span>
        <span>Hasta</span>
        <span>Factor</span>
        <span>Cargo</span>
      </div>
      {escalas.map((e) => (
        <div key={e.id ?? e.desde} className="grid grid-cols-4 gap-2 text-sm">
          {(['desde', 'hasta', 'factor', 'cargoServicio'] as const).map((campo) => (
            <input
              key={campo}
              inputMode="decimal"
              aria-label={`${campo} de la escala desde ${e.desde}`}
              className="h-9 w-full min-w-0 border border-border rounded px-2 bg-bg tabular"
              defaultValue={e[campo] == null ? '' : String(e[campo])}
              placeholder={campo === 'hasta' ? 'sin tope' : ''}
              onBlur={(ev) => {
                const texto = ev.target.value.trim()
                const valor = texto === '' ? null : Number(texto)
                if (campo !== 'hasta' && valor == null) return
                if (valor != null && !Number.isFinite(valor)) return setError('Escribe un número')
                if (valor === e[campo]) return
                guardarEscala({ ...e, [campo]: valor })
                  .then(() => setError(null))
                  .catch((err) => setError(err instanceof Error ? err.message : String(err)))
              }}
            />
          ))}
        </div>
      ))}
      <MensajeError texto={error} />
    </Tarjeta>
  )
}

// ── Tamaños: vaso, cierre y canales (A5 / v3) ──
export function SeccionTamanos({ onActivo }: { onActivo: (nombre: string, v: boolean) => Promise<unknown> }) {
  const tamanos = useStore((s) => Object.values(s.tamanos).sort((a, b) => a.ml - b.ml))
  const insumos = useStore((s) => s.insumos)
  const canales = useStore((s) => s.canales)
  const [error, setError] = useState<string | null>(null)
  const piezas = Object.values(insumos)
    .filter((i) => i.unidad === 'pieza')
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
  const vasos = piezas.filter((i) => i.clave.startsWith('vaso_'))
  // Cierre: lo que tapa el vaso. Fuera vasos, popotes, etiquetas, charolas, botanas y botellas.
  const enUso = new Set(tamanos.flatMap((t) => t.cierreInsumoClaves))
  const cierres = piezas.filter(
    (i) => enUso.has(i.clave) || (!i.clave.startsWith('vaso_') && !/^(popote|etiqueta|charola|botana|botella)/.test(i.clave)),
  )
  const guardar = (p: Promise<unknown>) => p.then(() => setError(null)).catch((e) => setError(e instanceof Error ? e.message : String(e)))

  return (
    <Tarjeta titulo="Tamaños" ayuda="El cierre es lo que se descuenta al tapar cada vaso (tapa + playo, o película de selladora). Si cambias de vaso, cámbialo aquí.">
      {tamanos.map((t) => (
        <div key={t.nombre} className={`flex flex-col gap-2 border-b border-border pb-3 text-sm ${t.activo ? '' : 'opacity-60'}`}>
          <div className="flex justify-between items-center">
            <span className="font-semibold">
              {t.nombre} <span className="text-xs text-muted font-normal">· {t.ml} ml · escala ×{t.factorEscala}</span>
            </span>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={t.activo} onChange={(e) => guardar(onActivo(t.nombre, e.target.checked))} />
              Activo
            </label>
          </div>
          <label className="flex flex-col gap-1">
            Vaso
            <select className="h-10 border border-border rounded px-2 bg-bg" value={t.vasoInsumoClave} onChange={(e) => guardar(actualizarTamano(t.nombre, { vasoInsumoClave: e.target.value }))}>
              {vasos.map((v) => (
                <option key={v.clave} value={v.clave}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <span>Cierre</span>
            <div className="flex flex-wrap gap-2">
              {cierres.map((c) => {
                const marcado = t.cierreInsumoClaves.includes(c.clave)
                return (
                  <button
                    key={c.clave}
                    aria-pressed={marcado}
                    onClick={() =>
                      guardar(
                        actualizarTamano(t.nombre, {
                          cierreInsumoClaves: marcado ? t.cierreInsumoClaves.filter((x) => x !== c.clave) : [...t.cierreInsumoClaves, c.clave],
                        }),
                      )
                    }
                    className={`h-8 px-3 rounded border text-xs font-semibold ${marcado ? 'bg-ink text-bg border-ink' : 'border-border'}`}
                  >
                    {c.nombre}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span>Se vende en</span>
            <div className="flex flex-wrap gap-2">
              {canales.map((c) => {
                const lista = t.canales ?? canales.map((x) => x.nombre)
                const marcado = lista.includes(c.nombre)
                return (
                  <button
                    key={c.nombre}
                    aria-pressed={marcado}
                    onClick={() => guardar(actualizarTamano(t.nombre, { canales: marcado ? lista.filter((x) => x !== c.nombre) : [...lista, c.nombre] }))}
                    className={`h-8 px-3 rounded border text-xs font-semibold ${marcado ? 'bg-ink text-bg border-ink' : 'border-border'}`}
                  >
                    {c.nombre}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ))}
      <MensajeError texto={error} />
    </Tarjeta>
  )
}

// ── Proveedores (A6 / N5) ──
function EditorProveedor({ proveedor, onListo }: { proveedor?: ProveedorStore; onListo: () => void }) {
  const [p, setP] = useState<Omit<ProveedorStore, 'id'> & { id?: string }>(proveedor ?? { nombre: '' })
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-2 border border-border rounded p-3 bg-bg text-sm">
      <input className="h-10 border border-border rounded px-2 bg-surface" placeholder="Nombre" value={p.nombre} onChange={(e) => setP({ ...p, nombre: e.target.value })} />
      <input className="h-10 border border-border rounded px-2 bg-surface" placeholder="Contacto (WhatsApp, correo…)" value={p.contacto ?? ''} onChange={(e) => setP({ ...p, contacto: e.target.value })} />
      <input className="h-10 border border-border rounded px-2 bg-surface" placeholder="Notas" value={p.notas ?? ''} onChange={(e) => setP({ ...p, notas: e.target.value })} />
      <div className="flex gap-2">
        <button
          className="h-10 flex-1 rounded bg-ink text-bg font-semibold"
          onClick={() =>
            guardarProveedor(p)
              .then(onListo)
              .catch((e) => setError(e instanceof Error ? e.message : String(e)))
          }
        >
          Guardar
        </button>
        <button className="h-10 px-3 rounded border border-border" onClick={onListo}>
          Cancelar
        </button>
      </div>
      <MensajeError texto={error} />
    </div>
  )
}

export function SeccionProveedores() {
  const proveedores = useStore((s) => s.proveedores)
  const fichas = useStore((s) => s.fichas)
  const insumos = useStore((s) => s.insumos)
  const [editando, setEditando] = useState<string | 'nuevo' | null>(null)
  return (
    <Tarjeta titulo="Proveedores" ayuda="Asigna el proveedor de cada insumo en su ficha (Inventario); la lista de compras se agrupa por proveedor.">
      {proveedores.map((p) =>
        editando === p.id ? (
          <EditorProveedor key={p.id} proveedor={p} onListo={() => setEditando(null)} />
        ) : (
          <div key={p.id} className="flex justify-between items-start gap-2 text-sm border-b border-border pb-2">
            <span className="min-w-0">
              {p.nombre}
              <span className="block text-xs text-muted">
                {[p.contacto, p.notas].filter(Boolean).join(' · ')}
                {' · '}
                {Object.entries(fichas)
                  .filter(([clave, f]) => f.proveedorId === p.id && insumos[clave])
                  .map(([clave]) => insumos[clave].nombre)
                  .join(', ') || 'sin insumos asignados'}
              </span>
            </span>
            <button className="text-xs underline" onClick={() => setEditando(p.id)}>
              Editar
            </button>
          </div>
        ),
      )}
      {editando === 'nuevo' ? (
        <EditorProveedor onListo={() => setEditando(null)} />
      ) : (
        <button className="text-sm underline self-start" onClick={() => setEditando('nuevo')}>
          + Agregar proveedor
        </button>
      )}
    </Tarjeta>
  )
}
