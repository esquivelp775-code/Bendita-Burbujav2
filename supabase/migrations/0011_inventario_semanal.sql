-- Inventario semanal (domingos): conteo completo con la variación de cada insumo desde el inventario
-- anterior: existencia inicial + compras − ventas − mermas registradas = lo que debería haber; contra
-- lo contado, la diferencia es merma no registrada. Se guarda como historial y ajusta el kárdex.
begin;
select set_config('request.jwt.claims', json_build_object('sub', 'c79aeab6-ac16-47d9-a777-a25d739013f2', 'role', 'authenticated')::text, true);

create table if not exists inventarios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  creado_en timestamptz not null default now(),
  fecha date not null,
  desde timestamptz null,           -- inicio del periodo comparado (inventario anterior)
  notas text,
  valor_diferencia numeric not null default 0,  -- $ de la variación total (sin IVA)
  valor_mermas numeric not null default 0       -- $ de mermas registradas en el periodo
);
alter table inventarios enable row level security;
create policy inventarios_duenio on inventarios for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table if not exists inventario_lineas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  inventario_id uuid not null references inventarios(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  inicial numeric not null default 0,
  compras numeric not null default 0,
  ventas numeric not null default 0,     -- consumo por ventas (positivo)
  mermas numeric not null default 0,     -- mermas registradas (positivo)
  otros numeric not null default 0,      -- conteos/ajustes intermedios
  sistema numeric not null,              -- lo que debería haber
  contado numeric not null,
  diferencia numeric not null,           -- contado − sistema (negativo = falta)
  costo_unitario numeric not null default 0
);
alter table inventario_lineas enable row level security;
create policy inventario_lineas_duenio on inventario_lineas for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create index if not exists inventario_lineas_inv_idx on inventario_lineas (inventario_id);

-- Movimientos por insumo desde una fecha, separados por tipo (una fila por insumo activo).
create or replace function resumen_inventario(p_desde timestamptz)
returns table (
  insumo_id uuid, inicial numeric, compras numeric, ventas numeric, mermas numeric, otros numeric, sistema numeric, costo_unitario numeric
)
language sql
security invoker
stable
as $$
  select
    i.id,
    coalesce(sum(m.cantidad) filter (where m.fecha < p_desde), 0),
    coalesce(sum(m.cantidad) filter (where m.fecha >= p_desde and m.tipo = 'compra'), 0),
    coalesce(-sum(m.cantidad) filter (where m.fecha >= p_desde and m.tipo in ('venta', 'cancelacion')), 0),
    coalesce(-sum(m.cantidad) filter (where m.fecha >= p_desde and m.tipo = 'merma'), 0),
    coalesce(sum(m.cantidad) filter (where m.fecha >= p_desde and m.tipo in ('conteo', 'ajuste', 'inicial')), 0),
    coalesce(sum(m.cantidad), 0),
    i.costo_fisico_neto
  from insumos i
  left join movimientos_inventario m on m.insumo_id = i.id and m.owner_id = i.owner_id
  where i.owner_id = auth.uid() and i.activo
  group by i.id;
$$;

-- Guarda el inventario: encabezado + líneas + ajuste por conteo de cada diferencia (una transacción).
create or replace function guardar_inventario(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_linea jsonb;
  v_dif numeric;
  v_valor numeric := 0;
  v_mermas numeric := 0;
begin
  insert into inventarios (fecha, desde, notas)
  values ((payload->>'fecha')::date, nullif(payload->>'desde', '')::timestamptz, nullif(payload->>'notas', ''))
  returning id into v_id;

  for v_linea in select jsonb_array_elements(coalesce(payload->'lineas', '[]'::jsonb))
  loop
    v_dif := (v_linea->>'contado')::numeric - (v_linea->>'sistema')::numeric;
    insert into inventario_lineas (inventario_id, insumo_id, inicial, compras, ventas, mermas, otros, sistema, contado, diferencia, costo_unitario)
    values (
      v_id, (v_linea->>'insumo_id')::uuid,
      coalesce((v_linea->>'inicial')::numeric, 0), coalesce((v_linea->>'compras')::numeric, 0),
      coalesce((v_linea->>'ventas')::numeric, 0), coalesce((v_linea->>'mermas')::numeric, 0),
      coalesce((v_linea->>'otros')::numeric, 0),
      (v_linea->>'sistema')::numeric, (v_linea->>'contado')::numeric, v_dif,
      coalesce((v_linea->>'costo_unitario')::numeric, 0)
    );
    v_valor := v_valor + v_dif * coalesce((v_linea->>'costo_unitario')::numeric, 0);
    v_mermas := v_mermas + coalesce((v_linea->>'mermas')::numeric, 0) * coalesce((v_linea->>'costo_unitario')::numeric, 0);
    if v_dif <> 0 then
      insert into movimientos_inventario (insumo_id, cantidad, costo_unitario, tipo, origen_id, nota)
      values ((v_linea->>'insumo_id')::uuid, v_dif, coalesce((v_linea->>'costo_unitario')::numeric, 0), 'conteo', v_id,
              'Inventario semanal ' || (payload->>'fecha'));
      perform evaluar_alertas_insumo((v_linea->>'insumo_id')::uuid);
    end if;
  end loop;

  update inventarios set valor_diferencia = v_valor, valor_mermas = v_mermas where id = v_id;
  return v_id;
end;
$$;

-- Ajuste directo de existencia (corrección), con motivo; tipo 'ajuste' para distinguirlo de un conteo.
create or replace function ajustar_existencia(p_insumo_id uuid, p_nueva numeric, p_motivo text)
returns void
language plpgsql
security invoker
as $$
declare
  v_dif numeric := p_nueva - existencia_insumo(p_insumo_id);
begin
  if p_nueva is null or p_nueva < 0 then raise exception 'La existencia no puede ser negativa'; end if;
  if v_dif = 0 then return; end if;
  insert into movimientos_inventario (insumo_id, cantidad, costo_unitario, tipo, nota)
  select p_insumo_id, v_dif, costo_fisico_neto, 'ajuste', coalesce(nullif(trim(p_motivo), ''), 'Corrección de existencia')
  from insumos where id = p_insumo_id and owner_id = auth.uid();
  perform evaluar_alertas_insumo(p_insumo_id);
end;
$$;

commit;
