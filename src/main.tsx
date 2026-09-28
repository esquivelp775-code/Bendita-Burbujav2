import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Cuando hay una versión nueva, recarga sola en vez de dejar a alguien atorado en un build viejo
// (con chunks que Netlify ya borró) hasta que le baje manualmente al caché del navegador.
registerSW({ immediate: true, onNeedRefresh: () => window.location.reload() })

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
