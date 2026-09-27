// Adapta datos_bendita_v3.json a los tipos de calculos.ts. Usado por las pruebas v3 y por el
// script de migración de catálogo. No es parte del runtime de la app (ver también fixtures.ts,
// que sigue vigente para las pruebas v2).
import type { Adicional, Bebida, Categoria, Insumo, Leche, Parametros, Tamano, Turno } from './calculos'
import datos from '../../datos_bendita_v3.json'

type Json = typeof datos

export function construirParametrosV3(d: Json = datos): Parametros {
  return {
    ivaVenta: d.parametros.iva_venta,
    indirectosPorBebida: d.parametros.indirectos_por_bebida,
    mermaDefault: d.parametros.merma_default,
    redondeoPrecio: d.parametros.redondeo_precio,
    horaManoDeObraFueraDeTurno: d.parametros.hora_mano_obra_fuera_de_turno,
    metaUtilidadSemanal: d.parametros.meta_utilidad_semanal,
    umbralReordenPorPrioridad: {
      alta: d.parametros.umbral_reorden_por_prioridad.alta,
      media: d.parametros.umbral_reorden_por_prioridad.media,
      baja: d.parametros.umbral_reorden_por_prioridad.baja,
    },
  }
}

export function construirTurnosV3(d: Json = datos): Turno[] {
  return d.turnos.map((t) => ({
    nombre: t.nombre,
    dias: t.dias,
    inicio: t.inicio,
    fin: t.fin,
    horaManoDeObra: t.hora_mano_obra,
    activo: true,
  }))
}

function slug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
}

/** insumoClave → Insumo, incluyendo un vaso sintético por cada tamaño (el cierre usa insumos reales: tapa/playo/pelicula_sello). */
export function construirInsumosV3(d: Json = datos): Record<string, Insumo> {
  const insumos: Record<string, Insumo> = {}
  for (const i of d.insumos) {
    insumos[i.clave] = {
      clave: i.clave,
      nombre: i.nombre,
      categoria: i.categoria,
      costoUnitarioNeto: i.costo_unitario_neto!,
      merma: i.merma,
      prioridad: i.prioridad as Insumo['prioridad'],
      umbralReorden: i.umbral_reorden,
      stockObjetivo: i.stock_objetivo,
      caducaAbiertoDias: i.caduca_abierto_dias,
    }
  }
  for (const t of d.tamanos) {
    const vasoClave = `vaso_${slug(t.nombre)}`
    insumos[vasoClave] = {
      clave: vasoClave,
      nombre: `Vaso ${t.nombre}`,
      categoria: 'empaque',
      costoUnitarioNeto: t.costo_vaso / (1 + d.parametros.iva_venta),
      merma: 0,
      prioridad: t.prioridad_vasos_y_tapas as Insumo['prioridad'],
    }
  }
  return insumos
}

/** Mapa tamaño → claves de insumo de cierre, por catálogo v3 (sección 1 de 4_prompt_claude_code_v3.md). */
function cierresDeTamano(nombreTamano: string): string[] {
  if (nombreTamano === '20 oz') return ['pelicula_sello']
  return ['tapa', 'playo']
}

export function construirTamanosV3(d: Json = datos): Record<string, Tamano> {
  const tamanos: Record<string, Tamano> = {}
  for (const t of d.tamanos) {
    tamanos[t.nombre] = {
      nombre: t.nombre,
      ml: t.ml,
      factorEscala: t.factor_escala,
      vasoInsumoClave: `vaso_${slug(t.nombre)}`,
      cierreInsumoClaves: cierresDeTamano(t.nombre),
      canales: t.canales,
    }
  }
  return tamanos
}

export function construirCategoriasV3(d: Json = datos): Record<string, Categoria> {
  const categorias: Record<string, Categoria> = {}
  for (const c of d.categorias) {
    const utilidadObjetivo = (d.parametros.utilidad_objetivo as Record<string, number>)[c.nombre] ?? d.parametros.utilidad_objetivo.default
    categorias[c.nombre] = {
      nombre: c.nombre,
      minutosPreparacion: c.minutos_preparacion,
      utilidadObjetivo,
    }
  }
  return categorias
}

export function construirLechesV3(d: Json = datos): Record<string, Leche> {
  const leches: Record<string, Leche> = {}
  for (const l of d.leches) {
    leches[l.nombre] = {
      nombre: l.nombre,
      insumoClave: l.insumo,
      sobreprecio: l.sobreprecio,
      esDefault: l.default,
    }
  }
  return leches
}

export function construirBebidasV3(d: Json = datos): Record<string, Bebida> {
  const bebidas: Record<string, Bebida> = {}
  for (const b of d.bebidas) {
    bebidas[b.nombre] = {
      nombre: b.nombre,
      categoriaNombre: b.categoria,
      llevaLeche: b.lleva_leche,
      receta: b.receta.map((r) => ({
        insumoClave: r.insumo,
        cantidad: r.cantidad,
        escalaConTamano: r.escala_con_tamano,
        esLeche: r.es_leche,
      })),
    }
  }
  return bebidas
}

export function precioListaDeV3(nombreBebida: string, tamano: string, d: Json = datos): number {
  const b = d.bebidas.find((x) => x.nombre === nombreBebida)
  if (!b) throw new Error(`Bebida desconocida: ${nombreBebida}`)
  return (b.precio_lista as Record<string, number>)[tamano]
}

export function precioPublicoDeV3(nombreBebida: string, tamano: string, d: Json = datos): number {
  const b = d.bebidas.find((x) => x.nombre === nombreBebida)
  if (!b) throw new Error(`Bebida desconocida: ${nombreBebida}`)
  return (b.precio_publico as Record<string, number>)[tamano]
}

export function construirAdicionalesV3(d: Json = datos): Record<string, Adicional> {
  const adicionales: Record<string, Adicional> = {}
  for (const a of d.adicionales) {
    adicionales[a.nombre] = {
      nombre: a.nombre,
      precio: a.precio,
      minutos: a.minutos,
      receta: a.receta.map((r) => ({
        insumoClave: r.insumo,
        cantidad: r.cantidad,
        esLeche: r.es_leche,
        cambiaPorSabor: r.cambia_por_sabor,
      })),
      aplicaACategorias: a.aplica_a_categorias,
      excluyeBebidas: a.excluye_bebidas,
      sabores: a.sabores ?? undefined,
      saboresPorCategoria: a.sabores_por_categoria ?? undefined,
      canales: (a as any).canales ?? undefined,
    }
  }
  return adicionales
}

export function construirConfigPlataformaV3(nombreCanal: string, d: Json = datos) {
  const c = d.canales.find((x) => x.nombre === nombreCanal)
  if (!c || !('comision_efectiva' in c)) throw new Error(`Canal de plataforma desconocido: ${nombreCanal}`)
  return {
    comisionEfectiva: c.comision_efectiva as number,
    ivaSobreComision: (c as any).iva_sobre_comision as number,
    retencionIsr: (c as any).retencion_isr as number,
    retencionIva: (c as any).retencion_iva as number,
  }
}

export { datos as datosV3 }
