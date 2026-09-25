# Bendita Burbuja

PWA de caja, inventario y reportes para un negocio de bebidas de una sola persona.
Especificación completa en [`2_spec_claude_code.md`](./2_spec_claude_code.md); datos iniciales en
[`datos_iniciales_bendita_1.json`](./datos_iniciales_bendita_1.json); plan de esta fase en
`C:\Users\berna\.claude\plans\snuggly-frolicking-russell.md`.

## Estado actual

- **`src/lib/calculos.ts`** — el módulo de cálculo (sección 5 de la spec), puro y sin dependencias.
  Probado al centavo contra los 5 `pruebas_de_calculo` y `cotizacion_evento_ejemplo` del JSON:
  `npm test`.
- **`supabase/migrations/`** — esquema completo (sección 4) + RPC transaccionales (`registrar_pedido`,
  `cancelar_pedido`, `registrar_compra`, `registrar_conteo`, `cerrar_dia`). **Sin correr todavía**:
  esta máquina no tiene Docker, así que no hay Postgres local. `supabase/tests/calculos.pgtap.sql`
  queda pendiente de ejecutar contra el proyecto real.
- **`scripts/seed-from-json.ts`** — genera `supabase/seed.sql` desde el JSON de datos iniciales
  (`OWNER_ID=<uuid> npm run seed:sql`). Probado (corre y genera SQL bien formado), pendiente de
  ejecutarse contra un proyecto real.
- **Fase 1 completa en modo local**: mientras no se apruebe crear el proyecto de Supabase, la app
  corre contra `src/lib/store/localStore.ts` (localStorage), con las mismas reglas de negocio
  (mismo `calculos.ts`). `src/lib/supabase/` tiene el cliente y los repositorios reales, listos para
  cuando exista el proyecto — cambiar de uno a otro es reemplazar las llamadas en las pantallas.
  Pantallas: Hoy, Vender (caja con panel de bebida, 4 canales, envío, sustitución de leche/sabor),
  Desglose del día, Inventario (alertas + lista de compras), Compras, Recetas (precio manual/sugerido),
  Equipo y mobiliario, Ajustes (por canal + activar/desactivar tamaños/bebidas/adicionales).

## Verificación hecha

- `npm test` — 12/12 pruebas en verde (los 5 casos exactos + evento + reglas de adicionales).
- `npm run build` — compila TypeScript y arma el bundle + service worker sin errores.
- `npm run dev` levanta en `http://localhost:5173`; se confirmó que todos los módulos transforman sin
  error. **No se pudo hacer clic a través de la UI en un navegador real en esta sesión** (no hay
  extensión de Playwright disponible en este entorno) — falta ese recorrido manual.

## Pendiente para Fase 2

Cotizador de eventos con clientes (el cálculo `cotizarEvento` ya existe y está probado, falta la
pantalla y el CRUD de clientes/eventos), Web Push real, conteo físico recurrente y cierre formal del
día, reportes por rango extendido y por tamaño, real contra proyección, "¿me conviene contra Uber?",
impuestos del mes, conciliación de depósitos, exportar CSV/Excel.

## Pendiente antes de producción

1. Aprobar y crear el proyecto de Supabase, correr `supabase/migrations/`, generar y correr
   `supabase/seed.sql` con el `OWNER_ID` real.
2. Copiar `.env.example` a `.env.local` con `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Reemplazar las llamadas a `src/lib/store/localStore.ts` en las pantallas por
   `src/lib/supabase/{catalogo,ventas}.ts` + `src/lib/offline/queue.ts` (ya escrito, sin probar contra
   Postgres real).
4. Aprobar y publicar en Netlify (`public/_redirects` ya está listo para el SPA fallback).

## Comandos

```
npm install
npm run dev      # servidor de desarrollo
npm test         # vitest — calculos.test.ts
npm run build    # typecheck + build de producción
npm run seed:sql # OWNER_ID=<uuid> npm run seed:sql — genera supabase/seed.sql
```
