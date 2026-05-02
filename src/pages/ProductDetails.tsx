import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
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

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = {
  // Loading skeleton
  loadingPage: 'min-h-screen bg-black',
  loadingMain: 'container mx-auto px-6 py-32',
  loadingPulse: 'animate-pulse space-y-12',
  loadingBar: 'h-4 bg-white/5 rounded w-24',
  loadingGrid: 'grid lg:grid-cols-2 gap-16',
  loadingImage: 'aspect-square bg-white/5 rounded-3xl',
  loadingInfo: 'space-y-8',
  loadingTitle: 'h-12 bg-white/5 rounded w-3/4',
  loadingSubtitle: 'h-8 bg-white/5 rounded w-1/2',
  loadingDetails: 'space-y-4',
  loadingCard: 'h-32 bg-white/5 rounded-3xl',
  loadingBtn: 'h-16 bg-white/5 rounded-full',
  // Not-found state
  notFoundPage: 'min-h-screen bg-black text-white',
  notFoundMain: 'container mx-auto px-6 py-32 text-center',
  notFoundIcon: 'h-12 w-12 text-[#d4af37] mx-auto mb-6 opacity-20',
  notFoundTitle: 'text-3xl font-serif font-bold mb-4',
  notFoundDesc: 'text-white/40 mb-12 max-w-md mx-auto',
  notFoundBtn: 'bg-[#d4af37] text-black font-bold px-8 rounded-full uppercase tracking-widest text-[10px]',
  // Page
  page: 'min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]',
  bgGlow: 'fixed inset-0 pointer-events-none z-0',
  bgGlowOrb: 'absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.03] blur-[120px]',
  main: 'relative z-10 pt-32 pb-20 max-w-screen-2xl mx-auto px-6',
  backBtn: 'group flex items-center gap-3 text-white/30 hover:text-[#d4af37] transition-all mb-12 uppercase tracking-[0.2em] text-[10px] font-bold',
  backIcon: 'w-4 h-4 transition-transform group-hover:-translate-x-1',
  grid: 'grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24 mb-32',
  // Gallery
  gallery: 'lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000',
  galleryFrame: 'aspect-square rounded-[40px] overflow-hidden bg-[#0a0a0a] border border-white/5 relative group shadow-2xl',
  galleryImg: 'w-full h-full object-contain mix-blend-lighten group-hover:scale-105 transition-transform duration-1000 ease-out',
  carouselDots: 'absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-4',
  carouselBtn: 'relative left-0 translate-y-0 bg-black/40 backdrop-blur-md border-white/10',
  // Info panel
  infoPanel: 'lg:col-span-5 space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200',
  infoMeta: 'flex items-center gap-3',
  infoCategory: 'text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.3em]',
  infoTitle: 'font-serif text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight',
  infoPriceWrap: 'flex flex-col gap-1 pt-4',
  infoPrice: 'text-4xl font-serif font-bold text-[#d4af37]',
  descCard: 'bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 space-y-6',
  descText: 'text-sm text-white/60 leading-relaxed font-medium',
  shippingCard: 'bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8',
  ctaSection: 'space-y-4 pt-4',
  addBtn: 'w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] py-8 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#d4af37]/10',
  // Sections
  relatedSection: 'mb-32',
};
// ─────────────────────────────────────────────────────────────────────────────

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
    if (product?.id) {
      trackProductView(product.id);
    }
  }, [product?.id, trackProductView]);

  const handleWhatsAppContact = () => {
    if (!product || !settings?.whatsapp_number) return;
    
    const message = encodeURIComponent(`Olá! Gostaria de saber mais sobre o produto exclusivo: ${product.name}`);
    const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      toast({
        title: "Seleção Adicionada",
        description: `${product.name} agora faz parte do seu vault.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingPage}>
        <Header />
        <main className={styles.loadingMain}>
          <div className={styles.loadingPulse}>
            <div className={styles.loadingBar}></div>
            <div className={styles.loadingGrid}>
              <div className={styles.loadingImage}></div>
              <div className={styles.loadingInfo}>
                <div className={styles.loadingTitle}></div>
                <div className={styles.loadingSubtitle}></div>
                <div className={styles.loadingDetails}>
                  <div className={styles.loadingCard}></div>
                  <div className={styles.loadingBtn}></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFoundPage}>
        <Header />
        <main className={styles.notFoundMain}>
          <Diamond className={styles.notFoundIcon} />
          <h1 className={styles.notFoundTitle}>Peça não encontrada</h1>
          <p className={styles.notFoundDesc}>Este item pode ter sido removido de nossa coleção exclusiva.</p>
          <Button onClick={() => navigate('/produtos')} className={styles.notFoundBtn}>
            Explorar Coleção
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const allImages = product.images?.length ? product.images : [product.image || '/placeholder.svg'];

  return (
    <div className={styles.page}>
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
          availability: product.stock > 0 ? 'InStock' : 'OutOfStock',
        }}
      />
      <Header />

      <div className={styles.bgGlow}>
        <div className={styles.bgGlowOrb}></div>
      </div>

      <main className={styles.main}>
        <button onClick={() => navigate(-1)} className={styles.backBtn} aria-label="Voltar à coleção">
          <ArrowLeft className={styles.backIcon} />
          Voltar à Coleção
        </button>

        <div className={styles.grid}>
          {/* Gallery */}
          <div className={styles.gallery}>
            <div className={styles.galleryFrame}>
              <Carousel className="w-full h-full" onSelect={(index) => setActiveImage(index)}>
                <CarouselContent className="h-full">
                  {allImages.map((img, idx) => (
                    <CarouselItem key={idx} className="h-full flex items-center justify-center p-8 md:p-16">
                      <img
                        src={img}
                        alt={`${product.name} - View ${idx + 1}`}
                        className={styles.galleryImg}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {allImages.length > 1 && (
                  <div className={styles.carouselDots}>
                    <CarouselPrevious className={styles.carouselBtn} />
                    <CarouselNext className={styles.carouselBtn} />
                  </div>
                )}
              </Carousel>
            </div>
          </div>

          {/* Info */}
          <div className={styles.infoPanel}>
            <div className="space-y-4">
              <div className={styles.infoMeta}>
                <span className={styles.infoCategory}>{product.category || 'Tech Collection'}</span>
                {product.stock > 0 && <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] uppercase tracking-widest">In Stock</Badge>}
              </div>
              <h1 className={styles.infoTitle}>{product.name}</h1>
              <div className={styles.infoPriceWrap}>
                <span className={styles.infoPrice}>
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className={styles.descCard}>
              <p className={styles.descText}>{product.description}</p>
            </div>

            <div className={styles.shippingCard}>
              <ShippingCalculator totalValue={product.price} />
            </div>

            <div className={styles.ctaSection}>
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={styles.addBtn}
              >
                {product.stock === 0 ? 'Item Esgotado' : 'Adicionar ao Carrinho'}
              </Button>
            </div>
          </div>
        </div>

        <section className={styles.relatedSection}>
          <SmartShowcase
            title="Complete seu Setup"
            subtitle="Baseado nesta peça, nossa curadoria selecionou itens que combinam perfeitamente."
            mode="related"
            category={product.category}
            excludeProductId={product.id}
            limit={4}
          />
        </section>

        <ProductReviews productId={product.id} />
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;