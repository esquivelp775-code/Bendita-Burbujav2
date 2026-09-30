import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthProvider'
import { Layout } from './features/layout/Layout'
import { HoyScreen } from './features/hoy/HoyScreen'
import { VenderScreen } from './features/vender/VenderScreen'
import { DesgloseScreen } from './features/desglose/DesgloseScreen'
import { InventarioScreen } from './features/inventario/InventarioScreen'
import { ComprasScreen } from './features/compras/ComprasScreen'
import { RecetasScreen } from './features/recetas/RecetasScreen'
import { EquipoScreen } from './features/equipo/EquipoScreen'
import { AjustesScreen } from './features/ajustes/AjustesScreen'
import { EventosScreen } from './features/eventos/EventosScreen'
import { CierreScreen } from './features/cierre/CierreScreen'
import { ReportesScreen } from './features/reportes/ReportesScreen'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/hoy" replace />} />
          <Route path="/hoy" element={<HoyScreen />} />
          <Route path="/vender" element={<VenderScreen />} />
          <Route path="/desglose" element={<DesgloseScreen />} />
          <Route path="/inventario" element={<InventarioScreen />} />
          <Route path="/compras" element={<ComprasScreen />} />
          <Route path="/recetas" element={<RecetasScreen />} />
          <Route path="/equipo" element={<EquipoScreen />} />
          <Route path="/ajustes" element={<AjustesScreen />} />
          <Route path="/eventos" element={<EventosScreen />} />
          <Route path="/cierre" element={<CierreScreen />} />
          <Route path="/reportes" element={<ReportesScreen />} />
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
