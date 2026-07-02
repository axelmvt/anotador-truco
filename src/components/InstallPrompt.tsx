import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "anotador-truco:install-hint";
const SNOOZE_DAYS = 30;
// Espera antes de mostrar el aviso en iOS, para no interrumpir apenas entra.
const IOS_DELAY_MS = 5000;

// El evento beforeinstallprompt (Chrome/Edge/Android) todavía no está en lib.dom.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// La app ya está instalada (abierta desde el ícono, no desde el navegador).
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// Safari en iOS no emite beforeinstallprompt: hay que explicar el gesto manual.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const wasDismissedRecently = () => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw !== null && Date.now() - Number(raw) < SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

// Banner discreto que invita a instalar la PWA. En Chrome/Android dispara el
// diálogo nativo de instalación; en iOS explica cómo agregarla desde Compartir.
const InstallPrompt = () => {
  const [mode, setMode] = useState<"hidden" | "native" | "ios">("hidden");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    const onBeforeInstallPrompt = (e: Event) => {
      // Suprime el mini-infobar de Chrome: el aviso lo mostramos nosotros.
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    const onInstalled = () => setMode("hidden");

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const iosTimer = isIos() ? window.setTimeout(() => setMode("ios"), IOS_DELAY_MS) : 0;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setMode("hidden");
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage no disponible: se ignora
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    // Se lo eligió o se lo rechazó: en ambos casos el aviso ya no vuelve por un tiempo.
    dismiss();
  };

  if (mode === "hidden") return null;

  return (
    <div
      role="region"
      aria-label="Instalar la aplicación"
      className="fixed bottom-16 inset-x-3 sm:inset-x-auto sm:right-4 sm:max-w-sm z-40 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-xl p-3 animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm">
          <p className="font-semibold mb-0.5">Agregala a tu inicio</p>
          {mode === "native" ? (
            <p className="text-white/80">Se abre al toque y funciona sin conexión.</p>
          ) : (
            <p className="text-white/80">
              Tocá <Share className="inline h-4 w-4 align-text-bottom" aria-label="Compartir" /> y
              elegí <strong>"Agregar a inicio"</strong>. Funciona sin conexión.
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Cerrar aviso de instalación"
          onClick={dismiss}
          className="shrink-0 p-1 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {mode === "native" && (
        <Button
          size="sm"
          className="mt-2 w-full bg-truco-green hover:bg-truco-green/80 text-white border border-white/20"
          onClick={install}
        >
          <Download className="h-4 w-4 mr-2" />
          Instalar
        </Button>
      )}
    </div>
  );
};

export default InstallPrompt;
