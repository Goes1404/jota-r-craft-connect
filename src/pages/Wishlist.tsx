import React from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Wishlist: React.FC = () => {
  const { wishlist } = useWishlist();
  const { data: allProducts = [], isLoading: productsLoading } = useProducts();
  const navigate = useNavigate();

  const favoriteProducts = allProducts.filter(p => wishlist.includes(p.id));

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

        {/* Suggested Section could go here */}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
