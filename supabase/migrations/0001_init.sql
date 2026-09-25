-- Bendita Burbuja — esquema inicial (sección 4 de la especificación técnica v2).
-- Convención general: id uuid pk, owner_id uuid not null default auth.uid(), creado_en timestamptz
-- default now(), RLS owner_id = auth.uid(). pedidos y venta_lineas son la excepción: su id lo genera
-- el cliente (regla 5, idempotencia), así que no llevan default.

create extension if not exists "pgcrypto";

-- ── Configuración ────────────────────────────────────────────────────────

create table parametros (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  iva_venta numeric not null default 0.16,
  indirectos_por_bebida numeric not null default 2.00,
  merma_default numeric not null default 0.05,
  redondeo_precio numeric not null default 5,
  meta_utilidad_semanal numeric not null default 6000,
  hora_mano_obra_fuera_turno numeric not null default 50,
  isr_tasa_efectiva_estimada numeric not null default 0.025,
  umbral_alta numeric not null default 0.30,
  umbral_media numeric not null default 0.25,
  umbral_baja numeric not null default 0.20,
  hora_resumen_diario time null,
  zona_horaria text not null default 'America/Mexico_City'
);

create table turnos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  dias int[] not null,
  inicio time not null,
  fin time not null,
  hora_mano_obra numeric not null,
  estimado boolean not null default false,
  activo boolean not null default true
);

create table canales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  tipo text not null check (tipo in ('plataforma', 'publico', 'evento')),
  color text,
  activo boolean not null default true,
  orden int not null default 0,
  unique (owner_id, nombre)
);

create table config_plataforma (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  canal_id uuid not null unique references canales(id) on delete cascade,
  comision_base numeric not null,
  uber_one numeric not null default 0,
  uber_one_proporcion numeric not null default 0,
  marketing numeric not null default 0,
  iva_sobre_comision numeric not null default 0.16,
  retencion_isr numeric not null default 0.025,
  retencion_iva numeric not null default 0.08,
  frecuencia_deposito text
);

create table config_publico (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  canal_id uuid not null unique references canales(id) on delete cascade,
  descuento_vs_app numeric not null default 0.15,
  envio_cobrado_default numeric not null default 35,
  costo_envio_default numeric not null default 0
);

create table evento_escalas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  desde int not null,
  hasta int null,
  factor numeric not null,
  cargo_servicio numeric not null
);

create table config_evento (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  minimo_bebidas int not null default 30,
  traslado numeric not null default 400,
  equipo_hielo_desechables numeric not null default 300,
  horas_montaje numeric not null default 3
);

-- ── Catálogo ─────────────────────────────────────────────────────────────

create table proveedores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  contacto text,
  notas text
);

create table insumos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  clave text not null,
  nombre text not null,
  categoria text not null,
  unidad text not null check (unidad in ('g', 'ml', 'pieza')),
  presentacion text,
  contenido_util numeric not null,
  merma numeric not null default 0,
  iva numeric not null default 0,
  costo_fisico_neto numeric not null default 0,
  prioridad text not null check (prioridad in ('alta', 'media', 'baja')),
  umbral_reorden numeric null,
  stock_objetivo numeric null,
  caduca_abierto_dias int null,
  proveedor_id uuid references proveedores(id),
  verificado boolean not null default false,
  fuente text,
  activo boolean not null default true,
  unique (owner_id, clave)
);

create table categorias (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  minutos_preparacion numeric not null,
  utilidad_objetivo numeric not null,
  orden int not null default 0,
  unique (owner_id, nombre)
);

create table tamanos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  ml int not null,
  factor_escala numeric not null,
  insumo_vaso_id uuid references insumos(id),
  insumo_cierre_id uuid references insumos(id),
  activo boolean not null default true,
  unique (owner_id, nombre)
);

