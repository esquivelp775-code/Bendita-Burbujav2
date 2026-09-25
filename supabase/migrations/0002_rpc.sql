-- RPC de escritura — todas security invoker, todas transaccionales (una función = una transacción).
-- El cliente calcula el desglose completo con src/lib/calculos.ts y lo manda ya resuelto: el servidor
-- inserta la "foto" tal cual (regla 1), no recalcula nada de dinero.

-- ── Alertas de inventario (5.10) ────────────────────────────────────────────

create or replace function existencia_insumo(p_insumo_id uuid)
returns numeric
language sql
security invoker
stable
as $$
  select coalesce(sum(cantidad), 0)
  from movimientos_inventario
  where insumo_id = p_insumo_id and owner_id = auth.uid();
$$;

create or replace function stock_objetivo_insumo(p_insumo_id uuid)
returns numeric
language plpgsql
security invoker
stable
as $$
declare
  v_manual numeric;
  v_auto numeric;
  v_acumulado numeric := 0;
  v_maximo numeric := 0;
  r record;
begin
  select stock_objetivo into v_manual from insumos where id = p_insumo_id and owner_id = auth.uid();
  if v_manual is not null then
    return v_manual;
  end if;

  -- Máxima existencia inmediatamente después de una compra en los últimos 60 días.
  select coalesce(sum(cantidad), 0) into v_acumulado
  from movimientos_inventario
  where insumo_id = p_insumo_id and owner_id = auth.uid() and fecha < (now() - interval '60 days');

  for r in
    select cantidad from movimientos_inventario
    where insumo_id = p_insumo_id and owner_id = auth.uid() and fecha >= (now() - interval '60 days')
    order by fecha asc
  loop
    v_acumulado := v_acumulado + r.cantidad;
    if r.cantidad > 0 and v_acumulado > v_maximo then
      v_maximo := v_acumulado;
    end if;
  end loop;

  if v_maximo = 0 then
    return null;
  end if;
  return v_maximo;
end;
$$;

