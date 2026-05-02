import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Addresses from "./pages/Addresses";
import Coupons from "./pages/Coupons";
import Payments from "./pages/Payments";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import SalesManagement from "./pages/SalesManagement";
import AdminCoupons from "./pages/AdminCoupons";
import AdminCustomers from "./pages/AdminCustomers";
import AdminReviews from "./pages/AdminReviews";
import AdminSettings from "./pages/AdminSettings";
import AdminAbandonedCarts from "./pages/AdminAbandonedCarts";
import AdminInventoryIntelligence from "./pages/AdminInventoryIntelligence";
import NotFound from "./pages/NotFound";
import { ExitIntentPopup } from "./components/ExitIntentPopup";
import { AICopilot } from "./components/AICopilot";

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
          <BrowserRouter>
            <ExitIntentPopup />
            <AICopilot />
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
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/sales" element={<SalesManagement />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/abandoned-carts" element={<AdminAbandonedCarts />} />
              <Route path="/admin/inventory-intelligence" element={<AdminInventoryIntelligence />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
