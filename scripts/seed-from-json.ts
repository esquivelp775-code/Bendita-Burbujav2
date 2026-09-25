// Genera supabase/seed.sql a partir de datos_iniciales_bendita_1.json (sección 6 de la especificación).
// Uso: OWNER_ID=<uuid-del-dueño> npm run seed:sql
// El SQL resultante se corre una sola vez, a mano, en el proyecto real (SQL editor o `supabase db execute`).
// No se corre solo — pendiente hasta que exista el proyecto de Supabase (ver plan de Fase 1).
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import datos from '../datos_iniciales_bendita_1.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

const ownerId = process.env.OWNER_ID
if (!ownerId) {
  console.error('Falta OWNER_ID. Uso: OWNER_ID=<uuid-del-dueño> npm run seed:sql')
  process.exit(1)
}

function sqlStr(v: string | null | undefined): string {
  if (v == null) return 'null'
  return `'${v.replace(/'/g, "''")}'`
}
function sqlNum(v: number | null | undefined): string {
  return v == null ? 'null' : String(v)
}
function sqlBool(v: boolean | null | undefined): string {
  return v == null ? 'null' : v ? 'true' : 'false'
}
function slug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
}

const lines: string[] = []
lines.push('-- Generado por scripts/seed-from-json.ts — no editar a mano, regenerar desde el JSON.')
lines.push('begin;')

// ── parametros ──────────────────────────────────────────────────────────
const p = datos.parametros
lines.push(`insert into parametros (owner_id, iva_venta, indirectos_por_bebida, merma_default, redondeo_precio, meta_utilidad_semanal, hora_mano_obra_fuera_turno, isr_tasa_efectiva_estimada, umbral_alta, umbral_media, umbral_baja, zona_horaria)
values ('${ownerId}', ${p.iva_venta}, ${p.indirectos_por_bebida}, ${p.merma_default}, ${p.redondeo_precio}, ${p.meta_utilidad_semanal}, ${p.hora_mano_obra_fuera_de_turno}, ${p.isr_tasa_efectiva_estimada}, ${p.umbral_reorden_por_prioridad.alta}, ${p.umbral_reorden_por_prioridad.media}, ${p.umbral_reorden_por_prioridad.baja}, ${sqlStr(p.zona_horaria)});`)

// ── turnos ──────────────────────────────────────────────────────────────
for (const t of datos.turnos) {
  lines.push(`insert into turnos (owner_id, nombre, dias, inicio, fin, hora_mano_obra, estimado)
values ('${ownerId}', ${sqlStr(t.nombre)}, ARRAY[${t.dias.join(',')}], ${sqlStr(t.inicio)}, ${sqlStr(t.fin)}, ${t.hora_mano_obra}, ${sqlBool(t.estimado)});`)
}

// ── canales + config_plataforma / config_publico ─────────────────────────
let orden = 0
for (const c of datos.canales as any[]) {
  const tipo = c.tipo === 'plataforma' ? 'plataforma' : c.nombre === 'Evento' ? 'evento' : 'publico'
  lines.push(`insert into canales (owner_id, nombre, tipo, color, orden)
values ('${ownerId}', ${sqlStr(c.nombre)}, ${sqlStr(tipo)}, ${sqlStr(c.color)}, ${orden++});`)

  if (tipo === 'plataforma') {
    lines.push(`insert into config_plataforma (owner_id, canal_id, comision_base, uber_one, uber_one_proporcion, marketing, iva_sobre_comision, retencion_isr, retencion_iva, frecuencia_deposito)
values ('${ownerId}', (select id from canales where owner_id = '${ownerId}' and nombre = ${sqlStr(c.nombre)}), ${c.comision_base}, ${sqlNum(c.uber_one ?? 0)}, ${sqlNum(c.uber_one_proporcion_pedidos ?? 0)}, ${sqlNum(c.marketing ?? 0)}, ${c.iva_sobre_comision}, ${c.retencion_isr}, ${c.retencion_iva}, ${sqlStr(c.frecuencia_deposito)});`)
  } else if (tipo === 'publico') {
    lines.push(`insert into config_publico (owner_id, canal_id, descuento_vs_app, envio_cobrado_default, costo_envio_default)
values ('${ownerId}', (select id from canales where owner_id = '${ownerId}' and nombre = ${sqlStr(c.nombre)}), ${c.descuento_vs_app}, ${c.envio_cobrado_default}, ${c.costo_envio_default});`)
  }
}

// ── evento_escalas + config_evento ───────────────────────────────────────
for (const e of datos.evento.escalas) {
  lines.push(`insert into evento_escalas (owner_id, desde, hasta, factor, cargo_servicio)
values ('${ownerId}', ${e.desde}, ${sqlNum(e.hasta)}, ${e.factor}, ${e.cargo_servicio});`)
}
lines.push(`insert into config_evento (owner_id, minimo_bebidas, traslado, equipo_hielo_desechables, horas_montaje)
values ('${ownerId}', ${datos.evento.minimo_bebidas}, ${datos.evento.costos_reales.traslado}, ${datos.evento.costos_reales.equipo_hielo_desechables}, ${datos.evento.costos_reales.horas_montaje});`)

