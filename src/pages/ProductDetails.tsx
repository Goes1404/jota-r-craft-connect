import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useProduct, useAppSettings } from '@/hooks/useProducts';
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
    <div className="space-y-3 select-none">
      {/* Main image */}
      <div
        className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-[#0a0a0a] border border-white/[0.06] cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: '1 / 1' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { if (isDragging) { setIsDragging(false); setDragOffset(0); } }}
      >
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
      </div>

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
    <div className="min-h-screen bg-[#050505] text-[#e2e2e2] selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
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
        <div className="absolute top-[5%] right-0 w-[45%] h-[45%] rounded-full bg-[#d4af37] opacity-[0.02] blur-[160px]" />
        <div className="absolute bottom-[20%] left-0 w-[30%] h-[35%] rounded-full bg-[#d4af37] opacity-[0.015] blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 pb-36 lg:pt-24 lg:pb-20">

        {/* ── Back + Share row (mobile) ── */}
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/30 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Voltar</span>
          </button>

          {/* Breadcrumb desktop */}
          <nav aria-label="Navegação" className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 absolute left-1/2 -translate-x-1/2">
            <Link to="/produtos" className="hover:text-white/50 transition-colors">Produtos</Link>
            <span className="text-white/10">/</span>
            <span className="text-white/40 truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWishlisted(v => !v)}
              aria-label={wishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-90
                ${wishlisted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/20'}`}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-400' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              aria-label="Compartilhar"
              className="w-9 h-9 rounded-full border border-white/10 text-white/30 flex items-center justify-center hover:text-white/60 hover:border-white/20 transition-all active:scale-90"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-16 mb-20">

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
          <div className="lg:sticky lg:top-24 lg:self-start space-y-0">

            {/* Category */}
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] mb-2">
              {product.category || 'Coleção Exclusiva'}
            </p>

            {/* Name */}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight mb-3">
              {product.name}
            </h1>

            {/* Rating + stock */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mb-4">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
                ))}
              </div>
              <span className="text-xs text-white/30 font-medium">4.9 · 48 avaliações</span>
              <span className="w-px h-3 bg-white/10" />
              <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest
                ${isOutOfStock ? 'text-red-400' : 'text-emerald-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                {isOutOfStock ? 'Esgotado' : `${product.stock} em estoque`}
              </span>
            </div>

            <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-5" />

            {/* Price block */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white leading-none">
                  R$ {fmt(product.price)}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/35">
                <span>
                  <span className="text-emerald-400 font-bold">5% off</span> no PIX —{' '}
                  <span className="text-white/60 font-semibold">R$ {fmt(pixPrice)}</span>
                </span>
                <span>ou 10× de <span className="text-white/60 font-semibold">R$ {installment}</span></span>
              </div>
              <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-white/[0.05]">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Pague com:</span>
                {['PIX', 'VISA', 'MASTER', 'ELO'].map(f => (
                  <span key={f} className="text-[8px] font-black text-white/25 border border-white/10 px-1.5 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Qty selector */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Qtd.</span>
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-full px-1 py-1">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50
                      hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-white">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50
                      hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {isLowStock && (
                  <span className="text-[10px] text-amber-400/80 font-bold">
                    Apenas {product.stock} disp.
                  </span>
                )}
              </div>
            )}

            {/* CTAs — desktop */}
            <div className="hidden lg:flex flex-col gap-2.5 mb-5">
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex w-full items-center justify-center gap-2.5 h-14 rounded-2xl
                  bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-[0.2em]
                  shadow-[0_8px_40px_-8px_rgba(212,175,55,0.45)]
                  hover:bg-[#f2ca50] active:scale-[0.985] transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                {isOutOfStock ? 'Item Esgotado' : 'Comprar Agora'}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex w-full items-center justify-center gap-2.5 h-14 rounded-2xl
                  bg-white/[0.05] border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em]
                  hover:bg-white/[0.09] hover:border-white/20 active:scale-[0.985] transition-all disabled:opacity-30"
              >
                <ShoppingBag className="w-4 h-4" />
                Adicionar ao Carrinho
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex w-full items-center justify-center gap-2.5 py-3 rounded-2xl
                  border border-[#25D366]/20 text-[#25D366]/70 font-bold text-[10px] uppercase tracking-[0.2em]
                  hover:bg-[#25D366]/5 hover:text-[#25D366] hover:border-[#25D366]/40 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Falar no WhatsApp
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { icon: Truck,     label: 'Entrega Rápida',   sub: 'Todo o Brasil' },
                { icon: RefreshCw, label: 'Troca em 7 dias',  sub: 'Garantido CDC' },
                { icon: FileText,  label: 'Nota Fiscal',      sub: 'Todos os pedidos' },
                { icon: Shield,    label: 'Pagamento Seguro', sub: 'SSL 256-bit' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Icon className="w-3.5 h-3.5 text-[#d4af37]/60 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-white/60">{label}</p>
                    <p className="text-[9px] text-white/25">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping eta */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 mb-5">
              <Package className="w-4 h-4 text-emerald-400/60 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
                  Pedido até às 16h — envio hoje
                </p>
                <p className="text-[9px] text-white/25 mt-0.5">Para Osasco/SP e região.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="flex border-b border-white/[0.07]">
                {([
                  { key: 'descricao',      label: 'Descrição' },
                  { key: 'especificacoes', label: 'Especif.' },
                  { key: 'frete',          label: 'Frete' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all
                      ${activeTab === tab.key
                        ? 'text-[#d4af37] bg-[#d4af37]/[0.04] border-b-2 border-[#d4af37]'
                        : 'text-white/30 hover:text-white/60 border-b-2 border-transparent'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-4 min-h-[90px]">
                {activeTab === 'descricao' && (
                  <p className="text-sm text-white/50 leading-relaxed animate-in fade-in duration-200">
                    {product.description || 'Sem descrição disponível.'}
                    {product.detailed_description && (
                      <span className="block mt-2 text-white/30 text-xs">{product.detailed_description}</span>
                    )}
                  </p>
                )}
                {activeTab === 'especificacoes' && (
                  <dl className="divide-y divide-white/[0.05] animate-in fade-in duration-200">
                    {[
                      { label: 'Categoria',        value: product.category || '—' },
                      { label: 'Disponibilidade',  value: isOutOfStock ? 'Esgotado' : `${product.stock} un.` },
                      { label: 'Garantia',         value: '90 dias' },
                      { label: 'Nota Fiscal',      value: 'Em todos os pedidos' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2.5">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-white/25">{label}</dt>
                        <dd className="text-[11px] font-semibold text-white/60 text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {activeTab === 'frete' && (
                  <div className="animate-in fade-in duration-200">
                    <ShippingCalculator totalValue={product.price} />
                  </div>
                )}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2.5 mt-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37]/60 shrink-0" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/55 font-bold">Compra 100% segura.</span>{' '}
                Dados protegidos por SSL · nunca compartilhados.
              </p>
            </div>

          </div>
        </div>

        {/* ── Related ── */}
        <section className="mb-20">
          <SmartShowcase
            title="Complete seu Estilo"
            subtitle="Selecionamos peças que combinam com este item."
            mode="related"
            category={product.category}
            excludeProductId={product.id}
            limit={4}
          />
        </section>

        {/* ── Reviews ── */}
        <div id="avaliacoes">
          <ProductReviews productId={product.id} />
        </div>

      </main>

      {/* ── Sticky CTA — mobile only ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
        {/* Gradient fade */}
        <div className="bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pt-6 px-4 pb-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>

          {/* WhatsApp slim row */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-xl
              border border-[#25D366]/15 text-[#25D366]/60 text-[10px] font-bold uppercase tracking-widest
              hover:bg-[#25D366]/5 hover:text-[#25D366] transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Perguntar no WhatsApp
          </button>

          {/* Main CTAs */}
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0
                bg-white/[0.06] border border-white/10 text-white
                disabled:opacity-30 active:scale-95 transition-all"
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl
                bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-widest
                shadow-[0_8px_32px_-8px_rgba(212,175,55,0.5)]
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
