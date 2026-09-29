-- Complemento de 0003: la migración de catálogo v3 actualizó costos y precios pero no las dosis de
-- receta que cambian en la sección 4 de 4_prompt_claude_code_v3.md. Comparado contra
-- datos_bendita_v3.json, sólo difieren estas tres bebidas. Las ventas ya registradas guardan su
-- propia foto de costos, así que no se ven afectadas.
begin;

-- Taro Celestial y Chai Bendito: 30 g → 8.77 g base de 14 oz (10 g en 16 oz, 12.5 g en 20 oz).
update receta_lineas r set cantidad = 8.77
from bebidas b, insumos i
where r.bebida_id = b.id and r.insumo_id = i.id
  and r.owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2'
  and ((b.nombre = 'Taro Celestial' and i.clave = 'polvo_taro') or (b.nombre = 'Chai Bendito' and i.clave = 'polvo_chai'));

-- Matcha Divino (matcha puro): 30 g → 4 g, más 15 g de azúcar para endulzar el matcha.
update receta_lineas r set cantidad = 4
from bebidas b, insumos i
where r.bebida_id = b.id and r.insumo_id = i.id
  and r.owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2'
  and b.nombre = 'Matcha Divino' and i.clave = 'polvo_matcha';

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
select 'c79aeab6-ac16-47d9-a777-a25d739013f2',
  (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'),
  (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'azucar'),
  15, true, false
where not exists (
  select 1 from receta_lineas r
  join bebidas b on b.id = r.bebida_id join insumos i on i.id = r.insumo_id
  where r.owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2'
    and b.nombre = 'Matcha Divino' and i.clave = 'azucar' and r.cantidad = 15
);

-- Los cierres sintéticos de v2 ("Tapa 14/16/20 oz") los reemplazaron tapa + playo + película de
-- selladora. Ya nada los usa; se desactivan (no se borran) para que no salgan como "Agotado".
update insumos set activo = false
where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2'
  and clave in ('cierre_14_oz', 'cierre_16_oz', 'cierre_20_oz');

commit;
