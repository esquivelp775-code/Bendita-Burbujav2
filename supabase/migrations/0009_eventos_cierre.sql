-- Ola 5 (auditoría 29/09): eventos con cotización, cierre del día con corte de caja y merma de
-- tapioca, aperturas y tandas con caducidad. No toca ventas registradas.
begin;
select set_config('request.jwt.claims', json_build_object('sub', 'c79aeab6-ac16-47d9-a777-a25d739013f2', 'role', 'authenticated')::text, true);

-- ── Eventos: guardar evento + líneas de cotización en una transacción (F1) ──
create or replace function guardar_evento(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid := nullif(payload->>'id', '')::uuid;
  v_linea jsonb;
begin
  if v_id is null then
    insert into eventos (cliente_id, nombre, fecha, lugar, estado, cargo_servicio, anticipo, notas)
    values (
      nullif(payload->>'cliente_id', '')::uuid,
      payload->>'nombre',
      (payload->>'fecha')::date,
      nullif(payload->>'lugar', ''),
      coalesce(payload->>'estado', 'cotizado'),
      coalesce((payload->>'cargo_servicio')::numeric, 0),
      coalesce((payload->>'anticipo')::numeric, 0),
      nullif(payload->>'notas', '')
    )
    returning id into v_id;
  else
    update eventos set
      cliente_id = nullif(payload->>'cliente_id', '')::uuid,
      nombre = payload->>'nombre',
      fecha = (payload->>'fecha')::date,
      lugar = nullif(payload->>'lugar', ''),
      cargo_servicio = coalesce((payload->>'cargo_servicio')::numeric, 0),
      anticipo = coalesce((payload->>'anticipo')::numeric, 0),
      notas = nullif(payload->>'notas', '')
    where id = v_id and owner_id = auth.uid();
    if not found then raise exception 'Evento no encontrado'; end if;
    delete from evento_cotizacion_lineas where evento_id = v_id and owner_id = auth.uid();
  end if;

  for v_linea in select jsonb_array_elements(coalesce(payload->'lineas', '[]'::jsonb))
  loop
    insert into evento_cotizacion_lineas (evento_id, bebida_id, tamano_id, cantidad, precio_unitario)
    values (v_id, (v_linea->>'bebida_id')::uuid, (v_linea->>'tamano_id')::uuid, (v_linea->>'cantidad')::int, (v_linea->>'precio_unitario')::numeric);
  end loop;
  return v_id;
end;
$$;

-- ── Cierre del día con corte de caja y merma de tapioca (F2, idea 3) ──
alter table cierres_dia add column if not exists efectivo_esperado numeric null;
alter table cierres_dia add column if not exists efectivo_contado numeric null;

drop function if exists cerrar_dia(date, numeric, text);
create or replace function cerrar_dia(
  p_fecha date,
  p_merma_tapioca_g numeric default 0,
  p_notas text default null,
  p_efectivo_esperado numeric default null,
  p_efectivo_contado numeric default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_tapioca uuid;
begin
  insert into cierres_dia (fecha, merma_tapioca_g, notas, efectivo_esperado, efectivo_contado)
  values (p_fecha, coalesce(p_merma_tapioca_g, 0), p_notas, p_efectivo_esperado, p_efectivo_contado)
  on conflict (owner_id, fecha) do update set
    merma_tapioca_g = excluded.merma_tapioca_g,
    notas = excluded.notas,
    efectivo_esperado = excluded.efectivo_esperado,
    efectivo_contado = excluded.efectivo_contado
  returning id into v_id;

  -- La merma de tapioca del cierre descuenta tapioca seca. Cerrar dos veces el mismo día la reemplaza.
  select id into v_tapioca from insumos where owner_id = auth.uid() and clave = 'tapioca_seca';
  delete from movimientos_inventario where owner_id = auth.uid() and origen_id = v_id and tipo = 'merma';
  if v_tapioca is not null and coalesce(p_merma_tapioca_g, 0) > 0 then
    insert into movimientos_inventario (insumo_id, cantidad, costo_unitario, tipo, origen_id, nota)
    select v_tapioca, -p_merma_tapioca_g, costo_fisico_neto, 'merma', v_id, 'Cierre del día ' || p_fecha || ': tapioca que sobró'
    from insumos where id = v_tapioca;
    perform evaluar_alertas_insumo(v_tapioca);
  end if;
  return v_id;
end;
$$;

-- ── Aperturas y tandas (F3, I6): caducidad por días del insumo o por horas de la tanda ──
alter table aperturas add column if not exists caduca_en timestamptz null;
alter table aperturas add column if not exists nota text null;

commit;
