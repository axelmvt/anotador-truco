# IR AL VAR — historial de puntos + rediseño del tablero

**Fecha:** 2026-07-30
**Estado:** aprobado, listo para plan de implementación

## Qué construimos

Un panel de historial de solo lectura llamado **VAR**, que muestra cada punto sumado, restado y deshecho durante la partida. El nombre es un chiste con el VAR del fútbol: existe para cuando alguien dice *"pará, vos sumaste dos"*.

Junto con eso, cuatro cambios visuales en el tablero que salieron del mismo pedido: el botón de entrada al VAR, rayas doradas horizontales, la fase (Malas/Buenas) debajo del nombre en vez de entre paréntesis, y micro-interacciones.

## Contexto: lo que ya existe

El tablero vive entero en `src/components/MatchCounter.tsx`, sobre un reducer puro en `src/lib/gameReducer.ts` con 13 tests en Vitest. Ya hay persistencia en localStorage (`anotador-truco:partida`), deshacer, modos a 15 y a 30, nombres de equipo editables, sonido/vibración, wake lock y compartir.

`GameState` ya tiene un campo `history`, **que no sirve para el VAR**: es una pila de snapshots `{team1, team2}` para el deshacer, no dice qué equipo movió ni si fue suma o resta ni cuándo, el deshacer la desapila, y `MatchCounter.tsx` la descarta a propósito antes de guardar en localStorage. El VAR necesita su propia estructura.

## Decisiones

| Decisión | Elegido | Por qué |
|---|---|---|
| Alcance | Solo lectura | Resuelve el caso real sin riesgo de romper el estado. El deshacer ya existe en su propio botón. |
| Deshacer en el log | Se registra como evento | El log queda append-only: la jugada original sigue visible más una entrada "se deshizo". Trazabilidad completa, que es el punto de un VAR. |
| Entrada | FAB circular arriba del engranaje | 48 px, monocromo, mismo tratamiento que el resto. |
| Ícono | SVG propio | Recuadro redondeado con "VAR" dibujado como trazos. No es el logo oficial de FIFA (marca registrada) ni depende de la fuente cargada. |
| Panel | Variante C · Tandas | Agrupa los puntos consecutivos de un equipo en tarjetas desplegables: es como la gente recuerda la partida ("esa mano se llevaron tres"). |
| Umbral de agrupación | 2 minutos | Parte menos manos que 45 s, a costa de juntar de vez en cuando dos manos seguidas. |
| Borrar historial | No hay botón | "Reiniciar partida" ya limpia el log, que es el único momento en que tiene sentido. Un tacho aparte solo habilita borrar la evidencia en medio de una discusión. |
| Tablero | Variante A + banda de B | Marco cerrado (lo más legible, no toca el layout flex) con banda de fase teñida al 15 % (no compite con el oro de los fósforos). |
| Persistencia del log | localStorage, tope 200 | El historial que se borra al recargar sin querer no sirve. |

### Lo que se descartó y por qué

- **Token `truco.ink #0B2E17`** — hacía falta para escribir sobre dorado macizo. Con la banda teñida al 15 % el texto va en `truco.stick` sobre fondo oscuro. No se agrega.
- **`scoreAfter` en cada entrada** — lo pedía la variante B para mostrar `20 – 15`. La variante C muestra `→ 14`, que es el `points` que ya está en la entrada.
- **Pastilla dorada "IR AL VAR"** — uno de los mockups la propuso; le roba protagonismo a los fósforos. Va el FAB circular monocromo.

## Modelo de datos

```ts
// src/lib/gameReducer.ts
export type LogType = "suma" | "resta" | "deshacer";

export interface LogEntry {
  id: string;            // "L1", "L2", … — contador monótono, estable como key de React
  team: Team;
  type: LogType;
  delta: number;         // +1 | -1  (en "deshacer", el inverso del movimiento revertido)
  points: number;        // puntos del equipo DESPUÉS del movimiento
  stage: Stage;          // fase del equipo DESPUÉS del movimiento
  at: number;            // timestamp en ms
  undoneType?: LogType;  // solo cuando type === "deshacer"
}
```

`GameState` suma dos campos: `log: LogEntry[]` y `nextLogId: number`.

### El reducer tiene que seguir siendo puro

`gameReducer` es puro y testeado, y eso no se negocia. Un `Date.now()` o un `crypto.randomUUID()` adentro lo rompe.

