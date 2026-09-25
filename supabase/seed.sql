-- Generado por scripts/seed-from-json.ts — no editar a mano, regenerar desde el JSON.

begin;

insert into parametros (owner_id, iva_venta, indirectos_por_bebida, merma_default, redondeo_precio, meta_utilidad_semanal, hora_mano_obra_fuera_turno, isr_tasa_efectiva_estimada, umbral_alta, umbral_media, umbral_baja, zona_horaria)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 0.16, 2, 0.05, 5, 6000, 50, 0.025, 0.3, 0.25, 0.2, 'America/Mexico_City');

insert into turnos (owner_id, nombre, dias, inicio, fin, hora_mano_obra, estimado)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Mañana entre semana', ARRAY[1,2,3,4,5], '06:00', '09:00', 60, true);

insert into turnos (owner_id, nombre, dias, inicio, fin, hora_mano_obra, estimado)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Tarde entre semana', ARRAY[1,2,3,4,5], '13:30', '16:30', 45, false);

insert into turnos (owner_id, nombre, dias, inicio, fin, hora_mano_obra, estimado)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Fin de semana', ARRAY[6,0], '06:00', '13:00', 55, false);

insert into canales (owner_id, nombre, tipo, color, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Uber Eats', 'plataforma', '#5E0B0A', 0);

insert into config_plataforma (owner_id, canal_id, comision_base, uber_one, uber_one_proporcion, marketing, iva_sobre_comision, retencion_isr, retencion_iva, frecuencia_deposito)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from canales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Uber Eats'), 0.29, 0.01, 0.5, 0, 0.16, 0.025, 0.08, 'semanal');

insert into canales (owner_id, nombre, tipo, color, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Rappi', 'plataforma', '#B07A3A', 1);

insert into config_plataforma (owner_id, canal_id, comision_base, uber_one, uber_one_proporcion, marketing, iva_sobre_comision, retencion_isr, retencion_iva, frecuencia_deposito)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from canales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Rappi'), 0.25, 0, 0, 0, 0.16, 0.025, 0.08, 'semanal');

insert into canales (owner_id, nombre, tipo, color, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Público en general', 'publico', '#6B4E2E', 2);

insert into config_publico (owner_id, canal_id, descuento_vs_app, envio_cobrado_default, costo_envio_default)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from canales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Público en general'), 0.15, 35, 0);

insert into canales (owner_id, nombre, tipo, color, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Evento', 'evento', '#44607A', 3);

insert into evento_escalas (owner_id, desde, hasta, factor, cargo_servicio)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 30, 59, 1, 600);

insert into evento_escalas (owner_id, desde, hasta, factor, cargo_servicio)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 60, 99, 0.95, 500);

insert into evento_escalas (owner_id, desde, hasta, factor, cargo_servicio)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 100, 149, 0.9, 400);

insert into evento_escalas (owner_id, desde, hasta, factor, cargo_servicio)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 150, 249, 0.85, 300);

insert into evento_escalas (owner_id, desde, hasta, factor, cargo_servicio)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 250, null, 0.8, 0);

insert into config_evento (owner_id, minimo_bebidas, traslado, equipo_hielo_desechables, horas_montaje)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 30, 400, 300, 3);

insert into proveedores (owner_id, nombre, contacto, notas)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Ziaba Gourmet', null, 'Tapioca, polvos. Tarjeta vía PayPal; envía a todo México');

insert into proveedores (owner_id, nombre, contacto, notas)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Café Etrusca', null, 'Catálogo 2026 (jarabes Chillout, tisanas)');

insert into proveedores (owner_id, nombre, contacto, notas)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Barra Pro', null, 'Base moka Chillout; acepta tarjetas');

insert into proveedores (owner_id, nombre, contacto, notas)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'COLDAY', null, 'Perlas explosivas');

insert into proveedores (owner_id, nombre, contacto, notas)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Walmart', null, 'Leches y crema');

