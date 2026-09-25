import { useState } from 'react'
import { supabase } from '../../lib/supabase/client'

export function AuthScreen() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function enviarEnlace() {
    setCargando(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setCargando(false)
    if (error) setError(error.message)
    else setEnviado(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm flex flex-col gap-4 border border-border rounded p-6 bg-surface">
        <img src="/assets/logo-bendita.jpeg" alt="Bendita Burbuja" className="w-20 h-20 object-cover rounded self-center" />
        <h1 className="text-2xl text-center">Bendita Burbuja</h1>

        {enviado ? (
          <p className="text-sm text-ok text-center">Te mandamos un enlace a {email}. Ábrelo desde este mismo navegador.</p>
        ) : (
          <>
            <input
              type="email"
              placeholder="tu correo"
              className="h-11 border border-border rounded px-3 bg-bg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-sm text-ink-dark">{error}</p>}
            <button disabled={cargando || !email} onClick={enviarEnlace} className="h-11 rounded bg-ink text-bg font-semibold disabled:opacity-50">
              {cargando ? 'Enviando…' : 'Enviar enlace mágico'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
