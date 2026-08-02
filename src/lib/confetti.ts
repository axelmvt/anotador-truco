// Confites al ganar la partida. Vive aparte de MatchCounter porque toda la
// maquinaria —import dinámico, canvas, cronograma de la andanada— no tiene
// nada que ver con el tablero. Mismo trato que feedback.ts: funciones sueltas
// que se llaman y se olvidan, y que degradan en silencio si algo falla.

/** Un disparo de los dos cañones: cuándo sale y con cuántas partículas por lado. */
export interface Disparo {
  atMs: number;
  particulas: number;
}

const DURACION_MS = 2500;
const INTERVALO_MS = 200;
// La andanada arranca densa y se va apagando, para que no se corte seca.
const PARTICULAS_INICIALES = 34;
const PARTICULAS_FINALES = 8;

// Los cañones salen del 70% de la altura tirando hacia adentro y hacia arriba:
// más abajo salen casi horizontales, más arriba caen sin recorrido.
const ALTURA = 0.7;
const APERTURA = 55;
const VELOCIDAD = 55;

export const COLORES = ["#FF4D8D", "#4DC3FF", "#FFD84D", "#A64DFF", "#7BE04D"];

/**
 * Cronograma de la andanada. Puro: no toca el reloj ni el DOM, así que se
 * puede testear sin animar nada.
 */
export const planDeAndanada = (
  duracionMs: number = DURACION_MS,
  intervaloMs: number = INTERVALO_MS,
): Disparo[] => {
  // Siempre al menos un disparo: una andanada de cero confites no es una
  // andanada, es un bug.
  const cantidad = Math.max(1, Math.ceil(duracionMs / intervaloMs));
  return Array.from({ length: cantidad }, (_, i) => {
    // Interpolación lineal de denso a flaco. Con un solo disparo no hay
    // rampa que recorrer: sale con la densidad inicial.
    const avance = cantidad > 1 ? i / (cantidad - 1) : 0;
    const particulas = Math.round(
      PARTICULAS_INICIALES + (PARTICULAS_FINALES - PARTICULAS_INICIALES) * avance,
    );
    return { atMs: i * intervaloMs, particulas: Math.max(1, particulas) };
  });
};

// El paquete se publica con `export =` (estilo CommonJS), así que el tipo del
// módulo ya es la función en sí, con `reset` colgando.
type Confetti = typeof import("canvas-confetti");

let cargado: Confetti | null = null;
let timers: ReturnType<typeof setTimeout>[] = [];

const cancelarTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};

const prefiereMenosMovimiento = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Dispara la andanada desde los dos costados. No devuelve nada útil ni tira
 * excepciones: si la librería no se puede cargar, la partida sigue igual.
 */
export const lanzarConfites = async () => {
  // Se consulta en el momento del disparo, no al importar el módulo: el
  // usuario puede cambiar la preferencia del sistema con la app abierta.
  if (prefiereMenosMovimiento()) return;

  try {
    if (!cargado) {
      // Según cómo lo envuelva el bundler, el módulo CommonJS llega crudo o
      // dentro de `.default`. Aceptamos las dos formas.
      const mod = (await import("canvas-confetti")) as unknown as Confetti & {
        default?: Confetti;
      };
      cargado = mod.default ?? mod;
    }
  } catch {
    // Sin red y sin el chunk precacheado todavía. No es motivo para romper
    // el fin de partida.
    return;
  }
  const confetti = cargado;

  // Si quedaba una andanada viva (dos victorias seguidas sin recargar), la
  // nueva la reemplaza en vez de sumarse.
  cancelarTimers();

  for (const { atMs, particulas } of planDeAndanada()) {
    timers.push(
      setTimeout(() => {
        const comun = {
          particleCount: particulas,
          spread: APERTURA,
          startVelocity: VELOCIDAD,
          colors: COLORES,
          // Cinturón y tiradores: ya cortamos arriba, pero la librería
          // también sabe respetar la preferencia por su cuenta.
          disableForReducedMotion: true,
        };
        confetti({ ...comun, angle: 60, origin: { x: 0, y: ALTURA } });
        confetti({ ...comun, angle: 120, origin: { x: 1, y: ALTURA } });
      }, atMs),
    );
  }
};

/** Corta la andanada y limpia lo que quede en pantalla. */
export const cortarConfites = () => {
  cancelarTimers();
  cargado?.reset();
};
