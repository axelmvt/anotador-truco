import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Head } from "vite-react-ssg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-truco-green px-4">
      <Head>
        <title>Página no encontrada | Anotador de Truco</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-white/80 mb-6">Uh, esta página no existe.</p>
        <a
          href="/"
          className="inline-block px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
        >
          Volver al anotador
        </a>
      </div>
    </div>
  );
};

export default NotFound;
