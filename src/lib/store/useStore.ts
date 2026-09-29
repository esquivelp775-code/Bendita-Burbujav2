import { useSyncExternalStore } from 'react'
import { getEstado, subscribe, type EstadoStore } from './remoteStore'

// Se suscribe al estado completo (getEstado devuelve la misma referencia mientras no haya cambios)
// y aplica el selector ya en el render. Pasar el selector directo como getSnapshot rompía la app:
// los selectores que arman listas u objetos nuevos (Object.values(...).filter, resumenDia, …)
// devolvían una referencia distinta en cada llamada, React lo tomaba como cambio y re-pintaba en
// bucle infinito (error #185, "Maximum update depth exceeded").
export function useStore<T>(selector: (s: EstadoStore) => T): T {
  const estado = useSyncExternalStore(subscribe, getEstado)
  return selector(estado)
}
