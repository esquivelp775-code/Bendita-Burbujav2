# Bendita Burbuja — Especificación técnica para Claude Code · v2

Pega este documento en Claude Code **después** del Handoff desde Claude Design, junto con `datos_iniciales_bendita.json` (v2). El diseño viene del bundle de Claude Design; este documento define **datos, cálculos y reglas**. Si el diseño contradice un cálculo de aquí, manda este documento.

**Cambios de la v2 (24/09/2026):** canal *Público en general* con envío · cotizador de eventos por bebida, tamaño y volumen · precios editables a mano por bebida, tamaño y canal · modal de venta con tamaño, leche, adicionales y sabor · adicionales filtrados por tipo de bebida · el sabor elegido es el que se descuenta del inventario · reorden por prioridad (30/25/20 %) con notificaciones y lista de compras · reportes por tamaño · horario con bloque de 6-9 am · comisiones configuradas por plataforma.

---

## 1. Qué se construye

Una app web (PWA) para operar un negocio de bebidas de una sola persona que vende por **Uber Eats, Rappi, Público en general (pedidos por WhatsApp/Instagram con envío) y Eventos**. Registra ventas en dos toques, descuenta inventario por receta, avisa cuándo reponer, y en todo momento dice cuánto se vendió, a dónde se fue cada peso y cuánto quedó.

**Usuario único** (el dueño). Diseñar para agregar después un rol "ayudante" que registre ventas sin ver costos.

## 2. Stack

- **Frontend:** React + Vite + TypeScript + Tailwind (tokens del sistema de diseño del bundle).
- **Backend:** Supabase — Postgres, Auth (enlace mágico), Row Level Security.
- **Hosting:** Netlify. **PWA instalable y offline** (ventas en IndexedDB, sincronización al volver la señal) con **Web Push** para avisos de inventario.
- **Un solo módulo de cálculo** `src/lib/calculos.ts`, puro, usado por la caja, el cotizador, los reportes y las pruebas. **Ningún cálculo de dinero vive en componentes.**

## 3. Reglas que no se negocian

1. **Foto del costo al vender.** Cada línea guarda su desglose completo calculado con los costos y precios vigentes en ese instante. Cambiar un precio o un costo **nunca** reescribe ventas pasadas.
2. **Inventario = kárdex.** Existencia = suma de movimientos. Compras suman, ventas restan, conteos y mermas ajustan, cancelaciones revierten.
3. **Venta e inventario en una transacción** (RPC en Postgres).
4. **Todo cuadra al centavo:** `iva + comisión + insumos + empaque + vaso_tapa + indirectos + mano_de_obra + utilidad = precio` en cada línea, y la cascada del día suma la venta del día.
5. **Idempotencia:** IDs de pedido y línea generados en el cliente; reintentar nunca duplica.
6. **Cancelar no borra:** marca el pedido y revierte su inventario con movimientos de signo contrario.
7. **Una sola fuente de verdad para lo activo.** Tamaños, bebidas, adicionales y canales activos se leen de su tabla. Si un tamaño se activa en Ajustes, aparece al instante en la caja; nunca se muestra un tamaño inactivo en la caja. *(Bug del prototipo: al activar 16 y 20 oz seguían apareciendo como inactivos.)*

## 4. Modelo de datos

Todas las tablas: `id uuid pk default gen_random_uuid()`, `owner_id uuid not null default auth.uid()`, `creado_en timestamptz default now()`, RLS `owner_id = auth.uid()`.

