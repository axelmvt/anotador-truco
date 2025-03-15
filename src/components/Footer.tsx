import { Github } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full bg-truco-green py-4 px-4 border-t border-white/20 text-white text-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mb-4 md:mb-0">
            <h3 className="font-semibold text-base mb-2">Anotador de Truco Argentino</h3>
            <p className="text-white/80">
              La herramienta perfecta para llevar la cuenta en tus partidas de truco.
              Fácil de usar, gratuito y sin publicidad.
            </p>
          </div>
          
          <div className="mb-4 md:mb-0">
            <h3 className="font-semibold text-base mb-2">Sobre el Truco</h3>
            <ul className="space-y-1 text-white/80">
              <li><Link to="/blog" className="hover:text-white">Blog sobre Truco</Link></li>
              <li><a href="https://es.wikipedia.org/wiki/Truco_argentino" className="hover:text-white" target="_blank" rel="noopener noreferrer">Historia del Truco</a></li>
              <li><a href="https://www.reglamento-de-juego.com/reglamento-del-truco.html" className="hover:text-white" target="_blank" rel="noopener noreferrer">Reglamento oficial</a></li>
              <li><a href="https://trucojuego.com.ar/diccionario-de-truco/" className="hover:text-white" target="_blank" rel="noopener noreferrer">Diccionario de términos</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-base mb-2">Enlaces útiles</h3>
            <ul className="space-y-1 text-white/80">
              <li>
                <a 
                  href="https://github.com/axelmvt/anotador-truco" 
                  className="flex items-center hover:text-white" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4 mr-1" />
                  <span>Código fuente</span>
                </a>
              </li>
              <li><a href="mailto:info@mvt.ar" className="hover:text-white">Contacto</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-white/60 text-xs mb-2 sm:mb-0">
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