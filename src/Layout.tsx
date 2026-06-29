import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";

// Providers globales + punto de montaje de cada ruta.
const Layout = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Outlet />
    <Analytics />
  </TooltipProvider>
);

export default Layout;
