import React, { useMemo } from 'react';
import { X, Plus, Minus, ShoppingBag, Diamond, Trash2, ArrowRight, Zap, Sparkles, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREE_SHIPPING_THRESHOLD = 500;

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, addToCart } = useCart();
  const { data: allProducts = [] } = useProducts();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const totalPrice = getTotalPrice();
  const progressToFreeShipping = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totalPrice;

  // Lumina Upsell Logic: Suggest 1 low-cost accessory not in cart
  const upsellItem = useMemo(() => {
    if (cartItems.length === 0) return null;
    const cartIds = cartItems.map(i => i.id);
    
    return allProducts
      .filter(p => !cartIds.includes(p.id) && Number(p.price) < 150)
      .sort((a, b) => Number(b.stock) - Number(a.stock))[0]; // Take the top suggestion
  }, [allProducts, cartItems]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-[#050505] backdrop-blur-3xl border-l border-white/10 p-0 flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]">
        {/* Header */}
        <SheetHeader className="p-8 border-b border-white/5 bg-[#0a0a0a]/80">
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
              <div className="w-24 h-24 rounded-full bg-[#d4af37]/5 flex items-center justify-center relative">
                <ShoppingBag className="h-10 w-10 text-[#d4af37]/40" />
                <div className="absolute inset-0 bg-[#d4af37]/10 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-2xl font-bold text-white">O vault está vazio</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto font-bold">
                  Descubra peças únicas e inicie sua seleção exclusiva hoje.
                </p>
              </div>
              <Button 
                onClick={onClose}
                className="bg-[#d4af37] text-black hover:bg-[#f2ca50] transition-all rounded-full px-10 h-14 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                Explorar Coleção
              </Button>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              
              {/* Shipping Progress */}
              <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 p-5 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#d4af37]/10 blur-[40px] rounded-full"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${progressToFreeShipping >= 100 ? 'bg-green-500/20 text-green-500' : 'bg-[#d4af37]/20 text-[#d4af37]'}`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        {progressToFreeShipping >= 100 ? 'Frete Expresso Desbloqueado' : 'Frete Expresso Grátis'}
                      </h4>
                      <p className="text-xs text-white/40 font-bold">
                        {progressToFreeShipping >= 100 
                          ? 'Cortesia Lumina aplicada.' 
                          : <>Faltam <span className="text-[#d4af37]">R$ {amountToFreeShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></>}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${progressToFreeShipping >= 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gradient-to-r from-[#d4af37] to-[#f2ca50]'}`}
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Itens Selecionados</span>
                  <span className="text-[9px] font-black text-white/20">{cartItems.length} Itens</span>
                </div>
                {cartItems.map((item) => (
                  <div key={item.id} className="group relative flex items-center gap-5 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#d4af37]/30 hover:bg-white/[0.04] transition-all">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/5 flex-shrink-0 relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover mix-blend-lighten"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="text-xs font-bold text-white truncate uppercase tracking-wider pr-6">
                        {item.name}
                      </h3>
                      <p className="text-xs font-serif font-black text-[#d4af37]">
                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      
                      <div className="flex items-center gap-1 bg-black/60 rounded-full border border-white/10 p-1 w-fit">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-[10px] font-black text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors p-2 bg-black/40 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 1-Click Upsell */}
              {upsellItem && (
                <div className="pt-6 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-3 h-3 text-[#d4af37]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Sugestão Lumina</span>
                  </div>
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-[#d4af37]/5 to-transparent border border-[#d4af37]/20 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-black border border-[#d4af37]/20 overflow-hidden">
                      <img src={upsellItem.image || '/placeholder.svg'} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-white uppercase line-clamp-1">{upsellItem.name}</p>
                      <p className="text-xs font-serif font-black text-[#d4af37] mt-1">+ R$ {Number(upsellItem.price).toLocaleString('pt-BR')}</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        addToCart(upsellItem);
                        toast({ title: 'Item Adicionado', description: 'Seleção perfeita.' });
                      }}
                      className="bg-[#d4af37] text-black hover:bg-[#f2ca50] rounded-full h-8 w-8 p-0 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-8 bg-[#0a0a0a] border-t border-white/5 space-y-6 relative z-20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Subtotal</span>
                <span className="text-xs font-serif font-bold text-white/60">
                  R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Frete</span>
                <span className={`text-xs font-bold ${progressToFreeShipping >= 100 ? 'text-green-500' : 'text-white/60'}`}>
                  {progressToFreeShipping >= 100 ? 'Cortesia' : 'Calculado no Checkout'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Total Estimado</span>
                <span className="text-3xl font-serif font-black text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <Button
              className="w-full bg-[#d4af37] hover:bg-[#f2ca50] text-black font-black h-16 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.2)] transition-all uppercase tracking-[0.2em] text-[10px] group relative overflow-hidden"
              onClick={handleCheckout}
            >
              <span className="relative z-10 flex items-center justify-center">
                <Lock className="w-4 h-4 mr-2" />
                Finalizar Compra Segura
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Button>
            
            <div className="flex items-center justify-center gap-2 pt-2">
              <Zap className="w-3 h-3 text-[#d4af37]" />
              <p className="text-center text-[8px] text-white/30 uppercase tracking-[0.3em] font-black">
                Seus itens estão reservados por 15 minutos
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// Temporary lock icon component since it wasn't in the original imports but it looks good
const Lock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);