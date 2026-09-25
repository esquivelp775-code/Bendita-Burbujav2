export function formatoMoneda(x: number): string {
  return x.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

export function formatoFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}
