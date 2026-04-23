import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, MessageCircle, Diamond, ShieldCheck, Truck, Gift, Star, Instagram, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { ProductReviews } from '@/components/ProductReviews';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useProduct, useAppSettings } from '@/hooks/useProducts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { INSTAGRAM_URL } from '@/config/constants';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { usePageVisit } = useAnalytics();
  const [activeImage, setActiveImage] = useState(0);

  const { trackProductView } = useAnalytics();
  const { data: product, isLoading } = useProduct(id!);
  const { data: settings } = useAppSettings();

  React.useEffect(() => {
    if (product?.id) {
      trackProductView(product.id);
    }
  }, [product?.id]);

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
      <div className="min-h-screen bg-black">
        <Header />
        <main className="container mx-auto px-6 py-32">
          <div className="animate-pulse space-y-12">
            <div className="h-4 bg-white/5 rounded w-24"></div>
            <div className="grid lg:grid-cols-2 gap-16">
              <div className="aspect-square bg-white/5 rounded-3xl"></div>
              <div className="space-y-8">
                <div className="h-12 bg-white/5 rounded w-3/4"></div>
                <div className="h-8 bg-white/5 rounded w-1/2"></div>
                <div className="space-y-4">
                  <div className="h-32 bg-white/5 rounded-3xl"></div>
                  <div className="h-16 bg-white/5 rounded-full"></div>
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
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="container mx-auto px-6 py-32 text-center">
          <Diamond className="h-12 w-12 text-[#d4af37] mx-auto mb-6 opacity-20" />
          <h1 className="text-3xl font-serif font-bold mb-4">Peça não encontrada</h1>
          <p className="text-white/40 mb-12 max-w-md mx-auto">Este item pode ter sido removido de nossa coleção exclusiva ou o link está incorreto.</p>
          <Button onClick={() => navigate('/produtos')} className="bg-[#d4af37] text-black font-bold px-8 rounded-full uppercase tracking-widest text-[10px]">
            Explorar Coleção
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const allImages = product.images?.length ? product.images : [product.image || '/placeholder.svg'];

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <SEO 
        title={product.name}
        description={product.description}
        image={product.image}
        type="product"
      />
      <Header />
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.03] blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-20 max-w-screen-2xl mx-auto px-6">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-white/30 hover:text-[#d4af37] transition-all mb-12 uppercase tracking-[0.2em] text-[10px] font-bold"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar à Coleção
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
          {/* Product Gallery Section */}
          <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="aspect-square rounded-[40px] overflow-hidden bg-[#0a0a0a] border border-white/5 relative group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
              
              <Carousel className="w-full h-full" onSelect={(index) => setActiveImage(index)}>
                <CarouselContent className="h-full">
                  {allImages.map((img, idx) => (
                    <CarouselItem key={idx} className="h-full flex items-center justify-center p-8 md:p-16">
                      <img
                        src={img}
                        alt={`${product.name} - View ${idx + 1}`}
                        className="w-full h-full object-contain mix-blend-lighten group-hover:scale-105 transition-transform duration-1000 ease-out"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {allImages.length > 1 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-4">
                    <CarouselPrevious className="relative left-0 translate-y-0 bg-black/40 backdrop-blur-md border-white/10 hover:bg-[#d4af37] hover:text-black transition-all" />
                    <CarouselNext className="relative right-0 translate-y-0 bg-black/40 backdrop-blur-md border-white/10 hover:bg-[#d4af37] hover:text-black transition-all" />
                  </div>
                )}
              </Carousel>
              
              {product.is_featured && (
                <div className="absolute top-8 left-8 z-20 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-black/60 backdrop-blur-md font-bold text-[9px] uppercase tracking-[0.3em] text-[#d4af37]">
                  Seleção Premium
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-[#d4af37] scale-95 shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover grayscale-0 group-hover:grayscale-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-5 space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.3em]">{product.category || 'Tech Collection'}</span>
                <div className="h-[1px] w-8 bg-[#d4af37]/30"></div>
                {product.stock > 0 ? (
                  <span className="text-[10px] font-bold text-green-500/80 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Disponível
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-[0.2em]">Indisponível</span>
                )}
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-col gap-1 pt-4">
                <span className="text-4xl font-serif font-bold text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-white/30 uppercase tracking-[0.2em] font-medium">Ou em até 10x sem juros no cartão</p>
              </div>
            </div>

            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Diamond className="w-3 h-3 text-[#d4af37]" />
                  Sobre a Peça
                </h3>
                <p className="text-sm text-white/60 leading-relaxed font-medium">
                  {product.description}
                </p>
                {product.detailed_description && (
                  <p className="text-xs text-white/30 leading-relaxed border-t border-white/5 pt-4 mt-4">
                    {product.detailed_description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all py-8 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] group disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4 mr-3 transition-transform group-hover:scale-110" />
                {product.stock === 0 ? 'Item Esgotado' : 'Adicionar ao Carrinho'}
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={handleWhatsAppContact}
                  className="bg-[#0f0f0f]/40 border-white/10 hover:border-[#25D366]/40 hover:bg-[#25D366]/5 text-white/60 hover:text-[#25D366] py-7 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Consultoria
                </Button>
                
                <Button
                  variant="outline"
                  asChild
                  className="bg-[#0f0f0f]/40 border-white/10 hover:border-primary/40 hover:bg-primary/5 text-white/60 hover:text-primary py-7 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4 mr-2" />
                    Details
                  </a>
                </Button>
              </div>
            </div>

            {/* Quality Badges */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
              {[
                { icon: Truck, label: 'Envio Global' },
                { icon: ShieldCheck, label: 'Garantia' },
                { icon: Gift, label: 'Embalagem' }
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#d4af37] group-hover:bg-[#d4af37]/5 transition-all">
                    <badge.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] uppercase tracking-widest font-black text-white/20 group-hover:text-white/40 transition-all">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />
      </main>

      {/* Suggested Products or Bottom CTA could go here */}
      
      <Footer />
    </div>
  );
};

export default ProductDetails;