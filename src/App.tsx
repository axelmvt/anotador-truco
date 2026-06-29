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
        path: "*",
        lazy: async () => ({ Component: (await import("./pages/NotFound")).default }),
      },
    ],
  },
];
