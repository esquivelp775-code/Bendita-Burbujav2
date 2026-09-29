import type { Session } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { modoLocal } from '../../lib/modo'
import { cargarTodo, hidratarDesdeSnapshot, iniciarStore, limpiar, marcarSinConexion } from '../../lib/store/remoteStore'
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

/** Antes de subir ventas pendientes: hay sesión, o se intenta la entrada automática. */
async function asegurarSesion(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  if (data.session) return true
  return (await entrarSola()) != null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(modoLocal ? null : undefined)
  const [fallo, setFallo] = useState(false)
  // true cuando ya hay datos guardados en el teléfono: la app abre sin esperar a la red.
  const [conSnapshot, setConSnapshot] = useState<boolean | null>(modoLocal ? false : null)
  const cargando = useStore((s) => s.cargando)
  const error = useStore((s) => s.error)
  // Evita que el evento inicial (sesión nula) de onAuthStateChange pise el resultado
  // del auto-login: solo se intenta una vez, todo pasa por este único listener.
  const intentado = useRef(false)

  useEffect(() => {
    if (modoLocal) return
    iniciarStore({ asegurarSesion })
    void hidratarDesdeSnapshot().then(setConSnapshot)

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      if (nuevaSesion) {
        setSession(nuevaSesion)
        setFallo(false)
        return
      }
      if (intentado.current) {
        setSession(null)
        setFallo(true)
        marcarSinConexion(true)
        return
      }
      intentado.current = true
      entrarSola().then((auto) => {
        setSession(auto)
        if (!auto) {
          setFallo(true)
          marcarSinConexion(true)
        }
      })
    })

    // Al volver la señal sin sesión (se abrió sin red), reintenta la entrada automática.
    const alVolver = () => {
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session) void entrarSola().then((auto) => auto && setSession(auto))
      })
    }
    window.addEventListener('online', alVolver)
    return () => {
      sub.subscription.unsubscribe()
      window.removeEventListener('online', alVolver)
    }
  }, [])

  useEffect(() => {
    if (modoLocal || !session || conSnapshot == null) return
    cargarTodo({ enSegundoPlano: conSnapshot }).catch(() => {
      /* el error queda expuesto en estado.error */
    })
  }, [session?.user.id, conSnapshot])

  if (modoLocal) return <>{children}</>

  // Con datos en el teléfono se trabaja aunque no haya red ni sesión todavía.
  if (conSnapshot) return <>{children}</>

  if (conSnapshot == null) return <SplashScreen />

  if (!session) {
    if (fallo) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
          <p className="text-ink-dark">{navigator.onLine ? 'No se pudo entrar automáticamente.' : 'Sin señal. La primera vez la app necesita internet para bajar tu catálogo.'}</p>
          <button
            className="underline text-sm"
            onClick={() => {
              limpiar()
              window.location.reload()
            }}
          >
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
