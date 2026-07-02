import { Head } from "vite-react-ssg";
import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";
import ArticleFaq from "@/components/ArticleFaq";
import { faqJsonLd, type FaqItem } from "@/lib/seo";

const faqs: FaqItem[] = [
  {
    q: "¿Cuánto es lo máximo que se puede tener de envido?",
    a: "33 puntos: el 7 y el 6 del mismo palo (7 + 6 + 20). Es la mejor mano posible para el envido.",
  },
  {
    q: "¿Cuánto valen las figuras para el envido?",
    a: "El 10, el 11 y el 12 valen 0 para el envido. Si tenés dos figuras del mismo palo, tu envido es 20.",
  },
  {
    q: "¿Cuánto vale el envido no querido?",
    a: "Si el rival no quiere el primer envido, te llevás 1 punto. Si ya había cantos aceptados en la escalera y se rechaza uno posterior, te llevás los puntos acumulados hasta el canto anterior.",
  },
  {
    q: "¿Quién gana el envido si hay empate?",
    a: "Gana el jugador que es mano (el que está más cerca del que reparte, en sentido contrario a las agujas del reloj).",
  },
  {
    q: "¿Cuánto vale la falta envido?",
    a: "Vale los puntos que le faltan al equipo que va ganando para terminar la fase en la que está (las malas o las buenas). Si el que la canta va perdiendo, puede dar vuelta la partida de un solo canto.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Valores del envido en el truco: cómo se calcula y cuánto vale cada canto",
  description:
    "Cómo se calculan los puntos del envido en el truco argentino: la regla del +20, cuánto valen las figuras, el real envido, la falta envido y qué pasa si no se quiere.",
  inLanguage: "es-AR",
  image: "https://truco.mvt.ar/og-image.png",
  mainEntityOfPage: "https://truco.mvt.ar/valores-del-envido",
  author: { "@type": "Organization", name: "Anotador de Truco" },
  publisher: { "@type": "Organization", name: "Anotador de Truco" },
};

const ValoresDelEnvido = () => (
  <ArticleLayout sectionLabel="Valores del Envido">
    <Head>
      <title>Valores del Envido en el Truco: Cómo se Calcula | Tabla y Ejemplos</title>
      <meta
        name="description"
        content="Aprendé a calcular el envido en el truco argentino: la regla del +20, cuánto valen las figuras, el real envido y la falta envido. Con ejemplos y preguntas frecuentes."
      />
      <link rel="canonical" href="https://truco.mvt.ar/valores-del-envido" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd(faqs))}</script>
    </Head>

    <article className="w-full max-w-4xl mx-auto px-4 py-8 text-white/90">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
        Valores del envido: cómo se calcula y cuánto vale cada canto
      </h1>

      <div className="prose prose-invert max-w-none opacity-90">
        <p className="lead text-lg mb-6">
          El envido se calcula sumando las dos cartas más altas del mismo palo y agregando 20. Las
          figuras (10, 11 y 12) valen 0, y el máximo posible es 33. Acá va la regla completa, con
          ejemplos y el valor de cada canto.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Cómo se calculan los puntos del envido</h2>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li>
            <strong>Dos o tres cartas del mismo palo:</strong> se suman las dos más altas y se agrega
            20. Ejemplo: 7 y 5 de espadas = 7 + 5 + 20 = <strong>32</strong>.
          </li>
          <li>
            <strong>Las figuras (10, 11 y 12) valen 0:</strong> dos figuras del mismo palo = 0 + 0 + 20
            = <strong>20</strong>. Una figura y un 4 del mismo palo = 0 + 4 + 20 = <strong>24</strong>.
          </li>
          <li>
            <strong>Sin cartas del mismo palo:</strong> vale la carta más alta sola, sin sumar 20.
            Ejemplo: 7 de oros, 4 de copas y 11 de bastos = <strong>7</strong>.
          </li>
        </ul>
        <p>
          El máximo del envido es <strong>33</strong> (el 7 y el 6 del mismo palo) y el mínimo con dos
          cartas del mismo palo es 20.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Cuánto vale cada canto</h2>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li><strong>Envido:</strong> 2 puntos.</li>
          <li><strong>Envido envido:</strong> 4 puntos (2 + 2).</li>
          <li><strong>Real envido:</strong> 3 puntos. Se puede sumar a los anteriores: envido + real envido = 5; envido + envido + real envido = 7.</li>
          <li>
            <strong>Falta envido:</strong> vale los puntos que le faltan al equipo que va ganando para
            terminar la fase en la que está. Si están en las buenas, puede definir la partida entera.
          </li>
        </ul>
        <p>
          Si un canto <strong>no se quiere</strong>, el que cantó se lleva 1 punto (o los puntos
          acumulados hasta el canto anterior, si ya había una escalera de cantos).
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Quién gana el envido</h2>
        <p>
          Cuando el envido se quiere, cada equipo dice sus puntos empezando por el que es mano. Gana el
          que tiene más puntos; en caso de empate, gana el que es <strong>mano</strong>. Los puntos del
          envido se anotan en el momento, antes de seguir jugando la ronda — y conviene anotarlos bien:
          para eso está{" "}
          <Link to="/" className="text-yellow-200 hover:underline">
            el anotador de truco online
          </Link>
          .
        </p>

        <ArticleFaq faqs={faqs} />

        <p className="mt-10">
          ¿Querés repasar el resto del juego? Mirá las{" "}
          <Link to="/reglas-del-truco" className="text-yellow-200 hover:underline">
            reglas completas del truco argentino
          </Link>{" "}
          o aprendé{" "}
          <Link to="/como-anotar-los-puntos-del-truco" className="text-yellow-200 hover:underline">
            cómo anotar los puntos con fósforos
          </Link>
          .
        </p>
      </div>
    </article>
  </ArticleLayout>
);

export default ValoresDelEnvido;
