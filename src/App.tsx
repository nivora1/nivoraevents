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
import GuestPlanner from "./pages/GuestPlanner.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:service" element={<ServiceListing />} />
              <Route path="/vendors/:id" element={<VendorDetail />} />
              <Route path="/list-your-service" element={<VendorApplication />} />
              <Route path="/list-your-service/success" element={<VendorApplicationSuccess />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/budget-planner" element={<RequireAuth><BudgetPlanner /></RequireAuth>} />
              <Route path="/guest-planner" element={<RequireAuth><GuestPlanner /></RequireAuth>} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
