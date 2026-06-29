import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import { Analytics } from "@vercel/analytics/react";

// El home se carga de entrada (página principal); el resto va en chunks aparte.
const Blog = lazy(() => import("./pages/Blog"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <HelmetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="h-full w-full bg-truco-green" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/blog" element={<Blog />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </HelmetProvider>
);

export default App;
