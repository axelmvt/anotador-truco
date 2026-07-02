import { Head } from "vite-react-ssg";
import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";
import ArticleFaq from "@/components/ArticleFaq";
import { faqJsonLd, type FaqItem } from "@/lib/seo";

// Señas tradicionales del truco rioplatense. Hay variantes regionales:
// la tabla refleja las más difundidas.
const senas: { carta: string; sena: string }[] = [
  { carta: "Ancho de espadas (1 de espadas)", sena: "Levantar las cejas" },
  { carta: "Ancho de bastos (1 de bastos)", sena: "Guiñar un ojo" },
  { carta: "Siete de espadas", sena: "Torcer la boca hacia la derecha" },
  { carta: "Siete de oros", sena: "Torcer la boca hacia la izquierda" },
  { carta: "Un tres (cualquier palo)", sena: "Morderse el labio inferior" },
  { carta: "Un dos (cualquier palo)", sena: "Fruncir los labios, como dando un beso" },
  { carta: "Ancho falso (1 de copas o de oros)", sena: "Entreabrir la boca" },
  { carta: "Flor", sena: "Arrugar la nariz" },
  { carta: "No tengo nada", sena: "Cerrar los dos ojos" },
];

const faqs: FaqItem[] = [
  {
    q: "¿Está permitido hacer señas en el truco?",
    a: "Sí, las señas son parte del juego cuando se juega en equipos: sirven para avisarle al compañero qué cartas tenés. La gracia está en hacerlas sin que el rival las vea.",
  },
  {
    q: "¿Cuáles son las señas más comunes del truco?",
    a: "Cejas levantadas para el ancho de espadas, guiño para el ancho de bastos, boca torcida a la derecha para el siete de espadas y a la izquierda para el siete de oros, labio mordido para los treses, beso para los doses, boca entreabierta para los anchos falsos y ojos cerrados para avisar que no se tiene nada.",
  },
  {
    q: "¿Qué pasa si el rival descubre una seña?",
    a: "No hay penalidad: simplemente el rival se entera de tu juego y puede aprovecharlo. Por eso las señas se hacen rápido, disimuladas o con señas falsas para confundir.",
  },
  {
    q: "¿Se usan señas jugando mano a mano (de a dos)?",
    a: "No. Las señas solo tienen sentido en partidas por equipos (de a 4 o de a 6), porque se usan para comunicarse con el compañero.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Las señas del truco argentino: cuáles son y cómo se usan",
  description:
    "Todas las señas del truco argentino: la seña de cada carta (ancho de espadas, siete de oros, los treses…), cómo usarlas sin que te descubran y qué variantes existen.",
  inLanguage: "es-AR",
  image: "https://truco.mvt.ar/og-image.png",
  mainEntityOfPage: "https://truco.mvt.ar/senas-del-truco",
  author: { "@type": "Organization", name: "Anotador de Truco" },
  publisher: { "@type": "Organization", name: "Anotador de Truco" },
};

const SenasDelTruco = () => (
  <ArticleLayout sectionLabel="Señas del Truco">
    <Head>
      <title>Las Señas del Truco Argentino: Tabla Completa y Cómo Usarlas</title>
      <meta
        name="description"
        content="La tabla completa de las señas del truco argentino: qué seña corresponde a cada carta, cómo hacerlas sin que te descubran y las variantes más comunes."
      />
      <link rel="canonical" href="https://truco.mvt.ar/senas-del-truco" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd(faqs))}</script>
    </Head>

    <article className="w-full max-w-4xl mx-auto px-4 py-8 text-white/90">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
        Las señas del truco: cuáles son y cómo se usan
      </h1>

      <div className="prose prose-invert max-w-none opacity-90">
        <p className="lead text-lg mb-6">
          En el truco por equipos está permitido —y es casi obligatorio— pasarle señas al compañero
          para avisarle qué cartas tenés. Cada carta importante tiene su gesto. Acá está la tabla
          completa de las señas tradicionales y los consejos para que no te las descubran.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">La tabla de señas</h2>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/30">
                <th className="py-2 pr-4 font-semibold text-white">Carta</th>
                <th className="py-2 font-semibold text-white">Seña</th>
              </tr>
            </thead>
            <tbody>
              {senas.map(({ carta, sena }) => (
                <tr key={carta} className="border-b border-white/10">
                  <td className="py-2 pr-4">{carta}</td>
                  <td className="py-2">{sena}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Las señas siguen el orden de importancia de las cartas: si tenés más de una carta buena, se
          seña primero la más alta. El orden completo está en{" "}
          <Link to="/reglas-del-truco" className="text-yellow-200 hover:underline">
            las reglas del truco
          </Link>
          .
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Cómo hacer señas sin que te descubran</h2>
        <ul className="list-disc pl-6 my-4 space-y-1">
          <li>
            <strong>Elegí el momento:</strong> la seña se pasa cuando los rivales miran sus cartas o
            están distraídos, no cuando te están mirando a vos.
          </li>
          <li>
            <strong>Rápido y natural:</strong> un gesto largo o exagerado se nota. La seña buena dura
            menos de un segundo.
          </li>
          <li>
            <strong>Señas falsas:</strong> hacer una seña sabiendo que el rival la va a ver es una
            táctica clásica para hacerle creer que tenés un juego que no tenés.
          </li>
          <li>
            <strong>Miradas repartidas:</strong> si mirás fijo a tu compañero antes de señar, ya lo
            anunciaste. Los buenos jugadores señan mirando a cualquier lado.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">Variantes regionales</h2>
        <p>
          La tabla de arriba es la más difundida en Argentina y Uruguay, pero hay mesas que usan señas
          propias: la lengua afuera para alguna carta, el hombro levantado, un dedo sobre la mesa. Si
          jugás con gente nueva, conviene acordar las señas antes de repartir — igual que se acuerda si
          se juega{" "}
          <Link to="/reglas-del-truco" className="text-yellow-200 hover:underline">
            con o sin flor
          </Link>
          .
        </p>

        <ArticleFaq faqs={faqs} />

        <p className="mt-10">
          Ya sabés señar: ahora que no se te escape el puntaje. Llevá la cuenta con{" "}
          <Link to="/" className="text-yellow-200 hover:underline">
            el anotador de truco online
          </Link>
          , gratis y sin conexión.
        </p>
      </div>
    </article>
  </ArticleLayout>
);

export default SenasDelTruco;