- **El timestamp entra por la acción.** `increment`, `decrement` y `undo` pasan a llevar `at: number`. `MatchCounter` lo completa con `Date.now()` al despachar.
- **El id sale de un contador en el estado.** `nextLogId` se incrementa con cada entrada. Determinista, y da keys estables para React. Los ids son únicos **dentro de un log**; `reset` vuelve el contador a 1, así que una partida nueva arranca de `L1` otra vez. Alcanza: el log viejo ya no existe.

Los 13 tests actuales usan los helpers `run()` e `inc()` de `gameReducer.test.ts`; ahí se inyecta un `at` fijo y creciente. Es un cambio en dos funciones, no en cada test.

### Semántica por acción

- `increment` / `decrement` — si el movimiento no cambia nada (partida terminada, tope alcanzado, restar en cero) **no se escribe nada en el log**. El log refleja movimientos reales.
- `undo` — desapila `history` como hoy, y **agrega** una entrada `type: "deshacer"` con `undoneType` igual al tipo de la entrada revertida. Nunca borra del log.
- `reset` y `setMode` — log vacío y `nextLogId` en 1.
- Tope: `log` se recorta a las últimas **200** entradas (`MAX_LOG`), independiente del `MAX_HISTORY = 50` de la pila de deshacer.

### Persistencia

`MatchCounter.tsx` hoy hace `const { history, ...persistable } = state`. Pasa a excluir solo `history` y a incluir `log` y `nextLogId`.

`loadSavedGame()` valida al leer: si `log` no es un array, arranca vacío; si lo es, se recorta a las últimas 200 entradas y se descartan las que no tengan `team`, `type` y `at`. Un log guardado por una versión vieja simplemente no existe y arranca vacío — no es un error.

## Componentes

### `src/components/icons/VarIcon.tsx` (nuevo)

SVG de 32×32, `currentColor`, `stroke-width` 2: un `<rect>` redondeado con las letras V, A, R dibujadas como `<path>`. Trazos, no tipografía.

### `src/lib/varLog.ts` (nuevo)

Lógica pura del panel, separada de la UI para poder testearla:

- `agruparEnTandas(log: LogEntry[], umbralMs = 120_000): Tanda[]` — junta movimientos consecutivos del mismo equipo cuando la diferencia con el anterior es menor al umbral. Un `deshacer` **nunca** se agrupa: corta la tanda y va como fila propia.
- `bucketDeTiempo(at: number, ahora: number): { k: number; label: string }` — "Recién", "Hace 5 min", "Al principio".
- `hitosDeBuenas(log: LogEntry[], mode: GameMode)` — la primera entrada en que cada equipo cruza a buenas, para el separador "▸ Los Pibes pasó a las buenas". Solo en modo 30.

```ts
export interface Tanda {
  team: Team;
  tipo: "tanda" | "deshacer";
  items: LogEntry[];
  desde: number;      // at del primer movimiento
  hasta: number;      // at del último
  delta: number;      // suma de los deltas
  points: number;     // puntos al cerrar la tanda
  stage: Stage;
  undoneType?: LogType;
}
```

### `src/components/VarPanel.tsx` (nuevo)

Recibe `{ open, onOpenChange, log, names, mode, team1, team2 }`. No despacha acciones: es solo lectura.

**Contenedor.** `Drawer` de vaul (`src/components/ui/drawer.tsx`, ya instalado) en mobile; `Dialog` de Radix centrado a dos columnas en `md+`, con la lista a la izquierda y el Resumen como barra lateral fija en vez de vista alternativa. vaul ya aporta el drag handle, arrastrar para cerrar, focus trap y restauración de foco.

**Cabecera.** Título "HISTORIAL" + badge "VAR" + contador de jugadas. Un `Tabs` segmentado Movimientos ↔ Resumen con thumb deslizante. Botón de cerrar. **Sin tacho.**

**Vista Movimientos.** Tarjetas por tanda: fósforo en miniatura, nombre del equipo, delta agregado (`+3`), pips (uno por punto; los de resta con borde punteado), `→ 14` y el chip de fase. Un tap despliega los movimientos individuales con la hora exacta `hh:mm:ss`. Separadores de tiempo entre grupos e hitos de "pasó a las buenas".

**Vista Resumen.** Una tarjeta por equipo con puntos actuales, fase, Sumas, Restas y Mejor racha; abajo una barra de participación y el total de movimientos, deshechos y duración.