insert into proveedores (owner_id, nombre, contacto, notas)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Abasto Vegano', null, 'Oatly Barista por caja');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'jarabe_maracuya', 'Jarabe agave maracuyá', 'jarabe', 'ml', 'Botella 1 L', 1000, 0.05, 0.16, 0.13922439999999997, 'media', 0.25, null, null, true, 'Nota 08/09/2026');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'jarabe_frambuesa', 'Jarabe agave frambuesa', 'jarabe', 'ml', 'Botella 1 L', 1000, 0.05, 0.16, 0.13922439999999997, 'media', 0.25, null, null, true, 'Nota 08/09/2026');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'perla_mango', 'Perla explosiva mango', 'perla', 'g', 'Bote 3 kg', 3000, 0.05, 0.16, 0.1149424, 'media', 0.25, null, null, true, 'Compra 08/09/2026; se usa sin escurrir, 30 g por bebida');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'perla_maracuya', 'Perla explosiva maracuyá', 'perla', 'g', 'Bote 1.25 kg', 1250, 0.05, 0.16, 0.08086875, 'media', 0.25, null, null, true, 'Compra 08/09/2026; se usa sin escurrir, 30 g por bebida');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'etiqueta', 'Etiqueta', 'empaque', 'pieza', '288 piezas', 288, 0, 0.16, 1.077586, 'media', 0.25, null, null, false, 'Sin nota de compra');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'popote', 'Popote ancho', 'empaque', 'pieza', 'Bolsa 1 kg', 100, 0, 0.16, 0.439655, 'media', 0.25, null, null, false, 'Ticket 65932 del 08/09/2026; cantidad sin confirmar — CONTAR');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'botella_mineral', 'Agua mineral individual', 'base', 'pieza', 'Botella 500 ml', 1, 0, 0.16, 6.034483, 'baja', 0.2, null, null, true, 'Tienda local 09/09/2026; la más barata');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'playo', 'Playo grado alimenticio', 'empaque', 'pieza', 'Rollo 500 m = 1,000 vasos', 1000, 0, 0.16, 0.215517, 'media', 0.25, null, null, false, 'Don Playo / genérico — CONFIRMAR. Un rollo industrial de 18 pulgadas cuesta $569 en Walmart pero es demasiado ancho');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'hielo', 'Hielo en cubo', 'base', 'g', 'Bolsa 5 kg', 5000, 0.25, 0, 0.006999749999999999, 'baja', 0.2, null, 2, false, 'Tienda de conveniencia');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'tapioca_seca', 'Tapioca seca', 'perla', 'g', 'Tea Zone 2.72 kg = 90 bebidas', 2720, 0.05, 0, 0.0863968, 'alta', 0.3, null, null, true, 'Ziaba Gourmet 16/09/2026. Catálogo Café Etrusca: 3 kg = 100 bebidas usando 30 g antes de cocción');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'azucar', 'Azúcar estándar (almíbar)', 'base', 'g', 'Bolsa 1 kg', 1000, 0.05, 0, 0.031999799999999995, 'baja', 0.2, null, null, false, 'Precio típico — CONFIRMAR');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'polvo_taro', 'Polvo taro premium', 'polvo', 'g', 'Bolsa 1 kg', 1000, 0.05, 0, 0.51499975, 'alta', 0.3, null, null, true, 'Ziaba Gourmet 16/09/2026');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'polvo_matcha', 'Polvo matcha', 'polvo', 'g', 'Bolsa 1 kg', 1000, 0.05, 0, 0.48499970000000003, 'alta', 0.3, null, null, true, 'Ziaba Gourmet 16/09/2026');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'polvo_chai', 'Polvo chai', 'polvo', 'g', 'Bolsa 700 g', 700, 0.05, 0, 0.44114295, 'alta', 0.3, null, null, true, 'Precio encontrado por Pablo 16/09/2026 — $441/kg');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'te_negro', 'Té negro a granel', 'te', 'g', 'Bolsa 1 kg = 190 bebidas', 1000, 0.05, 0, 0.40000035, 'media', 0.25, null, null, false, 'Assam/Ceylon comercial — CONFIRMAR con Ziaba o Café Etrusca. El de especialidad (Soy Té) cuesta $1,350/kg y no lo necesitas. Alternativa sin preparar: polvo all-in-one de COLDAY, $368 por 1.5 kg');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'leche', 'Leche entera', 'lacteo', 'ml', 'Alpura Selecta 1 L', 1000, 0.05, 0, 0.03600025, 'alta', 0.3, null, 5, true, 'Walmart 16/09/2026');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'leche_desl', 'Leche deslactosada', 'lacteo', 'ml', 'Alpura Deslactosada 1 L', 1000, 0.05, 0, 0.0310004, 'media', 0.25, null, 5, true, 'Walmart 16/09/2026 — sale más barata que la entera');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'avena_oatly', 'Bebida de avena barista', 'lacteo', 'ml', 'Oatly Barista 1 L (caja de 6)', 1000, 0.05, 0.16, 0.04827615, 'media', 0.25, null, 7, true, 'Abasto Vegano mayoreo 16/09/2026 — caja de 6 pz $336');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'cafe_molido', 'Café molido para cold brew', 'cafe', 'g', 'Bolsa 1 kg = 50 bebidas', 1000, 0.05, 0, 0.29999954999999995, 'alta', 0.3, null, null, false, 'Objetivo de Pablo. XicoCafé (sierra de Puebla) publica 1 kg en $329; el orgánico de Chiapas al mayoreo está en $360/kg pero pide 5 kg');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'crema_batir', 'Crema para batir', 'lacteo', 'ml', 'Lyncott 980 ml', 980, 0.05, 0, 0.11224535, 'media', 0.25, null, 5, true, 'Walmart 16/09/2026');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'jarabe_vainilla', 'Jarabe de vainilla', 'jarabe', 'ml', 'Chillout agave azul 1 L', 1000, 0.05, 0.16, 0.14655175, 'media', 0.25, null, null, false, 'Catálogo Café Etrusca IJA-151, misma línea de agave que los tuyos ($161.50) — CONFIRMAR precio. Monin cuesta $279/750 ml');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'base_moka', 'Base en polvo moka', 'polvo', 'g', 'Chillout 2 kg = 40 bebidas', 2000, 0.05, 0, 0.31450035, 'alta', 0.3, null, null, true, 'Barra Pro 17/09/2026 — Chillout IBP-201. El moka blanco cuesta $659');

