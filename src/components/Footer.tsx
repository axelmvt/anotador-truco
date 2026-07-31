import React, { useState } from "react";
import { Github } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const FOOTER_MOBILE_LINKS_ID = "footer-links-mobile";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(false);
  // Con el pie colapsado, los 7 links siguen en el DOM (a proposito, para
  // que los crawlers los sigan viendo) pero quedan recortados por altura.
  // Sin este tabIndex, un usuario de teclado tabularia hacia links
  // invisibles: los sacamos del orden de tabulacion mientras estan
  // recortados, sin tocar el DOM ni el href.
  const collapsedTabIndex = expanded ? undefined : -1;

  return (
    <footer className="w-full bg-truco-green py-2 px-3 text-white text-xs">
      {/* Versión móvil colapsada */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-xs">
            © {currentYear} Anotador de Truco
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={FOOTER_MOBILE_LINKS_ID}
            className="text-white/60 text-xs"
          >
            {expanded ? "Mostrar menos ↑" : "Más info ↓"}
          </button>
        </div>

        <div
          id={FOOTER_MOBILE_LINKS_ID}
          aria-hidden={!expanded}
          className={cn(
            "grid transition-[grid-template-rows] [transition-duration:260ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="mb-2">
                <h3 className="font-semibold text-sm mb-1">Sobre el Truco</h3>
                <ul className="space-y-1 text-white/80">
                  <li><Link to="/reglas-del-truco" tabIndex={collapsedTabIndex} className="hover:text-white">Reglas del Truco</Link></li>
                  <li><Link to="/valores-del-envido" tabIndex={collapsedTabIndex} className="hover:text-white">Valores del Envido</Link></li>
                  <li><Link to="/senas-del-truco" tabIndex={collapsedTabIndex} className="hover:text-white">Señas del Truco</Link></li>
                  <li><Link to="/como-anotar-los-puntos-del-truco" tabIndex={collapsedTabIndex} className="hover:text-white">Cómo anotar los puntos</Link></li>
                  <li><Link to="/blog" tabIndex={collapsedTabIndex} className="hover:text-white">Blog sobre Truco</Link></li>
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

      {/* Versión desktop completa */}
      <div className="hidden md:block max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          <div className="mb-2">
            <h3 className="font-semibold text-sm mb-1">Anotador de Truco Argentino</h3>
            <p className="text-white/80">
              La herramienta perfecta para llevar la cuenta en tus partidas de truco.
            </p>
          </div>
          
          <div className="mb-2">
            <h3 className="font-semibold text-sm mb-1">Sobre el Truco</h3>
            <ul className="space-y-1 text-white/80">
              <li><Link to="/reglas-del-truco" className="hover:text-white">Reglas del Truco</Link></li>
              <li><Link to="/valores-del-envido" className="hover:text-white">Valores del Envido</Link></li>
              <li><Link to="/senas-del-truco" className="hover:text-white">Señas del Truco</Link></li>
              <li><Link to="/como-anotar-los-puntos-del-truco" className="hover:text-white">Cómo anotar los puntos</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog sobre Truco</Link></li>
              <li><a href="https://es.wikipedia.org/wiki/Truco_argentino" className="hover:text-white" target="_blank" rel="noopener noreferrer">Historia del Truco</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm mb-1">Enlaces útiles</h3>
            <ul className="space-y-1 text-white/80">
              <li>
                <a 
                  href="https://github.com/axelmvt/anotador-truco" 
                  className="flex items-center hover:text-white" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Github className="h-3 w-3 mr-1" />
                  <span>Código fuente</span>
                </a>
              </li>
              <li><a href="mailto:info@mvt.ar" className="hover:text-white">Contacto</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center">
          <p className="text-white/60 text-xs">
            © {currentYear} Anotador de Truco. Todos los derechos reservados.
          </p>
          <p className="text-white/60 text-xs">
            Desarrollado con ❤️ en Argentina
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 