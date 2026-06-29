import { Head } from "vite-react-ssg";
import TrucoBlog from "@/components/TrucoBlog";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "El Truco Argentino: Historia y Reglas del Juego de Cartas más Popular",
  description:
    "Historia, reglas, valor de las cartas y cantos del truco argentino. Aprendé a jugar y a contar los puntos.",
  inLanguage: "es-AR",
  image: "https://truco.mvt.ar/og-image.png",
  mainEntityOfPage: "https://truco.mvt.ar/blog",
  author: { "@type": "Organization", name: "Anotador de Truco" },
  publisher: { "@type": "Organization", name: "Anotador de Truco" },
};

const Blog = () => {
  return (
    <div className="h-full w-full bg-truco-green flex flex-col">
      <Head>
        <title>Reglas del Truco Argentino: Cómo se Juega, Cartas y Cantos | Blog</title>
        <meta
          name="description"
          content="Historia y reglas del truco argentino: cómo se juega, el valor de las cartas, los cantos (envido, truco, flor) y cómo contar los puntos."
        />
        <link rel="canonical" href="https://truco.mvt.ar/blog" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>

      {/* Header */}
      <header className="w-full px-4 py-3 border-b border-white/20 flex items-center">
        <Link to="/">
          <Button variant="outline" size="sm" className="border-white/30 text-white">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver al anotador
          </Button>
        </Link>
        {/* Etiqueta de sección, no es el encabezado principal (el h1 lo da el artículo) */}
        <span className="text-xl font-semibold text-white ml-4">Blog de Truco</span>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 min-h-0 overflow-y-auto py-4">
        <TrucoBlog />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Blog;
