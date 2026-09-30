import { useState } from 'react'
import { CampoNumero } from '../../components/CampoNumero'
import { formatoPorcentaje } from '../../lib/format'
import {
  actualizarConfigPlataforma,
  actualizarConfigPublico,
  actualizarMargenPublico,
  cambiarContrasena,
  setAdicionalActivo,
  setBebidaActiva,
  setCanalActivo,
  setTamanoActivo,
} from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'
import { SeccionEventos, SeccionParametros, SeccionProveedores, SeccionTamanos, SeccionTurnos } from './AjustesSecciones'
import { mensajeError } from '../../lib/errores'

function Toggle({ activo, etiqueta, onChange }: { activo: boolean; etiqueta: string; onChange: (v: boolean) => Promise<unknown> }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        onClick={() =>
          onChange(!activo)
            .then(() => setError(null))
            .catch((e) => setError(mensajeError(e)))
        }
        className={`w-11 h-6 rounded-full relative transition-colors ${activo ? 'bg-ok' : 'bg-border'}`}
        aria-pressed={activo}
        aria-label={etiqueta}
      >
        <span className={`absolute top-0.5 left-0 w-5 h-5 rounded-full bg-bg transition-transform ${activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
      {error && <span className="text-xs text-ink-dark">No se guardó: {error}</span>}
    </span>
  )
}

function TarjetaCuenta() {
  const [nueva, setNueva] = useState('')
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)

  return (
    <section className="border border-border rounded p-4 bg-surface flex flex-col gap-3">
      <h2 className="text-sm label-uppercase m-0">Cuenta</h2>
      <p className="text-sm text-muted m-0">
        La app entra sola con esta contraseña. Si la cambias aquí, avísale a Claude para que actualice la de entrada automática en Netlify.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Contraseña nueva
        <input
          type="password"
          autoComplete="new-password"
          className="h-10 border border-border rounded px-2 bg-bg"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
        />
      </label>
      <button
        disabled={guardando || nueva.length === 0}
        className="h-11 rounded bg-ink text-bg font-semibold disabled:opacity-50"
        onClick={async () => {
          setGuardando(true)
          try {
            await cambiarContrasena(nueva)
            setNueva('')
            setMensaje({ ok: true, texto: 'Contraseña cambiada.' })
          } catch (e) {
            setMensaje({ ok: false, texto: mensajeError(e) })
          } finally {
            setGuardando(false)
          }
        }}
      >
        {guardando ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
      {mensaje && <p className={`text-sm m-0 ${mensaje.ok ? 'text-ok' : 'text-ink-dark'}`}>{mensaje.texto}</p>}
    </section>
  )
}

export function AjustesScreen() {
  const canales = useStore((s) => s.canales)
  const configPlataformaPorCanal = useStore((s) => s.configPlataformaPorCanal)
  const configPublicoPorCanal = useStore((s) => s.configPublicoPorCanal)
  const bebidas = useStore((s) => Object.values(s.bebidas))
  const adicionales = useStore((s) => Object.values(s.adicionales))
  const parametros = useStore((s) => s.parametros)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-3xl mx-auto">
      <h1 className="text-3xl">Ajustes</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm label-uppercase">Canales</h2>
        {canales.map((c) => {
          const plataforma = configPlataformaPorCanal[c.nombre]
          const publico = configPublicoPorCanal[c.nombre]
          return (
            <div key={c.nombre} className="border border-border rounded p-4 bg-surface flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-display text-lg">{c.nombre}</span>
                <Toggle etiqueta={`Canal ${c.nombre} activo`} activo={c.activo} onChange={(v) => setCanalActivo(c.nombre, v)} />
              </div>
              {plataforma && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <CampoNumero
                      etiqueta="Comisión base"
                      porcentaje
                      min={0}
                      max={100}
                      valor={plataforma.comisionBase}
                      onGuardar={(v) => actualizarConfigPlataforma(c.nombre, { comisionBase: v })}
                    />
                    <CampoNumero
                      etiqueta="Marketing / anuncios"
                      porcentaje
                      min={0}
                      max={100}
                      valor={plataforma.marketing}
                      onGuardar={(v) => actualizarConfigPlataforma(c.nombre, { marketing: v })}
                    />
                    <CampoNumero
                      etiqueta="Uber One (cargo extra)"
                      porcentaje
                      min={0}
                      max={100}
                      valor={plataforma.uberOne}
                      onGuardar={(v) => actualizarConfigPlataforma(c.nombre, { uberOne: v })}
                    />
                    <CampoNumero
                      etiqueta="Pedidos con Uber One"
                      porcentaje
                      min={0}
                      max={100}
                      valor={plataforma.uberOneProporcion}
                      onGuardar={(v) => actualizarConfigPlataforma(c.nombre, { uberOneProporcion: v })}
                    />
                    <CampoNumero
                      etiqueta="Retención ISR"
                      porcentaje
                      min={0}
                      max={100}
                      valor={plataforma.retencionIsr}
                      onGuardar={(v) => actualizarConfigPlataforma(c.nombre, { retencionIsr: v })}
                    />
                    <CampoNumero
                      etiqueta="Retención IVA"
                      porcentaje
                      min={0}
                      max={100}
                      valor={plataforma.retencionIva}
                      onGuardar={(v) => actualizarConfigPlataforma(c.nombre, { retencionIva: v })}
                    />
                  </div>
                  <p className="text-sm m-0 border-t border-border pt-2">
                    Comisión efectiva: <strong className="tabular">{formatoPorcentaje(plataforma.comisionEfectiva)}</strong>
                    <span className="text-muted"> = base + Uber One × pedidos con Uber One + marketing</span>
                  </p>
                </>
              )}
              {publico && (
                <div className="grid grid-cols-2 gap-3">
                  <CampoNumero
                    etiqueta="Margen mínimo"
                    porcentaje
                    min={0}
                    max={100}
                    valor={parametros.margenPublicoMin}
                    onGuardar={(v) => actualizarMargenPublico({ margenPublicoMin: v })}
                  />
                  <CampoNumero
                    etiqueta="Margen máximo"
                    porcentaje
                    min={0}
                    max={100}
                    valor={parametros.margenPublicoMax}
                    onGuardar={(v) => actualizarMargenPublico({ margenPublicoMax: v })}
                  />
                  <CampoNumero
                    etiqueta="Descuento de adicionales vs. app"
                    porcentaje
                    min={0}
                    max={100}
                    valor={publico.descuentoVsApp}
                    onGuardar={(v) => actualizarConfigPublico(c.nombre, { descuentoVsApp: v })}
                  />
                  <CampoNumero
                    etiqueta="Envío cobrado (sugerido)"
                    sufijo="$"
                    min={0}
                    valor={publico.envioCobradoDefault}
                    onGuardar={(v) => actualizarConfigPublico(c.nombre, { envioCobradoDefault: v })}
                  />
                </div>
              )}
            </div>
          )
        })}
      </section>

      <SeccionParametros />
      <SeccionTurnos />
      <SeccionEventos />
      <SeccionTamanos onActivo={setTamanoActivo} />
      <SeccionProveedores />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm label-uppercase">Bebidas</h2>
        {bebidas.map((b) => (
          <div key={b.nombre} className="flex justify-between items-center py-2 border-b border-border">
            <span>{b.nombre}</span>
            <Toggle etiqueta={`${b.nombre} activa`} activo={b.activa} onChange={(v) => setBebidaActiva(b.nombre, v)} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm label-uppercase">Adicionales</h2>
        {adicionales.map((a) => (
          <div key={a.nombre} className="flex justify-between items-center py-2 border-b border-border">
            <span>{a.nombre}</span>
            <Toggle etiqueta={`${a.nombre} activo`} activo={a.activo} onChange={(v) => setAdicionalActivo(a.nombre, v)} />
          </div>
        ))}
      </section>

      <TarjetaCuenta />
    </div>
  )
}
