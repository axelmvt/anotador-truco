import React, { useState } from "react";
import { Github } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const FOOTER_LINKS_ID = "footer-links";

// Un solo pie para todos los anchos. Antes habia dos bloques (md:hidden y
// hidden md:block) con los links escritos dos veces: se desincronizaron
// —"Historia del Truco" existia solo en desktop— y Google veia cada link
// duplicado. Ahora hay un solo juego que se reacomoda por breakpoint.
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(false);
  // Con el pie colapsado, los links siguen en el DOM (a proposito, para que
  // los crawlers los sigan viendo) pero quedan recortados por altura. Sin
  // este tabIndex, un usuario de teclado tabularia hacia links invisibles:
  // los sacamos del orden de tabulacion mientras estan recortados, sin tocar
  // el DOM ni el href.
  const collapsedTabIndex = expanded ? undefined : -1;

  return (
    <footer className="w-full bg-truco-green py-2 px-3 text-white text-xs">
      <div className="max-w-7xl mx-auto">
        {/* Linea siempre visible: es la que queda cuando el pie esta cerrado. */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-white/80 text-xs">
            © {currentYear} Anotador de Truco
            <span className="hidden md:inline"> · Todos los derechos reservados</span>
          </p>
          {/* En mobile no entran tres cosas en una linea de 390px. */}
          <p className="hidden md:block text-white/60 text-xs">
            Desarrollado con ❤️ en Argentina
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={FOOTER_LINKS_ID}
            className="shrink-0 text-white/60 text-xs"
          >
            {expanded ? "Mostrar menos ↑" : "Más info ↓"}
          </button>
        </div>

        <div
          id={FOOTER_LINKS_ID}
          aria-hidden={!expanded}
          className={cn(
            "grid transition-[grid-template-rows] [transition-duration:260ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {/* La descripcion solo cabe en desktop: en mobile robaria una
                  de las dos columnas de links. */}
              <div className="hidden md:block">
                <h3 className="font-semibold text-sm mb-1">Anotador de Truco Argentino</h3>
                <p className="text-white/80">
                  La herramienta perfecta para llevar la cuenta en tus partidas de truco.
                </p>
              </div>

              <div className="mb-2">
                <h3 className="font-semibold text-sm mb-1">Sobre el Truco</h3>
                <ul className="space-y-1 text-white/80">
                  <li><Link to="/reglas-del-truco" tabIndex={collapsedTabIndex} className="hover:text-white">Reglas del Truco</Link></li>
                  <li><Link to="/valores-del-envido" tabIndex={collapsedTabIndex} className="hover:text-white">Valores del Envido</Link></li>
                  <li><Link to="/senas-del-truco" tabIndex={collapsedTabIndex} className="hover:text-white">Señas del Truco</Link></li>
                  <li><Link to="/como-anotar-los-puntos-del-truco" tabIndex={collapsedTabIndex} className="hover:text-white">Cómo anotar los puntos</Link></li>
                  <li><Link to="/blog" tabIndex={collapsedTabIndex} className="hover:text-white">Blog sobre Truco</Link></li>
                  <li>
                    <a
                      href="https://es.wikipedia.org/wiki/Truco_argentino"
                      tabIndex={collapsedTabIndex}
                      className="hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Historia del Truco
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-1">Enlaces útiles</h3>
                <ul className="space-y-1 text-white/80">
                  <li>
                    <a
                      href="https://github.com/axelmvt/anotador-truco"
                      tabIndex={collapsedTabIndex}
                      className="flex items-center hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-3 w-3 mr-1" />
                      <span>Código fuente</span>
                    </a>
                  </li>
                  <li><a href="mailto:info@mvt.ar" tabIndex={collapsedTabIndex} className="hover:text-white">Contacto</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
