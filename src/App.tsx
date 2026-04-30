import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SiteLayout from "./components/layout/SiteLayout";
import Index from "./pages/Index.tsx";
import Services from "./pages/Services.tsx";
import ServiceListing from "./pages/ServiceListing.tsx";
import VendorDetail from "./pages/VendorDetail.tsx";
import VendorApplication from "./pages/VendorApplication.tsx";
import VendorApplicationSuccess from "./pages/VendorApplicationSuccess.tsx";
import BudgetPlanner from "./pages/BudgetPlanner.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:service" element={<ServiceListing />} />
            <Route path="/vendors/:id" element={<VendorDetail />} />
            <Route path="/list-your-service" element={<VendorApplication />} />
            <Route path="/list-your-service/success" element={<VendorApplicationSuccess />} />
            <Route path="/budget-planner" element={<BudgetPlanner />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
