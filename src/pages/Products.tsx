import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { ProductFilters, FilterState } from '@/components/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, SlidersHorizontal, Phone, Watch, Headphones,
  Shield, Zap, LayoutGrid, Bot, X, RefreshCcw,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// ─── Category pills data ──────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Todos',      value: '',            icon: LayoutGrid },
  { label: 'Smartphones', value: 'Smartphone', icon: Phone },
  { label: 'Watches',    value: 'Watch',       icon: Watch },
  { label: 'Audio',      value: 'Audio',       icon: Headphones },
  { label: 'Proteção',   value: 'Protection',  icon: Shield },
  { label: 'Energia',    value: 'Power',       icon: Zap },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Products: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('products');

  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const { data: products = [], isLoading } = useProducts();

  const [filters, setFilters] = useState<FilterState>({
    search: initialQuery,
    category: initialCategory,
    priceRange: [0, 15000],
    sortBy: 'created_at_desc',
    inStockOnly: false,
    featuredOnly: false,
  });

  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiMatchIds, setAiMatchIds] = useState<string[] | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const priceRangeSynced = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { priceRange } = useMemo(() => {
    if (!products.length) return { priceRange: [0, 15000] as [number, number] };
    const prices = products.map(p => Number(p.price));
    return { priceRange: [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))] as [number, number] };
  }, [products]);

  const dynamicCategories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  useEffect(() => {
    if (!priceRangeSynced.current && products.length > 0) {
      priceRangeSynced.current = true;
      setFilters(prev => ({ ...prev, priceRange }));
    }
  }, [products.length, priceRange]);

  const handleSemanticSearch = useCallback(async () => {
    setIsAiSearching(true);
    try {
      const productContext = products.map(p => ({ id: p.id, name: p.name, category: p.category, description: p.description }));
      const sanitized = filters.search.replace(/["\\]/g, '').slice(0, 100);
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: `Busca Semântica: "${sanitized}". Retorne APENAS um array JSON de IDs (máx. 8) dos produtos mais relevantes. Lista: ${JSON.stringify(productContext.slice(0, 40))}. Apenas o array.`,
          context: 'Lumina Semantic Engine',
        },
      });
      if (error) throw error;
      const match = data.reply.match(/\[.*\]/s)?.[0];
      if (match) setAiMatchIds(JSON.parse(match));
    } catch {
      /* silent */
    } finally {
      setIsAiSearching(false);
    }
  }, [products, filters.search]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!filters.search || filters.search.length < 3) { setAiMatchIds(null); return; }
    searchTimeoutRef.current = setTimeout(handleSemanticSearch, 1500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [filters.search, handleSemanticSearch]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        aiMatchIds?.includes(p.id)
      );
    }
    if (filters.category) list = list.filter(p => p.category === filters.category);
    list = list.filter(p => Number(p.price) >= filters.priceRange[0] && Number(p.price) <= filters.priceRange[1]);
    if (filters.inStockOnly) list = list.filter(p => p.stock && p.stock > 0);
    if (filters.featuredOnly) list = list.filter(p => p.is_featured);
    switch (filters.sortBy) {
      case 'price_asc':  list.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case 'price_desc': list.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case 'name_asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default:           list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [products, filters, aiMatchIds]);

  const hasActiveFilters = filters.search || filters.category || filters.inStockOnly || filters.featuredOnly;
  const activeFilterCount = [filters.inStockOnly, filters.featuredOnly, !!filters.category].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#060606] text-[#e2e2e2] selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <SEO title="Coleção" description="Curadoria digital com Lumina AI." />
      <Header />

      {/* ── Sticky top bar (search + filters) ── */}
      <div className="sticky top-14 md:top-16 z-30 bg-[#060606]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-2">

          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none
              ${isAiSearching ? 'text-[#d4af37] animate-pulse' : 'text-white/25'}`} />
            <input
              ref={searchRef}
              type="search"
              placeholder="Buscar produto ou intenção..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full h-10 bg-white/[0.06] border border-white/[0.08] focus:border-[#d4af37]/40
                pl-10 pr-10 rounded-xl text-sm text-white placeholder:text-white/20
                outline-none transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isAiSearching && (
              <RefreshCcw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#d4af37] animate-spin" />
            )}
          </div>

          {/* Advanced filters sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button className={`relative shrink-0 flex items-center gap-2 h-10 px-4 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all active:scale-95
                ${activeFilterCount > 0
                  ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]'
                  : 'bg-white/[0.06] border-white/10 text-white/50 hover:text-white/80'}`}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#d4af37] text-black text-[9px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto pb-safe">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-white text-left text-lg font-serif">Filtros Avançados</SheetTitle>
              </SheetHeader>
              <ProductFilters filters={filters} onFiltersChange={setFilters} categories={dynamicCategories} priceRange={priceRange} />
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Category pills ── */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-3 sm:px-6 pb-3 w-max min-w-full">
            {CATEGORIES.map(({ label, value, icon: Icon }) => {
              const active = filters.category === value;
              return (
                <button
                  key={value}
                  onClick={() => setFilters(prev => ({ ...prev, category: prev.category === value ? '' : value }))}
                  className={`shrink-0 flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[11px] font-black uppercase tracking-widest
                    transition-all active:scale-95 border
                    ${active
                      ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-[0_4px_16px_-4px_rgba(212,175,55,0.5)]'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20'}`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 pb-32">

        {/* Result count + sort */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'produto' : 'produtos'}
              {filters.category && <span className="text-[#d4af37]/60"> · {filters.category}</span>}
              {aiMatchIds && filters.search && (
                <span className="ml-2 text-[#d4af37]/50">via Lumina AI</span>
              )}
            </p>

            <select
              value={filters.sortBy}
              onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
              className="text-[10px] font-black uppercase tracking-widest text-white/40
                bg-transparent border-none outline-none cursor-pointer hover:text-white/70 transition-colors"
            >
              <option value="created_at_desc">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name_asc">A–Z</option>
            </select>
          </div>
        )}

        {/* Active search banner */}
        {filters.search && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl bg-[#d4af37]/[0.06] border border-[#d4af37]/15">
            {isAiSearching
              ? <RefreshCcw className="w-3.5 h-3.5 text-[#d4af37] animate-spin shrink-0" />
              : <Bot className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />}
            <p className="text-[11px] text-white/50 flex-1">
              {isAiSearching
                ? 'Lumina AI analisando sua busca…'
                : aiMatchIds
                  ? `Resultados otimizados por intenção para "${filters.search}"`
                  : `Buscando por "${filters.search}"`}
            </p>
            <button
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="text-white/25 hover:text-white/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                className={
                  // First featured product gets a wide bento card (spans 2 cols)
                  index === 0 && !filters.search && !filters.category && product.is_featured
                    ? 'col-span-2 md:col-span-2'
                    : ''
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/[0.06] border border-[#d4af37]/10 flex items-center justify-center mb-5">
              <Bot className="w-7 h-7 text-[#d4af37]/30" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-2">
              Nenhum resultado
            </h3>
            <p className="text-white/25 text-sm mb-8 max-w-xs">
              Tente mudar os filtros ou buscar por algo diferente.
            </p>
            <Button
              onClick={() => setFilters(prev => ({ ...prev, search: '', category: '', inStockOnly: false, featuredOnly: false }))}
              className="h-11 px-8 rounded-full bg-white/[0.06] border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Products;
