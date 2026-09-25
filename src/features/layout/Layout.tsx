import { NavLink, Outlet } from 'react-router-dom'
import { modoLocal } from '../../lib/modo'
import { pendientesCount } from '../../lib/offline/queue'
import { useEffect, useState } from 'react'

const NAV_GROUPS: { titulo: string; items: { to: string; label: string }[] }[] = [
  {
    titulo: 'Operación',
    items: [
      { to: '/hoy', label: 'Hoy' },
      { to: '/vender', label: 'Vender' },
      { to: '/desglose', label: 'Desglose del día' },
    ],
  },
  {
    titulo: 'Catálogo',
    items: [
      { to: '/inventario', label: 'Inventario' },
      { to: '/compras', label: 'Compras' },
      { to: '/recetas', label: 'Recetas' },
      { to: '/equipo', label: 'Equipo y mobiliario' },
    ],
  },
  {
    titulo: 'Cuenta',
    items: [{ to: '/ajustes', label: 'Ajustes' }],
  },
]

function navClase({ isActive }: { isActive: boolean }) {
  return `flex items-center h-10 px-3 rounded text-[15px] text-left ${
    isActive ? 'bg-ink text-bg font-semibold' : 'text-ink hover:bg-card'
  }`
}

export function Layout() {
  const [pendientes, setPendientes] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    if (modoLocal) return
    pendientesCount().then(setPendientes)
  }, [])

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
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col min-h-screen">
          <div className="flex justify-between items-center gap-2 px-4 py-1.5 border-b border-border bg-card">
            <span className="label-uppercase">Bendita Burbuja{modoLocal ? ' · modo local (sin Supabase todavía)' : ''}</span>
          </div>
          {!online && (
            <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-warn text-warn text-sm font-medium">
              <span className="flex-1">Sin conexión · Guardado en tu teléfono — se sube cuando vuelva la señal</span>
              {pendientes > 0 && <span className="tabular whitespace-nowrap">{pendientes} ventas por subir</span>}
            </div>
          )}
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2">
        {NAV_GROUPS.flatMap((g) => g.items)
          .slice(0, 5)
          .map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `text-xs px-2 ${isActive ? 'text-ink font-semibold' : 'text-muted'}`}>
              {item.label}
            </NavLink>
          ))}
      </nav>
    </div>
  )
}