insert into insumos (owner_id, clave, nombre, categoria, unidad, presentacion, contenido_util, merma, iva, costo_fisico_neto, prioridad, umbral_reorden, stock_objetivo, caduca_abierto_dias, verificado, fuente)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'tisana_frutos', 'Tisana frutos rojos', 'te', 'g', 'Chillout 250 g = 25 bebidas', 250, 0.05, 0, 0.7200002499999999, 'media', 0.25, null, null, false, 'Catálogo Café Etrusca ITI-104, 10 g por bebida — CONFIRMAR precio');

insert into insumos (owner_id, clave, nombre, categoria, unidad, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado, stock_objetivo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'vaso_14_oz', 'Vaso 14 oz', 'empaque', 'pieza', 1, 0, 0.16, 1.6379310344827587, 'alta', true, 70);

insert into insumos (owner_id, clave, nombre, categoria, unidad, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'cierre_14_oz', 'Tapa 14 oz', 'empaque', 'pieza', 1, 0, 0.16, 0.9482758620689656, 'alta', true);

insert into movimientos_inventario (owner_id, insumo_id, cantidad, tipo, nota)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'vaso_14_oz'), 70, 'inicial', 'Existencia inicial del catálogo');

insert into insumos (owner_id, clave, nombre, categoria, unidad, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado, stock_objetivo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'vaso_16_oz', 'Vaso 16 oz', 'empaque', 'pieza', 1, 0, 0.16, 1.6896551724137931, 'alta', true, null);

