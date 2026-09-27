// Genera supabase/migrations/0003_v3_catalogo.sql a partir de datos_bendita_v3.json
// (ver 4_prompt_claude_code_v3.md). Uso: OWNER_ID=<uuid-del-dueño> npx tsx scripts/seed-v3-from-json.ts
// El SQL resultante se corre una sola vez, a mano, en el SQL Editor de Supabase. No toca las ventas
// ya registradas: sólo agrega insumos/precios/activos/compras nuevos y actualiza costos y catálogo.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import datos from '../datos_bendita_v3.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

const ownerId = process.env.OWNER_ID
if (!ownerId) {
  console.error('Falta OWNER_ID. Uso: OWNER_ID=<uuid-del-dueño> npx tsx scripts/seed-v3-from-json.ts')
  process.exit(1)
}

function sqlStr(v: string | null | undefined): string {
  if (v == null) return 'null'
  return `'${v.replace(/'/g, "''")}'`
}
function sqlNum(v: number | null | undefined): string {
  return v == null ? 'null' : String(v)
}
function sqlArr(vs: string[]): string {
  return `ARRAY[${vs.map(sqlStr).join(', ')}]::text[]`
}
function insumoSub(clave: string): string {
  return `(select id from insumos where owner_id = '${ownerId}' and clave = ${sqlStr(clave)})`
}

const lines: string[] = []
lines.push('-- Generado por scripts/seed-v3-from-json.ts — no editar a mano, regenerar desde datos_bendita_v3.json.')
lines.push('-- Migración de catálogo v3: selladora, cierre por tamaño, canales por tamaño/adicional, insumos y precios nuevos.')
lines.push('begin;')

// ── 1. Esquema: columnas nuevas (idempotente) ──────────────────────────────
lines.push(`alter table tamanos add column if not exists canales text[];`)
lines.push(`alter table tamanos add column if not exists insumo_cierre_ids uuid[];`)
lines.push(`alter table adicionales add column if not exists canales text[];`)

// ── 2. Parámetros: indirectos por bebida sube a 2.6 (incluye charola) ──────
lines.push(`update parametros set indirectos_por_bebida = ${datos.parametros.indirectos_por_bebida} where owner_id = '${ownerId}';`)

// ── 3. Insumos nuevos y costos actualizados (upsert por clave) ─────────────
const clavesActualizarCosto = [
  'leche',
  'leche_desl',
  'avena_oatly',
  'polvo_matcha',
  'polvo_taro',
  'polvo_chai',
  'tapioca_seca',
  'base_frappe',
  'pelicula_sello',
  'charola_4',
  'tapa',
  'playo',
]
for (const clave of clavesActualizarCosto) {
  const i = datos.insumos.find((x) => x.clave === clave)!
  lines.push(`insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('${ownerId}', ${sqlStr(i.clave)}, ${sqlStr(i.nombre)}, ${sqlStr(i.categoria)}, ${sqlStr(i.unidad)}, ${sqlStr(i.presentacion)}, ${i.contenido_util}, ${i.merma}, ${i.iva}, ${i.costo_unitario_neto! * (1 - i.merma)}, ${sqlStr(i.prioridad)}, ${sqlNum(i.umbral_reorden)}, ${sqlNum(i.stock_objetivo)}, ${sqlNum(i.caduca_abierto_dias)}, ${i.verificado}, ${sqlStr(i.fuente)}, true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;`)
}

// Vasos de 16 y 20 oz: costo actualizado (selladora, medidas nuevas de vaso).
for (const t of datos.tamanos.filter((x) => x.nombre !== '14 oz')) {
  const vasoClave = `vaso_${t.nombre.toLowerCase().replace(' ', '_')}`
  lines.push(`update insumos set costo_fisico_neto = ${t.costo_vaso / (1 + datos.parametros.iva_venta)} where owner_id = '${ownerId}' and clave = ${sqlStr(vasoClave)};`)
}

// ── 4. La bebida ya no descuenta playo por receta: ahora vive en el cierre del tamaño ──
lines.push(`delete from receta_lineas
where owner_id = '${ownerId}'
  and insumo_id = ${insumoSub('playo')};`)

// ── 5. Tamaños: canales donde se vende y cierre real por tamaño ────────────
for (const t of datos.tamanos) {
  const cierreClaves = t.nombre === '20 oz' ? ['pelicula_sello'] : ['tapa', 'playo']
  lines.push(`update tamanos set
  canales = ${sqlArr(t.canales)},
  insumo_cierre_ids = ARRAY[${cierreClaves.map(insumoSub).join(', ')}]::uuid[]
where owner_id = '${ownerId}' and nombre = ${sqlStr(t.nombre)};`)
}

