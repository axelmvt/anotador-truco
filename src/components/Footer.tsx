import React, { useState } from "react";
import { Github } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(false);
  
  return (
    <footer className="w-full bg-truco-green py-2 px-3 border-t border-white/20 text-white text-xs">
      {/* Versión móvil colapsada */}
      <div className="md:hidden">
        {expanded ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="mb-2">
                <h3 className="font-semibold text-sm mb-1">Sobre el Truco</h3>
                <ul className="space-y-1 text-white/80">
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
            
            <button 
              onClick={() => setExpanded(false)}
              className="w-full text-center mt-2 py-1 text-white/60 text-xs"
            >
              Mostrar menos ↑
            </button>
          </>
        ) : (
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <p className="text-white/80 text-xs">
                © {currentYear} Anotador de Truco
              </p>
              <button 
                onClick={() => setExpanded(true)}
                className="text-white/60 text-xs"
              >
                Más info ↓
              </button>
            </div>
          </div>
        )}
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
              <li><Link to="/blog" className="hover:text-white">Blog sobre Truco</Link></li>
              <li><a href="https://es.wikipedia.org/wiki/Truco_argentino" className="hover:text-white" target="_blank" rel="noopener noreferrer">Historia del Truco</a></li>
              <li><a href="https://www.reglamento-de-juego.com/reglamento-del-truco.html" className="hover:text-white" target="_blank" rel="noopener noreferrer">Reglamento oficial</a></li>
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