**Estado vacío.** Un cuadro de fósforos sin usar, "Todavía no hay jugadas" y "Cada punto que sumen o resten queda anotado acá, con la hora. Después no se discute."

### Identificación de equipo

Los nombres son editables y pueden compartir inicial ("Marta" / "Martín"), así que la inicial no sirve. Tres señales redundantes:

1. **El fósforo en miniatura** — palito dorado liso = equipo 1, palito con cabeza roja = equipo 2. Es el objeto que ya está dibujado en el tablero, no un color inventado.
2. **El nombre completo**, truncado con `title=` y el nombre entero en el `aria-label`.
3. **El borde izquierdo de color** de la tarjeta.

El tipo de movimiento se codifica **por forma, no solo por color**: `+1` en pill sólida, `−1` con borde punteado, deshacer atenuado en itálica con el valor tachado. El color nunca es la única señal.

## Cambios en el tablero

### Fase debajo del nombre

Sale `{stageLabel(team)}` del `<h2>`. La fila del nombre queda con el nombre y el lápiz; debajo va una banda de ancho completo:

- Base: `relative w-full h-6 flex items-center justify-center overflow-hidden text-[10px] font-bold uppercase tracking-[0.22em] transition-colors duration-300`
- Malas: `bg-white/[0.06] text-white/60`
- Buenas: `bg-truco-stick/15 text-truco-stick shadow-[inset_0_-2px_0_0_#FDB833]`

**En modo a 15 la banda no se renderiza** (no existen malas ni buenas), pero las rayas sí — si no, el marco se abre.

El nombre en buenas sigue en `text-yellow-200` (5.3:1 sobre el verde). No usar `truco.stick` para el nombre: da 4.0:1 y a 19 px semibold no llega a AA.

### Rayas doradas — marco cerrado

Dos rayas horizontales del mismo color y grosor que el divisor vertical que ya existe:

```
h-1 w-full shrink-0 bg-truco-stick shadow-[0_0_10px_rgba(253,184,51,0.35)]
origin-center motion-safe:animate-rule-draw
```

La de arriba va después del header; la de abajo, como último hijo flex de la raíz de `MatchCounter` (el `Footer` vive en `Index.tsx`, fuera del componente, así que la raya queda justo entre el tablero y el pie). El divisor vertical no cambia: al estar dentro del board, que es el `flex-1` entre las dos rayas, las toca y cierra el marco.

**`shrink-0` es obligatorio en las dos rayas**: sin eso el `flex-1` del board se las come y quedan en 3 px.

**Costura central:** las dos bandas de fase son vecinas y con los dos equipos en la misma fase se leen como una sola barra. Se separan con `border-r-2 border-truco-green` en la izquierda y `border-l-2 border-truco-green` en la derecha, alineadas con el divisor.

**Costo:** el rediseño se lleva unos 22 px de alto del tablero. En un iPhone SE es medio cuadro de fósforos. Se mitiga bajando el header de `py-3 sm:py-4` a `pt-3 pb-0`: la banda ya aporta el aire de abajo.

### Botón VAR

Primero en la columna de FABs, arriba del engranaje. Hay que sacar el `mb-2` del botón de configuración para que la columna quede con `gap-3` parejo.

```
h-12 w-12 rounded-full bg-black/10 border-none text-white hover:bg-black/20
transition-transform duration-150 ease-out active:scale-[0.88] active:bg-black/25
```

`aria-label="VAR — revisar las jugadas"`.

## Animaciones

Todas con prefijo `motion-safe:`.

| Interacción | Duración · easing |
|---|---|
| Press de FAB | 150 ms · ease-out · `scale(0.88)` |
| FAB aparece | 260 ms · `cubic-bezier(.34,1.56,.64,1)` |
| Rayas se dibujan al montar | 520 ms · `cubic-bezier(.22,1,.36,1)`; la vertical con 120 ms de delay |
| Malas → buenas: barrido | 420 ms · `cubic-bezier(.65,0,.35,1)`, se limpia en `onAnimationEnd`. El overlay del barrido va en `bg-truco-stick/15`, el mismo tono al que llega la banda — no en dorado macizo, que era el barrido de la variante A descartada |
| Malas → buenas: brillo | 900 ms · ease-out · delay 120 ms |
| Malas → buenas: latido del nombre | 420 ms · `cubic-bezier(.34,1.56,.64,1)` |
| Panel abre | 360 ms · `cubic-bezier(.32,.72,0,1)` (la curva de vaul) |
| Panel cierra | 240 ms · `cubic-bezier(.4,0,1,1)` |
| Overlay | 280 ms · `cubic-bezier(.4,0,.2,1)` |
| Entrada escalonada de tarjetas | 240 ms · delay `i * 24 ms`, tope 260 ms |
| Desplegar una tanda | 260 ms · `grid-template-rows: 0fr → 1fr` |
| Thumb del tab | 260 ms |