create table bebidas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  categoria_id uuid references categorias(id),
  descripcion text,
  lleva_leche boolean not null default false,
  activa boolean not null default true,
  orden int not null default 0,
  unique (owner_id, nombre)
);

create table receta_lineas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  bebida_id uuid not null references bebidas(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  cantidad numeric not null,
  escala_con_tamano boolean not null default true,
  es_leche boolean not null default false
);

create table receta_pasos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  bebida_id uuid not null references bebidas(id) on delete cascade,
  orden int not null,
  texto text not null
);

create table leches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  insumo_id uuid not null references insumos(id),
  sobreprecio numeric not null default 0,
  es_default boolean not null default false,
  unique (owner_id, nombre)
);

create table adicionales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  precio numeric not null,
  minutos numeric not null default 0,
  activo boolean not null default true,
  unique (owner_id, nombre)
);

create table adicional_lineas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  adicional_id uuid not null references adicionales(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  cantidad numeric not null,
  es_leche boolean not null default false,
  cambia_por_sabor boolean not null default false
);

create table adicional_categorias (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  adicional_id uuid not null references adicionales(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade
);

create table adicional_exclusiones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  adicional_id uuid not null references adicionales(id) on delete cascade,
  bebida_id uuid not null references bebidas(id) on delete cascade
);

create table adicional_sabores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  adicional_id uuid not null references adicionales(id) on delete cascade,
  categoria_id uuid null references categorias(id),
  sabor text not null,
  insumo_id uuid not null references insumos(id)
);

create table precios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  bebida_id uuid not null references bebidas(id) on delete cascade,
  tamano_id uuid not null references tamanos(id),
  canal_tipo text not null check (canal_tipo in ('app', 'publico')),
  precio numeric not null,
  manual boolean not null default false,
  vigente_desde timestamptz not null default now()
);
create index precios_vigente_idx on precios (owner_id, bebida_id, tamano_id, canal_tipo, vigente_desde desc);

create table botanas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  descripcion text,
  insumo_id uuid references insumos(id),
  precio_app numeric not null,
  precio_publico numeric not null,
  activa boolean not null default true
);

-- ── Equipo, clientes, eventos ────────────────────────────────────────────

create table activos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  tipo text not null check (tipo in ('mobiliario', 'equipo')),
  costo_neto numeric not null,
  iva_acreditable numeric not null default 0,
  fecha_alta date not null,
  vida_util_meses int not null,
  valor_rescate numeric not null default 0,
  fecha_baja date null,
  verificado boolean not null default false,
  notas text
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  nombre text not null,
  telefono text,
  origen text not null check (origen in ('publico', 'evento')),
  notas text
);

create table eventos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  cliente_id uuid references clientes(id),
  nombre text not null,
  fecha date not null,
  lugar text,
  estado text not null check (estado in ('cotizado', 'confirmado', 'realizado', 'cobrado', 'cancelado')),
  escala_id uuid references evento_escalas(id),
  cargo_servicio numeric not null default 0,
  traslado_real numeric not null default 0,
  equipo_real numeric not null default 0,
  horas_montaje numeric not null default 0,
  anticipo numeric not null default 0,
  notas text
);

create table evento_cotizacion_lineas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  evento_id uuid not null references eventos(id) on delete cascade,
  bebida_id uuid not null references bebidas(id),
  tamano_id uuid not null references tamanos(id),
  cantidad int not null,
  precio_unitario numeric not null
);

-- ── Ventas ───────────────────────────────────────────────────────────────
-- id generado en el cliente (regla 5): sin default, para que reintentar nunca duplique.

create table pedidos (
  id uuid primary key,
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  fecha_hora timestamptz not null,
  canal_id uuid not null references canales(id),
  turno_id uuid null references turnos(id),
  evento_id uuid null references eventos(id),
  cliente_id uuid null references clientes(id),
  envio_cobrado numeric not null default 0,
  costo_envio numeric not null default 0,
  folio_plataforma text null,
  estado text not null check (estado in ('abierto', 'cerrado', 'cancelado')),
  notas text
);

