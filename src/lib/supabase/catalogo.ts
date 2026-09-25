// Carga el catálogo (insumos, bebidas, tamaños, adicionales, leches, categorías, canales, turnos,
// parámetros) desde Supabase y lo adapta a los tipos de src/lib/calculos.ts — el mismo shape que
// src/lib/fixtures.ts arma desde el JSON, para que calculos.ts no sepa de dónde vienen los datos.
import type {
  Adicional,
  Bebida,
  Categoria,
  ConfigPlataforma,
  ConfigPublico,
  Insumo,
  Leche,
  Parametros,
  Tamano,
  Turno,
} from '../calculos'
import { supabase } from './client'

export interface CanalDb {
  id: string
  nombre: string
  tipo: 'plataforma' | 'publico' | 'evento'
  color: string | null
  activo: boolean
  orden: number
}

export interface Catalogo {
  parametros: Parametros
  turnos: Turno[]
  canales: CanalDb[]
  configPlataformaPorCanal: Record<string, ConfigPlataforma>
  configPublicoPorCanal: Record<string, ConfigPublico>
  insumos: Record<string, Insumo>
  insumoIdPorClave: Record<string, string>
  categorias: Record<string, Categoria>
  tamanos: Record<string, Tamano>
  tamanoIdPorNombre: Record<string, string>
  bebidas: Record<string, Bebida>
  bebidaIdPorNombre: Record<string, string>
  leches: Record<string, Leche>
  lecheIdPorNombre: Record<string, string>
  adicionales: Record<string, Adicional>
  adicionalIdPorNombre: Record<string, string>
  /** bebidaId → tamanoNombre → { app, publico } */
  preciosVigentes: Record<string, Record<string, { app?: number; publico?: number }>>
}

async function cargarInsumos(): Promise<{ insumos: Record<string, Insumo>; idPorClave: Record<string, string> }> {
  const { data, error } = await supabase.from('insumos').select('*').eq('activo', true)
  if (error) throw error
  const insumos: Record<string, Insumo> = {}
  const idPorClave: Record<string, string> = {}
  for (const row of data ?? []) {
    const costoUnitarioNeto = row.costo_fisico_neto / (1 - row.merma)
    insumos[row.clave] = {
      clave: row.clave,
      nombre: row.nombre,
      categoria: row.categoria,
      costoUnitarioNeto,
      merma: row.merma,
      prioridad: row.prioridad,
      umbralReorden: row.umbral_reorden,
      stockObjetivo: row.stock_objetivo,
      caducaAbiertoDias: row.caduca_abierto_dias,
    }
    idPorClave[row.clave] = row.id
  }
  return { insumos, idPorClave }
}

