// Efectos de feedback: sonido (Web Audio API, sin archivos) y vibración.
// Todo es seguro en SSR: nada se ejecuta al importar, solo al llamar las funciones.

let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
};

// Prepara/reanuda el AudioContext dentro de un gesto del usuario (requisito de iOS).
export const primeAudio = () => {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
};

// Reproduce una nota corta con envolvente suave.
const tone = (ctx: AudioContext, freq: number, startOffset: number, dur: number, gain = 0.14) => {
  const t0 = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

// Arpegio ascendente alegre para la victoria (do-mi-sol-do).
export const playWin = () => {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, f, i * 0.12, 0.32));
};

// Nota breve al pasar a las buenas.
export const playBuenas = () => {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  tone(ctx, 659.25, 0, 0.18, 0.1);
};

export const vibrate = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // No soportado (p. ej. iOS Safari): se ignora.
  }
};
