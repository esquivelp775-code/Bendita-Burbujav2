import { useSyncExternalStore } from 'react'
import { getEstado, subscribe, type EstadoStore } from './remoteStore'

export function useStore<T>(selector: (s: EstadoStore) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getEstado()))
}
