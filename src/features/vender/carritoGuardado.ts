// El carrito se guarda en el teléfono en cada cambio: una recarga (actualización de la app, batería,
// cerrar la pestaña) ya no pierde el pedido en curso. Se guarda por nombres y se reconstruye con el
// catálogo vigente al leerlo.
import type { EstadoStore, ItemCarrito } from '../../lib/store/remoteStore'

const CLAVE = 'bb-carrito-v1'

type ItemGuardado =
  | { tipo: 'bebida'; bebida: string; tamano: string; leche?: string; adicionales: { nombre: string; sabor?: string }[]; cantidad: number; factorEvento?: number }
  | { tipo: 'botana'; botana: string; cantidad: number; factorEvento?: number }

export interface CarritoGuardado {
  canal: string
  items: ItemGuardado[]
}

export function guardarCarrito(canal: string, items: ItemCarrito[]) {
  try {
    if (items.length === 0) {
      localStorage.removeItem(CLAVE)
      return
    }
    const guardado: CarritoGuardado = {
      canal,
      items: items.map((i) =>
        i.tipo === 'bebida'
          ? { tipo: 'bebida', bebida: i.bebida.nombre, tamano: i.tamano.nombre, leche: i.lecheElegida?.nombre, adicionales: i.adicionalesElegidos, cantidad: i.cantidad, factorEvento: i.factorEvento }
          : { tipo: 'botana', botana: i.botana.nombre, cantidad: i.cantidad, factorEvento: i.factorEvento },
      ),
    }
    localStorage.setItem(CLAVE, JSON.stringify(guardado))
  } catch {
    /* sin almacenamiento: el carrito sólo vive en memoria */
  }
}

export function carritoVacio(): boolean {
  try {
    return !localStorage.getItem(CLAVE)
  } catch {
    return true
  }
}

/** Reconstruye el carrito con el catálogo actual; descarta lo que ya no exista. */
export function leerCarrito(s: EstadoStore): { canal: string; items: ItemCarrito[] } | null {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null
    const guardado = JSON.parse(crudo) as CarritoGuardado
    const items: ItemCarrito[] = []
    for (const g of guardado.items) {
      if (g.tipo === 'bebida') {
        const bebida = s.bebidas[g.bebida]
        const tamano = s.tamanos[g.tamano]
        if (!bebida || !tamano) continue
        items.push({
          tipo: 'bebida',
          fechaHora: new Date(),
          bebida,
          tamano,
          lecheElegida: g.leche ? s.leches[g.leche] : undefined,
          adicionalesElegidos: g.adicionales.filter((a) => s.adicionales[a.nombre]),
          cantidad: g.cantidad,
          factorEvento: g.factorEvento,
        })
      } else {
        const botana = s.botanas[g.botana]
        if (botana) items.push({ tipo: 'botana', fechaHora: new Date(), botana, cantidad: g.cantidad, factorEvento: g.factorEvento })
      }
    }
    return { canal: guardado.canal, items }
  } catch {
    return null
  }
}
