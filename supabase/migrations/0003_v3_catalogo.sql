-- Generado por scripts/seed-v3-from-json.ts — no editar a mano, regenerar desde datos_bendita_v3.json.

-- Migración de catálogo v3: selladora, cierre por tamaño, canales por tamaño/adicional, insumos y precios nuevos.

begin;

select set_config('request.jwt.claims', json_build_object('sub', 'c79aeab6-ac16-47d9-a777-a25d739013f2')::text, true);

alter table tamanos add column if not exists canales text[];

alter table tamanos add column if not exists insumo_cierre_ids uuid[];

alter table adicionales add column if not exists canales text[];

update parametros set indirectos_por_bebida = 2.6 where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2';

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'leche', 'Leche entera', 'lacteo', 'ml', 'Leche entera 1 L', 1000, 0.05, 0, 0.03000005, 'alta', 0.3, null, 5, true, 'Precio de Pablo 26/09/2026', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'leche_desl', 'Leche deslactosada', 'lacteo', 'ml', 'Leche deslactosada 1 L', 1000, 0.05, 0, 0.03000005, 'media', 0.25, null, 5, true, 'Precio de Pablo 26/09/2026', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'avena_oatly', 'Bebida de avena barista', 'lacteo', 'ml', 'Oatly Barista 1 L', 1000, 0.05, 0.16, 0.053447949999999994, 'media', 0.25, null, 7, true, 'Precio de Pablo 26/09/2026 (pieza suelta)', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'polvo_matcha', 'Matcha puro', 'polvo', 'g', 'Bolsa 100 g', 100, 0.05, 0, 2.24000025, 'alta', 0.3, null, null, true, 'Compra de Pablo 26/09/2026 (2 bolsas)', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'polvo_taro', 'Polvo taro premium', 'polvo', 'g', 'Bolsa 250 g (pack de prueba ML)', 250, 0.05, 0, 0.9599997, 'alta', 0.3, null, null, false, 'Pack ML $839 (taro+chai+base frappé 250 g c/u + tapioca 600 g), repartido $240 por polvo y $119 la tapioca — ESTIMADO', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'polvo_chai', 'Polvo chai', 'polvo', 'g', 'Bolsa 250 g (pack de prueba ML)', 250, 0.05, 0, 0.9599997, 'alta', 0.3, null, null, false, 'Pack ML $839 (taro+chai+base frappé 250 g c/u + tapioca 600 g), repartido $240 por polvo y $119 la tapioca — ESTIMADO', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'tapioca_seca', 'Tapioca seca', 'perla', 'g', 'Bolsa 600 g (pack de prueba ML)', 600, 0.05, 0, 0.1983334, 'alta', 0.3, null, null, false, 'Pack ML $839 (taro+chai+base frappé 250 g c/u + tapioca 600 g), repartido $240 por polvo y $119 la tapioca — ESTIMADO', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'base_frappe', 'Base para frappé', 'polvo', 'g', 'Bolsa 250 g', 250, 0.05, 0, 1.0760004, 'media', 0.25, null, null, true, 'Compra de Pablo 26/09/2026', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'pelicula_sello', 'Película para selladora', 'empaque', 'pieza', 'Rollo 2,500-3,000 sellos', 2500, 0, 0.16, 0.135307, 'alta', 0.3, null, null, true, 'Compra de Pablo 26/09/2026; se usan 2,500 para ir a la segura', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'charola_4', 'Charola portavasos 4 bebidas', 'empaque', 'pieza', 'Paquete 30 pz', 30, 0, 0.16, 1.960057, 'media', 0.25, null, null, true, 'Compra de Pablo 26/09/2026', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'tapa', 'Tapa vaso', 'empaque', 'pieza', 'Paquete', 1, 0, 0.16, 0.948276, 'alta', 0.3, null, null, true, 'Ver 4_prompt_claude_code_v3.md', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'playo', 'Playo grado alimenticio', 'empaque', 'pieza', 'Rollo 500 m = 1,000 vasos', 1000, 0, 0.16, 0.215517, 'media', 0.25, null, null, false, 'Don Playo / genérico — CONFIRMAR. Un rollo industrial de 18 pulgadas cuesta $569 en Walmart pero es demasiado ancho', true)
on conflict (owner_id, clave) do update set
  costo_fisico_neto = excluded.costo_fisico_neto,
  verificado = excluded.verificado,
  fuente = excluded.fuente,
  activo = true;

update insumos set costo_fisico_neto = 1.6698275862068968 where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'vaso_16_oz';

update insumos set costo_fisico_neto = 2.134827586206897 where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'vaso_20_oz';

