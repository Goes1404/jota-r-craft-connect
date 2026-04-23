import React from 'react';
import { X, Plus, Minus, ShoppingBag, Diamond, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WHATSAPP_LINK } from '@/config/constants';
import { useNavigate } from 'react-router-dom';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-black/95 backdrop-blur-2xl border-white/10 p-0 flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]">
        {/* Header */}
        <SheetHeader className="p-8 border-b border-white/5 bg-[#0a0a0a]">
          <SheetTitle className="flex items-center gap-3">
            <div className="relative">
              <Diamond className="h-5 w-5 text-[#d4af37]" />
              <div className="absolute inset-0 bg-[#d4af37]/20 blur-lg rounded-full"></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Seu Vault</span>
          </SheetTitle>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center relative">
                <ShoppingBag className="h-8 w-8 text-white/10" />
                <div className="absolute inset-0 bg-white/5 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-white">O vault está vazio</h3>
                <p className="text-xs text-white/20 uppercase tracking-widest leading-relaxed">
                  Descubra peças únicas e inicie sua seleção exclusiva hoje.
                </p>
              </div>
              <Button 
                onClick={onClose}
                className="bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 hover:bg-[#d4af37] hover:text-black transition-all rounded-full px-8 py-6 text-[10px] font-black uppercase tracking-widest"
              >
                Explorar Coleção
              </Button>
            </div>
          ) : (
            <div className="p-8 space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="group relative flex items-center gap-6 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-[#d4af37]/20 transition-all">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/5 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover grayscale-0"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-white truncate uppercase tracking-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs font-serif font-bold text-[#d4af37]">
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1 bg-black/40 rounded-full border border-white/5 p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-[10px] font-black text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-4 right-4 text-white/10 hover:text-red-500/60 transition-colors p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-8 bg-[#0a0a0a] border-t border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Total da Seleção</span>
              <div className="text-right">
                <span className="text-2xl font-serif font-bold text-[#d4af37] block drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  R$ {getTotalPrice().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-white/10 uppercase tracking-widest font-bold">Impostos e taxas inclusos</span>
              </div>
            </div>
            
            <Button
              className="w-full bg-[#d4af37] hover:bg-[#f2ca50] text-black font-black py-8 rounded-full shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all uppercase tracking-[0.2em] text-[10px] group"
              onClick={handleCheckout}
            >
              Finalizar Pedido Seguro
              <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <p className="text-center text-[9px] text-white/10 uppercase tracking-[0.2em] font-bold">
              Atendimento Premium 24/7 disponível
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};