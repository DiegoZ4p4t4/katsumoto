import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { ThemeProvider } from "./lib/theme-context";
import { TaxConfigProvider } from "./lib/tax-config-context";
import { PlatformProvider } from "./lib/platform";
import { BranchSelectionProvider } from "./lib/branch-selection-context";
import { CategoryImagesProvider } from "./lib/category-images-context";
import { RealtimeProvider } from "./lib/realtime-context";
import { useRealtime } from "./hooks/useRealtime";
import { Layout } from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const POS = lazy(() => import("./pages/POS"));
const CashRegisters = lazy(() => import("./pages/CashRegisters"));
const Inventory = lazy(() => import("./pages/Inventory"));
const MachineModels = lazy(() => import("./pages/MachineModels"));
const StockMovements = lazy(() => import("./pages/StockMovements"));
const Transfers = lazy(() => import("./pages/Transfers"));
const Invoices = lazy(() => import("./pages/Invoices"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const Clients = lazy(() => import("./pages/Clients"));
const Branches = lazy(() => import("./pages/Branches"));
const Orders = lazy(() => import("./pages/Orders"));
const TaxConfiguration = lazy(() => import("./pages/TaxConfiguration"));
const SunatConfigPage = lazy(() => import("./pages/SunatConfig"));
const SunatDocumentsPage = lazy(() => import("./pages/SunatDocuments"));
const Despatches = lazy(() => import("./pages/Despatches"));
const CreateDespatch = lazy(() => import("./pages/CreateDespatch"));
const PrinterSettingsPage = lazy(() => import("./pages/PrinterSettings"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StoreLayout = lazy(() => import("./pages/tienda/StoreLayout"));
const StoreIndex = lazy(() => import("./pages/tienda/StoreIndex"));
const StoreCartPage = lazy(() => import("./pages/tienda/StoreCartPage"));
const StoreCheckout = lazy(() => import("./pages/tienda/StoreCheckout"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
    </div>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  useRealtime(user?.organization_id);

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PlatformProvider>
      <BranchSelectionProvider>
        <CategoryImagesProvider>
          <TaxConfigProvider>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </Layout>
          </TaxConfigProvider>
        </CategoryImagesProvider>
      </BranchSelectionProvider>
    </PlatformProvider>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/tienda" element={<StoreLayout />}>
          <Route index element={<StoreIndex />} />
          <Route path="carrito" element={<StoreCartPage />} />
          <Route path="checkout" element={<StoreCheckout />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/cash-registers" element={<CashRegisters />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/machines" element={<MachineModels />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/stock" element={<StockMovements />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<CreateInvoice />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/tax-configuration" element={<TaxConfiguration />} />
          <Route path="/sunat-config" element={<SunatConfigPage />} />
          <Route path="/sunat-documents" element={<SunatDocumentsPage />} />
          <Route path="/despatches" element={<Despatches />} />
          <Route path="/despatches/new" element={<CreateDespatch />} />
          <Route path="/printer-settings" element={<PrinterSettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
