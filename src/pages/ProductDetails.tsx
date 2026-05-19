import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, ShoppingBag, MessageCircle, Shield,
  RefreshCw, Truck, FileText, Star, Zap, ChevronDown, Minus, Plus,
  CheckCircle2, Package, BadgeCheck, ZoomIn,
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
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-3">
            <div className="aspect-square bg-white/5 rounded-3xl" />
            <div className="flex gap-2">
              {[0,1,2,3].map(i => <div key={i} className="w-[22%] aspect-square bg-white/5 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-5 pt-4">
            <div className="h-3 bg-white/5 rounded w-20" />
            <div className="h-9 bg-white/5 rounded w-4/5" />
            <div className="h-4 bg-white/5 rounded w-1/3" />
            <div className="h-px bg-white/5" />
            <div className="h-10 bg-white/5 rounded w-2/5" />
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
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [activeTab, setActiveTab] = useState<'descricao' | 'especificacoes' | 'frete'>('descricao');
  const imgRef = useRef<HTMLDivElement>(null);

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
          <h1 className="text-2xl font-serif font-bold mb-3">Peça não encontrada</h1>
          <p className="text-white/40 mb-10 max-w-sm mx-auto text-sm">Este item pode ter sido removido de nossa coleção.</p>
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
  const maxQty = Math.min(product.stock, 10);
  const pixPrice = product.price * 0.95;
  const installment = (product.price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    toast({ title: `${qty}× adicionado ao carrinho ✨`, description: product.name });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

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
      toast({ title: 'Link copiado!', description: 'Compartilhe com quem quiser.' });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
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
        <div className="absolute top-[10%] right-0 w-[50%] h-[50%] rounded-full bg-[#d4af37] opacity-[0.02] blur-[160px]" />
        <div className="absolute bottom-[20%] left-0 w-[30%] h-[30%] rounded-full bg-[#d4af37] opacity-[0.015] blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 pt-24 pb-32">

        {/* Breadcrumb */}
        <nav aria-label="Navegação" className="flex items-center gap-2 mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 hover:text-white/50 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Voltar
          </button>
          <span className="text-white/10">/</span>
          <Link to="/produtos" className="hover:text-white/50 transition-colors">Produtos</Link>
          <span className="text-white/10">/</span>
          <span className="text-white/40 truncate max-w-[160px]">{product.name}</span>
        </nav>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-20 mb-28">

          {/* ════════════ GALERIA ════════════ */}
          <div className="space-y-3">

            {/* Imagem principal com zoom */}
            <div
              ref={imgRef}
              className={`relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/[0.06]
                aspect-square group cursor-zoom-in select-none`}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
            >
              <img
                key={activeImage}
                src={allImages[activeImage]}
                alt={`${product.name} — imagem ${activeImage + 1}`}
                onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
                className={`w-full h-full object-contain p-10 transition-all duration-500
                  ${zoomed ? 'scale-[1.65] origin-[var(--ox)_var(--oy)]' : 'scale-100'}`}
                style={zoomed ? {
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                } : {}}
                loading="eager"
                draggable={false}
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                {isLowStock && (
                  <div className="flex items-center gap-1.5 bg-amber-950/80 backdrop-blur-md border border-amber-400/30 rounded-full px-3 py-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                      Últimas {product.stock} unidades
                    </span>
                  </div>
                )}
                {product.is_featured && (
                  <div className="flex items-center gap-1.5 bg-[#d4af37]/10 backdrop-blur-md border border-[#d4af37]/30 rounded-full px-3 py-1.5">
                    <BadgeCheck className="w-3 h-3 text-[#d4af37]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">Destaque</span>
                  </div>
                )}
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl pointer-events-none">
                  <span className="text-xs font-black uppercase tracking-widest text-white/40 border border-white/10 px-5 py-2 rounded-full backdrop-blur-sm">
                    Esgotado
                  </span>
                </div>
              )}

              {/* Zoom hint */}
              {!zoomed && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <ZoomIn className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    Passe o mouse para ampliar
                  </span>
                </div>
              )}

              {/* Navegação de imagem por toque (mobile) */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                  {allImages.map((_, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImage ? 'bg-[#d4af37] w-4' : 'bg-white/20'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Ver imagem ${i + 1}`}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]
                      ${i === activeImage
                        ? 'border-[#d4af37] opacity-100 scale-[1.03]'
                        : 'border-white/[0.06] opacity-50 hover:opacity-80 hover:border-white/20'}`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${i + 1}`}
                      onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
                      className="w-full h-full object-contain bg-[#0a0a0a] p-2"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ════════════ PAINEL DE INFO ════════════ */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-0">

            {/* Topo: categoria + ações */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">
                {product.category || 'Coleção Exclusiva'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWishlisted(v => !v)}
                  aria-label={wishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all
                    ${wishlisted
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/60'}`}
                >
                  <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-400' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Compartilhar produto"
                  className="w-8 h-8 rounded-full border border-white/10 text-white/30 flex items-center justify-center hover:border-white/20 hover:text-white/60 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nome */}
            <h1 className="font-serif text-2xl md:text-[1.85rem] font-bold text-white leading-tight tracking-tight mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-0.5" aria-label="Avaliação 4.9 de 5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
                ))}
              </div>
              <span className="text-xs text-white/30 font-medium">4.9</span>
              <span className="w-1 h-1 bg-white/10 rounded-full" />
              <a href="#avaliacoes" className="text-xs text-white/30 hover:text-[#d4af37] transition-colors underline underline-offset-2">
                48 avaliações
              </a>
              <span className="w-1 h-1 bg-white/10 rounded-full" />
              <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                isOutOfStock ? 'text-red-400' : 'text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                {isOutOfStock ? 'Esgotado' : `${product.stock} em estoque`}
              </span>
            </div>

            <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-6" />

            {/* Bloco de preço */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-[2rem] font-black text-white tracking-tight leading-none">
                  R$ {fmt(product.price)}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35 mt-2">
                <span>
                  <span className="text-emerald-400 font-bold">5% off</span> no PIX —{' '}
                  <span className="text-white/60 font-semibold">R$ {fmt(pixPrice)}</span>
                </span>
                <span>ou 10× de <span className="text-white/60 font-semibold">R$ {installment}</span> sem juros</span>
              </div>

              {/* Ícones de pagamento */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.05]">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Pagamento seguro:</span>
                {['PIX', 'VISA', 'MASTER', 'ELO', 'AMEX'].map(flag => (
                  <span key={flag} className="text-[8px] font-black text-white/25 border border-white/10 px-1.5 py-0.5 rounded">
                    {flag}
                  </span>
                ))}
              </div>
            </div>

            {/* Seletor de quantidade */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4 mb-5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Quantidade</span>
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-full p-1">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/50
                      hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-white">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/50
                      hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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

            {/* CTAs */}
            <div className="space-y-2.5 mb-6">
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex w-full items-center justify-center gap-2.5 h-14 rounded-2xl
                  bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-[0.2em]
                  shadow-[0_8px_40px_-8px_rgba(212,175,55,0.45)]
                  hover:bg-[#f2ca50] hover:shadow-[0_12px_50px_-8px_rgba(242,202,80,0.5)]
                  active:scale-[0.985] transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <Zap className="w-4 h-4 shrink-0" />
                {isOutOfStock ? 'Item Esgotado' : 'Comprar Agora'}
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex w-full items-center justify-center gap-2.5 h-14 rounded-2xl
                  bg-white/[0.05] border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em]
                  hover:bg-white/[0.09] hover:border-white/20 active:scale-[0.985] transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                Adicionar ao Carrinho
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex w-full items-center justify-center gap-2.5 py-3 rounded-2xl
                  border border-[#25D366]/20 text-[#25D366]/70 font-bold text-[10px] uppercase tracking-[0.2em]
                  hover:bg-[#25D366]/5 hover:text-[#25D366] hover:border-[#25D366]/40 transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/30"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                Falar no WhatsApp
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { icon: Truck,        label: 'Entrega Rápida',   sub: 'Para todo o Brasil' },
                { icon: RefreshCw,    label: 'Troca em 7 dias',  sub: 'Garantido pelo CDC' },
                { icon: FileText,     label: 'Nota Fiscal',      sub: 'Em todos os pedidos' },
                { icon: Shield,       label: 'Pagamento Seguro', sub: 'Criptografia SSL' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Icon className="w-3.5 h-3.5 text-[#d4af37]/60 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold text-white/60">{label}</p>
                    <p className="text-[9px] text-white/25">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Entrega estimada */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 mb-6">
              <Package className="w-4 h-4 text-emerald-400/60 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
                  Pedido até às 16h — envio hoje
                </p>
                <p className="text-[9px] text-white/25 mt-0.5">Para Osasco/SP e região. Consulte frete abaixo.</p>
              </div>
            </div>

            {/* Tabs: Descrição / Especificações / Frete */}
            <div className="border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="flex border-b border-white/[0.07]">
                {([
                  { key: 'descricao', label: 'Descrição' },
                  { key: 'especificacoes', label: 'Especificações' },
                  { key: 'frete', label: 'Calcular Frete' },
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

              <div className="p-5 min-h-[100px]">
                {activeTab === 'descricao' && (
                  <div className="text-sm text-white/50 leading-relaxed space-y-3 animate-in fade-in duration-200">
                    <p>{product.description || 'Sem descrição disponível.'}</p>
                    {product.detailed_description && (
                      <p className="text-white/35 text-xs">{product.detailed_description}</p>
                    )}
                  </div>
                )}

                {activeTab === 'especificacoes' && (
                  <div className="animate-in fade-in duration-200">
                    <dl className="divide-y divide-white/[0.05]">
                      {[
                        { label: 'Categoria', value: product.category || '—' },
                        { label: 'Disponibilidade', value: isOutOfStock ? 'Esgotado' : `${product.stock} unidades` },
                        { label: 'Garantia', value: '90 dias contra defeito de fabricação' },
                        { label: 'Origem', value: 'Nacional' },
                        { label: 'Nota Fiscal', value: 'Emitida em todos os pedidos' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-2.5">
                          <dt className="text-[10px] font-bold uppercase tracking-widest text-white/25">{label}</dt>
                          <dd className="text-[11px] font-semibold text-white/60 text-right max-w-[55%]">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {activeTab === 'frete' && (
                  <div className="animate-in fade-in duration-200">
                    <ShippingCalculator totalValue={product.price} />
                  </div>
                )}
              </div>
            </div>

            {/* Compra verificada */}
            <div className="flex items-center gap-2.5 mt-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37]/60 shrink-0" />
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/60 font-bold">Compra 100% segura.</span>{' '}
                Seus dados são protegidos por criptografia SSL e nunca compartilhados.
              </p>
            </div>

          </div>
          {/* ═══════════════════════════════════════ */}
        </div>

        {/* ── Produtos relacionados ── */}
        <section className="mb-28">
          <SmartShowcase
            title="Complete seu Estilo"
            subtitle="Selecionamos peças que combinam perfeitamente com este item."
            mode="related"
            category={product.category}
            excludeProductId={product.id}
            limit={4}
          />
        </section>

        {/* ── Avaliações ── */}
        <div id="avaliacoes">
          <ProductReviews productId={product.id} />
        </div>

      </main>

      {/* ── Sticky CTA mobile ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-4 pb-safe-area-inset-bottom">
        <div className="pb-4 pt-3 bg-gradient-to-t from-black via-black/95 to-transparent">
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 flex items-center justify-center gap-2 h-13 py-3.5 rounded-2xl
                bg-white/[0.06] border border-white/10 text-white font-black text-[10px] uppercase tracking-widest
                disabled:opacity-30 active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Carrinho
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-[2] flex items-center justify-center gap-2 h-13 py-3.5 rounded-2xl
                bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-widest
                shadow-[0_8px_30px_-8px_rgba(212,175,55,0.5)]
                disabled:opacity-30 active:scale-[0.98] transition-all"
            >
              <Zap className="w-4 h-4" />
              {isOutOfStock ? 'Esgotado' : `Comprar · R$ ${fmt(product.price)}`}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetails;