create table venta_lineas (
  id uuid primary key,
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  tipo text not null check (tipo in ('bebida', 'botana', 'cargo_servicio')),
  bebida_id uuid null references bebidas(id),
  botana_id uuid null references botanas(id),
  tamano_id uuid null references tamanos(id),
  leche_id uuid null references leches(id),
  adicionales jsonb not null default '[]',
  cantidad int not null default 1,
  precio numeric not null,
  iva_trasladado numeric not null default 0,
  ingreso_sin_iva numeric not null default 0,
  comision numeric not null default 0,
  iva_comision numeric not null default 0,
  insumos numeric not null default 0,
  empaque numeric not null default 0,
  vaso_tapa numeric not null default 0,
  indirectos numeric not null default 0,
  minutos numeric not null default 0,
  tarifa_hora numeric not null default 0,
  mano_obra numeric not null default 0,
  utilidad numeric not null default 0,
  retencion_isr numeric not null default 0,
  retencion_iva numeric not null default 0,
  deposito_esperado numeric not null default 0
);
create index venta_lineas_pedido_idx on venta_lineas (pedido_id);

-- ── Inventario ───────────────────────────────────────────────────────────

create table compras (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  fecha date not null default current_date,
  proveedor_id uuid references proveedores(id),
  con_factura boolean not null default false,
  notas text
);

create table compra_lineas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  compra_id uuid not null references compras(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  presentaciones numeric not null,
  contenido_util_por_presentacion numeric not null,
  precio_por_presentacion numeric not null,
  iva numeric not null default 0
);

create table movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  fecha timestamptz not null default now(),
  insumo_id uuid not null references insumos(id),
  cantidad numeric not null,
  costo_unitario numeric not null default 0,
  tipo text not null check (tipo in ('inicial', 'compra', 'venta', 'cancelacion', 'conteo', 'merma', 'ajuste')),
  origen_id uuid null,
  nota text
);
create index movimientos_insumo_idx on movimientos_inventario (owner_id, insumo_id, fecha);

create table aperturas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  insumo_id uuid not null references insumos(id),
  abierto_en date not null default current_date,
  agotado_en date null
);

create table alertas_inventario (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  insumo_id uuid not null references insumos(id),
  tipo text not null check (tipo in ('reorden', 'agotado', 'caducidad', 'cobertura')),
  notificada boolean not null default false,
  resuelta_en timestamptz null
);
create index alertas_abiertas_idx on alertas_inventario (owner_id, insumo_id, tipo) where resuelta_en is null;

create table suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  endpoint text not null unique,
  llaves jsonb not null
);

create table cierres_dia (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  fecha date not null,
  merma_tapioca_g numeric not null default 0,
  notas text,
  unique (owner_id, fecha)
);

create table depositos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz default now(),
  fecha date not null,
  canal_id uuid not null references canales(id),
  monto numeric not null,
  periodo_desde date not null,
  periodo_hasta date not null,
  notas text
);

-- ── RLS: owner_id = auth.uid() en todas las tablas ─────────────────────────

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'parametros', 'turnos', 'canales', 'config_plataforma', 'config_publico', 'evento_escalas', 'config_evento',
      'proveedores', 'insumos', 'categorias', 'tamanos', 'bebidas', 'receta_lineas', 'receta_pasos', 'leches',
      'adicionales', 'adicional_lineas', 'adicional_categorias', 'adicional_exclusiones', 'adicional_sabores',
      'precios', 'botanas', 'activos', 'clientes', 'eventos', 'evento_cotizacion_lineas', 'pedidos', 'venta_lineas',
      'compras', 'compra_lineas', 'movimientos_inventario', 'aperturas', 'alertas_inventario', 'suscripciones_push',
      'cierres_dia', 'depositos'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      t || '_owner_rls', t
    );
  end loop;
end $$;