insert into insumos (owner_id, clave, nombre, categoria, unidad, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'cierre_16_oz', 'Tapa 16 oz', 'empaque', 'pieza', 1, 0, 0.16, 0.9482758620689656, 'alta', true);

insert into insumos (owner_id, clave, nombre, categoria, unidad, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado, stock_objetivo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'vaso_20_oz', 'Vaso 20 oz', 'empaque', 'pieza', 1, 0, 0.16, 2.0689655172413794, 'alta', true, null);

insert into insumos (owner_id, clave, nombre, categoria, unidad, contenido_util, merma, iva, costo_fisico_neto, prioridad, verificado)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'cierre_20_oz', 'Tapa 20 oz', 'empaque', 'pieza', 1, 0, 0.16, 0.9482758620689656, 'alta', true);

insert into categorias (owner_id, nombre, minutos_preparacion, utilidad_objetivo, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Soda italiana', 3, 13.25, 0);

insert into categorias (owner_id, nombre, minutos_preparacion, utilidad_objetivo, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Bubble tea', 4, 17.5, 1);

insert into categorias (owner_id, nombre, minutos_preparacion, utilidad_objetivo, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Café frío', 2, 17.5, 2);

insert into categorias (owner_id, nombre, minutos_preparacion, utilidad_objetivo, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Frutal', 3, 17.5, 3);

insert into tamanos (owner_id, nombre, ml, factor_escala, insumo_vaso_id, insumo_cierre_id, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', '14 oz', 414, 1,
  (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'vaso_14_oz'),
  (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'cierre_14_oz'), true);

insert into tamanos (owner_id, nombre, ml, factor_escala, insumo_vaso_id, insumo_cierre_id, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', '16 oz', 473, 1.14,
  (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'vaso_16_oz'),
  (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'cierre_16_oz'), true);

insert into tamanos (owner_id, nombre, ml, factor_escala, insumo_vaso_id, insumo_cierre_id, activo)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', '20 oz', 591, 1.43,
  (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'vaso_20_oz'),
  (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'cierre_20_oz'), true);

insert into leches (owner_id, nombre, insumo_id, sobreprecio, es_default)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Entera', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 0, true);

insert into leches (owner_id, nombre, insumo_id, sobreprecio, es_default)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Deslactosada', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche_desl'), 0, false);

insert into leches (owner_id, nombre, insumo_id, sobreprecio, es_default)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Avena Oatly', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'avena_oatly'), 15, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Pecado Tropical', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'), 'Frambuesa burbujeante con perlas de mango que revientan a cada trago. Dulce, frutal y bien fría.', false, true, 0);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_frambuesa'), 25, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_mango'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 100, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'botella_mineral'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), 0, '30 g de perlas de mango al fondo, con su almíbar');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), 1, '2 bombeos y medio de jarabe de frambuesa');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), 2, 'Hielo hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), 3, 'Tapa, etiqueta y popote');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), 4, 'La botella de agua mineral va aparte, sin abrir');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 55, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 75, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pecado Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Pasión Prohibida', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'), 'Frambuesa con perlas de maracuyá. Dulce arriba, ácido al morder. La que más se antoja en calor.', false, true, 1);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_frambuesa'), 25, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_maracuya'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 100, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'botella_mineral'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), 0, '30 g de perlas de maracuyá al fondo, con su almíbar');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), 1, '2 bombeos y medio de jarabe de frambuesa');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), 2, 'Hielo hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), 3, 'Tapa, etiqueta y popote');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), 4, 'La botella de agua mineral va aparte, sin abrir');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Pasión Prohibida'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 60, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Milagro Tropical', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'), 'Maracuyá con perlas de mango. Tropical y equilibrada, la más fácil de tomar del menú.', false, true, 2);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_maracuya'), 25, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_mango'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 100, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'botella_mineral'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), 0, '30 g de perlas de mango al fondo, con su almíbar');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), 1, '2 bombeos y medio de jarabe de maracuyá');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), 2, 'Hielo hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), 3, 'Tapa, etiqueta y popote');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), 4, 'La botella de agua mineral va aparte, sin abrir');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 55, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 75, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Milagro Tropical'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Amén de Maracuyá', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'), 'Maracuyá en el jarabe y en la perla. La más intensa y la más ácida. Para quien le gusta fuerte.', false, true, 3);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_maracuya'), 25, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_maracuya'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 100, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'botella_mineral'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), 0, '30 g de perlas de maracuyá al fondo, con su almíbar');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), 1, '2 bombeos y medio de jarabe de maracuyá');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), 2, 'Hielo hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), 3, 'Tapa, etiqueta y popote');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), 4, 'La botella de agua mineral va aparte, sin abrir');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Amén de Maracuyá'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 60, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Confesión de Sabores', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'), 'Tú la armas: eliges dos jarabes y la perla que quieras. Cada una sale distinta y ninguna se repite.', false, true, 4);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_maracuya'), 12, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_frambuesa'), 13, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_mango'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 100, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'botella_mineral'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), 0, 'La perla que haya elegido, 30 g al fondo');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), 1, 'Bombeo y medio del jarabe principal');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), 2, '1 bombeo del segundo jarabe');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), 3, 'Hielo hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), 4, 'Tapa, etiqueta, popote y botella aparte');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 55, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 75, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Confesión de Sabores'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 65, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Taro Celestial', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'), 'Taro con leche y tapioca. Morado pálido, cremoso, entre nuez y vainilla. El clásico que todos piden.', true, true, 5);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'polvo_taro'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 180, true, true);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 90, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tapioca_seca'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'azucar'), 12, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), 0, 'Tapioca ya cocida y en almíbar, 30 g secos por bebida');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), 1, 'Disuelve el polvo de taro en un poco de leche tibia');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), 2, 'Agrega el resto de la leche y bate hasta que no queden grumos');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), 3, 'Tapioca al fondo del vaso, luego el hielo');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), 4, 'Vacía la mezcla encima. Tapa, etiqueta y popote ancho');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 95, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 80, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 100, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 85, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 115, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Taro Celestial'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 100, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Matcha Divino', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'), 'Matcha con leche y tapioca. Verde, cremoso y con ese amargor rico que lo hace distinto a todo.', true, true, 6);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'polvo_matcha'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 180, true, true);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 90, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tapioca_seca'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'azucar'), 12, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), 0, 'Tapioca ya cocida y en almíbar, 30 g secos por bebida');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), 1, 'Disuelve el matcha en un poco de leche tibia');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), 2, 'Agrega el resto de la leche y bate bien');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), 3, 'Tapioca al fondo del vaso, luego el hielo');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), 4, 'Vacía la mezcla encima. Tapa, etiqueta y popote ancho');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 95, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 80, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 100, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 85, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 115, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Matcha Divino'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 100, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Bendita Original', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'), 'Té negro, leche y tapioca. La receta original de Taiwán, sin polvos ni sabores. Es la que mide si una bubble tea está bien hecha.', true, true, 7);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'te_negro'), 5, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 180, true, true);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'azucar'), 8, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 90, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tapioca_seca'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'azucar'), 12, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), 0, 'Concentrado de té negro de la jarra, bien frío');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), 1, 'Tapioca ya cocida y en almíbar, 30 g secos por bebida');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), 2, 'Tapioca al fondo del vaso, luego el hielo');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), 3, 'Vacía el té y encima la leche, despacio, para que se vea la veta');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), 4, 'Tapa, etiqueta y popote ancho');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 75, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 80, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bendita Original'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 70, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Chai Bendito', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'), 'Chai con leche y tapioca. Canela, cardamomo y jengibre. Sabe a temporada fría todo el año.', true, true, 8);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'polvo_chai'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 180, true, true);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 90, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tapioca_seca'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'azucar'), 12, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), 0, 'Tapioca ya cocida y en almíbar, 30 g secos por bebida');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), 1, 'Disuelve el polvo de chai en un poco de leche tibia');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), 2, 'Agrega el resto de la leche y bate bien');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), 3, 'Tapioca al fondo del vaso, luego el hielo');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), 4, 'Vacía la mezcla encima. Tapa, etiqueta y popote ancho');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 90, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 75, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 95, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 80, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 110, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Chai Bendito'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 95, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Penitencia Fría', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío'), 'Café reposado 16 horas en frío. Negro, sin azúcar y sin perlas. Amargo del bueno, del que no pica. Para los que ya no negocian.', false, true, 9);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'cafe_molido'), 20, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 120, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), 0, 'Cold brew de la tanda de anoche, bien frío');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), 1, 'Hielo hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), 2, 'Llena con el cold brew');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), 3, 'Tapa, etiqueta y popote');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), 4, 'Si lo piden con leche, deja 60 ml de espacio');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 50, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 55, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Penitencia Fría'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 60, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Gloria de Vainilla', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío'), 'Cold brew con una nube de vainilla encima. Baja despacio, se mezcla sola y cambia de sabor a media bebida. Sin perlas.', true, true, 10);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'cafe_molido'), 20, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 110, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 45, true, true);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'crema_batir'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_vainilla'), 15, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), 0, 'Bate leche, crema y jarabe de vainilla hasta que espese');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), 1, 'Hielo en el vaso hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), 2, 'Llena con cold brew dejando 3 cm libres');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), 3, 'Vacía la espuma encima, despacio, para que quede en capa');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), 4, 'Tapa, etiqueta y popote. No revolver');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 75, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 85, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 70, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Tentación de Cacao', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío'), 'Cold brew con chocolate y leche. Dulce sin empalagar. Es el café para el que jura que no le gusta el café.', true, true, 11);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'cafe_molido'), 18, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'base_moka'), 35, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 120, true, true);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 95, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), 0, 'Disuelve la base de moka en un poco de leche tibia');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), 1, 'Agrega el resto de la leche y bate bien');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), 2, 'Hielo en el vaso hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), 3, 'Vacía primero el cold brew, luego la mezcla de moka');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), 4, 'Tapa, etiqueta y popote');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 85, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 90, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 75, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 100, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tentación de Cacao'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 85, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Alma Blanca', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío'), 'Cold brew que en vez de agua se infusiona en leche, 16 horas en frío. Sale sedoso, dulce de por sí y sin nada de filo. El café para quien le tiene miedo al café.', true, true, 12);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'cafe_molido'), 25, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 270, true, true);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 95, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), 0, 'Tanda aparte: 25 g de café por cada 270 ml de leche, 16 h en refri');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), 1, 'El poso se chupa como 50 ml de leche — por eso se infusiona de más');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), 2, 'Cuela con filtro fino o manta; NUNCA exprimas el poso');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), 3, 'Hielo en el vaso hasta la marca y llena con el cold milk');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), 4, 'Tapa, etiqueta y popote');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), 5, 'OJO: esta tanda dura 48 h en refri, no 4 días como la de agua');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 80, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 85, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 95, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Alma Blanca'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 80, false);

