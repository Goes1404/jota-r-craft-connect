import React, { useMemo } from 'react';
import { Lock, Plus, Minus, ShoppingBag, Diamond, Trash2, ArrowRight, Zap, Sparkles, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useProducts, useAppSettings } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = {
  sheet: 'w-full sm:max-w-md bg-[#050505] backdrop-blur-3xl border-l border-white/10 p-0 flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]',
  header: 'p-8 border-b border-white/5 bg-[#0a0a0a]/80',
  title: 'flex items-center gap-3',
  titleGlow: 'absolute inset-0 bg-[#d4af37]/20 blur-lg rounded-full',
  scrollArea: 'flex-1 overflow-y-auto custom-scrollbar',
  // Empty state
  emptyWrap: 'h-full flex flex-col items-center justify-center p-12 text-center space-y-6',
  emptyIconWrap: 'w-24 h-24 rounded-full bg-[#d4af37]/5 flex items-center justify-center relative',
  emptyPing: 'absolute inset-0 bg-[#d4af37]/10 rounded-full animate-ping opacity-20',
  emptyTitle: 'font-serif text-2xl font-bold text-white',
  emptySubtitle: 'text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto font-bold',
  emptyBtn: 'bg-[#d4af37] text-black hover:bg-[#f2ca50] transition-all rounded-full px-10 h-14 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.2)]',
  // Filled state
  contentWrap: 'p-8 space-y-8',
  // Shipping progress
  shippingCard: 'bg-[#d4af37]/5 border border-[#d4af37]/20 p-5 rounded-3xl relative overflow-hidden group',
  shippingGlow: 'absolute -right-10 -top-10 w-32 h-32 bg-[#d4af37]/10 blur-[40px] rounded-full',
  shippingIconWrap: (complete: boolean) =>
    `p-2 rounded-xl ${complete ? 'bg-green-500/20 text-green-500' : 'bg-[#d4af37]/20 text-[#d4af37]'}`,
  shippingBarTrack: 'h-1.5 w-full bg-white/5 rounded-full overflow-hidden',
  shippingBarFill: (complete: boolean) =>
    `h-full rounded-full transition-all duration-1000 ${
      complete
        ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
        : 'bg-gradient-to-r from-[#d4af37] to-[#f2ca50]'
    }`,
  // Items list
  itemsHeaderRow: 'flex items-center justify-between px-2',
  itemsHeaderLabel: 'text-[9px] font-black uppercase tracking-[0.3em] text-white/20',
  itemRow: 'group relative flex items-center gap-5 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#d4af37]/30 hover:bg-white/[0.04] transition-all',
  itemThumb: 'w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/5 flex-shrink-0',
  itemThumbImg: 'w-full h-full object-cover mix-blend-lighten',
  itemInfo: 'flex-1 min-w-0 space-y-2',
  itemName: 'text-xs font-bold text-white truncate uppercase tracking-wider pr-6',
  itemPrice: 'text-xs font-serif font-black text-[#d4af37]',
  itemQtyRow: 'flex items-center gap-1 bg-black/60 rounded-full border border-white/10 p-1 w-fit',
  itemQtyBtn: 'h-9 w-9 flex items-center justify-center text-white/50 hover:text-white transition-colors',
  itemQtyNum: 'w-7 text-center text-xs font-black text-white',
  itemRemoveBtn: 'absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors p-2 bg-black/40 rounded-full opacity-0 group-hover:opacity-100',
  // Upsell
  upsellSection: 'pt-6 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700',
  upsellHeader: 'flex items-center gap-2 mb-4',
  upsellCard: 'p-4 rounded-3xl bg-gradient-to-r from-[#d4af37]/5 to-transparent border border-[#d4af37]/20 flex items-center gap-4',
  upsellThumb: 'w-14 h-14 rounded-xl bg-black border border-[#d4af37]/20 overflow-hidden',
  upsellAddBtn: 'bg-[#d4af37] text-black hover:bg-[#f2ca50] rounded-full h-8 w-8 p-0 flex items-center justify-center',
  // Footer
  footer: 'p-8 bg-[#0a0a0a] border-t border-white/5 space-y-6 relative z-20',
  summaryRow: 'flex items-center justify-between',
  summaryLabel: 'text-[10px] font-black uppercase tracking-[0.3em] text-white/30',
  shippingValueText: (free: boolean) => `text-xs font-bold ${free ? 'text-green-500' : 'text-white/60'}`,
  totalRow: 'flex items-center justify-between pt-4 border-t border-white/5',
  totalLabel: 'text-[10px] font-black uppercase tracking-[0.3em] text-white',
  totalValue: 'text-3xl font-serif font-black text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]',
  checkoutBtn: 'w-full bg-[#d4af37] hover:bg-[#f2ca50] text-black font-black h-16 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.2)] transition-all uppercase tracking-[0.2em] text-[10px] group relative overflow-hidden',
  checkoutShine: 'absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300',
  reserveNote: 'flex items-center justify-center gap-2 pt-2',
  reserveText: 'text-center text-[8px] text-white/30 uppercase tracking-[0.3em] font-black',
};
// ─────────────────────────────────────────────────────────────────────────────

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, addToCart } = useCart();
  const { data: allProducts = [] } = useProducts();
  const { data: settings } = useAppSettings();
  const FREE_SHIPPING_THRESHOLD = Number(settings?.free_shipping_threshold) || 500;
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalPrice = getTotalPrice();
  const progressToFreeShipping = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totalPrice;
  const isFreeShipping = progressToFreeShipping >= 100;

  const upsellItem = useMemo(() => {
    if (cartItems.length === 0) return null;
    const cartIds = cartItems.map((i) => i.id);
    return allProducts
      .filter((p) => !cartIds.includes(p.id) && Number(p.price) < 150)
      .sort((a, b) => Number(b.stock) - Number(a.stock))[0];
  }, [allProducts, cartItems]);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className={styles.sheet}>
        <SheetHeader className={styles.header}>
          <SheetTitle className={styles.title}>
            <div className="relative">
              <Diamond className="h-5 w-5 text-[#d4af37]" />
              <div className={styles.titleGlow} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Seu Vault</span>
          </SheetTitle>
        </SheetHeader>

        <div className={styles.scrollArea}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyWrap}>
              <div className={styles.emptyIconWrap}>
                <ShoppingBag className="h-10 w-10 text-[#d4af37]/40" />
                <div className={styles.emptyPing} />
              </div>
              <div className="space-y-3">
                <h3 className={styles.emptyTitle}>O vault está vazio</h3>
                <p className={styles.emptySubtitle}>
                  Descubra peças únicas e inicie sua seleção exclusiva hoje.
                </p>
              </div>
              <Button onClick={onClose} className={styles.emptyBtn}>
                Explorar Coleção
              </Button>
            </div>
          ) : (
            <div className={styles.contentWrap}>
              {/* Shipping progress */}
              <div className={styles.shippingCard}>
                <div className={styles.shippingGlow} />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={styles.shippingIconWrap(isFreeShipping)}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        {isFreeShipping ? 'Frete Expresso Desbloqueado' : 'Frete Expresso Grátis'}
                      </h4>
                      <p className="text-xs text-white/40 font-bold">
                        {isFreeShipping ? (
                          'Frete grátis aplicado!'
                        ) : (
                          <>Faltam <span className="text-[#d4af37]">R$ {amountToFreeShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={styles.shippingBarTrack}>
                    <div
                      className={styles.shippingBarFill(isFreeShipping)}
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className={styles.itemsHeaderRow}>
                  <span className={styles.itemsHeaderLabel}>Itens Selecionados</span>
                  <span className={styles.itemsHeaderLabel}>{cartItems.length} Itens</span>
                </div>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemThumb}>
                      <img src={item.image} alt={item.name} className={styles.itemThumbImg} />
                    </div>
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <p className={styles.itemPrice}>
                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className={styles.itemQtyRow}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className={styles.itemQtyBtn}
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className={styles.itemQtyNum}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className={styles.itemQtyBtn}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className={styles.itemRemoveBtn}
                      aria-label={`Remover ${item.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Upsell */}
              {upsellItem && (
                <div className={styles.upsellSection}>
                  <div className={styles.upsellHeader}>
                    <Sparkles className="w-3 h-3 text-[#d4af37]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Você também pode gostar</span>
                  </div>
                  <div className={styles.upsellCard}>
                    <div className={styles.upsellThumb}>
                      <img src={upsellItem.image || '/placeholder.svg'} alt={upsellItem.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-white uppercase line-clamp-1">{upsellItem.name}</p>
                      <p className="text-xs font-serif font-black text-[#d4af37] mt-1">
                        + R$ {Number(upsellItem.price).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        addToCart(upsellItem);
                        toast({ title: 'Item Adicionado', description: 'Seleção perfeita.' });
                      }}
                      className={styles.upsellAddBtn}
                      aria-label={`Adicionar ${upsellItem.name}`}
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
          <div className={styles.footer}>
            <div className="space-y-4">
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal</span>
                <span className="text-xs font-serif font-bold text-white/60">
                  R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Frete</span>
                <span className={styles.shippingValueText(isFreeShipping)}>
                  {isFreeShipping ? 'Cortesia' : 'Calculado no Checkout'}
                </span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total Estimado</span>
                <span className={styles.totalValue}>
                  R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <Button className={styles.checkoutBtn} onClick={handleCheckout}>
              <span className="relative z-10 flex items-center justify-center">
                <Lock className="w-4 h-4 mr-2" />
                Finalizar Compra Segura
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className={styles.checkoutShine} />
            </Button>

            <div className={styles.reserveNote}>
              <Zap className="w-3 h-3 text-[#d4af37]" />
              <p className={styles.reserveText}>Seus itens estão reservados por 15 minutos</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