// ── proveedores ───────────────────────────────────────────────────────────
for (const pr of datos.proveedores as any[]) {
  lines.push(`insert into proveedores (owner_id, nombre, contacto, notas)
values ('${ownerId}', ${sqlStr(pr.nombre)}, ${sqlStr(pr.contacto)}, ${sqlStr(pr.notas)});`)
}

// ── insumos (+ vaso/tapa sintéticos por tamaño, sección 8) ────────────────
for (const i of datos.insumos as any[]) {
  lines.push(`insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('${ownerId}', ${sqlStr(i.clave)}, ${sqlStr(i.nombre)}, ${sqlStr(i.categoria)}, ${sqlStr(i.unidad)}, ${sqlStr(i.presentacion)}, ${i.contenido_util}, ${i.merma}, ${i.iva}, ${i.costo_unitario_neto * (1 - i.merma)}, ${sqlStr(i.prioridad)}, ${sqlNum(i.umbral_reorden)}, ${sqlNum(i.stock_objetivo)}, ${sqlNum(i.caduca_abierto_dias)}, ${sqlBool(i.verificado)}, ${sqlStr(i.fuente)});`)
}
for (const t of datos.tamanos as any[]) {
  const vasoClave = `vaso_${slug(t.nombre)}`
  const cierreClave = `cierre_${slug(t.nombre)}`
  lines.push(`insert into insumos (owner_id, clave, nombre, categoria, unidad, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado, stock_objetivo)
values ('${ownerId}', ${sqlStr(vasoClave)}, ${sqlStr('Vaso ' + t.nombre)}, 'empaque', 'pieza', 1, 0, 0.16, ${t.costo_vaso / 1.16}, ${sqlStr(t.prioridad_vasos_y_tapas)}, true, ${sqlNum(t.stock_vasos_inicial || null)});`)
  lines.push(`insert into insumos (owner_id, clave, nombre, categoria, unidad, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado)
values ('${ownerId}', ${sqlStr(cierreClave)}, ${sqlStr('Tapa ' + t.nombre)}, 'empaque', 'pieza', 1, 0, 0.16, ${t.costo_tapa / 1.16}, ${sqlStr(t.prioridad_vasos_y_tapas)}, true);`)
  if (t.stock_vasos_inicial) {
    lines.push(`insert into movimientos_inventario (owner_id, insumo_id, cantidad, tipo, nota)
values ('${ownerId}', (select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(vasoClave)}), ${t.stock_vasos_inicial}, 'inicial', 'Existencia inicial del catálogo');`)
  }
}

// ── categorias / tamanos ─────────────────────────────────────────────────
let ordenCat = 0
for (const c of datos.categorias as any[]) {
  const utilidadObjetivo = (p.utilidad_objetivo as Record<string, number>)[c.nombre] ?? p.utilidad_objetivo.default
  lines.push(`insert into categorias (owner_id, nombre, minutos_preparacion, utilidad_objetivo, orden)
values ('${ownerId}', ${sqlStr(c.nombre)}, ${c.minutos_preparacion}, ${utilidadObjetivo}, ${ordenCat++});`)
}
for (const t of datos.tamanos as any[]) {
  const vasoClave = `vaso_${slug(t.nombre)}`
  const cierreClave = `cierre_${slug(t.nombre)}`
  lines.push(`insert into tamanos (owner_id, nombre, ml, factor_escala, insumo_vaso_id, insumo_cierre_id, activo)
values ('${ownerId}', ${sqlStr(t.nombre)}, ${t.ml}, ${t.factor_escala},
  (select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(vasoClave)}),
  (select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(cierreClave)}), ${sqlBool(t.activo)});`)
}

// ── leches ────────────────────────────────────────────────────────────────
for (const l of datos.leches as any[]) {
  lines.push(`insert into leches (owner_id, nombre, insumo_id, sobreprecio, es_default)
values ('${ownerId}', ${sqlStr(l.nombre)}, (select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(l.insumo)}), ${l.sobreprecio}, ${sqlBool(l.default)});`)
}

