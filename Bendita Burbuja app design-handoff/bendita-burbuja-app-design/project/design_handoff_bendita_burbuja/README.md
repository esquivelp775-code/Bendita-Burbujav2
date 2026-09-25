# Handoff: Bendita Burbuja — app de operación

## Overview
Web app (mobile-first, one user) for running **Bendita Burbuja**, a bubble tea / Italian soda / cold brew delivery business in Puebla, México. The owner makes the drinks and records each sale at the same time, standing, one-handed, with the phone on the counter. Later, on a computer, they review the business. Sales channels: Uber Eats, Rappi, and events (a pop-up bar with a per-drink price).

The app's core job is to answer at all times **"how is the business doing?"** — sales, what's left after every cost, what sells, what's running out — and to record every sale in **one tap**, deducting only from inventory.

Language: Spanish (Mexico), informal "tú". All UI copy in the prototype is final.

## About the Design Files
The files in this bundle are **design references built in HTML**: prototypes that show the intended look and behavior. They are **not production code to copy**. The task is to **recreate these designs in the target codebase** with its own patterns and libraries. If no codebase exists yet, pick the most suitable stack; a suggestion is React + TypeScript + an offline-first local store (IndexedDB) with sync.

The prototype is a single "Design Component" (`Bendita Burbuja.dc.html`) with inline styles, plus plain JS helper modules holding the data and the business logic. The math in the helpers is correct and has been tested (see "Business rules"), so port it faithfully.

To open the prototype, serve the folder over any static server and open `Bendita Burbuja.dc.html`. `support.js` is the prototype runtime only and does not belong in production.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy and interactions are final. Recreate them pixel-accurately.

---

## Design Tokens

### Color (use exactly these)
| Token | Hex | Use |
|---|---|---|
| `crema` | `#FEEFC4` | App background (with paper grain, see Texture) |
| `crema-alta` | `#FFF7DF` | Cards and raised surfaces |
| `crema-baja` | `#F1DEB6` | Inputs, selected rows, sunken areas, pressed/hover tint of ghost buttons |
| `arena` | `#E1C8A5` | 1 px dividers and borders. **Never text** |
| `rojo` | `#780F0D` | Primary text, primary buttons, brand |
| `rojo-oscuro` | `#5E0B0A` | Emphasis, pressed state, **negative numbers**, toast background |
| `texto-2` | `#8A5446` | Secondary text, notes, table footers |
| `verde` | `#4A7032` | **Only** profit and "what you keep" (ganancia, sueldo, "deja $X"). Never anything else |
| `ocre` | `#8A6212` | Alerts: low stock, about to expire, price below target, event price < $65 |
| `terracota` | `#B5806A` | **Decoration only** (ornaments, illustration). Never text or data |

Channel colors (always shown **next to the written channel name**, never alone; the color goes on a swatch or bar, the label stays in text color):
- Uber Eats `#5E0B0A`
- Rappi `#B07A3A`
- Evento `#44607A`

**Golden rule:** red is the brand, so it can't mean "loss". Negative money is written in parentheses with ▼ in `rojo-oscuro`: `($123) ▼`. Negative counts follow the same form: `(12) ▼`. Green is reserved for what is yours.

Heatmap cells use `color-mix(in oklch, #780F0D p%, #FFF7DF)` with p from 6 to 94 %. Text on a cell is `crema` when p > 50 %, otherwise `rojo`.

### Typography (three families, one job each)
- **Bodoni Moda** (500): screen titles 28–32 px, drink names 18–20 px, and the hero number of each screen 40–56 px. Never below 18 px and never inside tables.
- **Josefin Sans**: labels and category names in UPPERCASE with `letter-spacing: .12em`. Weight 400 at 11–13 px. Weight 300 only at 14 px and up. Never weight 100.
- **Montserrat**: everything functional, including body, buttons (600), inputs, tables and every figure. Always set `font-variant-numeric: tabular-nums` on figures.
- Google Fonts: `Bodoni Moda:opsz,wght@6..96,400;500;600`, `Josefin Sans:wght@300;400;600`, `Montserrat:wght@400;500;600;700`.

