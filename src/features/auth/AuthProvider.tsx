import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { modoLocal } from '../../lib/modo'
import { cargarTodo, limpiar } from '../../lib/store/remoteStore'
import { supabase } from '../../lib/supabase/client'
import { useStore } from '../../lib/store/useStore'
import { AuthScreen } from './AuthScreen'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(modoLocal ? null : undefined)
  const cargando = useStore((s) => s.cargando)
  const error = useStore((s) => s.error)

  useEffect(() => {
    if (modoLocal) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion)
      if (!nuevaSesion) limpiar()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (modoLocal || !session) return
    cargarTodo().catch(() => {
      /* el error queda expuesto en estado.error */
    })
  }, [session?.user.id])

  if (modoLocal) return <>{children}</>

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Cargando…</div>
  }
  if (!session) {
    return <AuthScreen />
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
