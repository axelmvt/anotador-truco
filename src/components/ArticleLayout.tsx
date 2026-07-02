import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

// Estructura compartida de las páginas de contenido (blog y artículos):
// header con vuelta al anotador, contenido scrolleable y footer.
const ArticleLayout = ({ sectionLabel, children }: { sectionLabel: string; children: ReactNode }) => (
  <div className="h-full w-full bg-truco-green flex flex-col">
    <header className="w-full px-4 py-3 border-b border-white/20 flex items-center">
      <Link to="/">
        <Button variant="outline" size="sm" className="border-white/30 text-white">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver al anotador
        </Button>
      </Link>
      {/* Etiqueta de sección, no es el encabezado principal (el h1 lo da cada artículo) */}
      <span className="text-xl font-semibold text-white ml-4">{sectionLabel}</span>
    </header>

    <main className="flex-1 min-h-0 overflow-y-auto py-4">{children}</main>

    <Footer />
  </div>
);

export default ArticleLayout;