Common sizes:

| Element | Size | Font / weight |
|---|---|---|
| Body | 14 px | Montserrat |
| Secondary line | 12–13 px | Montserrat, `texto-2` |
| KPI value | 20–26 px | Montserrat 600 |
| Section label (h2) | 13 px | Josefin 400, uppercase, .12em |
| Micro label | 11 px | Josefin 400, uppercase, .12em |

### Shape, lines, texture
- **Radius:** 4 px on cards, inputs and buttons. 2 px on tags. Pill (999 px) **only** on chips.
- **Lines, not shadows:** 1 px `arena` borders. The toast is the only floating element and gets a barely visible shadow: `0 1px 3px rgba(94,11,10,.14)`.
- **Engraving divider** between major sections: a 4 px tall block with `border-top` and `border-bottom` of 1 px `arena`. Totals rows inside tables use `border-top: 3px double #E1C8A5`.
- **Signature arch:** double outline in `rojo` (1.5 px outer + 1 px inner, 5 px gap, top radius equal to half the width). It appears in **one place per screen only**: the hero number on Hoy, and the illustration of each empty state.
- **Icons:** hand-drawn-feel line icons, 1.5 px stroke, `rojo`, 22 px (cup, pearl, leaf, star, jar, bag, recipe card, blender). No emoji, no filled icons.
- **Paper grain:** SVG `feTurbulence` noise at ~3.5 % opacity over the `crema` body background (see the helmet `<style>` in the prototype). Cards stay flat.
- **Spacing:** 4 px base. Side margins 16 px on mobile, 24 px on desktop. Card padding 16 px. Common gaps: 8, 12, 16, 20 px.
- **Motion:** minimal. 150–200 ms fades and color transitions. When a drink is sold, its card flashes solid `rojo` with `crema` text for 500 ms. Nothing bounces.

### Number and text format
- Money: `$1,234.50` in tables and `$1,235` on summary cards. Percent: `23.4 %` (with a non-breaking space).
- Dates: `mar 23 sep`. Time in 24 h: `14:37`.
- Flirty copy **only** in empty states and confirmations (e.g. "Todavía no sale la primera bendición del día"). Buttons and labels are always literal ("Registrar compra").

## Base components
All of them live inline in the prototype; extract them as components.
- **Primary button:** `rojo` background, `crema` text, 48 px tall (56 px for hero CTAs), padding `0 20px`, Montserrat 600 15–16 px. Hover and active: `rojo-oscuro`.
- **Secondary button:** 1 px `rojo` border, transparent background, `rojo` text. Hover: `crema-baja`.
- **Ghost button:** transparent, `rojo` text, underline with 4 px offset. Hover: `crema-baja`.
- **Chip** (single or multi select): pill, 40–44 px tall, 1 px border.
  - Off: `arena` border, transparent background, `rojo` text.
  - On: `rojo` border and background, `crema` text.
  - Channel chips add a 10×10 color swatch.
- **Segmented control:** 1 px `arena` frame, 4 px radius, 40–44 px buttons. Selected segment is `rojo` with `crema` text.
- **Stepper:** `−` / value / `+` with 44×44 hit areas, 1 px border. Used for price, tariffs, percentages and mix.
- **KPI card:** `crema-alta` background, 1 px `arena` border, 14×16 px padding. Josefin 11 px label, Montserrat 600 22–26 px value, 12 px note.
- **Drink card (register):** at least 80 px tall.
  - Contents: name in Bodoni 18, price in Montserrat 600 15, and "deja $17.44" in 12 px 600 `verde`.
  - Flashes on tap (see Motion).
  - Two columns on mobile; `auto-fill minmax(176px,1fr)` on desktop.
