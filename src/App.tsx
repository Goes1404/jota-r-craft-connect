import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { ExitIntentPopup } from "./components/ExitIntentPopup";
import { AICopilot } from "./components/AICopilot";
import { CookieBanner } from "./components/CookieBanner";
import { ScrollToTop } from "./components/ScrollToTop";
import { SmoothScroll } from "./components/animations/SmoothScroll";
import { PageTransition } from "./components/animations/PageTransition";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { AdminMobileMenu } from "./components/AdminMobileMenu";
import { IntroLoader } from "./components/animations/IntroLoader";

// ─── lazy page imports ────────────────────────────────────────────────────────
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Coupons = lazy(() => import("./pages/Coupons"));
const Payments = lazy(() => import("./pages/Payments"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const SalesManagement = lazy(() => import("./pages/SalesManagement"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminAbandonedCarts = lazy(() => import("./pages/AdminAbandonedCarts"));
const AdminInventoryIntelligence = lazy(() => import("./pages/AdminInventoryIntelligence"));
const AdminStudio = lazy(() => import("./pages/AdminStudio"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Security = lazy(() => import("./pages/Security"));
const NotFound = lazy(() => import("./pages/NotFound"));
// ─────────────────────────────────────────────────────────────────────────────

const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-6 h-6 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <IntroLoader />
              <BrowserRouter>
                <ScrollToTop />
                <SmoothScroll>
                <ErrorBoundary>
                  <ExitIntentPopup />
                  <AICopilot />
                  <CookieBanner />
                  <MobileBottomNav />
                  <AdminMobileMenu />
                  <Suspense fallback={<PageLoader />}>
                    <PageTransition>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/produtos" element={<Products />} />
                      <Route path="/produto/:id" element={<ProductDetails />} />
                      <Route path="/contato" element={<Contact />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/login" element={<AdminLogin />} />
                      <Route path="/entrar" element={<AdminLogin />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/perfil" element={<Profile />} />
                      <Route path="/pedidos" element={<Orders />} />
                      <Route path="/enderecos" element={<Addresses />} />
                      <Route path="/cupons" element={<Coupons />} />
                      <Route path="/pagamentos" element={<Payments />} />
                      <Route path="/favoritos" element={<Wishlist />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                      <Route path="/admin/products" element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>} />
                      <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
                      <Route path="/admin/sales" element={<ProtectedAdminRoute><SalesManagement /></ProtectedAdminRoute>} />
                      <Route path="/admin/coupons" element={<ProtectedAdminRoute><AdminCoupons /></ProtectedAdminRoute>} />
                      <Route path="/admin/customers" element={<ProtectedAdminRoute><AdminCustomers /></ProtectedAdminRoute>} />
                      <Route path="/admin/reviews" element={<ProtectedAdminRoute><AdminReviews /></ProtectedAdminRoute>} />
                      <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
                      <Route path="/admin/abandoned-carts" element={<ProtectedAdminRoute><AdminAbandonedCarts /></ProtectedAdminRoute>} />
                      <Route path="/admin/inventory-intelligence" element={<ProtectedAdminRoute><AdminInventoryIntelligence /></ProtectedAdminRoute>} />
                      <Route path="/admin/studio" element={<ProtectedAdminRoute><AdminStudio /></ProtectedAdminRoute>} />
                      <Route path="/termos" element={<Terms />} />
                      <Route path="/privacidade" element={<Privacy />} />
                      <Route path="/perfil/seguranca" element={<Security />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </PageTransition>
                  </Suspense>
                </ErrorBoundary>
                </SmoothScroll>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
