-- Generado por scripts/seed-v31-from-json.ts — no editar a mano, regenerar desde datos_bendita_v3_1_delta.json.

-- v3.1: el 14 oz también se vende a Público, el vaso de 14 oz no se recompra, precios nuevos a Público y rango de margen.

begin;

alter table parametros add column if not exists margen_publico_min numeric not null default 0.27;

alter table parametros add column if not exists margen_publico_max numeric not null default 0.34;

alter table insumos add column if not exists recompra boolean not null default true;

update parametros set margen_publico_min = 0.27, margen_publico_max = 0.34
where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2';

update tamanos set canales = ARRAY['Público en general', 'Evento']::text[]
where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz';

update insumos set recompra = false
where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2'
  and id = (select insumo_vaso_id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 30, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 35, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 55, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 60, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 70, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 55, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 40, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 45, true, '2026-09-29 00:00:00-06');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual, vigente_desde)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 50, true, '2026-09-29 00:00:00-06');

commit;
