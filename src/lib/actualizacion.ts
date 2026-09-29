// Actualización de la app (service worker en modo "prompt"). Si no hay pedido abierto, se aplica
// sola; si lo hay, se avisa y se espera: una recarga a media venta ya no se lleva el carrito.
import { registerSW } from 'virtual:pwa-register'
import { carritoVacio } from '../features/vender/carritoGuardado'

type Escucha = (hay: boolean) => void

let hayVersionNueva = false
let aplicar: ((recargar?: boolean) => Promise<void>) | null = null
const escuchas = new Set<Escucha>()

export function onVersionNueva(fn: Escucha): () => void {
  escuchas.add(fn)
  fn(hayVersionNueva)
  return () => escuchas.delete(fn)
}

export function actualizarAhora() {
  void aplicar?.(true)
}

/** Llamar al cerrar un pedido: si había versión nueva esperando y el carrito quedó vacío, se aplica. */
export function intentarActualizar() {
  if (hayVersionNueva && carritoVacio()) actualizarAhora()
}

export function iniciarActualizaciones() {
  aplicar = registerSW({
    immediate: true,
    onNeedRefresh() {
      hayVersionNueva = true
      if (carritoVacio()) {
        actualizarAhora()
        return
      }
      for (const fn of escuchas) fn(true)
    },
  })
  // Revisa si hay versión nueva cada 30 min mientras la app está abierta.
  setInterval(() => {
    void navigator.serviceWorker?.getRegistration().then((r) => r?.update())
  }, 30 * 60 * 1000)
}
