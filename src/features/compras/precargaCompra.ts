// "Convertir en compra" (Inventario → Compras): la lista de compras de un proveedor se pasa por
// sessionStorage para precargar el ticket. Se lee una sola vez.
const CLAVE = 'bb-precarga-compra'

export interface PrecargaCompra {
  proveedorId?: string
  lineas: { insumoClave: string; presentaciones: number }[]
}

export function guardarPrecarga(p: PrecargaCompra) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(p))
  } catch {
    /* sin almacenamiento: Compras abre vacío */
  }
}

export function tomarPrecarga(): PrecargaCompra | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    if (!crudo) return null
    sessionStorage.removeItem(CLAVE)
    return JSON.parse(crudo) as PrecargaCompra
  } catch {
    return null
  }
}
