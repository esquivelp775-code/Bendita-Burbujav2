-- Caja (auditoría 29/09, Ola 2): forma de pago, clientes de Público, botanas con su bolsita en
-- inventario. No toca ventas registradas: sólo agrega columnas con default y reemplaza funciones.
begin;
select set_config('request.jwt.claims', json_build_object('sub', 'c79aeab6-ac16-47d9-a777-a25d739013f2', 'role', 'authenticated')::text, true);

-- ── Forma de pago (idea 3). Uber y Rappi cobran ellos: 'plataforma'. ────────
alter table pedidos add column if not exists forma_pago text null
  check (forma_pago in ('efectivo', 'transferencia', 'tarjeta', 'plataforma'));

-- registrar_pedido: igual que 0002 más forma_pago. Idempotente por pedido.id (regla 5).
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
  if exists (select 1 from pedidos where id = v_pedido_id and owner_id = auth.uid()) then
    return v_pedido_id;
  end if;

  insert into pedidos (
    id, fecha_hora, canal_id, turno_id, evento_id, cliente_id,
    envio_cobrado, costo_envio, folio_plataforma, estado, notas, forma_pago
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
    nullif(payload->'pedido'->>'folio_plataforma', ''),
    coalesce(payload->'pedido'->>'estado', 'cerrado'),
    payload->'pedido'->>'notas',
    nullif(payload->'pedido'->>'forma_pago', '');

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

  -- Movimientos por pedido (no por línea), p. ej. charolas: ceil(bebidas / 4) con 2 o más bebidas.
  for v_mov in select jsonb_array_elements(coalesce(payload->'movimientos_pedido', '[]'::jsonb))
  loop
    insert into movimientos_inventario (insumo_id, cantidad, costo_unitario, tipo, origen_id, nota)
    values ((v_mov->>'insumo_id')::uuid, (v_mov->>'cantidad')::numeric, coalesce((v_mov->>'costo_unitario')::numeric, 0), 'venta', v_pedido_id, v_mov->>'nota');
    perform evaluar_alertas_insumo((v_mov->>'insumo_id')::uuid);
  end loop;

  return v_pedido_id;
end;
$$;

-- ── Clientes de Público (K4): reutiliza por teléfono, si no por nombre; si no existe, lo crea. ──
create or replace function cliente_por_telefono_o_nombre(p_nombre text, p_telefono text default null)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_tel text := nullif(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g'), '');
  v_nombre text := nullif(trim(coalesce(p_nombre, '')), '');
begin
  if v_tel is null and v_nombre is null then
    return null;
  end if;
  if v_tel is not null then
    select id into v_id from clientes
    where owner_id = auth.uid() and regexp_replace(coalesce(telefono, ''), '\D', '', 'g') = v_tel
    order by creado_en limit 1;
  end if;
  if v_id is null and v_nombre is not null then
    select id into v_id from clientes
    where owner_id = auth.uid() and lower(nombre) = lower(v_nombre)
      and (v_tel is null or telefono is null)
    order by creado_en limit 1;
  end if;
  if v_id is null then
    insert into clientes (nombre, telefono, origen) values (coalesce(v_nombre, 'Cliente ' || v_tel), v_tel, 'publico')
    returning id into v_id;
  elsif v_tel is not null then
    update clientes set telefono = v_tel where id = v_id and telefono is null;
  end if;
  return v_id;
end;
$$;

-- ── Botanas (K5): cada una descuenta su bolsita. Costo $19 con IVA (dato del JSON v2). ──
insert into insumos (clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado, fuente)
values
  ('botana_platano', 'Bolsita de plátano deshidratado', 'botana', 'pieza', 'Bolsita', 1, 0, 0.16, 19 / 1.16, 'baja', false, 'JSON v2: costo real $18-20 la bolsita'),
  ('botana_malanga', 'Bolsita de malanga natural', 'botana', 'pieza', 'Bolsita', 1, 0, 0.16, 19 / 1.16, 'baja', false, 'JSON v2: costo real $18-20 la bolsita')
on conflict (owner_id, clave) do nothing;

update botanas set insumo_id = (select id from insumos where owner_id = auth.uid() and clave = 'botana_platano')
where owner_id = auth.uid() and nombre = 'Plátano Deshidratado' and insumo_id is null;
update botanas set insumo_id = (select id from insumos where owner_id = auth.uid() and clave = 'botana_malanga')
where owner_id = auth.uid() and nombre = 'Malanga Natural' and insumo_id is null;

commit;