- **Table row:** CSS grid, 1 px `arena` bottom border, figures right-aligned with tabular-nums.
- **Progress to goal:** 10 px track in `crema-baja` with an `arena` border and a `verde` fill. A 1.5 px `rojo` tick marks break-even, with a label underneath.
- **Status tag:** Josefin 11 px uppercase, 2 px radius, padding `4px 6px 2px`.
  - OK: outline `texto-2`.
  - Bajo: outline `ocre`.
  - Por caducar: dashed outline `ocre`.
  - Agotado: solid `rojo-oscuro` background, `crema` text.
- **Toast with "Deshacer":** `rojo-oscuro` background, `crema` text, 48 px min height. Outline button "Deshacer". Lasts 5 s, sits above the tray and bottom nav.
- **Open-order tray:** sticky bottom bar on `crema-alta` with a 1.5 px `rojo` top border. Channel swatch, text "Pedido · Uber Eats · 2 bebidas · $190 · hace 2 min", and a primary "Listo" button.
- **Bottom nav (< 1024 px):** 5 items at 60 px: Hoy · Vender · Desglose · Inventario · Más. The active item has a 2 px `rojo` top border and 600 weight. "Más" opens a sheet with Eventos, Reportes, Compras, Recetas, Equipo, Ajustes.
- **Side nav (≥ 1024 px):** 232 px wide, sticky, scrollable. Logo 96 px, then groups *Operación* (Hoy, Vender, Desglose), *Negocio* (Eventos, Reportes), *Catálogo* (Inventario, Compras, Recetas, Equipo y mobiliario) and *Cuenta* (Ajustes). Items are 40 px; the active one has a `crema-baja` background.
- **Day selector:** 44×44 ← and → buttons around the date label.
- **Empty state:** double arch with a line icon inside, a Bodoni 22–24 title, a 14 px `texto-2` line and one CTA.

---

## Screens
The same component tree is used on mobile (390 px) and desktop (1280 px); desktop switches grids to 2–4 columns. The top strip reads "Datos de ejemplo" in Josefin 11 on `crema-baja`.

1. **Hoy** (home). Must answer in 5 s: how am I doing today and this week, and what needs attention?
   - **Header:** date in Bodoni 30 and the shift state ("Turno de la tarde · abierto hasta 16:30" or "Fuera de turno").
   - **Hero** (inside the arch): "Hoy te quedan **$412**" in Bodoni 56 `verde`, with "venta · bebidas · pedidos" underneath.
   - **Main CTA:** "Ver desglose del día", full width, 56 px.
   - **Money split:** a thin 3-segment bar with three rows: *Se va* / *Cuesta hacerla* / *Te llevas*.
   - **Semana card:** progress toward the weekly goal with a break-even tick, 7 day columns (today highlighted), and "Esta semana te llevas $X · manejando esas horas habrías hecho $Y".
   - **Por canal card:** stacked bar with direct labels, plus a table of venta, te dejó and pedidos.
   - **Lo que más se vende card:** top 5 with two toggles, Hoy/Semana and Por unidades/Por ganancia.
   - **Atención card:** inventory alerts in `ocre`, plus a link to Inventario.
   - **Dinero card:** what Uber and Rappi owe, inventory value, and the month's withholdings.
   - **Desktop:** `auto-fit minmax(300px,1fr)`; the hero and CTA take the first row.
2. **Vender** (register; speed is the priority).
   - **Sticky totals:** drinks today · sales · te queda.
   - **Chips, in this order:** Canal · Tamaño (active sizes only) · Leche (Entera, Deslactosada, Avena +$15). Canal, Tamaño and Leche persist. With Evento, today's event picker and a price stepper appear, with a warning below $65.
   - **Adicionales:** multi-select chips that clear after each drink.
   - **Drink grid:** grouped by category, with "deja $X" recalculated live for the chosen channel, milk and extras.
   - **One tap = one sale:** the drink goes into the open order, the card flashes, and a toast with Deshacer appears. There are **no confirmations or modals**.
   - **Open order:** changing the channel or 3 minutes of inactivity closes it; "Listo" closes it manually.
   - **"Lo de hoy":** orders, newest first, each expandable to its drinks, with "Cancelar pedido" (undoable).