```sql
-- ── Configuración ──────────────────────────────────────────────
parametros (iva_venta numeric default 0.16, indirectos_por_bebida numeric default 2.00,
            merma_default numeric default 0.05, redondeo_precio numeric default 5,
            meta_utilidad_semanal numeric default 6000, hora_mano_obra_fuera_turno numeric default 50,
            isr_tasa_efectiva_estimada numeric default 0.025,
            umbral_alta numeric default 0.30, umbral_media numeric default 0.25, umbral_baja numeric default 0.20,
            hora_resumen_diario time null,            -- null = al terminar el último turno del día
            zona_horaria text default 'America/Mexico_City')
turnos (nombre text, dias int[] /*0=dom..6=sáb*/, inicio time, fin time,
        hora_mano_obra numeric, estimado bool, activo bool default true)

-- Un registro por canal, cada uno con SUS campos (en Ajustes, una tarjeta por canal)
canales (nombre text unique, tipo text check (tipo in ('plataforma','publico','evento')),
         color text, activo bool default true, orden int)
config_plataforma (canal_id uuid unique references canales,
         comision_base numeric,                 -- Uber 0.29 · Rappi 0.25
         uber_one numeric default 0,            -- Uber 0.01
         uber_one_proporcion numeric default 0, -- Uber 0.5 (en la mitad de los pedidos)
         marketing numeric default 0,           -- % de anuncios o promociones cobrados por la app
         iva_sobre_comision numeric default 0.16,
         retencion_isr numeric default 0.025,   -- LIF 2026, con RFC registrado
         retencion_iva numeric default 0.08,
         frecuencia_deposito text)
         -- comision_efectiva = comision_base + uber_one × uber_one_proporcion + marketing
config_publico (canal_id uuid unique references canales,
         descuento_vs_app numeric default 0.15, envio_cobrado_default numeric default 35,
         costo_envio_default numeric default 0)
evento_escalas (desde int, hasta int null, factor numeric, cargo_servicio numeric)
         -- 30-59: 1.00/$600 · 60-99: 0.95/$500 · 100-149: 0.90/$400 · 150-249: 0.85/$300 · 250+: 0.80/$0
config_evento (minimo_bebidas int default 30, traslado numeric default 400,
         equipo_hielo_desechables numeric default 300, horas_montaje numeric default 3)

-- ── Catálogo ───────────────────────────────────────────────────
proveedores (nombre text, contacto text, notas text)
insumos (clave text unique, nombre text, categoria text,
         unidad text check (unidad in ('g','ml','pieza')), presentacion text,
         contenido_util numeric, merma numeric, iva numeric,
         costo_fisico_neto numeric,                 -- $ por unidad física, sin IVA, promedio ponderado
         prioridad text check (prioridad in ('alta','media','baja')),
         umbral_reorden numeric null,               -- null = el de su prioridad en parametros
         stock_objetivo numeric null,               -- null = automático (5.10)
         caduca_abierto_dias int, proveedor_id uuid references proveedores,
         verificado bool, fuente text, activo bool default true)
         -- costo_unitario_neto (por unidad de receta) = costo_fisico_neto / (1 - merma)
categorias (nombre text unique, minutos_preparacion numeric, utilidad_objetivo numeric, orden int)
tamanos (nombre text unique, ml int, factor_escala numeric,
         insumo_vaso_id uuid references insumos, insumo_cierre_id uuid references insumos, activo bool)
bebidas (nombre text unique, categoria_id uuid references categorias, descripcion text,
         lleva_leche bool, activa bool default true, orden int)
receta_lineas (bebida_id uuid references bebidas on delete cascade, insumo_id uuid references insumos,
               cantidad numeric, escala_con_tamano bool, es_leche bool default false)
receta_pasos (bebida_id uuid references bebidas on delete cascade, orden int, texto text)
leches (nombre text unique, insumo_id uuid references insumos, sobreprecio numeric, es_default bool)
adicionales (nombre text unique, precio numeric, minutos numeric, activo bool default true)
adicional_lineas (adicional_id uuid references adicionales on delete cascade, insumo_id uuid references insumos,
                  cantidad numeric,
                  es_leche bool default false,        -- espuma: su leche sigue a la leche elegida
                  cambia_por_sabor bool default false)-- perlas y jarabe: el sabor elegido reemplaza este insumo
adicional_categorias (adicional_id uuid references adicionales, categoria_id uuid references categorias)
adicional_exclusiones (adicional_id uuid references adicionales, bebida_id uuid references bebidas)
adicional_sabores (adicional_id uuid references adicionales, categoria_id uuid null references categorias,
                   sabor text, insumo_id uuid references insumos)
                   -- Perlas: Mango, Maracuyá · Jarabe: Maracuyá y Frambuesa en sodas y frutales, Vainilla en café y bubble tea

precios (bebida_id uuid references bebidas, tamano_id uuid references tamanos,
         canal_tipo text check (canal_tipo in ('app','publico')),   -- evento se calcula (5.5)
         precio numeric, manual bool default false, vigente_desde timestamptz default now())
         -- 'app' = mismo precio en Uber y Rappi (decisión de negocio). Historial: nunca se sobrescribe,
         -- se inserta un registro nuevo y el vigente es el más reciente.
botanas (nombre text, descripcion text, insumo_id uuid references insumos,
         precio_app numeric, precio_publico numeric, activa bool)

-- ── Equipo, clientes, eventos ─────────────────────────────────
activos (nombre text, tipo text check (tipo in ('mobiliario','equipo')), costo_neto numeric,
         iva_acreditable numeric default 0, fecha_alta date, vida_util_meses int,
         valor_rescate numeric default 0, fecha_baja date null, verificado bool, notas text)
clientes (nombre text, telefono text, origen text check (origen in ('publico','evento')), notas text)
eventos (cliente_id uuid references clientes, nombre text, fecha date, lugar text,
         estado text check (estado in ('cotizado','confirmado','realizado','cobrado','cancelado')),
         escala_id uuid references evento_escalas, cargo_servicio numeric,
         traslado_real numeric, equipo_real numeric, horas_montaje numeric,
         anticipo numeric default 0, notas text)
evento_cotizacion_lineas (evento_id uuid references eventos on delete cascade,
         bebida_id uuid references bebidas, tamano_id uuid references tamanos,
         cantidad int, precio_unitario numeric)

-- ── Ventas ─────────────────────────────────────────────────────
pedidos (id uuid primary key, fecha_hora timestamptz, canal_id uuid references canales,
         turno_id uuid null references turnos, evento_id uuid null references eventos,
         cliente_id uuid null references clientes,
         envio_cobrado numeric default 0,       -- sólo Público; con IVA
         costo_envio numeric default 0,         -- lo que pagas al repartidor (0 si entregas tú)
         folio_plataforma text null,
         estado text check (estado in ('abierto','cerrado','cancelado')), notas text)
venta_lineas (id uuid primary key, pedido_id uuid references pedidos,
         tipo text check (tipo in ('bebida','botana','cargo_servicio')),
         bebida_id uuid null, botana_id uuid null, tamano_id uuid null, leche_id uuid null,
         adicionales jsonb default '[]',        -- [{adicional_id, nombre, sabor, precio}]
         cantidad int default 1, precio numeric,        -- precio unitario
         -- FOTO del desglose unitario (sección 5):
         iva_trasladado numeric, ingreso_sin_iva numeric, comision numeric, iva_comision numeric,
         insumos numeric, empaque numeric, vaso_tapa numeric, indirectos numeric,
         minutos numeric, tarifa_hora numeric, mano_obra numeric, utilidad numeric,
         retencion_isr numeric, retencion_iva numeric, deposito_esperado numeric)

-- ── Inventario ─────────────────────────────────────────────────
compras (fecha date, proveedor_id uuid references proveedores, con_factura bool, notas text)
compra_lineas (compra_id uuid references compras on delete cascade, insumo_id uuid references insumos,
               presentaciones numeric, contenido_util_por_presentacion numeric,
               precio_por_presentacion numeric, iva numeric)
movimientos_inventario (fecha timestamptz, insumo_id uuid references insumos, cantidad numeric,
               costo_unitario numeric,
               tipo text check (tipo in ('inicial','compra','venta','cancelacion','conteo','merma','ajuste')),
               origen_id uuid null, nota text)
aperturas (insumo_id uuid references insumos, abierto_en date, agotado_en date null)
alertas_inventario (insumo_id uuid references insumos, tipo text check (tipo in ('reorden','agotado','caducidad','cobertura')),
               creada_en timestamptz, notificada bool default false, resuelta_en timestamptz null)
suscripciones_push (endpoint text unique, llaves jsonb)
cierres_dia (fecha date unique, merma_tapioca_g numeric default 0, notas text)
depositos (fecha date, canal_id uuid references canales, monto numeric,
           periodo_desde date, periodo_hasta date, notas text)
```