create or replace function evaluar_alertas_insumo(p_insumo_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_insumo insumos%rowtype;
  v_parametros parametros%rowtype;
  v_umbral numeric;
  v_stock_objetivo numeric;
  v_existencia numeric;
begin
  select * into v_insumo from insumos where id = p_insumo_id and owner_id = auth.uid();
  if not found then return; end if;

  select * into v_parametros from parametros where owner_id = auth.uid() limit 1;
  v_existencia := existencia_insumo(p_insumo_id);
  v_stock_objetivo := stock_objetivo_insumo(p_insumo_id);

  v_umbral := coalesce(
    v_insumo.umbral_reorden,
    case v_insumo.prioridad
      when 'alta' then v_parametros.umbral_alta
      when 'media' then v_parametros.umbral_media
      else v_parametros.umbral_baja
    end
  );

  if v_stock_objetivo is not null and v_existencia <= v_umbral * v_stock_objetivo then
    if not exists (
      select 1 from alertas_inventario
      where insumo_id = p_insumo_id and owner_id = auth.uid() and tipo = 'reorden' and resuelta_en is null
    ) then
      insert into alertas_inventario (owner_id, insumo_id, tipo, creado_en)
      values (auth.uid(), p_insumo_id, 'reorden', now());
    end if;
  end if;

  if v_existencia <= 0 then
    if not exists (
      select 1 from alertas_inventario
      where insumo_id = p_insumo_id and owner_id = auth.uid() and tipo = 'agotado' and resuelta_en is null
    ) then
      insert into alertas_inventario (owner_id, insumo_id, tipo, creado_en)
      values (auth.uid(), p_insumo_id, 'agotado', now());
    end if;
  end if;
end;
$$;

-- ── registrar_pedido — venta + descuento de inventario en una transacción ──

create or replace function registrar_pedido(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_pedido_id uuid := (payload->'pedido'->>'id')::uuid;
  v_linea jsonb;
  v_mov jsonb;
begin
  -- Idempotencia (regla 5): si el pedido ya existe, no se repite nada.
  if exists (select 1 from pedidos where id = v_pedido_id and owner_id = auth.uid()) then
    return v_pedido_id;
  end if;

  insert into pedidos (
    id, fecha_hora, canal_id, turno_id, evento_id, cliente_id,
    envio_cobrado, costo_envio, folio_plataforma, estado, notas
  )
  select
    v_pedido_id,
    (payload->'pedido'->>'fecha_hora')::timestamptz,
    (payload->'pedido'->>'canal_id')::uuid,
    nullif(payload->'pedido'->>'turno_id', '')::uuid,
    nullif(payload->'pedido'->>'evento_id', '')::uuid,
    nullif(payload->'pedido'->>'cliente_id', '')::uuid,
    coalesce((payload->'pedido'->>'envio_cobrado')::numeric, 0),
    coalesce((payload->'pedido'->>'costo_envio')::numeric, 0),
    payload->'pedido'->>'folio_plataforma',
    coalesce(payload->'pedido'->>'estado', 'cerrado'),
    payload->'pedido'->>'notas';

  for v_linea in select jsonb_array_elements(payload->'lineas')
  loop
    insert into venta_lineas (
      id, pedido_id, tipo, bebida_id, botana_id, tamano_id, leche_id, adicionales, cantidad, precio,
      iva_trasladado, ingreso_sin_iva, comision, iva_comision, insumos, empaque, vaso_tapa, indirectos,
      minutos, tarifa_hora, mano_obra, utilidad, retencion_isr, retencion_iva, deposito_esperado
    ) values (
      (v_linea->>'id')::uuid, v_pedido_id, v_linea->>'tipo',
      nullif(v_linea->>'bebida_id', '')::uuid, nullif(v_linea->>'botana_id', '')::uuid,
      nullif(v_linea->>'tamano_id', '')::uuid, nullif(v_linea->>'leche_id', '')::uuid,
      coalesce(v_linea->'adicionales', '[]'::jsonb),
      coalesce((v_linea->>'cantidad')::int, 1), (v_linea->>'precio')::numeric,
      coalesce((v_linea->>'iva_trasladado')::numeric, 0), coalesce((v_linea->>'ingreso_sin_iva')::numeric, 0),
      coalesce((v_linea->>'comision')::numeric, 0), coalesce((v_linea->>'iva_comision')::numeric, 0),
      coalesce((v_linea->>'insumos')::numeric, 0), coalesce((v_linea->>'empaque')::numeric, 0),
      coalesce((v_linea->>'vaso_tapa')::numeric, 0), coalesce((v_linea->>'indirectos')::numeric, 0),
      coalesce((v_linea->>'minutos')::numeric, 0), coalesce((v_linea->>'tarifa_hora')::numeric, 0),
      coalesce((v_linea->>'mano_obra')::numeric, 0), coalesce((v_linea->>'utilidad')::numeric, 0),
      coalesce((v_linea->>'retencion_isr')::numeric, 0), coalesce((v_linea->>'retencion_iva')::numeric, 0),
      coalesce((v_linea->>'deposito_esperado')::numeric, 0)
    );

    for v_mov in select jsonb_array_elements(coalesce(v_linea->'movimientos', '[]'::jsonb))
    loop
      insert into movimientos_inventario (insumo_id, cantidad, costo_unitario, tipo, origen_id, nota)
      values (
        (v_mov->>'insumo_id')::uuid,
        (v_mov->>'cantidad')::numeric * coalesce((v_linea->>'cantidad')::int, 1),
        coalesce((v_mov->>'costo_unitario')::numeric, 0),
        'venta', v_pedido_id, null
      );
      perform evaluar_alertas_insumo((v_mov->>'insumo_id')::uuid);
    end loop;
  end loop;

  return v_pedido_id;
end;
$$;

-- ── cancelar_pedido — revierte inventario con movimientos de signo contrario ─

create or replace function cancelar_pedido(p_pedido_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_mov record;
begin
  if not exists (select 1 from pedidos where id = p_pedido_id and owner_id = auth.uid()) then
    raise exception 'Pedido no encontrado';
  end if;

  update pedidos set estado = 'cancelado' where id = p_pedido_id and owner_id = auth.uid();

  for v_mov in
    select insumo_id, cantidad, costo_unitario
    from movimientos_inventario
    where origen_id = p_pedido_id and owner_id = auth.uid() and tipo = 'venta'
  loop
    insert into movimientos_inventario (insumo_id, cantidad, costo_unitario, tipo, origen_id, nota)
    values (v_mov.insumo_id, -v_mov.cantidad, v_mov.costo_unitario, 'cancelacion', p_pedido_id, 'Reversa de ' || p_pedido_id);
  end loop;
end;
$$;

-- ── registrar_compra — promedio ponderado (5.2), marca verificado, resuelve alertas ─

create or replace function registrar_compra(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_compra_id uuid := gen_random_uuid();
  v_linea jsonb;
  v_insumo insumos%rowtype;
  v_existencia numeric;
  v_costo_entrada numeric;
  v_costo_nuevo numeric;
  v_unidades_entrada numeric;
begin
  insert into compras (id, fecha, proveedor_id, con_factura, notas)
  values (
    v_compra_id,
    coalesce((payload->>'fecha')::date, current_date),
    nullif(payload->>'proveedor_id', '')::uuid,
    coalesce((payload->>'con_factura')::boolean, false),
    payload->>'notas'
  );

  for v_linea in select jsonb_array_elements(payload->'lineas')
  loop
    select * into v_insumo from insumos where id = (v_linea->>'insumo_id')::uuid and owner_id = auth.uid();
    if not found then raise exception 'Insumo no encontrado'; end if;

    insert into compra_lineas (compra_id, insumo_id, presentaciones, contenido_util_por_presentacion, precio_por_presentacion, iva)
    values (
      v_compra_id, v_insumo.id,
      (v_linea->>'presentaciones')::numeric,
      (v_linea->>'contenido_util_por_presentacion')::numeric,
      (v_linea->>'precio_por_presentacion')::numeric,
      coalesce((v_linea->>'iva')::numeric, v_insumo.iva)
    );

    v_existencia := existencia_insumo(v_insumo.id);
    v_unidades_entrada := (v_linea->>'presentaciones')::numeric * (v_linea->>'contenido_util_por_presentacion')::numeric;
    v_costo_entrada := ((v_linea->>'precio_por_presentacion')::numeric / (1 + coalesce((v_linea->>'iva')::numeric, v_insumo.iva)))
                       / (v_linea->>'contenido_util_por_presentacion')::numeric;

    if v_existencia <= 0 then
      v_costo_nuevo := v_costo_entrada;
    else
      v_costo_nuevo := (v_existencia * v_insumo.costo_fisico_neto + v_unidades_entrada * v_costo_entrada)
                        / (v_existencia + v_unidades_entrada);
    end if;

    update insumos
    set costo_fisico_neto = v_costo_nuevo, verificado = true
    where id = v_insumo.id and owner_id = auth.uid();

    insert into movimientos_inventario (insumo_id, cantidad, costo_unitario, tipo, origen_id, nota)
    values (v_insumo.id, v_unidades_entrada, v_costo_nuevo, 'compra', v_compra_id, null);

    update alertas_inventario
    set resuelta_en = now()
    where insumo_id = v_insumo.id and owner_id = auth.uid() and tipo in ('reorden', 'agotado') and resuelta_en is null;
  end loop;

  return v_compra_id;
end;
$$;

-- ── registrar_conteo — ajusta existencia al conteo físico ───────────────────

create or replace function registrar_conteo(p_insumo_id uuid, p_cantidad_contada numeric, p_nota text default null)
returns void
language plpgsql
security invoker
as $$
declare
  v_existencia numeric := existencia_insumo(p_insumo_id);
  v_diferencia numeric := p_cantidad_contada - v_existencia;
begin
  if v_diferencia = 0 then return; end if;
  insert into movimientos_inventario (insumo_id, cantidad, tipo, nota)
  values (p_insumo_id, v_diferencia, 'conteo', p_nota);
  perform evaluar_alertas_insumo(p_insumo_id);
end;
$$;

-- ── cerrar_dia — marca el cierre del día (mínimo de Fase 1, sin resumen push) ─

create or replace function cerrar_dia(p_fecha date, p_merma_tapioca_g numeric default 0, p_notas text default null)
returns uuid
language sql
security invoker
as $$
  insert into cierres_dia (fecha, merma_tapioca_g, notas)
  values (p_fecha, p_merma_tapioca_g, p_notas)
  on conflict (owner_id, fecha) do update set merma_tapioca_g = excluded.merma_tapioca_g, notas = excluded.notas
  returning id;
$$;