3. **Desglose del día.**
   - Date selector.
   - Headline: "De cada $100… te quedaron **$21** de ganancia y **$4** de tu sueldo".
   - **Waterfall chart:** horizontal on mobile, vertical on desktop. Order: Venta → IVA → Comisión → Insumos → Empaque → Indirectos → Equipo → Traslado de evento (only on event days) → Mano de obra → **Ganancia**.
     - Bars that leave are `rojo`; mano de obra and ganancia are `verde`.
     - Brackets group them as *Se va* / *Cuesta hacerla* / *Te llevas*.
   - Breakdown table.
   - Per-channel "per $100" columns.
   - Per-drink table.
   - Per-hour bars.
   - Same weekday last week, cut at the same hour when viewing today.
   - Real money of the day: deposits, withholdings, cash.
   - Actions: Cierre del día, Compartir resumen, Exportar.
4. **Inventario.**
   - KPIs: value, items to restock, opened perishables.
   - List grouped by Polvos, Lácteos, Jarabes, Perlas y tapioca, Café y té, Bases, Empaque, Vasos y tapas, Botanas.
     - Each row: name, unit cost · supplier, stock with unit, coverage bar ("te alcanza para N días", based on the last 14 days), value and status tag.
   - **Detail:**
     - Drinks the stock still covers, broken down by drink.
     - Weekly consumption (14 daily bars).
     - Editable minimum.
     - "Abrí uno nuevo hoy" for perishables.
     - Prices by supplier.
     - Stock ledger (kárdex): date, movement, ± quantity, running balance.
   - **Conteo físico:** type the real amount; shows the difference with its money value and records it as shrinkage or surplus. The first count becomes "Conteo inicial".
   - **Ajuste:** reasons Merma, Caducidad, Prueba de receta, Encontré de más.
   - **Empty state:** no initial count yet.
5. **Compras.**
   - Form: date, supplier chips, invoice yes/no (decides whether IVA is creditable), and lines of item + number of packs (stepper) + price per pack including IVA.
   - Each line shows "Última vez: Ziaba $235 por 2.72 kg" with the % change, and the live effect on stock and weighted average cost.
   - Saving turns "estimado" into "verificado".
   - Expandable history.
   - Supplier comparison per item.
   - **Empty state:** no purchases yet.
6. **Recetas.**
   - Tabs: Bebidas / Leches / Adicionales.
   - **Card:** category (Josefin), name (Bodoni 20), prices by size, cost, deja in Uber and in Rappi, and a margin tag (En objetivo / Bajo objetivo in `ocre`).
   - **Printed-look recipe sheet** (3 px double `rojo` border):
     - Ingredients in 14 / 16 / 20 oz columns (scaled by size factor).
     - Numbered steps with Bodoni numerals.
     - Cost breakdown per size.
     - Suggested vs current price, with an **ocre alert when an ingredient went up and the margin fell below target**.
   - **Price simulator:** a range slider from $30 to $160 in $5 steps, showing deja in each channel live.
   - Create, edit and retire drinks. Retired drinks disappear from the register but keep their history.
   - Milk surcharges and extras are managed here with steppers.
7. **Equipo y mobiliario.**
   - Hero sentence: "Cada día de operación tu equipo te cuesta **$6.40**".
   - KPIs: total investment, monthly depreciation, current value.
   - Asset rows: cost, monthly depreciation, current value and % depreciated bar.
   - "Por capturar" checklist from `activos_por_capturar`, with actions Capturar / No lo tengo.
   - Add form with a live cost-per-day preview.
   - **Empty state:** no assets yet.
8. **Eventos.**
   - Board: Cotizado → Confirmado → Realizado → Cobrado, with Cancelados listed below.
   - KPIs: pipeline, balance to collect, what collected events left.
   - **Cotizador (quote builder):** number of drinks, mix by category (steppers, 5 % steps), price per drink (stepper, "Usar sugerido $75"), transport, extra equipment and setup hours.
     - Live panel: te queda, costo total and por bebida, plus "Las mismas N bebidas en las apps te dejarían $X".
     - Ocre alert below $65: "Debajo de $65 un evento deja lo mismo que las apps, pero con más trabajo".
   - **Detail:**
     - Status chips.
     - Real vs quoted (hidden or "—" when there are no sales).
     - Registered sales.
     - Quote summary with "Mandar por WhatsApp" (`wa.me` link with the text) and "PDF con tu marca" (printable letter page).
     - Client card with WhatsApp.
     - Payment: total, deposit, paid, balance, "Registrar anticipo del 50 %" and "Registrar pago del saldo".
   - **Clientes:** tab derived from the events.
   - **Empty state:** no events yet.