## 5. Cálculos — `src/lib/calculos.ts`

### 5.1 Costo por unidad de receta
`costo_unitario_neto = costo_fisico_neto / (1 − merma)`

### 5.2 Compra (promedio ponderado)
```
unidades_entrada   = presentaciones × contenido_util_por_presentacion
costo_entrada_neto = (precio_por_presentacion / (1 + iva)) / contenido_util_por_presentacion
si existencia ≤ 0:  costo_fisico_neto = costo_entrada_neto
si no: costo_fisico_neto = (existencia × costo_previo + unidades_entrada × costo_entrada_neto)
                           / (existencia + unidades_entrada)
```
La compra marca el insumo como `verificado`, resuelve sus alertas de reorden y recalcula su `stock_objetivo` automático.

### 5.3 Tarifa de mano de obra
Turno cuyo día y horario contienen `fecha_hora` → `turno.hora_mano_obra`. Turnos v2:

| Turno | Días | Horario | $/hora |
|---|---|---|---|
| Mañana entre semana | L-V | 06:00-09:00 | 60 *(estimado — hora pico de Uber)* |
| Tarde entre semana | L-V | 13:30-16:30 | 45 |
| Fin de semana | S-D | 06:00-13:00 | 55 |

Fuera de turno (eventos, ventas sueltas): `hora_mano_obra_fuera_turno` = $50.

