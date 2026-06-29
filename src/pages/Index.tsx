import MatchCounter from "@/components/MatchCounter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="h-full w-full bg-truco-green overflow-hidden flex flex-col">
      {/* H1 descriptivo para SEO (no visible: el marcador usa h2 por equipo) */}
      <h1 className="sr-only">Anotador de Truco Argentino — Contador de puntos online</h1>
      <div className="flex-1 overflow-hidden">
        <MatchCounter />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
