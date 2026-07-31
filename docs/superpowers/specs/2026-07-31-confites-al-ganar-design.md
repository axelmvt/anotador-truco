# Confites al ganar — diseño

Fecha: 2026-07-31
Estado: aprobado

## Qué se agrega

Al ganar una partida saltan confites desde los dos costados de la pantalla,
en una andanada corta que después se apaga sola.

Es puramente decorativo: no toca el reducer, ni la persistencia, ni el
resultado de la partida.

## Decisiones tomadas

| Decisión | Elegido | Por qué |
|---|---|---|
| ¿Se puede apagar desde ajustes? | No, siempre activo | Pasa una vez por partida y dura ~2,5 s. El switch existente dice "Sonido y vibración", así que meter confites ahí lo volvería mentiroso, y un tercer ajuste es demasiada superficie para esto. `prefers-reduced-motion` cubre la necesidad real de accesibilidad. |
| Colores | Multicolor de cotillón | Elegido por el usuario sobre la paleta del truco y sobre el color del equipo ganador. |
| Forma del disparo | Andanada corta (~2,5 s) | Un solo estallido se termina demasiado rápido; la lluvia continua mantiene el canvas animando mientras el cartel esté abierto y gasta batería. |
| Implementación | `canvas-confetti` con import dinámico | 4,3 KB gzip (medido: minificado 10,7 KB) contra un chunk principal de 456 KB. La física — volteo, deriva, decaimiento — es todo el producto acá y ya viene probada. |

Enfoques descartados: canvas propio a mano (habría que escribir y auditar la
física que la librería ya trae) y partículas de DOM/CSS (decenas de nodos
animados sobre un overlay con `backdrop-blur` es un riesgo de tirones justo en
el momento de la celebración).

## Módulo nuevo: `src/lib/confetti.ts`

Hermano de `feedback.ts`, con la misma forma: funciones sueltas que se llaman
y se olvidan. `MatchCounter` no ve nada de canvas ni de imports dinámicos.

```ts
/** Un disparo de los dos cañones: cuándo sale y con cuántas partículas por lado. */
export interface Disparo {
  atMs: number;
  particulas: number;
}

export const planDeAndanada = (duracionMs: number, intervaloMs: number): Disparo[] => { /* … */ }
export const lanzarConfites = () => { /* … */ }
export const cortarConfites = () => { /* … */ }
```

Adentro vive el `await import("canvas-confetti")`, la guarda de movimiento
reducido, la paleta y el cronograma.

## Enganche

El `useEffect` de victoria que ya existe en `MatchCounter.tsx` (hoy en la
línea 242), al lado de `playWin()`.

Ese efecto ya está guardado por el ref `prevWinner`, así que los confites
heredan gratis el comportamiento correcto: **disparan una sola vez y no
vuelven a disparar al recargar una partida ya terminada.**

No se agrega estado nuevo a `MatchCounter`.

## Parámetros visuales

Dos orígenes fijos, disparando hacia adentro y hacia arriba:

| Cañón | `origin` | `angle` |
|---|---|---|
| Izquierdo | `{ x: 0, y: 0.7 }` | 60° |
| Derecho | `{ x: 1, y: 0.7 }` | 120° |

- `spread`: 55°
- `startVelocity`: 55
- Duración de la andanada: ~2500 ms, disparando cada ~200 ms
- La cantidad de partículas por disparo baja hacia el final, para que se
  apague en vez de cortarse seco
- Paleta: `#FF4D8D`, `#4DC3FF`, `#FFD84D`, `#A64DFF`, `#7BE04D`

El canvas que crea la librería es `position: fixed` con `pointer-events: none`,
así que queda por encima del overlay de ganador (`z-20`) sin bloquear los
botones de Compartir y Reiniciar.

## Guardas

Las tres degradan en silencio, igual que hoy hacen las escrituras a
`localStorage`. Ninguna puede romper el fin de partida.

1. **`prefers-reduced-motion: reduce`** → no dispara nada. Se consulta con
   `matchMedia` en el momento del disparo, no al importar el módulo.
2. **El `import()` puede fallar** — offline antes de que Workbox precachee el
   chunk, o red caída. Va en `try/catch` y la partida sigue normal.
3. **SSG** — el import dinámico dentro del efecto hace que el módulo nunca se
   evalúe durante el prerender, así que no hace falta guarda extra de
   `window`/`document`.

## Limpieza

Si se reinicia la partida o se desmonta el componente a mitad de andanada, se
cancelan los disparos pendientes y se limpia el canvas (`cortarConfites`).

## Qué se testea

`planDeAndanada` sale como función pura y con tests en Vitest, al estilo de
`gameReducer` y `varLog`:

```ts
planDeAndanada(duracionMs, intervaloMs) → [{ atMs, particulas }, …]
```

Así el ritmo y el apagado quedan verificables sin animar nada. Casos:

- La cantidad de disparos es `ceil(duracionMs / intervaloMs)`.
- El primero sale en `atMs: 0`.
- Ningún `atMs` llega a `duracionMs`.
- `particulas` es monótona no creciente: el primer disparo es el más denso y
  el último el más flaco, sin repuntes en el medio.
- `particulas` nunca es 0 ni negativo — hasta el último disparo tira algo.
- Con `duracionMs` menor a `intervaloMs` sale un solo disparo, no cero.

El resto —canvas, `requestAnimationFrame`, física— es de la librería y no se
re-testea.

## Fuera de alcance

- Confites en cualquier otro evento (pasar a buenas, cantar envido).
- Ajuste en el panel de configuración.
- Sonido nuevo: `playWin()` ya existe y no se toca.