export async function cargarCatalogo(): Promise<Catalogo> {
  const [
    { data: parametrosRow, error: eParametros },
    { data: turnosRows, error: eTurnos },
    { data: canalesRows, error: eCanales },
    { data: configPlataformaRows, error: eConfigPlataforma },
    { data: configPublicoRows, error: eConfigPublico },
    { insumos, idPorClave: insumoIdPorClave },
    { data: categoriasRows, error: eCategorias },
    { data: tamanosRows, error: eTamanos },
    { data: bebidasRows, error: eBebidas },
    { data: recetaLineasRows, error: eRecetaLineas },
    { data: lechesRows, error: eLeches },
    { data: adicionalesRows, error: eAdicionales },
    { data: adicionalLineasRows, error: eAdicionalLineas },
    { data: adicionalCategoriasRows, error: eAdicionalCategorias },
    { data: adicionalExclusionesRows, error: eAdicionalExclusiones },
    { data: adicionalSaboresRows, error: eAdicionalSabores },
    { data: preciosRows, error: ePrecios },
  ] = await Promise.all([
    supabase.from('parametros').select('*').limit(1).single(),
    supabase.from('turnos').select('*').eq('activo', true),
    supabase.from('canales').select('*').eq('activo', true).order('orden'),
    supabase.from('config_plataforma').select('*'),
    supabase.from('config_publico').select('*'),
    cargarInsumos(),
    supabase.from('categorias').select('*').order('orden'),
    supabase.from('tamanos').select('*').eq('activo', true),
    supabase.from('bebidas').select('*').eq('activa', true).order('orden'),
    supabase.from('receta_lineas').select('*'),
    supabase.from('leches').select('*'),
    supabase.from('adicionales').select('*').eq('activo', true),
    supabase.from('adicional_lineas').select('*'),
    supabase.from('adicional_categorias').select('*'),
    supabase.from('adicional_exclusiones').select('*'),
    supabase.from('adicional_sabores').select('*'),
    supabase.from('precios').select('*').order('vigente_desde', { ascending: false }),
  ])

  for (const [err, nombre] of [
    [eParametros, 'parametros'],
    [eTurnos, 'turnos'],
    [eCanales, 'canales'],
    [eConfigPlataforma, 'config_plataforma'],
    [eConfigPublico, 'config_publico'],
    [eCategorias, 'categorias'],
    [eTamanos, 'tamanos'],
    [eBebidas, 'bebidas'],
    [eRecetaLineas, 'receta_lineas'],
    [eLeches, 'leches'],
    [eAdicionales, 'adicionales'],
    [eAdicionalLineas, 'adicional_lineas'],
    [eAdicionalCategorias, 'adicional_categorias'],
    [eAdicionalExclusiones, 'adicional_exclusiones'],
    [eAdicionalSabores, 'adicional_sabores'],
    [ePrecios, 'precios'],
  ] as const) {
    if (err) throw new Error(`Error cargando ${nombre}: ${err.message}`)
  }

  const parametros: Parametros = {
    ivaVenta: parametrosRow.iva_venta,
    indirectosPorBebida: parametrosRow.indirectos_por_bebida,
    mermaDefault: parametrosRow.merma_default,
    redondeoPrecio: parametrosRow.redondeo_precio,
    horaManoDeObraFueraDeTurno: parametrosRow.hora_mano_obra_fuera_turno,
    metaUtilidadSemanal: parametrosRow.meta_utilidad_semanal,
    umbralReordenPorPrioridad: {
      alta: parametrosRow.umbral_alta,
      media: parametrosRow.umbral_media,
      baja: parametrosRow.umbral_baja,
    },
  }

  const turnos: Turno[] = (turnosRows ?? []).map((t) => ({
    nombre: t.nombre,
    dias: t.dias,
    inicio: t.inicio,
    fin: t.fin,
    horaManoDeObra: t.hora_mano_obra,
    activo: t.activo,
  }))

  const canales: CanalDb[] = (canalesRows ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    color: c.color,
    activo: c.activo,
    orden: c.orden,
  }))

  const configPlataformaPorCanal: Record<string, ConfigPlataforma> = {}
  for (const row of configPlataformaRows ?? []) {
    const comisionEfectiva = row.comision_base + row.uber_one * row.uber_one_proporcion + row.marketing
    configPlataformaPorCanal[row.canal_id] = {
      comisionEfectiva,
      ivaSobreComision: row.iva_sobre_comision,
      retencionIsr: row.retencion_isr,
      retencionIva: row.retencion_iva,
    }
  }

  const configPublicoPorCanal: Record<string, ConfigPublico> = {}
  for (const row of configPublicoRows ?? []) {
    configPublicoPorCanal[row.canal_id] = {
      descuentoVsApp: row.descuento_vs_app,
      envioCobradoDefault: row.envio_cobrado_default,
      costoEnvioDefault: row.costo_envio_default,
    }
  }

  const categoriaNombrePorId: Record<string, string> = {}
  const categorias: Record<string, Categoria> = {}
  for (const c of categoriasRows ?? []) {
    categoriaNombrePorId[c.id] = c.nombre
    categorias[c.nombre] = { nombre: c.nombre, minutosPreparacion: c.minutos_preparacion, utilidadObjetivo: c.utilidad_objetivo }
  }

  const insumoClavePorId: Record<string, string> = {}
  for (const [clave, id] of Object.entries(insumoIdPorClave)) insumoClavePorId[id] = clave

  const tamanoIdPorNombre: Record<string, string> = {}
  const tamanos: Record<string, Tamano> = {}
  for (const t of tamanosRows ?? []) {
    tamanoIdPorNombre[t.nombre] = t.id
    tamanos[t.nombre] = {
      nombre: t.nombre,
      ml: t.ml,
      factorEscala: t.factor_escala,
      vasoInsumoClave: insumoClavePorId[t.insumo_vaso_id],
      cierreInsumoClave: insumoClavePorId[t.insumo_cierre_id],
    }
  }

  const bebidaIdPorNombre: Record<string, string> = {}
  const bebidaNombrePorId: Record<string, string> = {}
  const bebidas: Record<string, Bebida> = {}
  for (const b of bebidasRows ?? []) {
    bebidaIdPorNombre[b.nombre] = b.id
    bebidaNombrePorId[b.id] = b.nombre
    bebidas[b.nombre] = {
      nombre: b.nombre,
      categoriaNombre: categoriaNombrePorId[b.categoria_id],
      llevaLeche: b.lleva_leche,
      receta: [],
    }
  }
  for (const r of recetaLineasRows ?? []) {
    const nombreBebida = bebidaNombrePorId[r.bebida_id]
    if (!nombreBebida) continue
    bebidas[nombreBebida].receta.push({
      insumoClave: insumoClavePorId[r.insumo_id],
      cantidad: r.cantidad,
      escalaConTamano: r.escala_con_tamano,
      esLeche: r.es_leche,
    })
  }

  const lecheIdPorNombre: Record<string, string> = {}
  const leches: Record<string, Leche> = {}
  for (const l of lechesRows ?? []) {
    lecheIdPorNombre[l.nombre] = l.id
    leches[l.nombre] = { nombre: l.nombre, insumoClave: insumoClavePorId[l.insumo_id], sobreprecio: l.sobreprecio, esDefault: l.es_default }
  }

  const adicionalIdPorNombre: Record<string, string> = {}
  const adicionalNombrePorId: Record<string, string> = {}
  const adicionales: Record<string, Adicional> = {}
  for (const a of adicionalesRows ?? []) {
    adicionalIdPorNombre[a.nombre] = a.id
    adicionalNombrePorId[a.id] = a.nombre
    adicionales[a.nombre] = {
      nombre: a.nombre,
      precio: a.precio,
      minutos: a.minutos,
      receta: [],
      aplicaACategorias: [],
      excluyeBebidas: [],
    }
  }
  for (const l of adicionalLineasRows ?? []) {
    const nombre = adicionalNombrePorId[l.adicional_id]
    if (!nombre) continue
    adicionales[nombre].receta.push({
      insumoClave: insumoClavePorId[l.insumo_id],
      cantidad: l.cantidad,
      esLeche: l.es_leche,
      cambiaPorSabor: l.cambia_por_sabor,
    })
  }
  for (const c of adicionalCategoriasRows ?? []) {
    const nombre = adicionalNombrePorId[c.adicional_id]
    if (!nombre) continue
    adicionales[nombre].aplicaACategorias.push(categoriaNombrePorId[c.categoria_id])
  }
  for (const e of adicionalExclusionesRows ?? []) {
    const nombre = adicionalNombrePorId[e.adicional_id]
    if (!nombre) continue
    adicionales[nombre].excluyeBebidas.push(bebidaNombrePorId[e.bebida_id])
  }
  for (const s of adicionalSaboresRows ?? []) {
    const nombre = adicionalNombrePorId[s.adicional_id]
    if (!nombre) continue
    const insumoClave = insumoClavePorId[s.insumo_id]
    if (s.categoria_id) {
      const categoriaNombre = categoriaNombrePorId[s.categoria_id]
      adicionales[nombre].saboresPorCategoria ??= {}
      adicionales[nombre].saboresPorCategoria![categoriaNombre] ??= {}
      adicionales[nombre].saboresPorCategoria![categoriaNombre][s.sabor] = insumoClave
    } else {
      adicionales[nombre].sabores ??= {}
      adicionales[nombre].sabores![s.sabor] = insumoClave
    }
  }

  const preciosVigentes: Catalogo['preciosVigentes'] = {}
  for (const row of preciosRows ?? []) {
    preciosVigentes[row.bebida_id] ??= {}
    const nombreTamano = Object.entries(tamanoIdPorNombre).find(([, id]) => id === row.tamano_id)?.[0]
    if (!nombreTamano) continue
    preciosVigentes[row.bebida_id][nombreTamano] ??= {}
    const bucket = preciosVigentes[row.bebida_id][nombreTamano]
    // Las filas vienen ordenadas por vigente_desde desc: la primera que se ve por canal_tipo es la vigente.
    if (row.canal_tipo === 'app' && bucket.app === undefined) bucket.app = row.precio
    if (row.canal_tipo === 'publico' && bucket.publico === undefined) bucket.publico = row.precio
  }

  return {
    parametros,
    turnos,
    canales,
    configPlataformaPorCanal,
    configPublicoPorCanal,
    insumos,
    insumoIdPorClave,
    categorias,
    tamanos,
    tamanoIdPorNombre,
    bebidas,
    bebidaIdPorNombre,
    leches,
    lecheIdPorNombre,
    adicionales,
    adicionalIdPorNombre,
    preciosVigentes,
  }
}
