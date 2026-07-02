import { useEffect } from "react";

// Mantiene la pantalla encendida mientras el componente está montado, usando la
// Screen Wake Lock API. En navegadores sin soporte (o si el sistema lo deniega,
// p. ej. por ahorro de batería) no hace nada: el anotador sigue funcionando igual.
export const useWakeLock = () => {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      if (!("wakeLock" in navigator)) return;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        // Si el componente se desmontó mientras se pedía el lock, se libera al toque.
        if (cancelled) {
          await acquired.release();
        } else {
          lock = acquired;
        }
      } catch {
        // Denegado por el sistema: se ignora
      }
    };

    // El navegador libera el lock al cambiar de pestaña o bloquear el teléfono;
    // hay que volver a pedirlo cuando la página vuelve a estar visible.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") request();
    };

    request();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lock?.release().catch(() => {});
    };
  }, []);
};
