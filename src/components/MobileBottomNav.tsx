import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Heart, User, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { easing } from '@/lib/motion';

const tabs = [
  { label: 'Início', path: '/', icon: Home },
  { label: 'Loja', path: '/produtos', icon: ShoppingBag },
  { label: 'Favoritos', path: '/favoritos', icon: Heart },
  { label: 'Conta', path: '/perfil', icon: User },
] as const;

/** Bottom nav mobile estilo app — fixa, glassmorphism, badge no carrinho. */
export const MobileBottomNav = () => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const path = location.pathname;
  // Esconde onde há barra de ação fixa própria (evita colisão com o CTA):
  // checkout, admin e a página de detalhes do produto.
  const hidden = path.startsWith('/admin') || path === '/checkout' || path.startsWith('/produto/');
  if (hidden) return null;

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4, ease: easing.expo }}
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 pointer-events-none"
      aria-label="Navegação mobile"
    >
      <div className="pointer-events-auto bg-black/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] px-2 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/' ? path === '/' : path.startsWith(tab.path);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-colors active:scale-95"
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 bg-primary/15 border border-primary/30 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={`relative h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-white/50'}`}
              />
              <span
                className={`relative text-[9px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-primary' : 'text-white/40'}`}
              >
                {tab.label}
              </span>
              {tab.path === '/produtos' && totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-background text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.6)]">
                  {totalItems}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};
