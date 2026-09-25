-- Pruebas pgTAP para registrar_pedido / cancelar_pedido / registrar_compra.
-- PENDIENTES DE CORRER: esta máquina no tiene Docker, así que no hay Postgres local para ejecutarlas.
-- Correr con `supabase test db` (o `pg_prove`) contra el proyecto real antes de confiar en el RPC en producción.
-- Los montos vienen de datos_iniciales_bendita_1.json → pruebas_de_calculo, ya verificados al centavo
-- en src/lib/calculos.test.ts; aquí sólo se prueba que el RPC los guarda tal cual y que la transacción
-- y la idempotencia funcionan — no se repite el cálculo en SQL.

begin;
select plan(6);

-- Fixture mínimo: un canal de plataforma y una bebida con un insumo, para poder insertar un pedido.
insert into canales (id, nombre, tipo) values ('11111111-1111-1111-1111-111111111111', 'Uber Eats', 'plataforma');
insert into insumos (id, clave, nombre, categoria, unidad, contenido_util, merma, prioridad, costo_fisico_neto)
values ('22222222-2222-2222-2222-222222222222', 'leche', 'Leche entera', 'lacteo', 'ml', 1000, 0.05, 'alta', 0.036);
insert into categorias (id, nombre, minutos_preparacion, utilidad_objetivo) values ('33333333-3333-3333-3333-333333333333', 'Bubble tea', 4, 17.5);
insert into bebidas (id, nombre, categoria_id, lleva_leche) values ('44444444-4444-4444-4444-444444444444', 'Taro Celestial', '33333333-3333-3333-3333-333333333333', true);
insert into tamanos (id, nombre, ml, factor_escala, insumo_vaso_id, insumo_cierre_id)
values ('55555555-5555-5555-5555-555555555555', '14 oz', 414, 1.0, '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222');

select is(
  registrar_pedido(jsonb_build_object(
    'pedido', jsonb_build_object(
      'id', '66666666-6666-6666-6666-666666666666',
      'fecha_hora', now(), 'canal_id', '11111111-1111-1111-1111-111111111111', 'estado', 'cerrado'
    ),
    'lineas', jsonb_build_array(jsonb_build_object(
      'id', '77777777-7777-7777-7777-777777777777', 'tipo', 'bebida',
      'bebida_id', '44444444-4444-4444-4444-444444444444', 'tamano_id', '55555555-5555-5555-5555-555555555555',
      'cantidad', 1, 'precio', 95.00, 'iva_trasladado', 13.10, 'comision', 28.03, 'insumos', 27.06,
      'empaque', 1.73, 'vaso_tapa', 2.59, 'indirectos', 1.72, 'minutos', 4, 'tarifa_hora', 45,
      'mano_obra', 3.00, 'utilidad', 17.77, 'retencion_isr', 2.05, 'retencion_iva', 6.55, 'deposito_esperado', 53.89,
      'movimientos', jsonb_build_array(jsonb_build_object('insumo_id', '22222222-2222-2222-2222-222222222222', 'cantidad', -189.47, 'costo_unitario', 0.0379))
    ))
  ))::uuid,
  '66666666-6666-6666-6666-666666666666'::uuid,
  'registrar_pedido devuelve el id del pedido'
);

select results_eq(
  $$select precio, utilidad, deposito_esperado from venta_lineas where id = '77777777-7777-7777-7777-777777777777'$$,
  $$values (95.00::numeric, 17.77::numeric, 53.89::numeric)$$,
  'la línea guarda la foto exacta del desglose calculado en el cliente'
);

select is(
  (select cantidad from movimientos_inventario where origen_id = '66666666-6666-6666-6666-666666666666' and tipo = 'venta'),
  -189.47::numeric,
  'el movimiento de inventario se registró con la cantidad enviada'
);

-- Idempotencia (regla 5): reintentar el mismo pedido no duplica nada.
select registrar_pedido(jsonb_build_object(
  'pedido', jsonb_build_object('id', '66666666-6666-6666-6666-666666666666', 'fecha_hora', now(), 'canal_id', '11111111-1111-1111-1111-111111111111', 'estado', 'cerrado'),
  'lineas', jsonb_build_array(jsonb_build_object(
    'id', '77777777-7777-7777-7777-777777777777', 'tipo', 'bebida', 'bebida_id', '44444444-4444-4444-4444-444444444444',
    'tamano_id', '55555555-5555-5555-5555-555555555555', 'cantidad', 1, 'precio', 95.00,
    'movimientos', jsonb_build_array(jsonb_build_object('insumo_id', '22222222-2222-2222-2222-222222222222', 'cantidad', -189.47))
  ))
));

select is(
  (select count(*)::int from venta_lineas where pedido_id = '66666666-6666-6666-6666-666666666666'),
  1,
  'reintentar el mismo pedido.id no duplica la línea (idempotencia, regla 5)'
);

-- Cancelar revierte el inventario con un movimiento de signo contrario, sin borrar nada.
select cancelar_pedido('66666666-6666-6666-6666-666666666666');

select is(
  (select estado from pedidos where id = '66666666-6666-6666-6666-666666666666'),
  'cancelado',
  'cancelar_pedido marca el pedido como cancelado, no lo borra'
);

select is(
  existencia_insumo('22222222-2222-2222-2222-222222222222'),
  0::numeric,
  'la cancelación revierte el movimiento de inventario (venta -189.47 + reversa +189.47 = 0)'
);

select * from finish();
rollback;
