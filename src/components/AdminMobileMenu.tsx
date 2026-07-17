import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, ShoppingBag, Ticket, Users, Layers,
  ShoppingCart, Star, Settings, Sparkles, Menu, Diamond,
} from 'lucide-react';

interface AdminMenuLink {
  label: string;
  path: string;
  icon: LucideIcon;
  highlight?: boolean;
}

const links: AdminMenuLink[] = [
  { label: 'Painel', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Estúdio IA', path: '/admin/studio', icon: Sparkles, highlight: true },
  { label: 'Coleção', path: '/admin/products', icon: Package },
  { label: 'Pedidos', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Cupons', path: '/admin/coupons', icon: Ticket },
  { label: 'CRM 360', path: '/admin/customers', icon: Users },
  { label: 'Estoque', path: '/admin/inventory-intelligence', icon: Layers },
  { label: 'Recuperar', path: '/admin/abandoned-carts', icon: ShoppingCart },
  { label: 'Reviews', path: '/admin/reviews', icon: Star },
  { label: 'Config', path: '/admin/settings', icon: Settings },
];

/** Menu flutuante de navegação do admin no mobile (sem mexer nos 11 headers). */
export const AdminMobileMenu = () => {
  const location = useLocation();
  if (!location.pathname.startsWith('/admin') || location.pathname === '/admin/login') return null;

  return (
    <div className="lg:hidden fixed bottom-5 right-5 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <button
            aria-label="Menu do admin"
            className="w-14 h-14 rounded-full bg-[#d4af37] text-black flex items-center justify-center shadow-[0_8px_30px_rgba(212,175,55,0.4)] active:scale-90 transition-transform"
          >
            <Menu className="w-6 h-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-black/95 border-[#d4af37]/20 backdrop-blur-2xl w-[280px] p-0 overflow-y-auto">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-left flex items-center gap-2">
              <Diamond className="h-5 w-5 text-[#d4af37]" />
              <span className="text-lg font-serif font-black text-[#d4af37] uppercase tracking-[0.2em]">
                JR <span className="text-white italic lowercase font-light">admin</span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-4 gap-1.5">
            {links.map((l) => {
              const active = location.pathname === l.path;
              const Icon = l.icon;
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                    active
                      ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30'
                      : l.highlight
                        ? 'text-[#d4af37] hover:bg-[#d4af37]/10'
                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-bold uppercase tracking-wider">{l.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};
