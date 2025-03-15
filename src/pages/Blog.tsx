import TrucoBlog from "@/components/TrucoBlog";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const Blog = () => {
  return (
    <div className="min-h-screen w-full bg-truco-green flex flex-col">
      {/* Header */}
      <header className="w-full px-4 py-3 border-b border-white/20 flex items-center">
        <Link to="/">
          <Button variant="outline" size="sm" className="border-white/30 text-white">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver al anotador
          </Button>
        </Link>
        <h1 className="text-xl font-semibold text-white ml-4">Blog de Truco</h1>
      </header>
      
      {/* Banner de publicidad superior */}
      <AdBanner position="top" variant="horizontal" />
      
      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto py-4">
        <TrucoBlog />
      </main>
      
      {/* Banner de publicidad inferior */}
      <AdBanner position="bottom" variant="horizontal" />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Blog; 