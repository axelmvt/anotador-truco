import type { RouteRecord } from "vite-react-ssg";
import Layout from "./Layout";
import Index from "./pages/Index";

// Rutas en formato data-router para que vite-react-ssg pueda prerenderizarlas.
export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <Layout />,
    entry: "src/Layout.tsx",
    children: [
      { index: true, element: <Index /> },
      {
        path: "blog",
        lazy: async () => ({ Component: (await import("./pages/Blog")).default }),
      },
      {
        path: "reglas-del-truco",
        lazy: async () => ({ Component: (await import("./pages/ReglasDelTruco")).default }),
      },
      {
        path: "valores-del-envido",
        lazy: async () => ({ Component: (await import("./pages/ValoresDelEnvido")).default }),
      },
      {
        path: "como-anotar-los-puntos-del-truco",
        lazy: async () => ({ Component: (await import("./pages/ComoAnotarLosPuntos")).default }),
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await import("./pages/NotFound")).default }),
      },
    ],
  },
];
