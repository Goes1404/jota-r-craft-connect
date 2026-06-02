import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { ProductFilters, FilterState } from '@/components/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  ShoppingBag,
  Phone,
  Watch,
  Headphones,
  Shield,
  Zap,
  Diamond,
  LayoutGrid,
  Bot,
  RefreshCcw,
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/config/constants';
import { Product } from '@/types/database';
import { Link, useSearchParams } from 'react-router-dom';
import { MaskReveal } from '@/components/animations/MaskReveal';
import { TrackingInText } from '@/components/animations/TrackingIn';

const Products: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('products');

  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const { data: products = [], isLoading } = useProducts();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: initialCategory,
    priceRange: [0, 15000],
    sortBy: 'created_at_desc',
    inStockOnly: false,
    featuredOnly: false,
  });

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  
  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiMatchIds, setAiMatchIds] = useState<string[] | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const priceRangeSynced = useRef(false);

  const { categories, priceRange } = useMemo(() => {
    if (!products.length) return { categories: [], priceRange: [0, 15000] as [number, number] };
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    const prices = products.map(p => Number(p.price));
    return { categories: cats, priceRange: [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))] as [number, number] };
  }, [products]);

  // Sync price filter to actual product range on first load so nothing is
  // filtered out by the hardcoded [0, 15000] default before products arrive.
  useEffect(() => {
    if (!priceRangeSynced.current && products.length > 0) {
      priceRangeSynced.current = true;
      setFilters(prev => ({ ...prev, priceRange }));
    }
  }, [products.length, priceRange]);

  const handleSemanticSearch = useCallback(async () => {
    setIsAiSearching(true);
    try {
      const productContext = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
      }));
      const sanitizedSearch = filters.search.replace(/["\\]/g, '').slice(0, 100);
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: `Busca Semântica Automática: O usuário está buscando por: ${sanitizedSearch}. Retorne APENAS um array JSON de IDs dos produtos (máximo 8) que mais combinam com a INTENÇÃO da busca. Lista: ${JSON.stringify(productContext.slice(0, 40))}. Responda apenas o array de IDs.`,
          context: 'Lumina Semantic Engine. Foco em intenção e contexto.',
        },
      });
      if (error) throw error;
      const reply = data.reply.match(/\[.*\]/s)?.[0];
      if (reply) setAiMatchIds(JSON.parse(reply));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiSearching(false);
    }
  }, [products, filters.search]);

  // Automatic Semantic Search Logic — debounced
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!filters.search || filters.search.length < 3) {
      setAiMatchIds(null);
      return;
    }
    searchTimeoutRef.current = setTimeout(handleSemanticSearch, 1500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [filters.search, handleSemanticSearch]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Hybrid Logic: Standard keywords OR AI Semantic matches
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => {
        const keywordMatch = p.name.toLowerCase().includes(searchLower) || p.description?.toLowerCase().includes(searchLower);
        const aiMatch = aiMatchIds?.includes(p.id);
        return keywordMatch || aiMatch;
      });
    }

    if (filters.category) filtered = filtered.filter(p => p.category === filters.category);
    filtered = filtered.filter(p => Number(p.price) >= filters.priceRange[0] && Number(p.price) <= filters.priceRange[1]);
    if (filters.inStockOnly) filtered = filtered.filter(p => p.stock && p.stock > 0);
    if (filters.featuredOnly) filtered = filtered.filter(p => p.is_featured);

    switch (filters.sortBy) {
      case 'price_asc': filtered.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case 'price_desc': filtered.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case 'name_asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return filtered;
  }, [products, filters, aiMatchIds]);

  const categoryIcons = [
    { name: 'Smartphones', value: 'Smartphone', icon: Phone, color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Watches', value: 'Watch', icon: Watch, color: 'bg-orange-500/10 text-orange-500' },
    { name: 'Audio', value: 'Audio', icon: Headphones, color: 'bg-purple-500/10 text-purple-500' },
    { name: 'Proteção', value: 'Protection', icon: Shield, color: 'bg-green-500/10 text-green-500' },
    { name: 'Energia', value: 'Power', icon: Zap, color: 'bg-yellow-500/10 text-yellow-500' },
    { name: 'Todos', value: '', icon: LayoutGrid, color: 'bg-primary/10 text-primary' },
  ];

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <SEO title="Coleção Inteligente" description="Busca semântica automática ativada por Lumina AI." />
      <Header />

      <main className="relative z-10">
        <section className="relative w-full h-[300px] md:h-[400px] overflow-hidden pt-20">
          <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/10 to-transparent"></div>
          <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl md:text-7xl font-serif font-bold text-white mb-4 tracking-tight">
              <TrackingInText text="JR" className="text-[#d4af37]" stagger={0.12} />
              {' '}
              <TrackingInText text="selection" className="text-[#d4af37] italic font-light" stagger={0.07} delay={0.3} />
            </h1>
            <MaskReveal delay={0.7}>
              <p className="text-white/40 max-w-md font-medium text-xs md:text-sm uppercase tracking-[0.2em]">
                Curadoria Digital com Inteligência Artificial
              </p>
            </MaskReveal>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20">
          {/* Mobile floating filters button */}
          <div className="lg:hidden sticky top-20 z-30 flex justify-end mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 bg-[#0f0f0f]/80 backdrop-blur-xl border border-[#d4af37]/30 text-[#d4af37] px-5 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-xs font-black uppercase tracking-widest active:scale-95 transition-transform">
                  <Search className="w-3.5 h-3.5" />
                  Filtros
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-white text-left text-lg font-serif">Filtros</SheetTitle>
                </SheetHeader>
                <ProductFilters filters={filters} onFiltersChange={setFilters} categories={categories} priceRange={priceRange} />
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-32">
            
            {/* Desktop Filters */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-[120px] space-y-8">
                <div className="bg-[#0f0f0f]/60 backdrop-blur-3xl p-8 rounded-[32px] border border-white/5 shadow-2xl">
                  <ProductFilters filters={filters} onFiltersChange={setFilters} categories={categories} priceRange={priceRange} />
                </div>
              </div>
            </aside>

            {/* Listing Area */}
            <div className="lg:col-span-9 space-y-10">
              
              {/* Smart Search Bar */}
              <div className="bg-[#0f0f0f]/60 backdrop-blur-3xl p-6 md:p-10 rounded-[40px] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="relative flex items-center">
                  <Search className={`absolute left-6 h-5 w-5 transition-colors ${isAiSearching ? 'text-[#d4af37] animate-pulse' : 'text-white/20'}`} />
                  <input
                    placeholder="Busque por produto ou intenção (ex: algo para presente)..."
                    className="w-full bg-black/40 border border-white/5 focus:border-[#d4af37]/40 pl-16 pr-24 h-16 rounded-full text-white placeholder:text-white/10 outline-none transition-all font-medium text-base shadow-inner"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                  <div className="absolute right-6 flex items-center gap-3">
                    {isAiSearching && <RefreshCcw className="w-4 h-4 text-[#d4af37] animate-spin" />}
                    <div className={`px-3 py-1 rounded-full border border-[#d4af37]/30 bg-black/60 text-[8px] font-black uppercase tracking-widest transition-all ${filters.search.length >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-[#d4af37]">Lumina AI</span> Active
                    </div>
                  </div>
                </div>

                {aiMatchIds && (
                  <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5"></div>
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Resultados otimizados por intenção</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5"></div>
                  </div>
                )}
              </div>

              {/* Grid */}
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-8">
                  {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-8">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={setQuickViewProduct}
                      className={index === 0 && !filters.search && !filters.category ? "md:col-span-2" : ""}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-[#0f0f0f]/20 rounded-[40px] border border-dashed border-white/5">
                  <Bot className="w-12 h-12 text-[#d4af37]/20 mx-auto mb-6" />
                  <h3 className="text-xl font-serif font-bold text-white mb-2">Sem resultados exatos</h3>
                  <p className="text-white/20 mb-8 max-w-xs mx-auto text-sm">Tente mudar os filtros ou pesquisar por algo diferente.</p>
                  <Button variant="outline" onClick={() => setFilters({ ...filters, search: '', category: '' })} className="border-[#d4af37]/40 text-[#d4af37] rounded-full px-12 h-14 uppercase text-[10px] font-black tracking-widest">
                    Limpar Tudo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Quick View Dialog */}
      <Dialog open={!!quickViewProduct} onOpenChange={(open) => !open && setQuickViewProduct(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#050505] border-white/10 rounded-[32px] shadow-2xl">
          {quickViewProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-[#0a0a0a] flex items-center justify-center p-12 border-r border-white/5">
                <img src={quickViewProduct.image || '/placeholder.svg'} alt={quickViewProduct.name} className="w-full h-full object-contain mix-blend-lighten" />
              </div>
              <div className="p-12 flex flex-col justify-center">
                <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-[0.4em] mb-4">Curadoria Especializada</span>
                <h2 className="text-4xl font-serif font-bold text-white mb-4 leading-tight">{quickViewProduct.name}</h2>
                <div className="text-3xl font-serif font-bold text-[#d4af37] mb-8">R$ {quickViewProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <p className="text-white/40 mb-10 text-sm leading-relaxed">{quickViewProduct.description}</p>
                <Button className="w-full h-16 bg-[#d4af37] text-black font-black rounded-full uppercase tracking-widest text-[10px] hover:bg-[#f2ca50] shadow-lg shadow-[#d4af37]/20" onClick={() => { addToCart(quickViewProduct as any); setQuickViewProduct(null); }}>
                  <ShoppingBag className="w-4 h-4 mr-2" /> Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Products;