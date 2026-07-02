import { Head } from "vite-react-ssg";
import TrucoBlog from "@/components/TrucoBlog";
import ArticleLayout from "@/components/ArticleLayout";

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

const Blog = () => (
  <ArticleLayout sectionLabel="Blog de Truco">
    <Head>
      <title>Reglas del Truco Argentino: Cómo se Juega, Cartas y Cantos | Blog</title>
      <meta
        name="description"
        content="Historia y reglas del truco argentino: cómo se juega, el valor de las cartas, los cantos (envido, truco, flor) y cómo contar los puntos."
      />
      <link rel="canonical" href="https://truco.mvt.ar/blog" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Head>

    <TrucoBlog />
  </ArticleLayout>
);

export default Blog;