### 5.4 Precio por canal (precio unitario de la línea)
```
precio_app(b, t)     = precio vigente canal_tipo 'app'      (sugerido: fórmula 5.9)
precio_publico(b, t) = precio vigente canal_tipo 'publico'  (sugerido: redondeo5(precio_app × (1 − descuento_vs_app)))
extra_leche          = bebida.lleva_leche ? leche.sobreprecio : 0
suma_adics           = Σ adicional.precio

Uber Eats / Rappi : p = precio_app + extra_leche + suma_adics
Público en general: p = precio_publico + extra_leche + redondeo5(suma_adics × (1 − descuento_vs_app))
Evento            : f = factor de la escala del evento (por total de bebidas del evento)
                    p = redondeo5(precio_app × f) + redondeo5((extra_leche + suma_adics) × f)
```
El precio de evento parte del precio de lista **de cada bebida en su tamaño**, así respeta su costo y su tamaño, y baja por volumen. No se usa costo + % puro: abarataría de más el café (la Penitencia cuesta $13 de hacer; a +100 % saldría en $30 contra $60 en la app).

### 5.5 Desglose de una línea (la foto que se guarda)
```
ingreso_sin_iva = p / (1 + iva_venta);   iva_trasladado = p − ingreso_sin_iva
comision        = plataforma ? p × comision_efectiva : 0;   iva_comision = comision × iva_sobre_comision

para cada línea de receta:
    insumo = (línea.es_leche && bebida.lleva_leche) ? leche.insumo : línea.insumo
    cant   = línea.cantidad × (línea.escala_con_tamano ? tamaño.factor_escala : 1)
    → 'empaque' si insumo.categoria == 'empaque', si no 'insumos'
para cada adicional elegido:
    para cada adicional_linea:
        insumo = línea.cambia_por_sabor ? sabor_elegido.insumo
               : línea.es_leche         ? leche.insumo           // la espuma usa la leche elegida
               : línea.insumo
        insumos += cantidad × costo_unitario_neto(insumo)
vaso_tapa   = costo_unitario_neto(vaso del tamaño) + costo_unitario_neto(cierre del tamaño)
indirectos  = indirectos_por_bebida / 1.16
minutos     = categoria.minutos_preparacion + Σ adicional.minutos
mano_obra   = minutos × tarifa_hora / 60
utilidad    = ingreso_sin_iva − comision − insumos − empaque − vaso_tapa − indirectos − mano_obra
retencion_isr = plataforma ? ingreso_sin_iva × retencion_isr : 0
retencion_iva = plataforma ? ingreso_sin_iva × retencion_iva : 0
deposito_esperado = plataforma ? p − comision − iva_comision − retencion_isr − retencion_iva : p
```
Con `cantidad > 1`, todo se multiplica por la cantidad al agregar; la foto guarda el unitario.

