# Bendita Burbuja — Actualización v3 (26/09/2026)

Pega esto en Claude Code, en la carpeta del proyecto. Antes, copia a esa carpeta `datos_bendita_v3.json`.

---

Actualiza la app a la versión 3 del catálogo. Los datos están en `datos_bendita_v3.json`: úsalo como fuente de verdad. `2_spec_claude_code.md` sigue vigente salvo lo que cambia aquí. La app ya está en Netlify con Supabase: todo cambio de datos va como **migración nueva** (no edites migraciones viejas) y **no toques las ventas ya registradas**, porque su foto de costos es histórica.

## 1. Tamaños, cierre y canales (el cambio principal)
Compré una selladora de vasos, pero **sólo el vaso de 20 oz es de la medida**: el de 14 y el de 16 oz que compré no caben. Queda así:

| Tamaño | Cierre (se descuenta del inventario por bebida) | Canales donde aparece |
|---|---|---|
| 14 oz | tapa ($1.10) + playo ($0.25) | **sólo Evento** |
| 16 oz | tapa ($1.10) + playo ($0.25) | Uber Eats, Rappi, Público, Evento |
| 20 oz | película de selladora ($0.157) | Uber Eats, Rappi, Público, Evento |

- Agrega una tabla `tamano_canales` (o un arreglo `canales` en `tamanos`, como viene en el JSON). La caja de Uber/Rappi/Público **sólo muestra 16 y 20 oz**; el cotizador de eventos muestra los tres.
- Cambia `costo_tapa` por un **cierre por tamaño**: una lista de insumos de cierre por tamaño (`tapa` + `playo` para 14 y 16 oz, `pelicula_sello` para 20 oz). La venta descuenta esos insumos. Si todavía no existen como insumos de inventario, crea `tapa` ($1.10 c/u con IVA, prioridad alta) y reactiva `playo`. En el JSON, `costo_tapa` ya trae el costo del cierre completo con IVA ($1.35 para 14/16 oz y $0.157 para 20 oz), y el campo `cierre` dice cuál es.
- Quita `playo` de las **recetas** de las bebidas: ya no depende de la bebida, sino del tamaño (va dentro del cierre de 14 y 16 oz). No borres el insumo.
- Si más adelante compro vasos de 16 oz de la medida de la selladora, debe bastar con cambiar el cierre del 16 oz en Ajustes, sin tocar código.
- Costo de vaso: 16 oz $1.937 y 20 oz $2.476 (IVA incluido).

## 2. Insumos nuevos y costos actualizados
Toma del JSON: `base_frappe`, `pelicula_sello`, `charola_4` (nuevos) y los costos nuevos de `leche`, `leche_desl`, `avena_oatly`, `polvo_matcha` (ahora **matcha puro**, bolsa de 100 g), `polvo_taro`, `polvo_chai` y `tapioca_seca`.
- Guarda el campo `costo_reposicion` (hoy sólo lo trae la tapioca: Tea Zone 2.72 kg en $235). En la ficha del insumo muéstralo como "Si lo compras con tu proveedor: $X/g". Si el costo actual es más de 30 % mayor que el de reposición, avisa en ocre: "Esta compra salió cara: reponla con <proveedor>".

## 3. Charola portavasos
- Descuenta `ceil(bebidas_del_pedido / 4)` charolas **sólo en pedidos con 2 o más bebidas**.
- En costeo no va por línea: `parametros.indirectos_por_bebida` sube de $2.00 a **$2.60**, que ya incluye la parte proporcional de la charola.

## 4. Recetas que cambian
**Taro Celestial y Chai Bendito:** el polvo del pack rinde 22-27 bebidas por bolsa de 250 g, así que la dosis baja de 30 g a **10 g en 16 oz** (8.77 g base de 14 oz, que escala a 10 g en 16 oz y 12.5 g en 20 oz). Ya viene así en el JSON.

**Matcha Divino (matcha puro):**
Ya viene en el JSON: matcha 4 g + azúcar 15 g + leche 180 ml + hielo 90 g + tapioca 30 g + azúcar 12 g + popote + etiqueta (cantidades base de 14 oz que escalan con el tamaño). Pablo va a ajustar los gramos hoy en la noche, así que la ficha de receta debe dejarlo editar sin fricción.

## 5. Precios nuevos
Carga `precio_lista` de cada bebida como **precio manual vigente** desde hoy: inserta registros nuevos en `precios` y no sobrescribas los anteriores. El precio de Público es `precio_publico` del JSON (15 % abajo, redondeado a $5).

| Bebida | 16 oz | 20 oz | Público 16 / 20 |
|---|---|---|---|
| Sodas (Pecado, Pasión, Milagro, Amén, Confesión) | 65 | 75 | 55 / 65 |
| Taro Celestial | 90 | 105 | 75 / 90 |
| Matcha Divino | 90 | 105 | 75 / 90 |
| Chai Bendito | 90 | 105 | 75 / 90 |
| Bendita Original | 75 | 85 | 65 / 70 |
| Penitencia Fría | 60 | 70 | 50 / 60 |
| Gloria de Vainilla | 75 | 90 | 65 / 75 |
| Tentación de Cacao | 90 | 110 | 75 / 95 |
| Alma Blanca | 80 | 95 | 70 / 80 |
| Frutos Rojos | 70 | 85 | 60 / 70 |

La lista de 14 oz (sólo eventos) también viene en el JSON.

**Cambia la regla de la escalera del precio sugerido (sección 5.9):** en lugar de "cada tamaño ≥ el anterior + $5", usa **"el 20 oz debe dejar al menos $2.50 más de utilidad en Uber que el 16 oz"**, subiendo de $5 en $5. Así se acaba la inversión en que el tamaño grande dejaba menos.

## 6. Adicional "Versión frappé"
Receta: `base_frappe` 14 g (el pack indica 13-15 g por frappé). Precio $25. **Disponible sólo en Público y Evento.** En Uber/Rappi pierde dinero con la base que compré ($1.08/g). Agrega `adicional_canales` para poder limitar un adicional por canal.

## 7. Equipo
Agrega a Activos: selladora de vasos ($1,550) y juego de matcha ($396). Los dos con fecha 2026-09-26, 12 meses de vida útil y rescate $0.

## 8. Compras del 26/09
Registra como compras reales las de `compras_26sep` **excepto** las que dicen "Por comprar" (las leches: esas las registro yo cuando las compre). Así el inventario arranca con existencia y costo reales. Antes de guardar, muéstrame la lista para confirmarla.

## 9. Pruebas
- Las pruebas v2 se quedan como pruebas del motor con los datos v2 (fixture).
- Agrega los dos casos de `pruebas_v3` (Matcha 16 oz con avena en Rappi y Pecado 20 oz en Uber). Tienen que pasar al centavo.
- Agrega pruebas de canal y cierre: en Uber no se puede vender 14 oz, el 16 oz descuenta tapa + playo y el 20 oz sólo película, un pedido de 5 bebidas descuenta 2 charolas y "Versión frappé" no aparece en Rappi.

## 10. Entrega
1. `npm test` y `npm run build` en verde.
2. Aplica la migración a Supabase y publica en Netlify.
3. En producción, haz dos ventas de prueba en Uber y luego cancélalas: un Taro de 16 oz, que debe descontar vaso de 16, tapa, playo, taro, leche, tapioca, popote y etiqueta, y nada de película; y un Pecado Tropical de 20 oz, que debe descontar vaso de 20 y película, y nada de tapa ni playo.
4. Dime qué quedó y qué no.
