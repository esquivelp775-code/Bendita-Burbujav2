import { useState } from 'react'
import { mensajeError } from '../../lib/errores'
import { formatoMoneda } from '../../lib/format'
import { asignarInsumosAProveedor, guardarProveedor, type ProveedorStore } from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

export function Proveedores() {
  const proveedores = useStore((s) => s.proveedores)
  const fichas = useStore((s) => s.fichas)
  const insumos = useStore((s) => s.insumos)
  const [editando, setEditando] = useState<ProveedorStore | 'nuevo' | null>(null)

  const surte = (id: string) =>
    Object.entries(fichas)
      .filter(([clave, f]) => f.proveedorId === id && insumos[clave])
      .map(([clave]) => clave)
  const sinProveedor = Object.values(insumos)
    .filter((i) => !fichas[i.clave]?.proveedorId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  if (editando) return <EditorProveedor proveedor={editando === 'nuevo' ? undefined : editando} surteActual={editando === 'nuevo' ? [] : surte(editando.id)} onListo={() => setEditando(null)} />

  return (
    <div className="flex flex-col gap-3">
      <button className="h-12 rounded bg-ink text-bg font-semibold" onClick={() => setEditando('nuevo')}>
        Agregar proveedor
      </button>
      {proveedores.map((p) => {
        const claves = surte(p.id)
        return (
          <section key={p.id} className="border border-border rounded p-4 bg-surface text-sm flex flex-col gap-1">
            <div className="flex justify-between items-start gap-2">
              <span className="font-display text-lg">{p.nombre}</span>
              <button className="h-9 px-3 rounded border border-border text-xs font-semibold" onClick={() => setEditando(p)}>
                Editar
              </button>
            </div>
            {p.contacto && <span>{p.contacto}</span>}
            {p.notas && <span className="text-muted">{p.notas}</span>}
            <span className="text-xs text-muted">
              Surte: {claves.length ? claves.map((c) => insumos[c].nombre).join(', ') : 'ningún insumo asignado'}
            </span>
            {claves.some((c) => fichas[c]?.ultimaCompra) && (
              <span className="text-xs text-muted">
                Últimas compras:{' '}
                {claves
                  .filter((c) => fichas[c]?.ultimaCompra)
                  .map((c) => `${insumos[c].nombre} ${fichas[c].ultimaCompra!.fecha} a ${formatoMoneda(fichas[c].ultimaCompra!.precioPorPresentacion)}`)
                  .join(' · ')}
              </span>
            )}
          </section>
        )
      })}
      {sinProveedor.length > 0 && (
        <section className="border border-warn rounded p-4 bg-surface text-sm">
          <h2 className="text-sm label-uppercase m-0 mb-1 text-warn">Insumos sin proveedor · {sinProveedor.length}</h2>
          <p className="text-xs text-muted m-0 mb-2">Asígnalos editando un proveedor, así la lista de compras sale agrupada.</p>
          <span className="text-muted">{sinProveedor.map((i) => i.nombre).join(', ')}</span>
        </section>
      )}
    </div>
  )
}

function EditorProveedor({ proveedor, surteActual, onListo }: { proveedor?: ProveedorStore; surteActual: string[]; onListo: () => void }) {
  const insumos = useStore((s) => Object.values(s.insumos).sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)))
  const fichas = useStore((s) => s.fichas)
  const proveedores = useStore((s) => s.proveedores)
  const [nombre, setNombre] = useState(proveedor?.nombre ?? '')
  const [contacto, setContacto] = useState(proveedor?.contacto ?? '')
  const [notas, setNotas] = useState(proveedor?.notas ?? '')
  const [elegidos, setElegidos] = useState<Set<string>>(new Set(surteActual))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nombreProveedor = (id?: string) => proveedores.find((p) => p.id === id)?.nombre

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      const id = await guardarProveedor({ id: proveedor?.id, nombre, contacto, notas })
      await asignarInsumosAProveedor(id, [...elegidos])
      onListo()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  let categoria = ''
  return (
    <div className="flex flex-col gap-3 text-sm">
      <button className="text-sm underline self-start" onClick={onListo}>
        ← Proveedores
      </button>
      <h2 className="text-lg font-display m-0">{proveedor ? `Editar · ${proveedor.nombre}` : 'Nuevo proveedor'}</h2>
      <label className="flex flex-col gap-1">
        Nombre
        <input className="h-11 border border-border rounded px-3 bg-surface" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        Contacto (WhatsApp, teléfono, correo)
        <input className="h-11 border border-border rounded px-3 bg-surface" value={contacto} onChange={(e) => setContacto(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        Notas (cómo paga, envíos, días de entrega…)
        <input className="h-11 border border-border rounded px-3 bg-surface" value={notas} onChange={(e) => setNotas(e.target.value)} />
      </label>
      <div className="border border-border rounded bg-surface">
        <div className="px-3 py-2 label-uppercase text-xs border-b border-border">Insumos que surte · {elegidos.size}</div>
        {insumos.map((i) => {
          const cabecera = i.categoria !== categoria
          categoria = i.categoria
          const otro = fichas[i.clave]?.proveedorId && fichas[i.clave]?.proveedorId !== proveedor?.id ? nombreProveedor(fichas[i.clave]?.proveedorId) : null
          return (
            <div key={i.clave}>
              {cabecera && <div className="px-3 pt-2 text-xs text-muted">{categoria}</div>}
              <label className="flex items-center gap-2 px-3 py-1.5 min-h-10">
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={elegidos.has(i.clave)}
                  onChange={(e) =>
                    setElegidos((s) => {
                      const n = new Set(s)
                      if (e.target.checked) n.add(i.clave)
                      else n.delete(i.clave)
                      return n
                    })
                  }
                />
                <span>
                  {i.nombre}
                  {otro && !elegidos.has(i.clave) && <span className="text-xs text-muted"> · hoy lo surte {otro}</span>}
                  {otro && elegidos.has(i.clave) && <span className="text-xs text-warn"> · se cambia de {otro}</span>}
                </span>
              </label>
            </div>
          )
        })}
      </div>
      <button disabled={guardando} className="h-12 rounded bg-ink text-bg font-semibold disabled:opacity-60" onClick={guardar}>
        {guardando ? 'Guardando…' : 'Guardar proveedor'}
      </button>
      {error && <p className="text-ink-dark m-0">No se guardó: {error}</p>}
    </div>
  )
}