Keyframes nuevos en `tailwind.config.ts`: `rule-draw`, `rule-draw-y`, `band-wipe`, `band-shine`, `stage-pop`, `fab-in`, `var-row-in`.

**Movimiento reducido:** el prefijo `motion-safe:` cubre las animaciones; como red de seguridad para las `transition-*` y para el `animate-match-manual` que ya existe, va un bloque `@media (prefers-reduced-motion: reduce)` al final de `src/index.css`. Con movimiento reducido el panel pasa a un fade de 120 ms y se desactivan el escalonado y el hover-translate.

## Accesibilidad

- `role="dialog"` + `aria-modal` + `aria-labelledby` al título. vaul ya hace focus trap y devuelve el foco al cerrar; igual se fuerza el foco al botón de cerrar al abrir.
- La lista usa `role="list"` / `role="listitem"` con un `aria-label` completo por fila: *"Tía Marta resta un punto, queda en 12 buenas, 21:14:07"*.
- Tabs con `role="tablist"` / `role="tab"` y `aria-selected`; ← → mueven entre vistas.
- El color nunca es la única señal (ver identificación de equipo).
- Íconos de cabecera de 34 px con área táctil de 44 px vía pseudo-elemento.
- `pb-[env(safe-area-inset-bottom)]` en el cuerpo scrolleable.

## Tests

Vitest ya está configurado (`npm test`).

**`gameReducer.test.ts`** — actualizar los helpers para inyectar `at`, y sumar: sumar y restar escriben una entrada cada uno; un movimiento sin efecto no escribe nada; deshacer agrega una entrada `"deshacer"` con el `undoneType` correcto y no borra la anterior; `reset` y `setMode` vacían el log; el tope de 200 se respeta; los `id` no se repiten.

**`varLog.test.ts`** (nuevo) — puntos consecutivos del mismo equipo dentro de 2 min forman una tanda; pasado el umbral se parten; el otro equipo corta la tanda; un `deshacer` corta y va suelto; los buckets de tiempo caen donde corresponde; en modo 15 no hay hitos de buenas.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/lib/gameReducer.ts` | `LogEntry`, `log`, `nextLogId`, `at` en las acciones, `MAX_LOG` |
| `src/lib/gameReducer.test.ts` | helpers con `at` + tests del log |
| `src/lib/varLog.ts` | nuevo — agrupación en tandas, buckets, hitos |
| `src/lib/varLog.test.ts` | nuevo |
| `src/components/icons/VarIcon.tsx` | nuevo |
| `src/components/VarPanel.tsx` | nuevo |
| `src/components/MatchCounter.tsx` | FAB VAR, banda de fase, rayas, `at` al despachar, persistir el log |
| `tailwind.config.ts` | keyframes y animaciones nuevas, colores del panel |
| `src/index.css` | red de seguridad de `prefers-reduced-motion` |

`CLAUDE.md` quedó desactualizado en el pull (dice que no hay tests y menciona `AdBanner`, que ya se borró). Conviene corregirlo en el mismo trabajo.

## Distribución: qué pasa con quien ya instaló la PWA

**Nadie tiene que volver a descargar nada.** La app usa `vite-plugin-pwa` con `registerType: "autoUpdate"`: Workbox chequea el `sw.js` en cada carga, precachea la versión nueva, hace `skipWaiting()` + `clientsClaim()` y recarga sola.

Dos matices reales:

- La **primera** apertura después del deploy puede mostrar un instante la versión vieja y auto-recargar a la nueva. La segunda ya arranca limpia.
- En **iOS**, una PWA en standalone chequea updates solo cuando se lanza de verdad. Quien la tenga en el app switcher sin cerrarla se actualiza recién cuando la cierra y la vuelve a abrir.

En ningún caso hace falta reinstalar.
