import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { actualizarAhora, onVersionNueva } from '../../lib/actualizacion'
import { modoLocal } from '../../lib/modo'
import { sincronizar } from '../../lib/offline/queue'
import { alertasInventario } from '../../lib/store/selectors'
import { useStore } from '../../lib/store/useStore'

type Icono = 'hoy' | 'vender' | 'desglose' | 'inventario' | 'compras' | 'recetas' | 'equipo' | 'ajustes' | 'mas'

interface ItemNav {
  to: string
  label: string
  icono: Icono
}

const NAV_GROUPS: { titulo: string; items: ItemNav[] }[] = [
  {
    titulo: 'Operación',
    items: [
      { to: '/hoy', label: 'Hoy', icono: 'hoy' },
      { to: '/vender', label: 'Vender', icono: 'vender' },
      { to: '/desglose', label: 'Desglose del día', icono: 'desglose' },
    ],
  },
  {
    titulo: 'Catálogo',
    items: [
      { to: '/inventario', label: 'Inventario', icono: 'inventario' },
      { to: '/compras', label: 'Compras', icono: 'compras' },
      { to: '/recetas', label: 'Recetas', icono: 'recetas' },
      { to: '/equipo', label: 'Equipo y mobiliario', icono: 'equipo' },
    ],
  },
  {
    titulo: 'Cuenta',
    items: [{ to: '/ajustes', label: 'Ajustes', icono: 'ajustes' }],
  },
]

/** Los accesos fijos de la barra inferior en celular; todo lo demás vive en "Más". */
const NAV_MOVIL: ItemNav[] = [
  { to: '/hoy', label: 'Hoy', icono: 'hoy' },
  { to: '/vender', label: 'Vender', icono: 'vender' },
  { to: '/inventario', label: 'Inventario', icono: 'inventario' },
  { to: '/desglose', label: 'Desglose', icono: 'desglose' },
]

const TRAZOS: Record<Icono, string> = {
  hoy: 'M4 5h16v15H4z M4 9h16 M8 3v4 M16 3v4',
  vender: 'M7 4h10l-1 16H8z M9 4l1-2h4l1 2 M12 2v2',
  desglose: 'M5 20V10 M10 20V4 M15 20v-7 M20 20V8',
  inventario: 'M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10',
  compras: 'M3 4h2l2 12h11l2-8H7 M9 20a1 1 0 1 0 0.01 0 M17 20a1 1 0 1 0 0.01 0',
  recetas: 'M6 3h10l3 3v15H6z M9 9h7 M9 13h7 M9 17h4',
  equipo: 'M4 17h16 M6 17V9h12v8 M9 9V5h6v4',
  ajustes: 'M12 9a3 3 0 1 0 0.01 0 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1',
  mas: 'M5 12h.01 M12 12h.01 M19 12h.01',
}

function Icono({ nombre }: { nombre: Icono }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={nombre === 'mas' ? 3 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={TRAZOS[nombre]} />
    </svg>
  )
}

function navClase({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 h-10 px-3 rounded text-[15px] text-left ${isActive ? 'bg-ink text-bg font-semibold' : 'text-ink hover:bg-card'}`
}

function Contador({ n }: { n: number }) {
  if (n === 0) return null
  return <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-warn text-bg text-[11px] font-semibold flex items-center justify-center tabular">{n}</span>
}

export function Layout() {
  const pendientes = useStore((s) => s.pendientesPorSubir)
  const sinConexion = useStore((s) => s.sinConexion)
  const [online, setOnline] = useState(navigator.onLine)
  const [versionNueva, setVersionNueva] = useState(false)
  const [masAbierto, setMasAbierto] = useState(false)
  const avisos = useStore((s) => alertasInventario(s).length)
  const ubicacion = useLocation()

  useEffect(() => setMasAbierto(false), [ubicacion.pathname])
  useEffect(() => onVersionNueva(setVersionNueva), [])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const enMas = !NAV_MOVIL.some((i) => ubicacion.pathname.startsWith(i.to))

  return (
    <div className="flex min-h-screen justify-center">
      <div className="flex w-full max-w-[1400px] min-h-screen">
        <aside className="hidden md:flex w-[232px] flex-none sticky top-0 h-screen overflow-y-auto border-r border-border flex-col gap-5 p-4">
          <img src="/assets/logo-bendita.jpeg" alt="Bendita Burbuja" className="w-24 h-24 object-cover rounded self-center" />
          <div className="h-px bg-border" />
          <nav className="flex flex-col gap-1">
            {NAV_GROUPS.map((grupo) => (
              <div key={grupo.titulo} className="flex flex-col gap-1 mb-2">
                <span className="label-uppercase px-3 pb-1">{grupo.titulo}</span>
                {grupo.items.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navClase}>
                    <Icono nombre={item.icono} />
                    {item.label}
                    {item.to === '/inventario' && <Contador n={avisos} />}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="flex justify-between items-center gap-2 px-4 py-1.5 border-b border-border bg-card">
            <span className="label-uppercase">Bendita Burbuja{modoLocal ? ' · modo local (sin Supabase todavía)' : ''}</span>
          </div>
          {(!online || sinConexion || pendientes > 0) && (
            <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-warn text-warn text-sm font-medium">
              <span className="flex-1">
                {!online || sinConexion
                  ? 'Sin conexión · Trabajando con lo guardado en tu teléfono; las ventas se suben cuando vuelva la señal'
                  : 'Subiendo ventas guardadas en el teléfono…'}
              </span>
              {pendientes > 0 && (
                <button className="tabular whitespace-nowrap underline" onClick={() => void sincronizar()}>
                  {pendientes} por subir · Reintentar
                </button>
              )}
            </div>
          )}
          {versionNueva && (
            <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border text-sm">
              <span className="flex-1">Hay una versión nueva de la app. Se instala sola al cerrar el pedido abierto.</span>
              <button className="underline font-semibold whitespace-nowrap" onClick={actualizarAhora}>
                Actualizar ya
              </button>
            </div>
          )}
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>

      {masAbierto && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMasAbierto(false)}>
          <nav
            className="absolute bottom-0 left-0 right-0 bg-bg rounded-t p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}
            aria-label="Todas las secciones"
          >
            {NAV_GROUPS.map((grupo) => (
              <div key={grupo.titulo} className="flex flex-col gap-1 mb-2">
                <span className="label-uppercase px-3 pb-1">{grupo.titulo}</span>
                {grupo.items.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navClase}>
                    <Icono nombre={item.icono} />
                    {item.label}
                    {item.to === '/inventario' && <Contador n={avisos} />}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border grid grid-cols-5 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación principal"
      >
        {NAV_MOVIL.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `relative flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] ${isActive ? 'text-ink font-semibold' : 'text-muted'}`}
          >
            <Icono nombre={item.icono} />
            {item.label}
            {item.to === '/inventario' && avisos > 0 && (
              <span className="absolute top-2 right-[calc(50%-1.1rem)] w-2 h-2 rounded-full bg-warn" aria-label={`${avisos} avisos`} />
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setMasAbierto((v) => !v)}
          className={`flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] ${masAbierto || enMas ? 'text-ink font-semibold' : 'text-muted'}`}
          aria-expanded={masAbierto}
        >
          <Icono nombre="mas" />
          Más
        </button>
      </nav>
    </div>
  )
}