`redondeo5(x)` = múltiplo de 5 más cercano, **empate hacia arriba** (`Math.round(x / 5) * 5`). Ejemplo: $42.50 → $45.

**Reglas de adicionales** (tabla `adicional_categorias`, `adicional_exclusiones`, `adicional_sabores`):

| Adicional | Aplica a | Sabor |
|---|---|---|
| Tapioca extra | Bubble tea | — |
| Perlas explosivas extra | Soda italiana, Frutal | Mango · Maracuyá |
| Shot de jarabe | Soda, Frutal → Maracuyá · Frambuesa; Café frío, Bubble tea → Vainilla | según categoría |
| Espuma de vainilla | Café frío, Bubble tea (excepto Gloria de Vainilla, que ya la trae) | — |
| Versión frappé | Bubble tea, Café frío | — |

La leche de avena **no** es adicional: es opción del selector de leche (+$15).

### 5.6 Movimientos de inventario de una línea
Por cada insumo consumido (receta con leche sustituida + adicionales con sabor + vaso + cierre):
`cantidad_fisica = − cant × cantidad_línea / (1 − merma)`, tipo `venta`, con `costo_fisico_neto` vigente.
Después de insertar, evaluar alertas (5.10).

### 5.7 Envío (sólo Público)
Por pedido: `envio_sin_iva = envio_cobrado / 1.16`, `iva_envio = envio_cobrado − envio_sin_iva`, `margen_envio = envio_sin_iva − costo_envio`. El envío **no** se mezcla con la utilidad de las bebidas: tiene su renglón en el desglose.

### 5.8 Cotizador de eventos
```
n        = Σ cantidades de la cotización
escala   = evento_escalas donde desde ≤ n ≤ hasta
por línea: precio_unitario = redondeo5(precio_app(b, t) × escala.factor); utilidad = desglose 5.5 (tarifa fuera de turno)
subtotal = Σ precio_unitario × cantidad
cargo    = escala.cargo_servicio (editable por evento)
total_cliente = subtotal + cargo
utilidad_evento = Σ utilidad × cantidad + cargo / 1.16 − traslado − equipo_hielo_desechables − horas_montaje × tarifa
comparativo_apps = n × utilidad promedio por bebida de las apps (últimas 4 semanas; si no hay datos, metas_del_modelo)
alerta si utilidad_evento / n < utilidad promedio de apps  → "Este evento te deja menos por bebida que las apps"
bloquear si n < minimo_bebidas (30)
```
Mostrar por línea: costo de producción, precio app, precio evento y **margen sobre costo** (`precio_evento / 1.16 / costo_produccion − 1`) para que se vea la relación con el costo.
El cargo de servicio se registra como `venta_linea` tipo `cargo_servicio` (IVA incluido, sin costo). Los costos reales del evento (traslado, equipo, montaje) se restan el día del evento (5.11).

