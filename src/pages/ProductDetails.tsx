import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, ShoppingBag, MessageCircle, Shield,
  RefreshCw, Truck, FileText, Star, Zap, ChevronDown, Minus, Plus,
  CheckCircle2, Package, BadgeCheck, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShippingCalculator } from '@/components/ShippingCalculator';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { ProductReviews } from '@/components/ProductReviews';
import { GoldenBlob } from '@/components/animations/GoldenBlob';
import { Magnetic } from '@/components/animations/Magnetic';
import { Reveal } from '@/components/animations/Reveal';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useProduct, useAppSettings } from '@/hooks/useProducts';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SmartShowcase } from '@/components/SmartShowcase';
import { WHATSAPP_LINK } from '@/config/constants';

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.07]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left
          text-[11px] font-black uppercase tracking-[0.2em] text-white/50
          hover:text-white/80 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded"
      >
        {title}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
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
    <div className="min-h-screen bg-[#050505]">
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 pb-32">
        <div className="animate-pulse space-y-4">
          <div className="h-[56vw] max-h-[520px] bg-white/5 rounded-3xl" />
          <div className="flex gap-2">
            {[0,1,2,3].map(i => <div key={i} className="w-16 h-16 bg-white/5 rounded-xl flex-shrink-0" />)}
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-3 bg-white/5 rounded w-24" />
            <div className="h-7 bg-white/5 rounded w-4/5" />
            <div className="h-10 bg-white/5 rounded w-2/5 mt-2" />
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Image Gallery with swipe ─────────────────────────────────────────────────
function Gallery({
  images,
  productName,
  isOutOfStock,
  isLowStock,
  stock,
  isFeatured,
}: {
  images: string[];
  productName: string;
  isOutOfStock: boolean;
  isLowStock: boolean;
  stock: number;
  isFeatured: boolean;
}) {
  const [active, setActive] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const dragStartX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  const goTo = (i: number) => setActive(Math.max(0, Math.min(images.length - 1, i)));
  const prev = () => goTo(active - 1);
  const next = () => goTo(active + 1);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    dragStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - dragStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll — don't interfere
    e.preventDefault();
    setDragOffset(dx);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    setDragOffset(0);
    if (Math.abs(dx) > 48) {
      dx > 0 ? next() : prev();
    }
  };

  // Mouse drag (desktop)
  const mouseStartX = useRef(0);
  const onMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    dragStartX.current = e.clientX;
    setIsDragging(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - dragStartX.current);
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const dx = mouseStartX.current - e.clientX;
    setDragOffset(0);
    if (Math.abs(dx) > 48) dx > 0 ? next() : prev();
  };

  return (
    <div className="relative space-y-3 select-none">
      {/* Glow behind gallery */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-6 z-0 rounded-[40px] bg-[#d4af37]/[0.07] blur-[60px]" />

      {/* Main image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="lumina-ring group relative z-[1] overflow-hidden rounded-2xl lg:rounded-3xl bg-[#0a0a0a] border border-white/[0.06] cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: '1 / 1' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { if (isDragging) { setIsDragging(false); setDragOffset(0); } }}
      >
        {/* Shine sweep */}
        <div className="lumina-shine pointer-events-none absolute inset-0 z-[5]" />
        {/* Track */}
        <div
          className="flex h-full transition-transform"
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(calc(-${active * (100 / images.length)}% + ${dragOffset / images.length}px))`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        >
          {images.map((src, i) => (
            <div key={i} className="flex items-center justify-center p-8 lg:p-12"
              style={{ width: `${100 / images.length}%`, flexShrink: 0 }}>
              <img
                src={src}
                alt={`${productName} — ${i + 1}`}
                onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
                className="w-full h-full object-contain mix-blend-lighten pointer-events-none"
              />
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {isFeatured && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d4af37]/15 backdrop-blur-md border border-[#d4af37]/30 text-[#d4af37] text-[9px] font-black uppercase tracking-widest">
              <BadgeCheck className="w-2.5 h-2.5" /> Destaque
            </span>
          )}
          {isLowStock && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 backdrop-blur-md border border-amber-400/30 text-amber-400 text-[9px] font-black uppercase tracking-widest">
              <Zap className="w-2.5 h-2.5" /> Últimas {stock}
            </span>
          )}
        </div>

        {/* Prev/Next arrows — desktop only */}
        {images.length > 1 && (
          <>
            <button onClick={prev} disabled={active === 0}
              className="hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all disabled:opacity-20">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={next} disabled={active === images.length - 1}
              className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all disabled:opacity-20">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300
                ${i === active ? 'w-5 bg-[#d4af37]' : 'w-1.5 bg-white/25'}`} />
            ))}
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/65 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-5 py-2 rounded-full backdrop-blur-sm">
              Esgotado
            </span>
          </div>
        )}
      </motion.div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Imagem ${i + 1}`}
              className={`shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-xl overflow-hidden border-2 transition-all duration-200
                ${i === active
                  ? 'border-[#d4af37] opacity-100 scale-[1.05]'
                  : 'border-white/[0.06] opacity-45 hover:opacity-75 hover:border-white/20'}`}
            >
              <img
                src={img}
                alt={`Miniatura ${i + 1}`}
                onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-contain bg-[#0a0a0a] p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'descricao' | 'especificacoes' | 'frete'>('descricao');

  const { trackProductView } = useAnalytics();
  const { data: product, isLoading } = useProduct(id!);
  const { data: settings } = useAppSettings();
  const { data: ratings } = useProductRatings();

  useEffect(() => {
    if (product?.id) trackProductView(product.id);
  }, [product?.id, trackProductView]);

  if (isLoading) return <LoadingSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <Header />
        <main className="max-w-screen-xl mx-auto px-4 pt-32 pb-20 text-center">
          <h1 className="text-2xl font-serif font-bold mb-3">Peça não encontrada</h1>
          <p className="text-white/40 mb-10 text-sm max-w-sm mx-auto">Este item pode ter sido removido da coleção.</p>
          <Button onClick={() => navigate('/produtos')}
            className="bg-[#d4af37] text-black font-bold px-8 rounded-full uppercase tracking-widest text-[10px] h-11">
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
  const maxQty = Math.min(product.stock, 10);
  const pixPrice = product.price * 0.95;
  const installment = (product.price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Rating real (agregado das reviews); fallback elegante quando ainda não há avaliações.
  const productRating = ratings?.[product.id];
  const hasReviews = !!productRating && productRating.review_count > 0;

  // Frete grátis: barra de progresso para incentivar a compra (gatilho antecipado).
  const freeShippingThreshold = Number(settings?.free_shipping_threshold) || 500;
  const subtotalForShipping = product.price * qty;
  const qualifiesFreeShipping = subtotalForShipping >= freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotalForShipping);
  const freeShippingProgress = Math.min((subtotalForShipping / freeShippingThreshold) * 100, 100);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    toast({ title: `${qty}× adicionado ✨`, description: product.name });
  };
  const handleBuyNow = () => { handleAddToCart(); navigate('/checkout'); };
  const handleWhatsApp = () => {
    const number = settings?.whatsapp_number ?? WHATSAPP_LINK.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! Tenho interesse em: ${product.name} (R$ ${fmt(product.price)})`);
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
  };
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copiado!' });
    }
  };

  return (
    <div className="lumina-grain relative min-h-screen bg-[#050505] text-[#e2e2e2] overflow-hidden selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
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

      {/* Layered background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_65%_55%_at_70%_-5%,rgba(212,175,55,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
        <GoldenBlob className="top-[2%] -right-[10%]" size={560} opacity={0.07} duration={18} />
        <GoldenBlob className="bottom-[10%] -left-[12%]" size={460} opacity={0.05} duration={22}
          xPath={[0, -50, 40, -20, 0]} yPath={[0, 40, -30, 20, 0]} />
      </div>

      <main className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 pb-36 lg:pt-28 lg:pb-24">

        {/* ── Back + Share row (mobile) ── */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Voltar</span>
          </button>

          {/* Breadcrumb desktop */}
          <nav aria-label="Navegação" className="hidden lg:flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.25em] text-white/20 absolute left-1/2 -translate-x-1/2">
            <Link to="/produtos" className="hover:text-white/50 transition-colors">Produtos</Link>
            <span className="text-white/10">/</span>
            <span className="text-[#d4af37] truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWishlisted(v => !v)}
              aria-label={wishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 active:scale-90
                ${wishlisted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-white/10 text-white/40 hover:text-white/80 hover:border-white/25 hover:bg-white/[0.02]'}`}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-400 text-red-400' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              aria-label="Compartilhar"
              className="w-10 h-10 rounded-full border border-white/10 text-white/40 flex items-center justify-center hover:text-white/80 hover:border-white/25 hover:bg-white/[0.02] transition-all duration-300 active:scale-90"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-24 mb-24 lg:mb-32">

          {/* Gallery */}
          <Gallery
            images={allImages}
            productName={product.name}
            isOutOfStock={isOutOfStock}
            isLowStock={isLowStock}
            stock={product.stock}
            isFeatured={!!product.is_featured}
          />

          {/* ── Info panel ── */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">

            <div>
              {/* Category */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-[9px] font-black uppercase tracking-[0.35em] text-[#d4af37] mb-2 drop-shadow-[0_0_12px_rgba(212,175,55,0.15)]"
              >
                {product.category || 'Coleção Exclusiva'}
              </motion.p>

              {/* Name */}
              <motion.h1
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.08] tracking-tight mb-4"
              >
                {product.name}
              </motion.h1>

              {/* Rating + stock */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5">
                {hasReviews ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(productRating!.avg_rating) ? 'text-[#d4af37] fill-[#d4af37] drop-shadow-[0_0_5px_rgba(212,175,55,0.4)]' : 'text-white/15'}`} />
                      ))}
                    </div>
                    <a href="#avaliacoes" className="text-xs text-white/40 font-semibold hover:text-[#d4af37] transition-colors">
                      {productRating!.avg_rating.toFixed(1)} · {productRating!.review_count}{' '}
                      {productRating!.review_count === 1 ? 'avaliação' : 'avaliações'}
                    </a>
                  </>
                ) : (
                  <a href="#avaliacoes" className="text-xs text-white/40 font-semibold hover:text-[#d4af37] transition-colors">
                    ★★★★★ Seja o primeiro a avaliar
                  </a>
                )}
                <span className="w-px h-3 bg-white/10" />
                <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest
                  ${isOutOfStock ? 'text-red-400' : 'text-emerald-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-400' : 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                  {isOutOfStock ? 'Esgotado' : `${product.stock} em estoque`}
                </span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

            {/* Price block */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="relative bg-gradient-to-br from-white/[0.03] to-white/[0.005] border border-white/[0.08] backdrop-blur-md rounded-2xl p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden group"
            >
              {/* Glowing decorative corner */}
              <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#d4af37]/8 blur-3xl group-hover:bg-[#d4af37]/12 transition-colors duration-500" />
              
              <div className="relative flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-white leading-none bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,255,255,0.05)]">
                  R$ {fmt(product.price)}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-3 gap-y-2 mt-3 items-center text-xs text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                    5% OFF
                  </span>
                  <span>no PIX</span>
                  <span className="text-white font-bold">R$ {fmt(pixPrice)}</span>
                </span>
                <span className="text-white/20">|</span>
                <span>ou 10x de <span className="text-white/70 font-semibold">R$ {installment}</span> sem juros</span>
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.05]">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Pague com:</span>
                <div className="flex gap-1.5">
                  {['PIX', 'VISA', 'MASTER', 'ELO'].map(f => (
                    <span key={f} className="text-[8px] font-black text-white/40 border border-white/10 px-2 py-0.5 rounded bg-white/[0.01]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Free shipping progress — gatilho de upsell */}
            {!isOutOfStock && (
              <div className={`rounded-2xl p-5 border backdrop-blur-sm transition-all duration-300
                ${qualifiesFreeShipping
                  ? 'bg-emerald-500/[0.03] border-emerald-500/15'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`p-1.5 rounded-lg ${qualifiesFreeShipping ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#d4af37]/5 text-[#d4af37]'}`}>
                    <Truck className="w-4 h-4 shrink-0" />
                  </div>
                  {qualifiesFreeShipping ? (
                    <p className="text-[11px] font-bold text-emerald-400 tracking-wide uppercase">
                      🎉 Frete Grátis Garantido!
                    </p>
                  ) : (
                    <p className="text-xs text-white/60 leading-snug">
                      Faltam <span className="font-extrabold text-white">R$ {fmt(amountToFreeShipping)}</span> para{' '}
                      <span className="text-[#d4af37] font-bold">Frete Grátis</span>
                    </p>
                  )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.02]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(212,175,55,0.3)]
                      ${qualifiesFreeShipping ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-[#d4af37] to-[#f2ca50]'}`}
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Qty selector */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40">Quantidade:</span>
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-1 py-1 hover:border-white/[0.1] transition-colors">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white/40
                      hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-white font-mono">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white/40
                      hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isLowStock && (
                  <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/5 border border-amber-400/10 px-2 py-0.5 rounded-md animate-pulse">
                    Apenas {product.stock} disponíveis!
                  </span>
                )}
              </div>
            )}

            {/* CTAs — desktop */}
            <div className="hidden lg:flex flex-col gap-3 pt-2">
              <Magnetic strength={0.15} className="w-full">
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="group relative flex w-full items-center justify-center gap-2.5 h-14 rounded-2xl overflow-hidden
                    bg-gradient-to-r from-[#d4af37] via-[#f5d066] to-[#d4af37] text-black font-black text-[11px] uppercase tracking-[0.25em]
                    shadow-[0_8px_32px_-8px_rgba(212,175,55,0.4)]
                    hover:shadow-[0_12px_40px_-4px_rgba(242,202,80,0.55)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300
                    disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="lumina-shine pointer-events-none absolute inset-0" />
                  <Zap className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{isOutOfStock ? 'Item Esgotado' : 'Comprar Agora'}</span>
                </button>
              </Magnetic>
              
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="group flex w-full items-center justify-center gap-2.5 h-14 rounded-2xl
                  bg-white/[0.03] border border-white/[0.08] text-white font-black text-[11px] uppercase tracking-[0.25em]
                  hover:bg-white/[0.06] hover:border-white/20 active:scale-[0.99] transition-all duration-350 disabled:opacity-30"
              >
                <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110" />
                Adicionar ao Carrinho
              </button>
              
              <button
                onClick={handleWhatsApp}
                className="group flex w-full items-center justify-center gap-2.5 h-12 rounded-2xl
                  bg-emerald-500/[0.02] border border-emerald-500/15 text-emerald-400/90 font-bold text-[10px] uppercase tracking-[0.2em]
                  hover:bg-emerald-500/[0.06] hover:text-emerald-300 hover:border-emerald-500/35 active:scale-[0.99] transition-all duration-350"
              >
                <MessageCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
                Falar no WhatsApp
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Truck,     label: 'Entrega Rápida',   sub: 'Todo o Brasil' },
                { icon: RefreshCw, label: 'Troca em 7 dias',  sub: 'Garantido CDC' },
                { icon: FileText,  label: 'Nota Fiscal',      sub: 'Todos os pedidos' },
                { icon: Shield,    label: 'Pagamento Seguro', sub: 'SSL 256-bit' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-300">
                  <div className="p-2 rounded-xl bg-[#d4af37]/5 text-[#d4af37] border border-[#d4af37]/10 group-hover:bg-[#d4af37]/10 group-hover:text-[#f2ca50] transition-colors duration-300">
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-white/80 leading-tight uppercase tracking-wider">{label}</p>
                    <p className="text-[9px] text-white/30 leading-tight mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping eta */}
            <div className="flex items-center gap-3.5 px-4.5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/[0.03] to-transparent border border-emerald-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
              <div className="relative flex items-center justify-center p-2 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                <Package className="w-4 h-4 shrink-0" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                  Pedido até às 16h — envio hoje
                </p>
                <p className="text-[9px] text-white/30 mt-0.5">Para Osasco/SP e região metropolitana.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <div className="flex border-b border-white/[0.06] bg-white/[0.01]">
                {([
                  { key: 'descricao',      label: 'Descrição' },
                  { key: 'especificacoes', label: 'Especif.' },
                  { key: 'frete',          label: 'Frete' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all duration-300
                      ${activeTab === tab.key
                        ? 'text-[#d4af37] bg-[#d4af37]/[0.05] border-b-2 border-[#d4af37]'
                        : 'text-white/30 hover:text-white/60 border-b-2 border-transparent'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-5.5 min-h-[110px]">
                {activeTab === 'descricao' && (
                  <p className="text-sm text-white/50 leading-relaxed animate-in fade-in duration-300">
                    {product.description || 'Sem descrição disponível.'}
                    {product.detailed_description && (
                      <span className="block mt-3 pt-3 border-t border-white/[0.04] text-white/35 text-xs">{product.detailed_description}</span>
                    )}
                  </p>
                )}
                {activeTab === 'especificacoes' && (
                  <dl className="divide-y divide-white/[0.05] animate-in fade-in duration-300">
                    {[
                      { label: 'Categoria',        value: product.category || '—' },
                      { label: 'Disponibilidade',  value: isOutOfStock ? 'Esgotado' : `${product.stock} unidades` },
                      { label: 'Garantia',         value: '90 dias de fábrica' },
                      { label: 'Nota Fiscal',      value: 'Inclusa (Danfe Eletrônica)' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-3">
                        <dt className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</dt>
                        <dd className="text-[11px] font-semibold text-white/70 text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {activeTab === 'frete' && (
                  <div className="animate-in fade-in duration-300">
                    <ShippingCalculator totalValue={product.price} items={[{ id: product.id, quantity: 1 }]} />
                  </div>
                )}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]/50 shrink-0" />
              <p className="text-[9px] font-medium text-white/40 tracking-wider uppercase">
                Compra 100% segura. Proteção SSL criptografada.
              </p>
            </div>

          </div>
        </div>

        {/* ── Related ── */}
        <Reveal y={40} className="mb-24 lg:mb-28">
          <SmartShowcase
            title="Complete seu Estilo"
            subtitle="Selecionamos peças que combinam com este item."
            mode="related"
            category={product.category}
            excludeProductId={product.id}
            limit={4}
          />
        </Reveal>

        {/* ── Reviews ── */}
        <Reveal y={40} className="scroll-mt-24" >
          <div id="avaliacoes">
            <ProductReviews productId={product.id} />
          </div>
        </Reveal>

      </main>

      {/* ── Sticky CTA — mobile only ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
        {/* Gradient fade & container */}
        <div className="bg-gradient-to-t from-[#050505] via-[#050505]/98 to-transparent pt-8 px-4 pb-4 border-t border-white/[0.04] backdrop-blur-md"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>

          {/* WhatsApp slim row */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-2.5 rounded-xl bg-emerald-500/[0.02]
              border border-emerald-500/20 text-[#25D366]/80 text-[10px] font-black uppercase tracking-widest
              hover:bg-emerald-500/[0.05] hover:text-[#25D366] active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Perguntar no WhatsApp
          </button>

          {/* Main CTAs */}
          <div className="flex gap-2.5">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0
                bg-white/[0.04] border border-white/10 text-white
                disabled:opacity-30 active:scale-95 transition-all hover:bg-white/[0.07]"
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl
                bg-gradient-to-r from-[#d4af37] via-[#f2ca50] to-[#d4af37] text-black font-black text-[11px] uppercase tracking-widest
                shadow-[0_8px_24px_rgba(212,175,55,0.3)]
                disabled:opacity-30 active:scale-[0.98] transition-all"
            >
              <Zap className="w-4 h-4" />
              {isOutOfStock ? 'Esgotado' : `Comprar · R$ ${fmt(product.price * qty)}`}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetails;
