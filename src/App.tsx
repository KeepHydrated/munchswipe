import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import RandomPick from "./pages/RandomPick";
import Likes from "./pages/Likes";
import HiddenRestaurants from "./pages/HiddenRestaurants";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RestaurantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RandomPick />} />
            <Route path="/likes" element={<Likes />} />
            <Route path="/hidden" element={<HiddenRestaurants />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RestaurantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