Referencia (`cotizacion_evento_ejemplo` del JSON): 100 bebidas de 16 oz → cliente paga **$7,925** → utilidad **$2,989** ($29.89/bebida) contra $1,852 en apps.

### 5.9 Precio sugerido y edición manual
```
precio_sugerido_app(b, t) = redondeo5( (costo_total(b, t) + utilidad_objetivo(cat))
                                        / (1/(1 + iva) − comision_efectiva de Uber) )
                            con escalera: cada tamaño ≥ el anterior + $5
costo_total usa la tarifa de $50/h (promedio) para la mano de obra
```
- El precio vigente es el **manual** si existe; si no, el sugerido.
- Editar un precio inserta un registro nuevo en `precios` con `manual = true`; "Restablecer al sugerido" inserta uno con `manual = false`.
- Si el margen de un precio manual queda debajo de la utilidad objetivo de su categoría → alerta en ocre, sin bloquear.
- Si un insumo sube y el sugerido cambia, avisar en la ficha: "El sugerido subió a $X; tu precio actual deja $Y".

### 5.10 Reorden por prioridad y notificaciones
```
umbral(insumo)         = insumo.umbral_reorden ?? parametros.umbral_<prioridad>   // alta .30 · media .25 · baja .20
stock_objetivo(insumo) = insumo.stock_objetivo manual
                       ?? máxima existencia inmediatamente después de una compra en los últimos 60 días
                       ?? null
alerta 'reorden'   si stock_objetivo y existencia ≤ umbral × stock_objetivo
alerta 'agotado'   si existencia ≤ 0
alerta 'cobertura' si existencia / consumo_diario_14d < 3 días
alerta 'caducidad' si apertura abierta y (abierto_en + caduca_abierto_dias − hoy) ≤ 2
```
- Crear la alerta **una vez** al cruzar el umbral; resolverla con la compra o el conteo.
- **Aviso inmediato:** toast en la caja + contador en la pestaña Inventario + tarjeta "Atención" en Hoy.
- **Push (PWA):** una notificación por alerta nueva de prioridad alta; las demás van en el resumen.
- **Resumen diario** al terminar el último turno del día: "Lista de compras" agrupada por proveedor.
- **Lista de compras:** por insumo con alerta, `cantidad_sugerida = redondear_arriba((stock_objetivo − existencia) / contenido_util) presentaciones` y costo estimado con el último precio. Botón "Convertir en compra" que precarga el formulario.

Prioridades del JSON: **alta** tapioca, polvos (taro, matcha, chai, moka), café, leche entera, vasos y tapas · **media** jarabes, perlas, té, tisana, deslactosada, avena, crema, popotes, etiquetas, playo · **baja** azúcar, hielo, agua mineral.

### 5.11 Desglose del día (el botón principal)
Sobre las líneas válidas del día:
```
venta          = Σ precio × cantidad  + Σ envio_cobrado
iva            = Σ iva_trasladado × cantidad + Σ iva_envio
comision, insumos, empaque (+ vaso_tapa), indirectos, mano_obra_lineas = sumas × cantidad
equipo         = equipo_del_dia(d)                        // 5.12
costos_evento  = Σ eventos del día: traslado_real + equipo_real
mo_montaje     = Σ eventos del día: horas_montaje × tarifa fuera de turno
costo_envios   = Σ costo_envio
mano_obra      = mano_obra_lineas + mo_montaje
ganancia       = Σ utilidad × cantidad + Σ cargo_servicio/1.16 − equipo − costos_evento − mo_montaje
                 + Σ margen_envio
te_llevas      = ganancia + mano_obra
```
Cascada: venta → IVA → comisión → insumos → empaque → indirectos → equipo → costos de eventos → envíos pagados → mano de obra → ganancia. **Debe cumplirse** que los tramos sumen la venta.

