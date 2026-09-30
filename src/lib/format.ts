export function formatoMoneda(x: number): string {
  return x.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

/** Costo por gramo/ml/pieza: con 4 decimales cuando es menor a $1 ($0.1983/g), si no como moneda. */
export function formatoCostoUnitario(x: number): string {
  if (Math.abs(x) >= 1) return formatoMoneda(x)
  return x.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

/** "martes, 29 de septiembre" → "Martes, 29 de septiembre": sólo la primera letra en mayúscula. */
export function formatoFecha(fecha: Date): string {
  const texto = fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** 0.295 → "29.5 %" */
export function formatoPorcentaje(fraccion: number, decimales = 1): string {
  return `${(fraccion * 100).toFixed(decimales).replace(/\.0+$/, '')} %`
}

const ABREVIATURA_UNIDAD = { g: 'g', ml: 'ml', pieza: 'pza' } as const

/** 1250 g → "1,250 g"; 0.5 pieza → "0.5 pza". Sin unidad, sólo el número. */
export function formatoCantidad(valor: number, unidad?: keyof typeof ABREVIATURA_UNIDAD): string {
  const numero = valor.toLocaleString('es-MX', { maximumFractionDigits: Math.abs(valor) < 10 ? 2 : 1 })
  return unidad ? `${numero} ${ABREVIATURA_UNIDAD[unidad]}` : numero
}
