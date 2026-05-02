import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, Search, Diamond, Home, ShoppingBag, Phone } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CartModal } from './CartModal';

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = {
  header: (scrolled: boolean) =>
    `fixed w-full top-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'py-3 bg-black/80 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
        : 'py-6 bg-transparent'
    }`,
  inner: 'flex justify-between items-center w-full px-6 max-w-screen-2xl mx-auto',
  logoWrap: 'flex items-center gap-2 group shrink-0',
  logoIcon: 'h-6 w-6 text-primary animate-pulse',
  logoGlow: 'absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
  logoText: 'text-xl md:text-2xl font-serif font-black text-primary uppercase tracking-[0.2em] transition-all',
  logoSub: 'text-white italic lowercase font-light tracking-normal opacity-80',
  nav: 'hidden md:flex items-center gap-10',
  navLink: (active: boolean) =>
    `relative group text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
      active ? 'text-primary' : 'text-white/60 hover:text-white'
    }`,
  navUnderline: (active: boolean) =>
    `absolute -bottom-2 left-1/2 -translate-x-1/2 h-[2px] bg-primary transition-all duration-300 group-hover:w-full ${
      active ? 'w-full' : 'w-0'
    }`,
  actions: 'flex items-center gap-1 md:gap-4 text-primary',
  iconBtn: 'hover:bg-white/5 transition-all duration-300 p-2.5 rounded-full active:scale-90 flex items-center justify-center relative group',
  searchBtn: 'hidden sm:flex hover:bg-white/5 transition-all duration-300 p-2.5 rounded-full active:scale-90 items-center justify-center relative',
  cartBadge: 'absolute top-1 right-1 bg-primary text-background text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_rgba(212,175,55,0.5)]',
  iconGlow: 'absolute inset-0 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
  mobileBtn: 'md:hidden hover:bg-white/5 transition-all duration-300 p-2.5 rounded-full active:scale-90 flex items-center justify-center',
  drawer: 'bg-black/95 border-primary/20 backdrop-blur-2xl w-[300px] p-0 overflow-hidden',
  drawerHeader: 'p-8 border-b border-primary/10',
  drawerNav: 'flex flex-col p-6 gap-4 mt-8',
  drawerLink: (active: boolean) =>
    `flex items-center gap-4 p-4 rounded-xl transition-all ${
      active
        ? 'bg-primary/10 text-primary border border-primary/20'
        : 'text-white/40 hover:bg-white/5 hover:text-white'
    }`,
  drawerIcon: (active: boolean) => `h-5 w-5 ${active ? 'text-primary' : 'text-white/20'}`,
  drawerLabel: 'text-sm font-bold uppercase tracking-widest',
  drawerFooter: 'absolute bottom-12 left-0 w-full px-10 text-center',
  drawerFooterText: 'text-[10px] uppercase tracking-[0.3em] text-white/10 font-bold',
};
// ─────────────────────────────────────────────────────────────────────────────

const navLinks = [
  { label: 'Início', path: '/', icon: Home },
  { label: 'Produtos', path: '/produtos', icon: ShoppingBag },
  { label: 'Contato', path: '/contato', icon: Phone },
];

export const Header: React.FC = () => {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={styles.header(isScrolled)}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link to="/" className={styles.logoWrap}>
          <div className="relative">
            <Diamond className={styles.logoIcon} />
            <div className={styles.logoGlow} />
          </div>
          <span className={styles.logoText}>
            JR <span className={styles.logoSub}>acessorios</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={styles.navLink(isActive(link.path))}>
              {link.label}
              <span className={styles.navUnderline(isActive(link.path))} />
            </Link>
          ))}
        </nav>

        {/* Action icons */}
        <div className={styles.actions}>
          <button className={styles.searchBtn} aria-label="Buscar">
            <Search className="h-5 w-5 text-white/40" />
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className={styles.iconBtn}
            aria-label={`Carrinho — ${totalItems} itens`}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            <div className={styles.iconGlow} />
          </button>

          <Link to="/login" className={styles.iconBtn} aria-label="Minha conta">
            <User className="h-5 w-5" />
            <div className={styles.iconGlow} />
          </Link>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className={styles.mobileBtn} aria-label="Abrir menu">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className={styles.drawer}>
              <SheetHeader className={styles.drawerHeader}>
                <SheetTitle className="text-left">
                  <div className="flex items-center gap-2">
                    <Diamond className="h-5 w-5 text-primary" />
                    <span className="text-lg font-serif font-black text-primary uppercase tracking-[0.2em]">
                      JR <span className={styles.logoSub}>acessorios</span>
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className={styles.drawerNav}>
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} className={styles.drawerLink(isActive(link.path))}>
                    <link.icon className={styles.drawerIcon(isActive(link.path))} />
                    <span className={styles.drawerLabel}>{link.label}</span>
                  </Link>
                ))}
                <Link to="/login" className={styles.drawerLink(isActive('/login'))}>
                  <User className={styles.drawerIcon(isActive('/login'))} />
                  <span className={styles.drawerLabel}>Minha Conta</span>
                </Link>
              </div>
              <div className={styles.drawerFooter}>
                <p className={styles.drawerFooterText}>Lumina Tech Experience</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};
