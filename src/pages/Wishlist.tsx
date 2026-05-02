import React, { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, ShoppingBag, Sparkles, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { useWishlist, getWishlistPriceDrops } from '@/contexts/WishlistContext';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

const Wishlist: React.FC = () => {
  const { wishlist } = useWishlist();
  const { data: allProducts = [], isLoading: productsLoading } = useProducts();
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasCheckedDrops = useRef(false);

  useEffect(() => {
    if (productsLoading || !allProducts.length || !wishlist.length || hasCheckedDrops.current) return;
    hasCheckedDrops.current = true;
    const wishlisted = allProducts.filter(p => wishlist.includes(p.id));
    const drops = getWishlistPriceDrops(wishlisted);
    drops.forEach(d => {
      toast({
        title: 'Baixou de preço! 🎉',
        description: `${d.name} caiu ${d.discountPct}% — de R$ ${d.oldPrice.toFixed(2).replace('.', ',')} para R$ ${d.newPrice.toFixed(2).replace('.', ',')}`,
      });
    });
  }, [productsLoading, allProducts, wishlist, toast]);

  const favoriteProducts = allProducts.filter(p => wishlist.includes(p.id));

  // Lumina AI Matchmaker Logic
  const suggestedProducts = useMemo(() => {
    if (favoriteProducts.length === 0) return [];
    
    // Find categories of favorited items
    const favoriteCategories = [...new Set(favoriteProducts.map(p => p.category))];
    
    // Find products in those categories (or any if empty) that are NOT in the wishlist
    const suggestions = allProducts.filter(p => 
      !wishlist.includes(p.id) && 
      favoriteCategories.includes(p.category) && 
      p.stock > 0
    );

    // If no direct category match, just suggest featured items
    if (suggestions.length === 0) {
      return allProducts.filter(p => !wishlist.includes(p.id) && p.is_featured).slice(0, 3);
    }

    return suggestions.slice(0, 3);
  }, [favoriteProducts, allProducts, wishlist]);

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.02] blur-[120px]"></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Voltar ao Perfil
            </button>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-white tracking-tight flex items-center gap-4">
              Meus <span className="text-primary italic">Favoritos</span>
              <Heart className="w-8 h-8 text-primary fill-primary" />
            </h1>
            <p className="text-white/30 text-sm font-medium">Sua seleção pessoal das peças mais desejadas da nossa coleção.</p>
          </div>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[400px] bg-white/5 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {favoriteProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 bg-white/[0.02] border border-white/5 rounded-[40px]">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/10">
              <Heart className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-white">Sua lista está vazia</h2>
              <p className="text-white/30 text-sm max-w-xs mx-auto">Explore nossa coleção e salve as peças que você mais gostar para vê-las aqui depois.</p>
            </div>
            <Button 
              onClick={() => navigate('/produtos')}
              className="bg-primary text-black font-bold text-[10px] uppercase tracking-widest px-10 py-6 rounded-full hover:bg-primary/80 transition-all shadow-luxury"
            >
              Explorar Coleção
            </Button>
          </div>
        )}

        {/* Lumina AI Matchmaker Section */}
        {favoriteProducts.length > 0 && suggestedProducts.length > 0 && (
          <div className="mt-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-[#d4af37]/20 rounded-[40px] p-10 md:p-16 relative overflow-hidden group shadow-[0_0_40px_rgba(212,175,55,0.05)]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-[#d4af37]/10 transition-colors duration-1000"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 font-bold text-[10px] uppercase tracking-widest text-[#d4af37]">
                    <Sparkles className="w-3 h-3" />
                    Lumina Matchmaker
                  </div>
                  <h2 className="text-3xl font-serif font-black text-white">Completando seu <span className="text-[#d4af37] italic">Estilo</span>.</h2>
                  <p className="text-white/40 text-sm max-w-md font-medium leading-relaxed">
                    Nossa IA analisou sua curadoria pessoal e encontrou peças que harmonizam perfeitamente com os itens que você já salvou.
                  </p>
                </div>
                <Cpu className="w-16 h-16 text-[#d4af37]/10 hidden md:block" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                {suggestedProducts.map(product => (
                  <div key={product.id} className="relative group/card">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4af37] to-[#f2ca50] rounded-[34px] blur opacity-0 group-hover/card:opacity-30 transition duration-500"></div>
                    <div className="relative h-full">
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