9. **Reportes.**
   - Ranges: Hoy · Semana · Mes · Trimestre · Personalizado (← → stepper per bound).
   - Channel filter.
   - **KPIs:** venta, ganancia, margen, bebidas, pedidos, ticket promedio, ganancia por hora de turno, and **bebidas por pedido** (scale 1.0–2.0 with a start tick at 1.4 and the goal at 2).
   - **Charts:**
     - Profit per day with a dashed daily-goal line.
     - Sales by channel.
     - By category (red bar = sales, green strip = profit).
     - Top drinks.
     - Drinks by hour.
     - Weekday × hour heatmap, excluding events, with a Tuesday/Wednesday insight line.
     - Real vs projection: cumulative lines, real in `verde`, base scenario as a dashed `texto-2` line.
   - **"¿Me conviene contra manejar Uber?"** per week: what you kept (profit + wage) vs what driving those shift hours would have paid.
   - **Monthly taxes (estimate):** IVA collected, minus IVA on commissions, minus IVA on invoiced purchases, minus IVA withheld = **IVA a pagar / Saldo a favor**; plus ISR withheld. Label: "Estimación para revisar con tu contador".
   - Export to CSV and Excel.
   - **Empty state:** no sales in the selected range.
10. **Ajustes.** Everything is edited with steppers.
    - Labor rate per shift and outside shifts.
    - Shift hours (30 min steps).
    - Commissions: Uber base + Uber One × share of orders = effective rate; Rappi.
    - IVA: 16 % or 8 % (border zone).
    - Withholdings: ISR and IVA.
    - Indirect cost per drink.
    - Sealer film cost.
    - Weekly goal and projection base.
    - Sizes: active or not, closed with lid or sealer film.
    - Categories: minutes and target profit.
    - Backup: export or import all data as JSON.
    - "Ver la bienvenida otra vez".
11. **Primer uso** (5 steps, progress dots):
    1. Welcome with the logo inside the arch.
    2. Confirm the preloaded catalog ("En la caja" / "Fuera" per drink, plus the count of items with estimated prices).
    3. Initial count, which reuses Inventario → Conteo with a step bar ("Guardar y seguir" / "Saltar por ahora").
    4. Equipment, which reuses the Equipo checklist.
    5. Schedule and weekly goal, then land on Hoy.

### System states (all designed)
- **Loading:** empty arch with pearls and "Abriendo la caja…".
- **Offline:** `ocre` strip, "Sin conexión · Guardado en tu teléfono — se sube cuando vuelva la señal · 3 ventas por subir".
- **Save error:** `rojo-oscuro` strip, "No se pudo guardar la venta de las 15:12. Sigue en tu teléfono." with a "Reintentar" button.
- **Open order left behind:** the tray shows on every screen with "hace N min".
- **Empty states:** no sales today (Hoy hero reads "Todavía no sale la primera bendición del día"), no inventory, no purchases, no assets, no events, no sales in the report range.