Tablas del desglose:
- Por canal (4 columnas: Uber Eats · Rappi · Público · Evento).
- **Por bebida y tamaño** ("Taro Celestial 14 oz" y "Taro Celestial 16 oz" son renglones distintos), ordenada por ganancia total: unidades, venta, ganancia, margen %, ganancia por bebida. Con opción de agrupar por bebida.
- Top 5 por unidades y por ganancia; bebidas por hora; contra el mismo día de la semana anterior; depósitos esperados por plataforma y retenciones.

**Coherencia:** cada línea mostrada debe tener el precio que le corresponde por tabla de precios, tamaño, leche, adicionales y canal. Nunca un precio inventado.

### 5.12 Equipo y mobiliario
`depreciacion_mensual = (costo_neto − valor_rescate) / vida_util_meses`; en uso el día d si `fecha_alta ≤ d`, sin baja y dentro de su vida útil. `equipo_del_dia = Σ depreciacion_mensual / 30.4`.

### 5.13 Semana y metas
Semana lunes-domingo. `ganancia_semana` (5.11 sumado), `avance = ganancia_semana / meta`, `te_llevas_semana`, `manejando_habrías_hecho = Σ turnos de la semana (horas × hora_mano_obra)`.
Referencias con el horario v2 (44 h): equilibrio **111 bebidas/semana**, meta **323/semana**, cupo **950/semana**. Con el horario de 29 h eran 69 / 324 / 604.

### 5.14 Reportes por tamaño
- **General:** por tamaño (14 / 16 / 20 oz): unidades, % del total, venta, ganancia, **ganancia promedio por bebida**, ticket promedio. Filtro "sólo 16 y 20 oz".
- **Detalle:** matriz bebida × tamaño (unidades y ganancia).
- **Mezcla de tamaños** en el tiempo (barras apiladas por semana).
- **Alerta del simulador:** si en una bebida el tamaño grande deja menos que el chico (hoy pasa con Taro, Matcha, Chai y Tentación de Cacao en 16 oz), señalarlo.

### 5.15 Impuestos del mes (estimación)
`iva_a_pagar = Σ iva_trasladado (+ envíos) − Σ retencion_iva − (Σ iva_comision + IVA de compras y activos con factura)`; `isr_retenido = Σ retencion_isr`. Siempre con "Estimación para revisar con tu contador". Las ventas a Público y Eventos no son ingresos por plataforma: mostrarlas en su propio renglón para el contador.

## 6. Flujos

**Vender.** El canal se elige arriba y se queda puesto. Tocar una bebida abre un panel (hoja inferior en celular, modal en escritorio) con: tamaños activos con su precio en el canal actual · leche (si aplica) · adicionales que aplican a esa bebida, con selector de sabor cuando corresponde · cantidad · resumen en vivo "Precio $110 · te deja $30.95" · botón **"Agregar al pedido · $110"**. Valores por defecto: el último tamaño usado, leche entera, sin adicionales — así el caso común son **dos toques**. El pedido se cierra con "Listo", al cambiar de canal o tras 3 min sin actividad; al cerrar se llama `registrar_pedido(payload)` en una transacción.
Con **Público en general**, la bandeja del pedido pide: envío cobrado (default $35), costo de envío (default $0) y, opcional, nombre y teléfono del cliente (crea o reutiliza un registro en `clientes`).
Con **Evento**, se elige el evento del día y los precios salen de su escala.

**Cotizar evento.** Agregar líneas bebida + tamaño + cantidad → la escala se elige sola por el total → se ven precios, cargo, utilidad y comparativo en vivo → guardar como `cotizado` → compartir por WhatsApp o PDF.

**Deshacer (5 s), cancelar, compra, conteo físico, cierre del día, aperturas:** igual que la v1.

