import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Diamond, Home, ShoppingBag, MessageCircle, Phone } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CartModal } from './CartModal';

export const Header: React.FC = () => {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Início', path: '/', icon: Home },
    { label: 'Produtos', path: '/produtos', icon: ShoppingBag },
    { label: 'Contato', path: '/contato', icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'py-3 bg-black/80 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="flex justify-between items-center w-full px-6 max-w-screen-2xl mx-auto">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative">
            <Diamond className="h-6 w-6 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <span className="text-xl md:text-2xl font-serif font-black text-primary uppercase tracking-[0.2em] transition-all">
            JR <span className="text-white italic lowercase font-light tracking-normal opacity-80">acessorios</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              className={`relative group text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                isActive(link.path) ? 'text-primary' : 'text-white/60 hover:text-white'
              }`}
            >
              {link.label}
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full ${
                isActive(link.path) ? 'w-full' : ''
              }`}></span>
            </Link>
          ))}
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-1 md:gap-4 text-primary">
          <button className="hidden sm:flex hover:bg-white/5 transition-all duration-300 p-2.5 rounded-full active:scale-90 items-center justify-center relative">
            <Search className="h-5 w-5 text-white/40" />
          </button>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="hover:bg-white/5 transition-all duration-300 p-2.5 rounded-full active:scale-90 flex items-center justify-center relative group"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 bg-primary text-background text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                {totalItems}
              </span>
            )}
            <div className="absolute inset-0 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <Link to="/login" className="hover:bg-white/5 transition-all duration-300 p-2.5 rounded-full active:scale-90 flex items-center justify-center relative group">
            <User className="h-5 w-5" />
            <div className="absolute inset-0 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden hover:bg-white/5 transition-all duration-300 p-2.5 rounded-full active:scale-90 flex items-center justify-center">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black/95 border-primary/20 backdrop-blur-2xl w-[300px] p-0 overflow-hidden">
              <SheetHeader className="p-8 border-b border-primary/10">
                <SheetTitle className="text-left">
                  <div className="flex items-center gap-2">
                    <Diamond className="h-5 w-5 text-primary" />
                    <span className="text-lg font-serif font-black text-primary uppercase tracking-[0.2em]">
                      JR <span className="text-white italic lowercase font-light tracking-normal opacity-80">acessorios</span>
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-6 gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isActive(link.path) 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <link.icon className={`h-5 w-5 ${isActive(link.path) ? 'text-primary' : 'text-white/20'}`} />
                    <span className="text-sm font-bold uppercase tracking-widest">{link.label}</span>
                  </Link>
                ))}
                <Link 
                  to="/login"
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isActive('/login') 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <User className={`h-5 w-5 ${isActive('/login') ? 'text-primary' : 'text-white/20'}`} />
                  <span className="text-sm font-bold uppercase tracking-widest">Minha Conta</span>
                </Link>
              </div>
              <div className="absolute bottom-12 left-0 w-full px-10 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/10 font-bold">Lumina Tech Experience</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};