// ── 6. Precios nuevos vigentes (no se borran los anteriores) ───────────────
for (const b of datos.bebidas) {
  for (const tamanoNombre of Object.keys(b.precio_lista)) {
    lines.push(`insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('${ownerId}', (select id from bebidas where owner_id = '${ownerId}' and nombre = ${sqlStr(b.nombre)}), (select id from tamanos where owner_id = '${ownerId}' and nombre = ${sqlStr(tamanoNombre)}), 'app', ${(b.precio_lista as Record<string, number>)[tamanoNombre]}, true);`)
    lines.push(`insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('${ownerId}', (select id from bebidas where owner_id = '${ownerId}' and nombre = ${sqlStr(b.nombre)}), (select id from tamanos where owner_id = '${ownerId}' and nombre = ${sqlStr(tamanoNombre)}), 'publico', ${(b.precio_publico as Record<string, number>)[tamanoNombre]}, true);`)
  }
}

// ── 7. Adicional "Versión frappé" (nuevo, sólo Público/Evento) ─────────────
const frappe = datos.adicionales.find((a) => a.nombre === 'Versión frappé')!
lines.push(`insert into adicionales (owner_id, nombre, precio, minutos, canales)
values ('${ownerId}', ${sqlStr(frappe.nombre)}, ${frappe.precio}, ${frappe.minutos}, ${sqlArr((frappe as any).canales)})
on conflict (owner_id, nombre) do update set precio = excluded.precio, minutos = excluded.minutos, canales = excluded.canales;`)
for (const r of frappe.receta) {
  lines.push(`insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
select '${ownerId}', (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(frappe.nombre)}), ${insumoSub(r.insumo)}, ${r.cantidad}, ${r.es_leche}, ${r.cambia_por_sabor}
where not exists (
  select 1 from adicional_lineas where owner_id = '${ownerId}' and adicional_id = (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(frappe.nombre)}) and insumo_id = ${insumoSub(r.insumo)}
);`)
}
for (const categoriaNombre of frappe.aplica_a_categorias) {
  lines.push(`insert into adicional_categorias (owner_id, adicional_id, categoria_id)
select '${ownerId}', (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(frappe.nombre)}), (select id from categorias where owner_id = '${ownerId}' and nombre = ${sqlStr(categoriaNombre)})
where not exists (
  select 1 from adicional_categorias where owner_id = '${ownerId}' and adicional_id = (select id from adicionales where owner_id = '${ownerId}' and nombre = ${sqlStr(frappe.nombre)}) and categoria_id = (select id from categorias where owner_id = '${ownerId}' and nombre = ${sqlStr(categoriaNombre)})
);`)
}

// ── 8. Equipo nuevo ─────────────────────────────────────────────────────────
for (const a of datos.activos) {
  lines.push(`insert into activos (owner_id, nombre, tipo, costo_neto, fecha_alta, vida_util_meses, valor_rescate, verificado, notas)
select '${ownerId}', ${sqlStr(a.nombre)}, 'equipo', ${a.costo}, ${sqlStr(a.fecha_compra)}, ${a.vida_util_meses}, ${a.valor_rescate}, ${a.verificado}, ${sqlStr(a.fuente)}
where not exists (select 1 from activos where owner_id = '${ownerId}' and nombre = ${sqlStr(a.nombre)});`)
}

// ── 9. Compras reales del 26/09 (se excluyen las marcadas "por comprar") ───
for (const c of datos.compras_26sep as any[]) {
  if (typeof c.nota === 'string' && c.nota.includes('Por comprar')) continue
  const clave = c.insumo
  lines.push(`select registrar_compra(jsonb_build_object(
  'notas', ${sqlStr('Compra 26/09/2026' + (c.nota ? ' — ' + c.nota : ''))},
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', ${insumoSub(clave)},
    'presentaciones', ${c.presentaciones},
    'contenido_util_por_presentacion', ${c.contenido},
    'precio_por_presentacion', ${c.total / c.presentaciones}
  ))
));`)
}

lines.push('commit;')

const outPath = resolve(__dirname, '../supabase/migrations/0003_v3_catalogo.sql')
writeFileSync(outPath, lines.join('\n\n') + '\n', 'utf-8')
console.log(`Escrito: ${outPath} (${lines.length} sentencias)`)
console.log('Compras excluidas por "Por comprar": leche, leche_desl, avena_oatly.')
