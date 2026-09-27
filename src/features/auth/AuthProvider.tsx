import type { Session } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { modoLocal } from '../../lib/modo'
import { cargarTodo, limpiar } from '../../lib/store/remoteStore'
import { supabase } from '../../lib/supabase/client'
import { useStore } from '../../lib/store/useStore'
import { SplashScreen } from './SplashScreen'

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
  const [fallo, setFallo] = useState(false)
  const cargando = useStore((s) => s.cargando)
  const error = useStore((s) => s.error)
  // Evita que el evento inicial (sesión nula) de onAuthStateChange pise el resultado
  // del auto-login: solo se intenta una vez, todo pasa por este único listener.
  const intentado = useRef(false)

  useEffect(() => {
    if (modoLocal) return

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      if (nuevaSesion) {
        setSession(nuevaSesion)
        return
      }
      if (intentado.current) {
        setSession(null)
        setFallo(true)
        limpiar()
        return
      }
      intentado.current = true
      entrarSola().then((auto) => {
        setSession(auto)
        if (!auto) setFallo(true)
      })
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

  if (!session) {
    if (fallo) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
          <p className="text-ink-dark">No se pudo entrar automáticamente.</p>
          <button className="underline text-sm" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      )
    }
    return <SplashScreen />
  }
  if (cargando) {
    return <SplashScreen />
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
