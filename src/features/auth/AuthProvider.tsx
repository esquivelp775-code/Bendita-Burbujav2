import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { modoLocal } from '../../lib/modo'
import { cargarTodo, limpiar } from '../../lib/store/remoteStore'
import { supabase } from '../../lib/supabase/client'
import { useStore } from '../../lib/store/useStore'

const autoEmail = import.meta.env.VITE_AUTO_LOGIN_EMAIL
const autoPassword = import.meta.env.VITE_AUTO_LOGIN_PASSWORD

async function entrarSola(): Promise<Session | null> {
  if (!autoEmail || !autoPassword) return null
  const { data, error } = await supabase.auth.signInWithPassword({ email: autoEmail, password: autoPassword })
  if (error) return null
  return data.session
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(modoLocal ? null : undefined)
  const cargando = useStore((s) => s.cargando)
  const error = useStore((s) => s.error)

  useEffect(() => {
    if (modoLocal) return
    let detenido = false

    async function iniciar() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        if (!detenido) setSession(data.session)
        return
      }
      const nueva = await entrarSola()
      if (!detenido) setSession(nueva)
    }
    iniciar()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion)
      if (!nuevaSesion) limpiar()
    })
    return () => {
      detenido = true
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (modoLocal || !session) return
    cargarTodo().catch(() => {
      /* el error queda expuesto en estado.error */
    })
  }, [session?.user.id])

  if (modoLocal) return <>{children}</>

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-muted">
        <span>Abriendo…</span>
        <button className="text-xs underline" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    )
  }
  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Abriendo la caja…</div>
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <p className="text-ink-dark">No se pudo cargar el catálogo: {error}</p>
        <button className="underline text-sm" onClick={() => cargarTodo()}>
          Reintentar
        </button>
      </div>
    )
  }
  return <>{children}</>
}
