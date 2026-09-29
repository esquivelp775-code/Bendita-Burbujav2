import { useEffect, useId, useState } from 'react'

interface Props {
  etiqueta: string
  /** Valor guardado. Si `porcentaje`, es una fracción (0.295) y se muestra como 29.5. */
  valor: number | null
  onGuardar: (valor: number) => Promise<unknown> | unknown
  porcentaje?: boolean
  min?: number
  max?: number
  sufijo?: string
  ayuda?: string
  /** Permite dejarlo vacío (guarda null a través de onVaciar). */
  onVaciar?: () => Promise<unknown> | unknown
  className?: string
}

type Estado = { tipo: 'quieto' } | { tipo: 'guardando' } | { tipo: 'guardado' } | { tipo: 'error'; mensaje: string }

const aTexto = (v: number | null, porcentaje?: boolean) => (v == null ? '' : String(porcentaje ? Math.round(v * 100000) / 1000 : v))

/**
 * Campo numérico que guarda al salir del campo o con Enter, nunca con cada tecla: escribir "27"
 * ya no guarda primero 2 %. Valida el rango y muestra el resultado (o el error) junto al campo.
 */
export function CampoNumero({ etiqueta, valor, onGuardar, porcentaje, min, max, sufijo, ayuda, onVaciar, className }: Props) {
  const id = useId()
  const [texto, setTexto] = useState(() => aTexto(valor, porcentaje))
  const [estado, setEstado] = useState<Estado>({ tipo: 'quieto' })

  // Si el valor cambia desde fuera (recarga, otro campo), se refleja mientras no se esté editando.
  useEffect(() => {
    if (estado.tipo !== 'guardando') setTexto(aTexto(valor, porcentaje))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, porcentaje])

  useEffect(() => {
    if (estado.tipo !== 'guardado') return
    const t = setTimeout(() => setEstado({ tipo: 'quieto' }), 2000)
    return () => clearTimeout(t)
  }, [estado])

  async function guardar() {
    const limpio = texto.trim().replace(',', '.')
    if (limpio === aTexto(valor, porcentaje)) return
    if (limpio === '') {
      if (!onVaciar) {
        setTexto(aTexto(valor, porcentaje))
        return
      }
      setEstado({ tipo: 'guardando' })
      try {
        await onVaciar()
        setEstado({ tipo: 'guardado' })
      } catch (e) {
        setEstado({ tipo: 'error', mensaje: e instanceof Error ? e.message : String(e) })
      }
      return
    }
    const mostrado = Number(limpio)
    if (!Number.isFinite(mostrado)) {
      setEstado({ tipo: 'error', mensaje: 'Escribe un número' })
      return
    }
    if ((min != null && mostrado < min) || (max != null && mostrado > max)) {
      setEstado({ tipo: 'error', mensaje: `Debe estar entre ${min ?? '−∞'} y ${max ?? '∞'}` })
      return
    }
    setEstado({ tipo: 'guardando' })
    try {
      await onGuardar(porcentaje ? mostrado / 100 : mostrado)
      setEstado({ tipo: 'guardado' })
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <label htmlFor={id} className={`flex flex-col gap-1 text-sm ${className ?? ''}`}>
      <span>{etiqueta}</span>
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className={`h-10 w-full min-w-0 border rounded px-2 bg-bg tabular ${estado.tipo === 'error' ? 'border-ink-dark' : 'border-border'}`}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            if (estado.tipo === 'error') setEstado({ tipo: 'quieto' })
          }}
          onBlur={guardar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') {
              setTexto(aTexto(valor, porcentaje))
              setEstado({ tipo: 'quieto' })
            }
          }}
        />
        {(sufijo ?? (porcentaje ? '%' : '')) && <span className="text-muted">{sufijo ?? '%'}</span>}
      </span>
      {estado.tipo === 'guardando' && <span className="text-xs text-muted">Guardando…</span>}
      {estado.tipo === 'guardado' && <span className="text-xs text-ok">Guardado ✓</span>}
      {estado.tipo === 'error' && <span className="text-xs text-ink-dark">No se guardó: {estado.mensaje}</span>}
      {estado.tipo === 'quieto' && ayuda && <span className="text-xs text-muted">{ayuda}</span>}
    </label>
  )
}
