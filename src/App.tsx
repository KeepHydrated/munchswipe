import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { usePageTracking } from "@/hooks/usePageTracking";
import RandomPick from "./pages/RandomPick";
import Find from "./pages/Find";
import Likes from "./pages/Likes";
import Matches from "./pages/Matches";
import HiddenRestaurants from "./pages/HiddenRestaurants";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  usePageTracking();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RestaurantProvider>
        <BrowserRouter>
          <AppContent />
          <Routes>
            <Route path="/" element={<RandomPick />} />
            <Route path="/find" element={<Find />} />
            <Route path="/likes" element={<Likes />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/hidden" element={<HiddenRestaurants />} />
            <Route path="/analytics" element={<Analytics />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RestaurantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
