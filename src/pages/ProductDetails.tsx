import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Diamond, MessageCircle, ShoppingBag, Shield,
  RefreshCw, Truck, FileText, ChevronDown, Star, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShippingCalculator } from '@/components/ShippingCalculator';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { ProductReviews } from '@/components/ProductReviews';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useProduct, useAppSettings } from '@/hooks/useProducts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SmartShowcase } from '@/components/SmartShowcase';
import { WHATSAPP_LINK } from '@/config/constants';

// ─── Trust badge data ─────────────────────────────────────────────────────────
const TRUST = [
  { icon: Truck,     label: 'Entrega hoje',    sub: 'Osasco/SP' },
  { icon: RefreshCw, label: 'Troca em 7 dias', sub: 'Pelo CDC' },
  { icon: FileText,  label: 'Nota fiscal',     sub: 'Garantida' },
  { icon: Shield,    label: 'Pagamento',        sub: 'Criptografado' },
];

// ─── Accordion item ───────────────────────────────────────────────────────────
function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left
          text-xs font-black uppercase tracking-[0.2em] text-white/50
          hover:text-white/80 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="pb-5 text-sm text-white/50 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-screen-xl mx-auto px-6 pt-28 pb-20">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-square bg-white/5 rounded-2xl" />
            <div className="flex gap-3">
              {[0,1,2].map(i => <div key={i} className="w-20 h-20 bg-white/5 rounded-xl" />)}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-5">
            <div className="h-3 bg-white/5 rounded w-24" />
            <div className="h-8 bg-white/5 rounded w-4/5" />
            <div className="h-6 bg-white/5 rounded w-1/3" />
            <div className="h-40 bg-white/5 rounded-2xl" />
            <div className="h-14 bg-white/5 rounded-full" />
            <div className="h-14 bg-white/5 rounded-full" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0);

  const { trackProductView } = useAnalytics();
  const { data: product, isLoading } = useProduct(id!);
  const { data: settings } = useAppSettings();

  React.useEffect(() => {
    if (product?.id) trackProductView(product.id);
  }, [product?.id, trackProductView]);

  if (isLoading) return <LoadingSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="max-w-screen-xl mx-auto px-6 pt-32 pb-20 text-center">
          <Diamond className="h-10 w-10 text-[#d4af37] mx-auto mb-6 opacity-20" />
          <h1 className="text-2xl font-serif font-bold mb-3">Peça não encontrada</h1>
          <p className="text-white/40 mb-10 max-w-sm mx-auto text-sm">Este item pode ter sido removido de nossa coleção exclusiva.</p>
          <Button onClick={() => navigate('/produtos')} className="bg-[#d4af37] text-black font-bold px-8 rounded-full uppercase tracking-widest text-[10px] h-11">
            Explorar Coleção
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const allImages = product.images?.length ? product.images : [product.image || '/placeholder.svg'];
  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock <= 5;
  const installment = (product.price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const formattedPrice = product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const handleAddToCart = () => {
    addToCart(product);
    toast({ title: 'Adicionado ao carrinho ✨', description: product.name });
  };

  const handleWhatsApp = () => {
    const number = settings?.whatsapp_number ?? WHATSAPP_LINK.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! Gostaria de mais informações sobre: ${product.name}`);
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <SEO
        title={product.name}
        description={product.description}
        image={product.image}
        type="product"
        product={{
          name: product.name,
          description: product.description,
          image: product.image,
          price: product.price,
          availability: isOutOfStock ? 'OutOfStock' : 'InStock',
        }}
      />
      <Header />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[15%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.025] blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Breadcrumb */}
        <nav aria-label="Navegação" className="flex items-center gap-2 mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
          <Link to="/" className="hover:text-white/50 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/produtos" className="hover:text-white/50 transition-colors">Produtos</Link>
          <span>/</span>
          <span className="text-white/40">{product.category || 'Coleção'}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 mb-24">

          {/* ── Gallery ── */}
          <div className="lg:col-span-7 space-y-3">
            {/* Main image */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/[0.06] aspect-square group">
              <img
                key={activeImage}
                src={allImages[activeImage]}
                alt={`${product.name} — vista ${activeImage + 1}`}
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                className="w-full h-full object-contain p-10 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="eager"
              />
              {/* Floating badges on image */}
              {isLowStock && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-amber-400/30 rounded-full px-3 py-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                    Últimas {product.stock} unidades
                  </span>
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                  <span className="text-xs font-black uppercase tracking-widest text-white/40 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    Esgotado
                  </span>
                </div>
              )}
              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  Hover para ampliar
                </span>
              </div>
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Ver imagem ${i + 1}`}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]
                      ${i === activeImage
                        ? 'border-[#d4af37]'
                        : 'border-white/10 opacity-50 hover:opacity-80 hover:border-white/30'
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${i + 1}`}
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      className="w-full h-full object-contain bg-[#0a0a0a] p-2"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start space-y-0">

            {/* Category + Stock */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">
                {product.category || 'Tech Collection'}
              </span>
              <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                isOutOfStock
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                {isOutOfStock ? 'Esgotado' : 'Disponível'}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight mb-4">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-1" aria-label="Avaliação 4.9 de 5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= 5 ? 'text-[#d4af37] fill-[#d4af37]' : 'text-white/10'}`} />
                ))}
              </div>
              <span className="text-xs text-white/30 font-medium">4.9 · 48 avaliações</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mb-5" />

            {/* Price block */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl font-black text-[#d4af37] tracking-tight">
                  R$ {formattedPrice}
                </span>
                {!isOutOfStock && (
                  <span className="text-xs font-bold text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Em estoque
                  </span>
                )}
              </div>
              {!isOutOfStock && (
                <p className="text-xs text-white/30 mt-1.5">
                  ou <span className="text-white/50 font-bold">10×</span> de{' '}
                  <span className="text-white/50 font-bold">R$ {installment}</span> sem juros
                </p>
              )}
            </div>

            {/* CTA buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex w-full items-center justify-center gap-2.5 h-13 py-3.5 rounded-full
                  bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-[0.2em]
                  shadow-[0_8px_32px_-8px_rgba(212,175,55,0.5)]
                  hover:bg-[#f2ca50] hover:shadow-[0_12px_40px_-8px_rgba(242,202,80,0.5)]
                  active:scale-[0.99] transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#d4af37]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                {isOutOfStock ? 'Item Esgotado' : 'Adicionar ao Carrinho'}
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex w-full items-center justify-center gap-2.5 py-3.5 rounded-full
                  bg-white/[0.04] border border-white/10 text-white font-bold text-[11px] uppercase tracking-[0.2em]
                  hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.99] transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                Tirar dúvidas no WhatsApp
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {TRUST.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Icon className="w-3.5 h-3.5 text-[#d4af37]/60 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold text-white/60">{label}</p>
                    <p className="text-[9px] text-white/25">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Accordion: Descrição + Frete */}
            <div className="border-t border-white/5">
              <Accordion title="Descrição" defaultOpen>
                <p className="text-white/50 leading-relaxed">{product.description || 'Sem descrição disponível.'}</p>
              </Accordion>

              <Accordion title="Calcular Frete">
                <div className="pt-1">
                  <ShippingCalculator totalValue={product.price} />
                </div>
              </Accordion>

              <Accordion title="Devolução & Garantia">
                <ul className="space-y-2 text-white/40">
                  <li className="flex items-start gap-2"><span className="text-[#d4af37] mt-0.5">·</span> Troca ou devolução em até 7 dias corridos (CDC)</li>
                  <li className="flex items-start gap-2"><span className="text-[#d4af37] mt-0.5">·</span> Produto com defeito: troca imediata sem custo</li>
                  <li className="flex items-start gap-2"><span className="text-[#d4af37] mt-0.5">·</span> Garantia de autenticidade em todos os produtos</li>
                  <li className="flex items-start gap-2"><span className="text-[#d4af37] mt-0.5">·</span> Nota fiscal emitida para todos os pedidos</li>
                </ul>
              </Accordion>
            </div>

          </div>
        </div>

        {/* Related products */}
        <section className="mb-24">
          <SmartShowcase
            title="Complete seu Setup"
            subtitle="Nossa curadoria selecionou itens que combinam perfeitamente com esta peça."
            mode="related"
            category={product.category}
            excludeProductId={product.id}
            limit={4}
          />
        </section>

        {/* Reviews */}
        <ProductReviews productId={product.id} />

      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