## 7. Seguridad
Enlace mágico, RLS por `owner_id`, RPC `security invoker`. Fase 3: rol ayudante sin acceso a costos ni utilidades.

## 8. Datos iniciales (`datos_iniciales_bendita.json` v2)
- `canales` trae cada canal con sus campos → `canales` + `config_plataforma` / `config_publico`. `evento` → `config_evento` + `evento_escalas`.
- `bebidas[].precio_lista` → `precios` tipo `app`; `precio_publico` → tipo `publico` (ambos `manual = false`).
- `adicionales[]` trae `aplica_a_categorias`, `excluye_bebidas`, `sabores` / `sabores_por_categoria` y en su receta `es_leche` y `cambia_por_sabor`.
- `insumos[]` trae `prioridad`, `umbral_reorden` y `stock_objetivo` (null = automático).
- Vasos y tapas por tamaño se crean como insumos `pieza`, prioridad alta, `costo_fisico_neto = costo / 1.16`. Los tres tamaños vienen **activos**.
- Existencia inicial en cero salvo los 70 vasos de 14 oz; el primer uso pide conteo.

## 9. Pruebas de aceptación

`calculos.test.ts` debe reproducir **al centavo** los cinco casos de `pruebas_de_calculo` (incluido `consumo_inventario`) y la `cotizacion_evento_ejemplo`:

| Caso | Precio | Utilidad | Depósito |
|---|---|---|---|
| Taro Celestial 14 oz, entera, Uber Eats, martes 14:00 | $95.00 | $17.77 | $53.89 |
| Alma Blanca 14 oz, avena + espuma de vainilla (con avena), Rappi, sábado 08:00 | $115.00 | $30.95 | $71.24 |
| Pecado Tropical 16 oz + perlas de maracuyá + shot de frambuesa, Público, miércoles 07:30 | $85.00 | $43.72 | $85.00 |
| Gloria de Vainilla 20 oz, deslactosada, Uber Eats, domingo 09:00 | $85.00 | $18.92 | $48.22 |
| Penitencia Fría 14 oz en evento de 100 bebidas, sábado 18:00 | $55.00 | $32.27 | $55.00 |

Además:
- En cada caso la suma de los tramos es igual al precio.
- Las perlas de maracuyá descuentan `perla_maracuya` (no mango) y el shot de frambuesa `jarabe_frambuesa`.
- La espuma sobre una bebida con avena descuenta `avena_oatly`, no leche entera.
- Ofrecer "Tapioca extra" en un café o "Espuma de vainilla" en Gloria de Vainilla debe ser imposible.
- Activar un tamaño en Ajustes lo muestra de inmediato en la caja; desactivarlo lo quita.
- Editar el precio de una bebida no cambia la utilidad de ventas ya guardadas.
- Una venta que deja un insumo de prioridad alta en ≤ 30 % de su objetivo crea una alerta y una sola notificación.
- Cotizar 45 bebidas usa la escala 30-59; cotizar 25 se bloquea.

## 10. Fases

**Fase 1:** autenticación · importación · primer uso con conteo inicial y activos · caja con panel de bebida, 4 canales, envío y descuento de inventario · Hoy · Desglose del día (por canal y por bebida × tamaño) · inventario con prioridades, alertas y lista de compras · compras · recetas con edición de precios y simulador por tamaño · activos · ajustes por plataforma · offline.

**Fase 2:** eventos con cotizador y clientes · Web Push y resumen diario · conteo físico y cierre del día · reportes por rango, por canal y por tamaño · real contra proyección · ¿me conviene contra Uber? · impuestos del mes · conciliación de depósitos · exportar CSV/Excel.

**Fase 3:** rol ayudante · respaldo automático · comparativos de temporada.

## 11. Fuera de alcance
Cobrar o procesar pagos, facturar (CFDI), conectarse a las APIs de Uber o Rappi, datos del cliente final de las apps, multi-sucursal.
