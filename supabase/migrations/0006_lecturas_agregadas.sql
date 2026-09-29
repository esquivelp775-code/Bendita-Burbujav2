-- Lecturas agregadas: la app ya no baja el kárdex ni el historial de precios completos.
-- PostgREST entrega como máximo 1,000 filas por consulta; con ~9 movimientos por bebida, sumar
-- existencias en el cliente se habría truncado en silencio alrededor de la venta 110.
-- Ambas vistas son security_invoker: respetan el RLS (owner_id = auth.uid()) de quien consulta.
begin;

-- Una fila por insumo: existencia (suma del kárdex), objetivo efectivo (manual o automático por
-- compras de los últimos 60 días, ver stock_objetivo_insumo) y consumo de ventas de 14 días.
create or replace view existencias_insumo
with (security_invoker = true)
as
select
  i.id as insumo_id,
  coalesce(sum(m.cantidad), 0) as existencia,
  stock_objetivo_insumo(i.id) as stock_objetivo_efectivo,
  coalesce(-sum(m.cantidad) filter (where m.tipo = 'venta' and m.fecha >= now() - interval '14 days'), 0)
    + coalesce(-sum(m.cantidad) filter (where m.tipo = 'cancelacion' and m.fecha >= now() - interval '14 days'), 0)
    as consumo_14d
from insumos i
left join movimientos_inventario m on m.insumo_id = i.id and m.owner_id = i.owner_id
group by i.id;

-- El precio vigente por bebida × tamaño × canal: el más reciente que ya aplica. El historial se queda
-- en `precios`; un precio con vigencia futura entra solo cuando llega su fecha.
create or replace view precios_vigentes
with (security_invoker = true)
as
select distinct on (bebida_id, tamano_id, canal_tipo)
  bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde
from precios
where vigente_desde <= now()
order by bebida_id, tamano_id, canal_tipo, vigente_desde desc;

grant select on existencias_insumo to authenticated;
grant select on precios_vigentes to authenticated;

create index if not exists pedidos_fecha_idx on pedidos (owner_id, fecha_hora);
create index if not exists movimientos_origen_idx on movimientos_inventario (owner_id, origen_id);

commit;
