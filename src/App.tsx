import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { AuthGate } from "@/components/AuthGate";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import BudgetDetail from "./pages/BudgetDetail";
import Categories from "./pages/Categories";
import Accounts from "./pages/Accounts";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthGate>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />

              <Route path="/transacties" element={<Transactions />} />

              <Route path="/budgetten" element={<Budgets />} />
              {/* detail: /budgetten/2026-02-01/<categoryId> */}
              <Route path="/budgetten/:periodStart/:categoryId" element={<BudgetDetail />} />

              <Route path="/categorieen" element={<Categories />} />
              <Route path="/categorieen/:id" element={<Categories />} />

              <Route path="/rekeningen" element={<Accounts />} />
              <Route path="/rekeningen/:id" element={<Accounts />} />

              <Route path="/instellingen" element={<SettingsPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AuthGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
