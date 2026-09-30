-- Ola 6 (auditoría 29/09): reportes por rango. Una sola llamada devuelve todo ya agregado (un jsonb),
-- así un año de ventas nunca choca con el límite de 1,000 filas de PostgREST. Días y horas en la
-- zona de Puebla (America/Mexico_City). Pedidos cancelados fuera.
begin;

create or replace function resumen_ventas(p_desde date, p_hasta date)
returns jsonb
language sql
security invoker
stable
as $$
  with p as (
    select p.*, (p.fecha_hora at time zone 'America/Mexico_City') as local, c.nombre as canal, c.tipo as canal_tipo
    from pedidos p
    join canales c on c.id = p.canal_id
    where p.owner_id = auth.uid()
      and p.estado <> 'cancelado'
      and (p.fecha_hora at time zone 'America/Mexico_City')::date between p_desde and p_hasta
  ),
  l as (
    select vl.*, p.local, p.canal, p.canal_tipo
    from venta_lineas vl
    join p on p.id = vl.pedido_id
  )
  select jsonb_build_object(
    'lineas', coalesce((
      select jsonb_agg(x) from (
        select l.local::date as dia, l.canal, l.canal_tipo, l.tipo,
               b.nombre as bebida, bo.nombre as botana, t.nombre as tamano,
               sum(l.cantidad) as unidades,
               sum(l.precio * l.cantidad) as venta,
               sum(l.iva_trasladado * l.cantidad) as iva,
               sum(l.comision * l.cantidad) as comision,
               sum(l.insumos * l.cantidad) as insumos,
               sum(l.empaque * l.cantidad) as empaque,
               sum(l.vaso_tapa * l.cantidad) as vaso_tapa,
               sum(l.indirectos * l.cantidad) as indirectos,
               sum(l.mano_obra * l.cantidad) as mano_obra,
               sum(l.utilidad * l.cantidad) as utilidad,
               sum(l.retencion_isr * l.cantidad) as retencion_isr,
               sum(l.retencion_iva * l.cantidad) as retencion_iva,
               sum(l.deposito_esperado * l.cantidad) as deposito_esperado
        from l
        left join bebidas b on b.id = l.bebida_id
        left join botanas bo on bo.id = l.botana_id
        left join tamanos t on t.id = l.tamano_id
        group by 1, 2, 3, 4, 5, 6, 7
      ) x
    ), '[]'::jsonb),
    'horas', coalesce((
      select jsonb_agg(x) from (
        select extract(dow from l.local)::int as dow, extract(hour from l.local)::int as hora,
               sum(l.cantidad) filter (where l.tipo = 'bebida') as bebidas,
               sum(l.precio * l.cantidad) as venta,
               sum(l.utilidad * l.cantidad) as utilidad
        from l
        group by 1, 2
      ) x
    ), '[]'::jsonb),
    'pedidos', coalesce((
      select jsonb_agg(x) from (
        select p.local::date as dia, p.canal, count(*) as pedidos,
               sum(p.envio_cobrado) as envio_cobrado, sum(p.costo_envio) as costo_envio
        from p
        group by 1, 2
      ) x
    ), '[]'::jsonb),
    'eventos', coalesce((
      select jsonb_agg(x) from (
        select e.fecha as dia, sum(e.traslado_real) as traslado, sum(e.equipo_real) as equipo, sum(e.horas_montaje) as horas
        from eventos e
        where e.owner_id = auth.uid() and e.estado in ('realizado', 'cobrado') and e.fecha between p_desde and p_hasta
        group by 1
      ) x
    ), '[]'::jsonb)
  );
$$;

grant execute on function resumen_ventas(date, date) to authenticated;

commit;
