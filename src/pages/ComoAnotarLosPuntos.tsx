import { Head } from "vite-react-ssg";
import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";
import ArticleFaq from "@/components/ArticleFaq";
import { faqJsonLd, type FaqItem } from "@/lib/seo";

const faqs: FaqItem[] = [
  {
    q: "¿Qué son las malas y las buenas en el truco?",
    a: "La partida a 30 se divide en dos fases de 15 puntos: los primeros 15 son las malas y los últimos 15 las buenas. Cuando un equipo pasa los 15, se dice que 'entró en las buenas'.",
  },
  {
    q: "¿Por qué los puntos del truco se anotan con fósforos?",
    a: "Por tradición: en el bar o en la casa se anotaba con lo que hubiera a mano. Cada 5 puntos se forma un cuadradito: cuatro fósforos por los lados y el quinto cruzado en diagonal.",
  },
  {
    q: "¿A cuántos puntos se juega el truco?",
    a: "La partida clásica es a 30 puntos (15 malas y 15 buenas). Para partidas rápidas se juega a 15.",
  },
  {
    q: "¿Puedo usar el anotador sin conexión a internet?",
    a: "Sí. El anotador funciona sin conexión: es una aplicación web que podés agregar a la pantalla de inicio del celular y usar donde no haya señal.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Cómo anotar los puntos del truco: fósforos, malas y buenas",
  description:
    "Cómo se lleva la cuenta en el truco argentino: el sistema de fósforos (cuadraditos de 5), qué son las malas y las buenas, y cómo usar un anotador online.",
  inLanguage: "es-AR",
  image: "https://truco.mvt.ar/og-image.png",
  mainEntityOfPage: "https://truco.mvt.ar/como-anotar-los-puntos-del-truco",
  author: { "@type": "Organization", name: "Anotador de Truco" },
  publisher: { "@type": "Organization", name: "Anotador de Truco" },
};

const ComoAnotarLosPuntos = () => (
  <ArticleLayout sectionLabel="Cómo anotar los puntos">
    <Head>
      <title>Cómo Anotar los Puntos del Truco: Fósforos, Malas y Buenas</title>
      <meta
        name="description"
        content="Aprendé a llevar la cuenta del truco argentino: el sistema tradicional de fósforos (cuadraditos de 5 puntos), qué son las malas y las buenas, y cómo anotar online."
      />
      <link rel="canonical" href="https://truco.mvt.ar/como-anotar-los-puntos-del-truco" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd(faqs))}</script>
    </Head>

    <article className="w-full max-w-4xl mx-auto px-4 py-8 text-white/90">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
        Cómo anotar los puntos del truco: fósforos, malas y buenas
      </h1>

      <div className="prose prose-invert max-w-none opacity-90">
        <p className="lead text-lg mb-6">
          En el truco los puntos se anotan de a cuadraditos de 5, tradicionalmente con fósforos o
          rayitas en un papel. La partida a 30 se divide en dos fases de 15: las malas y las buenas.
          Acá te contamos cómo funciona el sistema y cómo llevar la cuenta sin discusiones.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">El sistema de fósforos (cuadraditos de 5)</h2>
        <p>
          La forma tradicional de anotar es armar un <strong>cuadradito por cada 5 puntos</strong>:
          cuatro fósforos forman los lados y el quinto se cruza en diagonal. Así, de un vistazo, se sabe
          cuántos puntos tiene cada equipo: tres cuadraditos completos son 15. Si se anota con lápiz, se
          dibujan los lados del cuadrado y la diagonal de la misma manera.
        </p>
        <p>
          Este anotador usa exactamente ese sistema: cada punto que sumás dibuja un fósforo, y cada 5
          puntos se cierra un cuadradito, igual que en la mesa.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Las malas y las buenas</h2>
        <p>
          La partida clásica se juega a <strong>30 puntos</strong>, divididos en dos fases de 15:
        </p>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li>
            <strong>Las malas:</strong> los primeros 15 puntos. Todos los equipos empiezan acá.
          </li>
          <li>
            <strong>Las buenas:</strong> los últimos 15. Cuando un equipo supera los 15 puntos, "entra
            en las buenas" y sus puntos se empiezan a contar de nuevo del lado de las buenas.
          </li>
        </ul>
        <p>
          De ahí vienen expresiones como "estamos en las malas" o "ya entramos en las buenas". En el
          papel, la hoja se divide con una línea horizontal: arriba las malas, abajo las buenas (o en
          dos columnas). Gana el primer equipo que completa los 15 de las buenas.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Qué puntos se anotan</h2>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li>La ronda ganada: 1 punto (2, 3 o 4 si se cantó truco, retruco o vale cuatro).</li>
          <li>
            El envido: se anota en el momento en que se define, antes de seguir jugando la ronda. Los
            valores están en{" "}
            <Link to="/valores-del-envido" className="text-yellow-200 hover:underline">
              la guía del envido
            </Link>
            .
          </li>
          <li>La flor: 3 puntos, si se juega con flor.</li>
          <li>Los cantos no queridos: los puntos por los que se venía jugando.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">Anotar online: más fácil y sin discusiones</h2>
        <p>
          Con{" "}
          <Link to="/" className="text-yellow-200 hover:underline">
            el anotador de truco online
          </Link>{" "}
          no hacen falta fósforos ni papel: tocás la mitad de la pantalla del equipo que sumó y el
          fósforo se dibuja solo. Además:
        </p>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li>Marca solo el paso de las malas a las buenas.</li>
          <li>Podés deshacer si anotaste de más y elegir partida a 15 o a 30.</li>
          <li>La partida queda guardada aunque se bloquee el teléfono.</li>
          <li>Funciona sin conexión y se puede instalar en el celu como una app.</li>
        </ul>

        <ArticleFaq faqs={faqs} />

        <p className="mt-10">
          Si estás empezando, repasá primero las{" "}
          <Link to="/reglas-del-truco" className="text-yellow-200 hover:underline">
            reglas del truco argentino
          </Link>{" "}
          y después dejá que{" "}
          <Link to="/" className="text-yellow-200 hover:underline">
            el anotador
          </Link>{" "}
          lleve la cuenta por vos.
        </p>
      </div>
    </article>
  </ArticleLayout>
);

export default ComoAnotarLosPuntos;
