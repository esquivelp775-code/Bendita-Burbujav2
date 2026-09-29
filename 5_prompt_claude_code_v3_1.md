# Bendita Burbuja — Actualización v3.1 (29/09/2026): precios a público y vaso de 14 oz

Pega esto en Claude Code, en la carpeta del proyecto. Antes, copia a esa carpeta `datos_bendita_v3_1_delta.json`.

---

Actualiza la app a la versión 3.1. Los datos nuevos están en `datos_bendita_v3_1_delta.json`: úsalo como fuente de verdad para lo que cambia. Todo lo demás sigue como en `datos_bendita_v3.json` y en `4_prompt_claude_code_v3.md`. La app ya está en Netlify con Supabase, así que todo cambio de datos va como **migración nueva** (no edites migraciones viejas) y **no toques las ventas ya registradas**, porque su foto de precios y costos es histórica.

## 0. Antes de migrar: conteo real
Pregúntame cuántos quedan físicamente de: **vasos de 14 oz, tapas y playo**. Regístralo como **ajuste de inventario por conteo** con fecha de hoy, no como compra. No sobrescribas el stock con el `stock_vasos_inicial` del JSON v3.

## 1. El vaso de 14 oz se vende a público
Hasta hoy el 14 oz sólo aparecía en Evento. Desde hoy también se vende en **Público en general**.

| Tamaño | Canales antes | Canales ahora |
|---|---|---|
| 14 oz | Evento | **Público en general, Evento** |
| 16 oz | Uber Eats, Rappi, Público, Evento | sin cambio |
| 20 oz | Uber Eats, Rappi, Público, Evento | sin cambio |

- En Uber Eats y Rappi el 14 oz **sigue sin aparecer**: no cabe en la selladora.
- El cierre del 14 oz no cambia: descuenta `tapa` + `playo`.
- Cada venta de 14 oz descuenta `vaso_14`, `tapa`, `playo`, popote, etiqueta y los insumos de la receta en cantidad base (factor 1.00).
- **El vaso de 14 oz no se recompra.** Márcalo como "sin recompra": que no genere aviso de compra al bajar del umbral. Cuando el stock de `vaso_14` llegue a 0, desactiva el 14 oz en Público y en Evento automáticamente y muéstrame un aviso ("Se acabaron los vasos de 14 oz"). Si luego registro una compra de vasos de 14 oz, se reactiva.

## 2. Precios nuevos a público
Inserta registros nuevos en `precios` para el canal Público en general, vigentes desde **2026-09-29**. No sobrescribas los anteriores (el historial de precios se queda).

| Bebida | 14 oz | 16 oz | 20 oz | Antes (14/16/20) |
|---|---|---|---|---|
| Pecado Tropical | 40 | 45 | 50 | 50 / 55 / 65 |
| Pasión Prohibida | 40 | 45 | 50 | 50 / 55 / 65 |
| Milagro Tropical | 40 | 45 | 50 | 50 / 55 / 65 |
| Amén de Maracuyá | 40 | 45 | 50 | 50 / 55 / 65 |
| Confesión de Sabores | 40 | 45 | 50 | 50 / 55 / 65 |
| Taro Celestial | 50 | 55 | 65 | 70 / 75 / 90 |
| Matcha Divino | 50 | 55 | 65 | 70 / 75 / 90 |
| Chai Bendito | 50 | 55 | 65 | 70 / 75 / 90 |
| Bendita Original | 40 | 45 | 50 | 60 / 65 / 70 |
| Penitencia Fría | 30 | 35 | 40 | 45 / 50 / 60 |
| Gloria de Vainilla | 40 | 45 | 50 | 60 / 65 / 75 |
| Tentación de Cacao | 55 | 60 | 70 | 70 / 75 / 95 |
| Alma Blanca | 45 | 50 | 55 | 65 / 70 / 80 |
| Frutos Rojos | 40 | 45 | 50 | 55 / 60 / 70 |

**No cambian:** los precios de Uber Eats y Rappi (precio de lista), los de Evento, las botanas a público ($45) ni los adicionales.

## 3. Cambia la regla del precio sugerido a público
- **Antes:** `precio_publico = precio_lista × 0.85`, redondeado a $5.
- **Ahora:** el precio sugerido a público es el **más bajo** que deje un margen entre **27 % y 34 %** del precio, redondeado a $5, con cada tamaño al menos $5 arriba del anterior.
  - `utilidad = precio / 1.16 − costo_produccion − mano_de_obra`
  - `margen = utilidad / precio`
- Pon `margen_publico_min` (0.27) y `margen_publico_max` (0.34) como parámetros editables en **Ajustes**, junto a las comisiones.
- El precio sugerido **no reemplaza** el precio manual vigente: sólo se muestra al lado para comparar.
- En la ficha de cada bebida, en el canal Público, muestra el margen con color: **verde** si está entre 27 y 34 %, **ocre** si está afuera, con el texto "fuera del rango de público".

## 4. Lo que debe verse en ocre (es esperado, no es error)
El delta trae la utilidad de referencia con dos costos: el de **reposición** (proveedor barato) y el de **lo comprado** (lo que tengo hoy en inventario). Con el costo de lo comprado van a salir abajo del rango:
- **Taro, Matcha, Chai y Bendita Original: 20 a 25 %**, porque la tapioca del pack de Mercado Libre sale más cara que la de Ziaba. Cuando registre la compra de tapioca Tea Zone de 2.72 kg ($235), deben entrar al rango sin tocar los precios.
- **Pasión Prohibida y Amén de Maracuyá** en 16 y 20 oz (34.5 % y 36.6 %) y **Penitencia Fría** en 16 y 20 oz (38 % y 40 %) quedan arriba del rango. Así se decidió para no romper la regla de $5 ni el precio único de sodas.

## 5. Pruebas
Mano de obra a $50/h y costo de lo comprado. Tienen que pasar al centavo contra el motor de la app (si el motor usa otra tarifa por turno, fija $50/h en la prueba):
1. **Pecado Tropical 14 oz, Público:** precio $40 → utilidad **$11.16**. Descuenta `vaso_14`, `tapa` y `playo`, sin película.
2. **Taro Celestial 16 oz, Público:** precio $55 → utilidad **$12.35** (margen 22 %, en ocre).
3. **Penitencia Fría 20 oz, Público:** precio $40 → utilidad **$16.16**. Lleva película, sin tapa ni playo.
4. **En Uber Eats no aparece el 14 oz.**
5. **Con `vaso_14` = 0:** el 14 oz desaparece de Público y de Evento, y sale el aviso.
6. **Vaso de 14 oz:** no genera aviso de compra aunque esté abajo del umbral.
7. **Una venta anterior al 29/09** conserva su precio y su costo originales.

## 6. No toques
Lo que sigue pendiente de mi lado (viene en `pendientes_no_tocar` del delta): gramos de matcha, 2 contra 2½ bombeos de jarabe en sodas, 10 contra 12 g de tisana y la proporción de la tanda de cold brew.

## 7. Entrega
1. `npm test` y `npm run build` en verde.
2. Aplica la migración a Supabase y publica en Netlify.
3. En producción, haz una venta de prueba a Público de un Pecado Tropical de 14 oz y luego cancélala. Revisa que descuente el vaso de 14, la tapa y el playo.
4. Dime qué quedó, qué no, y el conteo con el que arrancó el inventario del 14 oz.
