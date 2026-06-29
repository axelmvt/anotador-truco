import { Helmet } from "react-helmet-async";
import MatchCounter from "@/components/MatchCounter";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Anotador de Truco Argentino",
  url: "https://truco.mvt.ar/",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  inLanguage: "es-AR",
  description:
    "Anotador online gratuito para llevar la cuenta de los puntos del truco argentino, a 15 o a 30.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
};

const Index = () => {
  return (
    <div className="h-full w-full bg-truco-green overflow-hidden flex flex-col">
      <Helmet>
        <title>Anotador para el Truco Argentino | Cuenta Puntos Fácil</title>
        <meta
          name="description"
          content="Anotador online gratuito para el Truco Argentino. Llevá la cuenta de los puntos fácil y rápido, a 15 o a 30. Funciona en el celu y sin conexión."
        />
        <link rel="canonical" href="https://truco.mvt.ar/" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

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
