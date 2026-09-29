import {
  actualizarConfigPlataforma,
  actualizarConfigPublico,
  actualizarMargenPublico,
  setAdicionalActivo,
  setBebidaActiva,
  setCanalActivo,
  setTamanoActivo,
} from '../../lib/store/remoteStore'
import { useStore } from '../../lib/store/useStore'

function Toggle({ activo, onChange }: { activo: boolean; onChange: (v: boolean) => void | Promise<void> }) {
  return (
    <button
      onClick={() => Promise.resolve(onChange(!activo)).catch((e) => window.alert(`No se pudo guardar: ${e instanceof Error ? e.message : e}`))}
      className={`w-11 h-6 rounded-full relative transition-colors ${activo ? 'bg-ok' : 'bg-border'}`}
      aria-pressed={activo}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-bg transition-transform ${activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function AjustesScreen() {
  const canales = useStore((s) => s.canales)
  const configPlataformaPorCanal = useStore((s) => s.configPlataformaPorCanal)
  const configPublicoPorCanal = useStore((s) => s.configPublicoPorCanal)
  const tamanos = useStore((s) => Object.values(s.tamanos))
  const bebidas = useStore((s) => Object.values(s.bebidas))
  const adicionales = useStore((s) => Object.values(s.adicionales))
  const parametros = useStore((s) => s.parametros)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-3xl mx-auto">
      <h1 className="text-3xl">Ajustes</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm label-uppercase">Canales</h2>
        {canales.map((c) => {
          const configPlataforma = configPlataformaPorCanal[c.nombre]
          const configPublico = configPublicoPorCanal[c.nombre]
          return (
            <div key={c.nombre} className="border border-border rounded p-4 bg-surface flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-display text-lg">{c.nombre}</span>
                <Toggle activo={c.activo} onChange={(v) => setCanalActivo(c.nombre, v)} />
              </div>
              {configPlataforma && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <label className="flex flex-col gap-1">
                    Comisión efectiva
                    <input
                      type="number"
                      step="0.01"
                      className="h-9 border border-border rounded px-2 bg-bg"
                      value={configPlataforma.comisionEfectiva}
                      onChange={(e) => actualizarConfigPlataforma(c.nombre, { comisionEfectiva: Number(e.target.value) }).catch(console.error)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Retención ISR
                    <input
                      type="number"
                      step="0.001"
                      className="h-9 border border-border rounded px-2 bg-bg"
                      value={configPlataforma.retencionIsr}
                      onChange={(e) => actualizarConfigPlataforma(c.nombre, { retencionIsr: Number(e.target.value) }).catch(console.error)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Retención IVA
                    <input
                      type="number"
                      step="0.01"
                      className="h-9 border border-border rounded px-2 bg-bg"
                      value={configPlataforma.retencionIva}
                      onChange={(e) => actualizarConfigPlataforma(c.nombre, { retencionIva: Number(e.target.value) }).catch(console.error)}
                    />
                  </label>
                </div>
              )}
              {configPublico && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <label className="flex flex-col gap-1">
                    Margen mínimo (%)
                    <input
                      type="number"
                      step="0.5"
                      className="h-9 border border-border rounded px-2 bg-bg"
                      value={Math.round(parametros.margenPublicoMin * 1000) / 10}
                      onChange={(e) => actualizarMargenPublico({ margenPublicoMin: Number(e.target.value) / 100 }).catch(console.error)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Margen máximo (%)
                    <input
                      type="number"
                      step="0.5"
                      className="h-9 border border-border rounded px-2 bg-bg"
                      value={Math.round(parametros.margenPublicoMax * 1000) / 10}
                      onChange={(e) => actualizarMargenPublico({ margenPublicoMax: Number(e.target.value) / 100 }).catch(console.error)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Descuento de adicionales vs. app
                    <input
                      type="number"
                      step="0.01"
                      className="h-9 border border-border rounded px-2 bg-bg"
                      value={configPublico.descuentoVsApp}
                      onChange={(e) => actualizarConfigPublico(c.nombre, { descuentoVsApp: Number(e.target.value) }).catch(console.error)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Envío cobrado (default)
                    <input
                      type="number"
                      className="h-9 border border-border rounded px-2 bg-bg"
                      value={configPublico.envioCobradoDefault}
                      onChange={(e) => actualizarConfigPublico(c.nombre, { envioCobradoDefault: Number(e.target.value) }).catch(console.error)}
                    />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm label-uppercase">Tamaños</h2>
        {tamanos.map((t) => (
          <div key={t.nombre} className="flex justify-between items-center py-2 border-b border-border">
            <span>{t.nombre}</span>
            <Toggle activo={t.activo} onChange={(v) => setTamanoActivo(t.nombre, v)} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm label-uppercase">Bebidas</h2>
        {bebidas.map((b) => (
          <div key={b.nombre} className="flex justify-between items-center py-2 border-b border-border">
            <span>{b.nombre}</span>
            <Toggle activo={b.activa} onChange={(v) => setBebidaActiva(b.nombre, v)} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm label-uppercase">Adicionales</h2>
        {adicionales.map((a) => (
          <div key={a.nombre} className="flex justify-between items-center py-2 border-b border-border">
            <span>{a.nombre}</span>
            <Toggle activo={a.activo} onChange={(v) => setAdicionalActivo(a.nombre, v)} />
          </div>
        ))}
      </section>
    </div>
  )
}