// ── bebidas + receta_lineas + receta_pasos ────────────────────────────────
let ordenBebida = 0
for (const b of datos.bebidas as any[]) {
  lines.push(`insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('${ownerId}', ${sqlStr(b.nombre)}, (select id from categorias where owner_id = '${ownerId}' and nombre = ${sqlStr(b.categoria)}), ${sqlStr(b.descripcion)}, ${sqlBool(b.lleva_leche)}, ${sqlBool(b.activa)}, ${ordenBebida++});`)
  for (const r of b.receta) {
    lines.push(`insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('${ownerId}', (select id from bebidas where owner_id = '${ownerId}' and nombre = ${sqlStr(b.nombre)}), (select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(r.insumo)}), ${r.cantidad}, ${sqlBool(r.escala_con_tamano)}, ${sqlBool(r.es_leche)});`)
  }
  b.pasos.forEach((texto: string, idx: number) => {
    lines.push(`insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('${ownerId}', (select id from bebidas where owner_id = '${ownerId}' and nombre = ${sqlStr(b.nombre)}), ${idx}, ${sqlStr(texto)});`)
  })
  for (const tamanoNombre of Object.keys(b.precio_lista)) {
    lines.push(`insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('${ownerId}', (select id from bebidas where owner_id = '${ownerId}' and nombre = ${sqlStr(b.nombre)}), (select id from tamanos where owner_id = '${ownerId}' and nombre = ${sqlStr(tamanoNombre)}), 'app', ${(b.precio_lista as Record<string, number>)[tamanoNombre]}, false);`)
    lines.push(`insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('${ownerId}', (select id from bebidas where owner_id = '${ownerId}' and nombre = ${sqlStr(b.nombre)}), (select id from tamanos where owner_id = '${ownerId}' and nombre = ${sqlStr(tamanoNombre)}), 'publico', ${(b.precio_publico as Record<string, number>)[tamanoNombre]}, false);`)
  }
}

// ── adicionales ───────────────────────────────────────────────────────────
for (const a of datos.adicionales as any[]) {
  lines.push(`insert into adicionales (owner_id, nombre, precio, minutos)
values ('${ownerId}', ${sqlStr(a.nombre)}, ${a.precio}, ${a.minutos});`)
  for (const r of a.receta) {
    lines.push(`insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
values ('${ownerId}', (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(a.nombre)}), (select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(r.insumo)}), ${r.cantidad}, ${sqlBool(r.es_leche)}, ${sqlBool(r.cambia_por_sabor)});`)
  }
  for (const categoriaNombre of a.aplica_a_categorias) {
    lines.push(`insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('${ownerId}', (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(a.nombre)}), (select id from categorias where owner_id = '${ownerId}' and nombre = ${sqlStr(categoriaNombre)}));`)
  }
  for (const bebidaNombre of a.excluye_bebidas ?? []) {
    lines.push(`insert into adicional_exclusiones (owner_id, adicional_id, bebida_id)
values ('${ownerId}', (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(a.nombre)}), (select id from bebidas where owner_id = '${ownerId}' and nombre = ${sqlStr(bebidaNombre)}));`)
  }
  if (a.sabores) {
    for (const [sabor, insumoClave] of Object.entries(a.sabores as Record<string, string>)) {
      lines.push(`insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('${ownerId}', (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(a.nombre)}), null, ${sqlStr(sabor)}, (select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(insumoClave)}));`)
    }
  }
  if (a.sabores_por_categoria) {
    for (const [categoriaNombre, sabores] of Object.entries(a.sabores_por_categoria as Record<string, Record<string, string>>)) {
      for (const [sabor, insumoClave] of Object.entries(sabores)) {
        lines.push(`insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('${ownerId}', (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(a.nombre)}), (select id from categorias where owner_id = '${ownerId}' and nombre = ${sqlStr(categoriaNombre)}), ${sqlStr(sabor)}, (select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(insumoClave)}));`)
      }
    }
  }
}

// ── botanas ───────────────────────────────────────────────────────────────
for (const b of datos.botanas as any[]) {
  lines.push(`insert into botanas (owner_id, nombre, descripcion, precio_app, precio_publico, activa)
values ('${ownerId}', ${sqlStr(b.nombre)}, ${sqlStr(b.descripcion)}, ${sqlNum(b.precio_lista)}, ${sqlNum(b.precio_publico)}, true);`)
}

// ── activos ya capturados ────────────────────────────────────────────────
for (const a of datos.activos as any[]) {
  lines.push(`insert into activos (owner_id, nombre, tipo, costo_neto, iva_acreditable, fecha_alta, vida_util_meses, valor_rescate, verificado, notas)
values ('${ownerId}', ${sqlStr(a.nombre)}, ${sqlStr(a.tipo)}, ${sqlNum(a.costo)}, ${sqlNum(a.iva_acreditable ?? 0)}, ${sqlStr(a.fecha_compra)}, ${a.vida_util_meses}, ${sqlNum(a.valor_rescate ?? 0)}, ${sqlBool(a.verificado)}, ${sqlStr(a.fuente)});`)
}

lines.push('commit;')

const outPath = resolve(__dirname, '../supabase/seed.sql')
writeFileSync(outPath, lines.join('\n\n') + '\n', 'utf-8')
console.log(`Escrito: ${outPath} (${lines.length} sentencias)`)
console.log('Nota: activos_por_capturar del JSON no se siembra — es la lista de compras pendientes del dueño, no inventario ya dado de alta.')
