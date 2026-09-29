// Genera supabase/migrations/0005_v31_publico_y_vaso_14.sql a partir de datos_bendita_v3_1_delta.json
// (ver 5_prompt_claude_code_v3_1.md). Uso: OWNER_ID=<uuid-del-dueño> npm run seed:v31:sql
// No toca ventas ni precios anteriores: los precios nuevos se insertan con su vigencia y el historial
// se queda. El conteo físico del paso 0 se registra aparte (registrar_conteo), no aquí.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import delta from '../datos_bendita_v3_1_delta.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

const ownerId = process.env.OWNER_ID
if (!ownerId) {
  console.error('Falta OWNER_ID. Uso: OWNER_ID=<uuid-del-dueño> npm run seed:v31:sql')
  process.exit(1)
}

const sqlStr = (v: string) => `'${v.replace(/'/g, "''")}'`
const sqlArr = (vs: string[]) => `ARRAY[${vs.map(sqlStr).join(', ')}]::text[]`
// "2026-09-29" es fecha de Puebla: la vigencia empieza a medianoche hora de México (UTC−6, sin horario de verano).
const vigenteDesde = `${delta.vigente_desde} 00:00:00-06`

const lines: string[] = []
lines.push('-- Generado por scripts/seed-v31-from-json.ts — no editar a mano, regenerar desde datos_bendita_v3_1_delta.json.')
lines.push('-- v3.1: el 14 oz también se vende a Público, el vaso de 14 oz no se recompra, precios nuevos a Público y rango de margen.')
lines.push('begin;')

// ── 1. Esquema (idempotente) ───────────────────────────────────────────────
lines.push(`alter table parametros add column if not exists margen_publico_min numeric not null default ${delta.regla_precio_publico.margen_min};`)
lines.push(`alter table parametros add column if not exists margen_publico_max numeric not null default ${delta.regla_precio_publico.margen_max};`)
lines.push(`alter table insumos add column if not exists recompra boolean not null default true;`)

// ── 2. Rango de margen de Público ──────────────────────────────────────────
lines.push(`update parametros set margen_publico_min = ${delta.regla_precio_publico.margen_min}, margen_publico_max = ${delta.regla_precio_publico.margen_max}
where owner_id = '${ownerId}';`)

// ── 3. Tamaños: canales nuevos y vaso sin recompra ─────────────────────────
for (const [nombre, cambio] of Object.entries(delta.tamanos_cambios)) {
  lines.push(`update tamanos set canales = ${sqlArr(cambio.canales_ahora)}
where owner_id = '${ownerId}' and nombre = ${sqlStr(nombre)};`)
  if (cambio.recompra === false) {
    lines.push(`update insumos set recompra = false
where owner_id = '${ownerId}'
  and id = (select insumo_vaso_id from tamanos where owner_id = '${ownerId}' and nombre = ${sqlStr(nombre)});`)
  }
}

// ── 4. Precios nuevos a Público (el historial anterior se queda) ───────────
for (const b of delta.bebidas) {
  for (const [tamano, precio] of Object.entries(b.precio_publico_nuevo as Record<string, number>)) {
    lines.push(`insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('${ownerId}', (select id from bebidas where owner_id = '${ownerId}' and nombre = ${sqlStr(b.nombre)}), (select id from tamanos where owner_id = '${ownerId}' and nombre = ${sqlStr(tamano)}), 'publico', ${precio}, true, '${vigenteDesde}');`)
  }
}

lines.push('commit;')

const outPath = resolve(__dirname, '../supabase/migrations/0005_v31_publico_y_vaso_14.sql')
writeFileSync(outPath, lines.join('\n\n') + '\n', 'utf-8')
console.log(`Escrito: ${outPath} (${lines.length} sentencias)`)
