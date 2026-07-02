import { Head } from "vite-react-ssg";
import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";
import ArticleFaq from "@/components/ArticleFaq";
import { faqJsonLd, type FaqItem } from "@/lib/seo";

const faqs: FaqItem[] = [
  {
    q: "¿Con cuántas cartas se juega al truco?",
    a: "Se juega con la baraja española de 40 cartas (sin los ochos ni los nueves). Cada jugador recibe 3 cartas por mano.",
  },
  {
    q: "¿A cuántos puntos se juega el truco?",
    a: "La partida tradicional se juega a 30 puntos, divididos en dos fases de 15: las malas y las buenas. También es común jugar partidas cortas a 15 puntos.",
  },
  {
    q: "¿Cuál es la carta más alta del truco?",
    a: "El ancho de espadas (1 de espadas) es la carta más alta, seguida por el ancho de bastos, el siete de espadas y el siete de oros.",
  },
  {
    q: "¿Cuántas personas pueden jugar al truco?",
    a: "Se puede jugar de a 2 (mano a mano), de a 4 (dos parejas) o de a 6 (dos equipos de tres). La versión más tradicional es de a 4.",
  },
  {
    q: "¿Qué pasa si una mano termina empatada (parda)?",
    a: "Si la primera mano queda parda, gana la ronda el equipo que gane la segunda. Si la segunda también queda parda, define la tercera; y si las tres quedan pardas, gana el equipo que es mano.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Reglas del Truco Argentino: cómo se juega, cartas y cantos",
  description:
    "Las reglas completas del truco argentino: la baraja, la jerarquía de cartas, las manos, el truco, el envido y la flor. Explicadas de forma simple.",
  inLanguage: "es-AR",
  image: "https://truco.mvt.ar/og-image.png",
  mainEntityOfPage: "https://truco.mvt.ar/reglas-del-truco",
  author: { "@type": "Organization", name: "Anotador de Truco" },
  publisher: { "@type": "Organization", name: "Anotador de Truco" },
};

const ReglasDelTruco = () => (
  <ArticleLayout sectionLabel="Reglas del Truco">
    <Head>
      <title>Reglas del Truco Argentino: el Reglamento Completo Paso a Paso</title>
      <meta
        name="description"
        content="El reglamento del truco argentino explicado fácil: la baraja, el orden de las cartas, las manos, el truco, el retruco, el envido, la flor y las señas. Con preguntas frecuentes."
      />
      <link rel="canonical" href="https://truco.mvt.ar/reglas-del-truco" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd(faqs))}</script>
    </Head>

    <article className="w-full max-w-4xl mx-auto px-4 py-8 text-white/90">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
        Reglas del Truco Argentino: el reglamento completo, paso a paso
      </h1>

      <div className="prose prose-invert max-w-none opacity-90">
        <p className="lead text-lg mb-6">
          El truco se juega con la baraja española de 40 cartas (se sacan los ochos y los nueves) entre
          2, 4 o 6 jugadores divididos en dos equipos. Gana la partida el primer equipo que llega a 30
          puntos. Acá tenés el reglamento completo, explicado de forma simple.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">El objetivo del juego</h2>
        <p>
          La partida se juega a 30 puntos, divididos en dos fases de 15: las <strong>malas</strong> (los
          primeros 15) y las <strong>buenas</strong> (los últimos 15). También se puede jugar una partida
          corta a 15. Los puntos se consiguen ganando las rondas y los cantos: el truco, el envido y la
          flor. Si querés saber cómo se lleva la cuenta, mirá{" "}
          <Link to="/como-anotar-los-puntos-del-truco" className="text-yellow-200 hover:underline">
            cómo anotar los puntos del truco
          </Link>
          .
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Cómo se juega una ronda</h2>
        <p>
          Cada jugador recibe <strong>3 cartas</strong>. La ronda se compone de hasta tres manos: en cada
          mano, cada jugador tira una carta y gana la mano quien tiró la más alta. El equipo que gana
          <strong> 2 de las 3 manos</strong> se lleva la ronda (1 punto, o más si se cantó truco).
        </p>
        <p>
          Si una mano queda empatada (<strong>parda</strong>), define la siguiente. Si todas quedan
          pardas, gana la ronda el equipo que es <strong>mano</strong> (el que recibió cartas primero).
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">El orden de las cartas</h2>
        <p>
          En el truco las cartas no valen por su número: tienen una jerarquía propia. De mayor a menor:
        </p>
        <ol className="list-decimal pl-6 my-4 space-y-1">
          <li>Ancho de espadas (1 de espadas)</li>
          <li>Ancho de bastos (1 de bastos)</li>
          <li>Siete de espadas</li>
          <li>Siete de oros</li>
          <li>Los treses (de cualquier palo)</li>
          <li>Los doses (de cualquier palo)</li>
          <li>Anchos falsos (1 de copas y 1 de oros)</li>
          <li>Los doces (de cualquier palo)</li>
          <li>Los onces (de cualquier palo)</li>
          <li>Los dieces (de cualquier palo)</li>
          <li>Sietes falsos (7 de copas y 7 de bastos)</li>
          <li>Los seises (de cualquier palo)</li>
          <li>Los cincos (de cualquier palo)</li>
          <li>Los cuatros (de cualquier palo)</li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-4">El truco, el retruco y el vale cuatro</h2>
        <p>
          En cualquier momento de la ronda, un equipo puede cantar <strong>truco</strong> para subir la
          apuesta. El rival puede aceptar ("quiero"), rechazar ("no quiero") o subirla de nuevo:
        </p>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li><strong>Truco:</strong> la ronda pasa a valer 2 puntos.</li>
          <li><strong>Retruco:</strong> la ronda pasa a valer 3 puntos.</li>
          <li><strong>Vale cuatro:</strong> la ronda pasa a valer 4 puntos. Es el máximo.</li>
        </ul>
        <p>
          Si un equipo no quiere el canto, el otro se lleva los puntos por los que se venía jugando: 1 si
          no se quiere el truco, 2 si no se quiere el retruco y 3 si no se quiere el vale cuatro.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">El envido</h2>
        <p>
          Antes de jugar la primera carta se puede cantar <strong>envido</strong>: una apuesta aparte que
          se define por la suma de dos cartas del mismo palo (más 20). El envido vale 2 puntos, el real
          envido 3 y la falta envido puede definir la partida. El puntaje máximo es 33. Tenés el detalle
          completo, con ejemplos, en{" "}
          <Link to="/valores-del-envido" className="text-yellow-200 hover:underline">
            los valores del envido
          </Link>
          .
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">La flor</h2>
        <p>
          Si un jugador tiene sus tres cartas del mismo palo, puede cantar <strong>flor</strong>, que
          vale 3 puntos. Es una regla opcional: antes de empezar la partida conviene acordar si se juega
          con o sin flor. Cuando se juega con flor, cantarla anula el envido de esa ronda.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Irse al mazo</h2>
        <p>
          Un equipo puede abandonar la ronda en cualquier momento ("irse al mazo"). El rival se lleva los
          puntos que estuvieran en juego hasta ese momento.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Las señas</h2>
        <p>
          Cuando se juega por equipos, está permitido pasarle señas al compañero para avisarle qué
          cartas se tienen: cejas levantadas para el ancho de espadas, un guiño para el ancho de bastos,
          y así para cada carta importante. Tenés la tabla completa, con los consejos para que no te
          descubran, en{" "}
          <Link to="/senas-del-truco" className="text-yellow-200 hover:underline">
            las señas del truco
          </Link>
          .
        </p>

        <ArticleFaq faqs={faqs} />

        <p className="mt-10">
          ¿Ya sabés jugar? Entonces solo te falta llevar bien la cuenta:{" "}
          <Link to="/" className="text-yellow-200 hover:underline">
            usá el anotador de truco online gratis
          </Link>{" "}
          y dejá los fósforos para el asado.
        </p>
      </div>
    </article>
  </ArticleLayout>
);

export default ReglasDelTruco;
