import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Diamond, Truck, Shield } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { CartModal } from './CartModal';
import { ThemeToggle } from './ThemeToggle';
import { INSTAGRAM_URL } from '@/config/constants';
export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const {
    getTotalItems
  } = useCart();
  const location = useLocation();
  const totalItems = getTotalItems();
  const isActive = (path: string) => location.pathname === path;
  const navLinks = [{
    path: '/',
    label: 'Início'
  }, {
    path: '/produtos',
    label: 'Produtos'
  }, {
    path: '/contato',
    label: 'Contato'
  }];
  return <>
      {/* Top Promotional Stripe - Inspired by Decathlon */}
      <div className="bg-primary text-primary-foreground py-1.5 px-4 text-center text-[10px] md:text-xs font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">
        <div className="flex justify-center items-center gap-8 animate-marquee md:animate-none">
          <span className="flex items-center gap-1.5"><Truck className="h-3 w-3" /> Frete Grátis acima de R$250</span>
          <span className="hidden md:flex items-center gap-1.5"><Shield className="h-3 w-3" /> 100% Original & Garantido</span>
          <span className="flex items-center gap-1.5"><Diamond className="h-3 w-3" /> Retire em Osasco hoje mesmo</span>
        </div>
      </div>
      
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Diamond className="h-6 w-6 text-primary absolute -top-4 left-1/2 -translate-x-1/2 animate-pulse fill-primary/20" />
                <h1 className="font-serif font-black text-foreground text-3xl tracking-tighter transition-all group-hover:text-primary">
                  JR <span className="text-primary italic font-light tracking-normal text-xl">acessorios</span>
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map(link => <Link key={link.path} to={link.path} className={`font-medium transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'}`}>
                  {link.label}
                </Link>)}
            </nav>

            {/* Cart and Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={() => setIsCartOpen(true)} className="relative p-2 text-xl">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-xs min-w-[1.25rem] h-5 flex items-center justify-center font-medium">
                      {totalItems}
                    </span>}
                </Button>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  Instagram
                </a>
              </div>

              {/* Mobile Menu Button */}
              <Button variant="ghost" size="sm" className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && <nav className="md:hidden py-4 border-t border-border">
              {navLinks.map(link => <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className={`block py-2 px-4 font-medium transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary' : 'text-muted-foreground'}`}>
                  {link.label}
                </Link>)}
            </nav>}
        </div>
      </header>

      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>;
};