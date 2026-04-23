import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useExitIntent } from '@/hooks/useExitIntent';
import { Diamond, ShoppingBag, Gift, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ExitIntentPopup = () => {
  const { items } = useCart();
  const hasItems = items.length > 0;
  const { showPopup, setShowPopup } = useExitIntent(hasItems);
  const navigate = useNavigate();

  if (!hasItems) return null;

  const handleCheckout = () => {
    setShowPopup(false);
    // You could automatically apply a coupon here in a real scenario
    // For now, we direct them to finish the purchase (which is via WhatsApp in this app)
    // We can open the cart modal or navigate to a checkout page.
    // Since cart is a modal managed by Header usually, we'll navigate them to a generic place or just close and let them click cart.
    // Actually, we can dispatch a custom event to open the cart.
    const event = new CustomEvent('open-cart');
    window.dispatchEvent(event);
  };

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="max-w-md bg-black/95 backdrop-blur-2xl border-white/10 text-white p-0 overflow-hidden rounded-[32px] sm:rounded-[40px]">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
        
        <button 
          onClick={() => setShowPopup(false)}
          className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10 text-center relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(212,175,55,0.15)] animate-pulse">
            <Gift className="w-10 h-10 text-[#d4af37]" />
          </div>

          <h2 className="text-3xl font-serif font-bold text-white tracking-tight mb-3">
            Espere um <span className="text-[#d4af37] italic">momento</span>
          </h2>
          
          <p className="text-white/60 text-sm mb-8 leading-relaxed px-4">
            Notamos que você deixou itens exclusivos em sua seleção. 
            Finalize agora e garanta <strong className="text-white font-black">10% OFF</strong> e <strong className="text-white font-black">Frete Expresso</strong> cortesia da casa.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full mb-8 flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Código Exclusivo</span>
            <span className="text-sm font-mono font-black text-[#d4af37] tracking-[0.3em]">LUMINA10</span>
          </div>

          <Button 
            onClick={handleCheckout}
            className="w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] transition-all h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
          >
            <ShoppingBag className="w-4 h-4" />
            Finalizar Compra Agora
          </Button>

          <button 
            onClick={() => setShowPopup(false)}
            className="mt-6 text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors"
          >
            Vou perder esta oportunidade
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