## Business rules (port exactly; see `bendita-data.js` `calc()`)
For each drink sold:
```
precio          = list price(drink, size) + milk surcharge + Σ extras   (event: event price instead of list price)
ingreso_sin_iva = precio / (1 + IVA)
iva             = precio − ingreso_sin_iva
comision        = precio × effective channel commission   (Uber 0.29 + 0.01×0.5 = 0.295 · Rappi 0.25 · Evento 0)
insumos         = Σ recipe qty × net unit cost (net = cost without creditable IVA ÷ (1 − merma))
                  milk swapped for the chosen one; qty × size factor when "escala_con_tamano"
empaque         = cup + lid (or film) of the size + straw + label + wrap, without IVA
indirectos      = 2.00 / 1.16
mano_de_obra    = (category minutes + extras minutes) × shift rate / 60   (Mon–Fri $45/h, Sat–Sun $55/h, off-shift $50/h)
utilidad        = ingreso_sin_iva − comision − insumos − empaque − indirectos − mano_de_obra
withholdings    = platforms only: ISR 2.5 %, IVA 8 % of ingreso_sin_iva
deposito        = precio − comision − IVA of commission − withholdings
```
- Daily equipment cost = Σ (cost − salvage) / useful life in months / 30.4.
- **Daily profit** = Σ utilidad − daily equipment cost − event costs (transport + extra equipment + setup hours × off-shift rate).
- Test case: Taro Celestial, 14 oz, whole milk, Uber Eats, Tuesday 14:00 → utilidad **$17.77**, and all parts add up to **$95.00**.
- **Inventory:** each sale consumes its recipe (scaled by size), plus one cup and one lid of its size (no lid when sealed with film), plus straw, label and wrap.
- **Purchases:** update cost as a weighted average, `(stock × cu + qty × new_cu) / (stock + qty)`. With an invoice, new_cu excludes IVA; without an invoice, IVA is part of the cost.
- **Suggested price:** the lowest multiple of $5 whose Uber Eats utilidad is at or above the category target (Sodas $13.25, rest $17.50).
- **Event quote:** uses the average drink of each category at the event price, off-shift labor rate, and fixed costs. The app comparison uses the average utilidad at a 55 % Uber / 45 % Rappi mix.
- **Coverage (days):** stock ÷ average daily consumption over the last 14 days.
- **Status:**
  - *Bajo* = below the minimum, or coverage under 3 days when no minimum is set.
  - *Por caducar* = opened and 2 days or less to expire.
  - *Agotado* = stock ≤ 0.

## State management
- **Entities:** sales (with the computed cost breakdown and consumption), orders (channel, event, time), inventory items (unit cost, verified flag, minimum, opened date), inventory movements (initial, purchase, adjustment, count), purchases, drinks (recipe, prices, active), milks, extras, assets, events, parameters.
- **UI state:** current screen and sub-view per screen; the register's persistent selections (channel, size, milk); an open order that auto-closes after 3 min of inactivity or on a channel change; the undo toast (5 s).
- **Offline-first:** every write goes to local storage first and then syncs. The offline and save-error strips reflect the sync queue.
- Past sales keep the breakdown computed at the moment of sale. Changing settings affects only new sales, recipes and quotes.

## Assets
- `assets/logo-bendita.jpeg`: the brand logo, supplied by the owner. It is the master mark; do not redraw it.
- Icons are inline SVG line icons drawn for this project (22 px, 1.5 px stroke). Lucide-style replacements are fine as long as they stay at 1.5 px stroke and never use fills.
- No photography.

## Files
- `Bendita Burbuja.dc.html`: the whole app. The template holds every screen, each marked with `data-screen-label`; the `<script data-dc-script>` logic class builds the view models. Preview props: `vista` (auto/celular/escritorio), `datos` (ejemplo/primer uso), `estado` (normal/cargando/sin conexión/error al guardar/pedido abierto), `autocierre` (min).
- `Sistema de diseño.dc.html`: design-system reference sheet (color, type, shape, components).
- `bendita-data.js`: catalog, parameters (`BB.P`), the `calc()` per-drink cost engine, sample sales generator, `agg()` for daily totals, and formatters.
- `bendita-inv.js`: inventory item catalog, suppliers, sample purchases and movements, recipe texts, asset lists.
- `bendita-ops.js`: consumption per sale, inventory state, coverage and status, stock ledger, recipe pricing, alerts.
- `bendita-extra.js`: events (sample data, quote engine, real vs quoted, WhatsApp text, PDF), Excel/CSV export, shift hours.
- `support.js`: prototype runtime only. Not needed in production.