delete from receta_lineas
where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2'
  and insumo_id = (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo');

update tamanos set
  canales = ARRAY['Evento']::text[],
  insumo_cierre_ids = ARRAY[(select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tapa'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo')]::uuid[]
where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz';

update tamanos set
  canales = ARRAY['Uber Eats', 'Rappi', 'Público en general', 'Evento']::text[],
  insumo_cierre_ids = ARRAY[(select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tapa'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo')]::uuid[]
where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz';

update tamanos set
  canales = ARRAY['Uber Eats', 'Rappi', 'Público en general', 'Evento']::text[],
  insumo_cierre_ids = ARRAY[(select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'pelicula_sello')]::uuid[]
where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz';

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 80, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 90, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 105, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 90, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 85, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 90, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 105, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 90, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 85, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 80, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 90, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 105, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 90, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 55, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 45, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 50, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 90, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 85, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 90, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 110, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 95, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 75, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 80, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 95, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 80, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 65, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 55, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 70, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 60, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 85, true);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 70, true);

insert into adicionales (owner_id, nombre, precio, minutos, canales)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Versión frappé', 25, 2, ARRAY['Público en general', 'Evento']::text[])
on conflict (owner_id, nombre) do update set precio = excluded.precio, minutos = excluded.minutos, canales = excluded.canales;

insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
select 'c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Versión frappé'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'base_frappe'), 14, false, false
where not exists (
  select 1 from adicional_lineas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and adicional_id = (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Versión frappé') and insumo_id = (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'base_frappe')
);

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
select 'c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Versión frappé'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea')
where not exists (
  select 1 from adicional_categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and adicional_id = (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Versión frappé') and categoria_id = (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea')
);

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
select 'c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Versión frappé'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío')
where not exists (
  select 1 from adicional_categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and adicional_id = (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Versión frappé') and categoria_id = (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío')
);

insert into activos (owner_id, nombre, tipo, costo_neto, fecha_alta, vida_util_meses, valor_rescate, verificado, notas)
select 'c79aeab6-ac16-47d9-a777-a25d739013f2', 'Dosificadores de 10 ml (2) y cuchara de bar', 'equipo', 237.8, '2026-09-08', 12, 0, true, 'Nota de compra 08/09/2026'
where not exists (select 1 from activos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Dosificadores de 10 ml (2) y cuchara de bar');

insert into activos (owner_id, nombre, tipo, costo_neto, fecha_alta, vida_util_meses, valor_rescate, verificado, notas)
select 'c79aeab6-ac16-47d9-a777-a25d739013f2', 'Máquina selladora de vasos', 'equipo', 1550, '2026-09-26', 12, 0, true, 'Compra de Pablo 26/09/2026'
where not exists (select 1 from activos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Máquina selladora de vasos');

insert into activos (owner_id, nombre, tipo, costo_neto, fecha_alta, vida_util_meses, valor_rescate, verificado, notas)
select 'c79aeab6-ac16-47d9-a777-a25d739013f2', 'Juego de matcha (batidor, cuchara, bowl)', 'equipo', 396, '2026-09-26', 12, 0, true, 'Compra de Pablo 26/09/2026'
where not exists (select 1 from activos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Juego de matcha (batidor, cuchara, bowl)');

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'vaso_16_oz'),
    'presentaciones', 1,
    'contenido_util_por_presentacion', 50,
    'precio_por_presentacion', 96.85
  ))
));

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'vaso_20_oz'),
    'presentaciones', 1,
    'contenido_util_por_presentacion', 50,
    'precio_por_presentacion', 123.82
  ))
));

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'charola_4'),
    'presentaciones', 1,
    'contenido_util_por_presentacion', 30,
    'precio_por_presentacion', 68.21
  ))
));

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026 — Supuesto: $224 por bolsa',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'polvo_matcha'),
    'presentaciones', 2,
    'contenido_util_por_presentacion', 100,
    'precio_por_presentacion', 224
  ))
));

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'base_frappe'),
    'presentaciones', 1,
    'contenido_util_por_presentacion', 250,
    'precio_por_presentacion', 269
  ))
));

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'pelicula_sello'),
    'presentaciones', 1,
    'contenido_util_por_presentacion', 2500,
    'precio_por_presentacion', 392.39
  ))
));

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026 — Pack ML $839 repartido (estimado)',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'polvo_taro'),
    'presentaciones', 1,
    'contenido_util_por_presentacion', 250,
    'precio_por_presentacion', 240
  ))
));

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026 — Pack ML $839 repartido (estimado)',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'polvo_chai'),
    'presentaciones', 1,
    'contenido_util_por_presentacion', 250,
    'precio_por_presentacion', 240
  ))
));

select registrar_compra(jsonb_build_object(
  'notas', 'Compra 26/09/2026 — Pack ML $839 repartido (estimado)',
  'lineas', jsonb_build_array(jsonb_build_object(
    'insumo_id', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tapioca_seca'),
    'presentaciones', 1,
    'contenido_util_por_presentacion', 600,
    'precio_por_presentacion', 119
  ))
));

commit;
