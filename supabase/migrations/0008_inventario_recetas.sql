-- Ola 4 (auditoría 29/09): costo de reposición, proveedor por insumo, mermas con motivo, edición de
-- recetas y pasos, y último precio de compra. No toca ventas registradas (su costo es una foto).
begin;
select set_config('request.jwt.claims', json_build_object('sub', 'c79aeab6-ac16-47d9-a777-a25d739013f2', 'role', 'authenticated')::text, true);

-- ── Costo de reposición (v3 §2) ─────────────────────────────────────────
-- Costo físico neto por unidad (sin IVA) si se compra con el proveedor recomendado.
alter table insumos add column if not exists costo_reposicion numeric null;
alter table insumos add column if not exists proveedor_reposicion text null;

-- Tapioca: Tea Zone 2.72 kg en $235 (sin IVA en el ticket) = $0.0864/g contra $0.1983/g del pack de ML.
update insumos set costo_reposicion = 235.0 / 2720, proveedor_reposicion = 'Ziaba Gourmet (Tea Zone) · 2.72 kg en $235'
where owner_id = auth.uid() and clave = 'tapioca_seca' and costo_reposicion is null;

-- ── Proveedor por insumo (N5) ───────────────────────────────────────────
-- El JSON no trae el proveedor de cada insumo; se deduce de las notas de cada proveedor. Sólo llena
-- los que están vacíos: lo que se asigne después en la ficha del insumo manda.
update insumos i set proveedor_id = p.id
from proveedores p
where i.owner_id = auth.uid() and p.owner_id = auth.uid() and i.proveedor_id is null
  and (
    (p.nombre = 'Ziaba Gourmet' and i.clave in ('tapioca_seca', 'polvo_taro', 'polvo_chai', 'polvo_matcha'))
    or (p.nombre = 'Café Etrusca' and i.clave in ('jarabe_frambuesa', 'jarabe_maracuya', 'jarabe_vainilla', 'tisana_frutos'))
    or (p.nombre = 'Barra Pro' and i.clave = 'base_moka')
    or (p.nombre = 'COLDAY' and i.clave in ('perla_mango', 'perla_maracuya'))
    or (p.nombre = 'Walmart' and i.clave in ('leche', 'leche_desl', 'crema_batir'))
    or (p.nombre = 'Abasto Vegano' and i.clave = 'avena_oatly')
  );

-- ── Último precio de compra por insumo (lista de compras y precarga de Compras) ──
create or replace view ultima_compra_insumo
with (security_invoker = true)
as
select distinct on (cl.insumo_id)
  cl.insumo_id, c.fecha, c.proveedor_id, cl.presentaciones, cl.contenido_util_por_presentacion, cl.precio_por_presentacion, cl.iva
from compra_lineas cl
join compras c on c.id = cl.compra_id
order by cl.insumo_id, c.fecha desc, c.creado_en desc;
grant select on ultima_compra_insumo to authenticated;

-- ── Mermas con motivo (idea 7) ──────────────────────────────────────────
create or replace function registrar_merma(p_insumo_id uuid, p_cantidad numeric, p_motivo text)
returns void
language plpgsql
security invoker
as $$
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La merma debe ser mayor a 0';
  end if;
  if not exists (select 1 from insumos where id = p_insumo_id and owner_id = auth.uid()) then
    raise exception 'Insumo no encontrado';
  end if;
  insert into movimientos_inventario (insumo_id, cantidad, costo_unitario, tipo, nota)
  select p_insumo_id, -p_cantidad, costo_fisico_neto, 'merma', coalesce(nullif(trim(p_motivo), ''), 'Merma')
  from insumos where id = p_insumo_id;
  perform evaluar_alertas_insumo(p_insumo_id);
end;
$$;

-- ── Editar receta (R1): reemplaza las líneas de una bebida en una transacción ──
-- Las ventas ya guardadas no cambian: su costo es la foto del momento (regla 1).
create or replace function guardar_receta(p_bebida_id uuid, p_lineas jsonb)
returns void
language plpgsql
security invoker
as $$
declare
  v_linea jsonb;
begin
  if not exists (select 1 from bebidas where id = p_bebida_id and owner_id = auth.uid()) then
    raise exception 'Bebida no encontrada';
  end if;
  if jsonb_array_length(coalesce(p_lineas, '[]'::jsonb)) = 0 then
    raise exception 'La receta no puede quedar vacía';
  end if;
  delete from receta_lineas where bebida_id = p_bebida_id and owner_id = auth.uid();
  for v_linea in select jsonb_array_elements(p_lineas)
  loop
    if (v_linea->>'cantidad')::numeric <= 0 then
      raise exception 'Cada cantidad debe ser mayor a 0';
    end if;
    insert into receta_lineas (bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
    values (
      p_bebida_id,
      (v_linea->>'insumo_id')::uuid,
      (v_linea->>'cantidad')::numeric,
      coalesce((v_linea->>'escala_con_tamano')::boolean, false),
      coalesce((v_linea->>'es_leche')::boolean, false)
    );
  end loop;
end;
$$;

-- ── Pasos de preparación (R2) ───────────────────────────────────────────
create or replace function guardar_pasos(p_bebida_id uuid, p_pasos jsonb)
returns void
language plpgsql
security invoker
as $$
declare
  v_texto text;
  v_orden int := 0;
begin
  if not exists (select 1 from bebidas where id = p_bebida_id and owner_id = auth.uid()) then
    raise exception 'Bebida no encontrada';
  end if;
  delete from receta_pasos where bebida_id = p_bebida_id and owner_id = auth.uid();
  for v_texto in select jsonb_array_elements_text(coalesce(p_pasos, '[]'::jsonb))
  loop
    if nullif(trim(v_texto), '') is not null then
      v_orden := v_orden + 1;
      insert into receta_pasos (bebida_id, orden, texto) values (p_bebida_id, v_orden, trim(v_texto));
    end if;
  end loop;
end;
$$;

commit;