insert into bebidas (owner_id, nombre, categoria_id, descripcion, lleva_leche, activa, orden)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Frutos Rojos', (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutal'), 'Té de frutos rojos con perlas explosivas. Ácido, ligero y sin leche. El más vendido de la categoría.', false, true, 13);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tisana_frutos'), 12, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_maracuya'), 30, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'hielo'), 95, true, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'popote'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'etiqueta'), 1, false, false);

insert into receta_lineas (owner_id, bebida_id, insumo_id, cantidad, escala_con_tamano, es_leche)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'playo'), 1, false, false);

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), 0, '30 g de perlas explosivas al fondo, con su almíbar');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), 1, 'Hielo hasta la marca');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), 2, 'Llena con la tisana de frutos rojos bien fría');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), 3, 'Tapa, etiqueta y popote ancho');

insert into receta_pasos (owner_id, bebida_id, orden, texto)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), 4, 'Se prepara en jarra, no vaso por vaso');

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'app', 70, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '14 oz'), 'publico', 60, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'app', 75, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '16 oz'), 'publico', 65, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'app', 80, false);

insert into precios (owner_id, bebida_id, tamano_id, canal_tipo, precio, manual)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutos Rojos'), (select id from tamanos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = '20 oz'), 'publico', 70, false);

insert into adicionales (owner_id, nombre, precio, minutos)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Tapioca extra', 15, 0.2);

insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tapioca extra'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'tapioca_seca'), 30, false, false);

insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tapioca extra'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'azucar'), 12, false, false);

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Tapioca extra'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'));

insert into adicionales (owner_id, nombre, precio, minutos)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Perlas explosivas extra', 20, 0.2);

insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Perlas explosivas extra'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_mango'), 30, false, true);

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Perlas explosivas extra'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'));

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Perlas explosivas extra'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutal'));

insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Perlas explosivas extra'), null, 'Mango', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_mango'));

insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Perlas explosivas extra'), null, 'Maracuyá', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'perla_maracuya'));

insert into adicionales (owner_id, nombre, precio, minutos)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Shot de jarabe', 10, 0.1);

insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_maracuya'), 15, false, true);

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'));

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutal'));

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío'));

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'));

insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'), 'Maracuyá', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_maracuya'));

insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Soda italiana'), 'Frambuesa', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_frambuesa'));

insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutal'), 'Maracuyá', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_maracuya'));

insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Frutal'), 'Frambuesa', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_frambuesa'));

insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío'), 'Vainilla', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_vainilla'));

insert into adicional_sabores (owner_id, adicional_id, categoria_id, sabor, insumo_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Shot de jarabe'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'), 'Vainilla', (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_vainilla'));

insert into adicionales (owner_id, nombre, precio, minutos)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Espuma de vainilla', 20, 1);

insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Espuma de vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'leche'), 45, true, false);

insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Espuma de vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'crema_batir'), 30, false, false);

insert into adicional_lineas (owner_id, adicional_id, insumo_id, cantidad, es_leche, cambia_por_sabor)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Espuma de vainilla'), (select id from insumos where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and clave = 'jarabe_vainilla'), 15, false, false);

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Espuma de vainilla'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío'));

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Espuma de vainilla'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'));

insert into adicional_exclusiones (owner_id, adicional_id, bebida_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Espuma de vainilla'), (select id from bebidas where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Gloria de Vainilla'));

insert into adicionales (owner_id, nombre, precio, minutos)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Versión frappé', 10, 2);

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Versión frappé'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Bubble tea'));

insert into adicional_categorias (owner_id, adicional_id, categoria_id)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', (select id from adicionales where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Versión frappé'), (select id from categorias where owner_id = 'c79aeab6-ac16-47d9-a777-a25d739013f2' and nombre = 'Café frío'));

insert into botanas (owner_id, nombre, descripcion, precio_app, precio_publico, activa)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Plátano Deshidratado', 'Plátano en rodajas, secado despacio y sin freír. Dulce natural, nada más. Crujiente y sin conservadores.', 50, 45, true);

insert into botanas (owner_id, nombre, descripcion, precio_app, precio_publico, activa)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Malanga Natural', 'Malanga en hojuelas delgadas. Más suave que la papa y con sabor a tierra buena. Con sal y ya.', 50, 45, true);

insert into activos (owner_id, nombre, tipo, costo_neto, iva_acreditable, fecha_alta, vida_util_meses, valor_rescate, verificado, notas)
values ('c79aeab6-ac16-47d9-a777-a25d739013f2', 'Dosificadores de 10 ml (2) y cuchara de bar', 'equipo', 237.8, 0, '2026-09-08', 12, 0, true, 'Nota de compra 08/09/2026');

commit;
