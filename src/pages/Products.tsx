import React, { useState, useMemo, useEffect } from 'react';
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
import {
  ShoppingCart,
  MessageCircle,
  Home,
  Search,
  ShoppingBag,
  User,
  ChevronLeft,
  ChevronRight,
  Filter as FilterIcon,
  Phone,
  Watch,
  Headphones,
  Shield,
  Zap,
  Laptop,
  PlusCircle,
  Diamond,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/config/constants';
import { Product } from '@/types/database';
import { Link } from 'react-router-dom';

const Products: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('products');

  const { data: products = [], isLoading } = useProducts();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    priceRange: [0, 15000],
    sortBy: 'created_at_desc',
    inStockOnly: false,
    featuredOnly: false,
  });

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { categories, priceRange } = useMemo(() => {
    if (!products.length) return { categories: [], priceRange: [0, 15000] as [number, number] };
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    const prices = products.map(p => Number(p.price));
    return { categories: cats, priceRange: [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))] as [number, number] };
  }, [products]);

  useEffect(() => {
    if (priceRange[0] !== filters.priceRange[0] || priceRange[1] !== filters.priceRange[1]) {
      setFilters(prev => ({ ...prev, priceRange }));
    }
  }, [priceRange]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (filters.search) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()) || p.description?.toLowerCase().includes(filters.search.toLowerCase()));
    }
    if (filters.category) filtered = filtered.filter(p => p.category === filters.category);
    filtered = filtered.filter(p => Number(p.price) >= filters.priceRange[0] && Number(p.price) <= filters.priceRange[1]);
    if (filters.inStockOnly) filtered = filtered.filter(p => p.stock && p.stock > 0);
    if (filters.featuredOnly) filtered = filtered.filter(p => p.is_featured);

    switch (filters.sortBy) {
      case 'price_asc': filtered.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case 'price_desc': filtered.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case 'name_asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name_desc': filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
      default: filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return filtered;
  }, [products, filters]);

  const categoryIcons = [
    { name: 'Smartphones', value: 'Smartphone', icon: Phone, color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Watches', value: 'Watch', icon: Watch, color: 'bg-orange-500/10 text-orange-500' },
    { name: 'Audio', value: 'Audio', icon: Headphones, color: 'bg-purple-500/10 text-purple-500' },
    { name: 'Proteção', value: 'Protection', icon: Shield, color: 'bg-green-500/10 text-green-500' },
    { name: 'Energia', value: 'Power', icon: Zap, color: 'bg-yellow-500/10 text-yellow-500' },
    { name: 'Laptops', value: 'Laptop', icon: Laptop, color: 'bg-pink-500/10 text-pink-500' },
    { name: 'Todos', value: '', icon: LayoutGrid, color: 'bg-primary/10 text-primary' },
  ];

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <SEO
        title="Nossa Coleção"
        description="Explore nossa seleção de smartwatches, eletrônicos e acessórios de luxo com os melhores preços de Osasco e região."
      />
      <Header />

      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#f2ca50] opacity-[0.03] blur-[120px]"></div>
      </div>

      <main className="relative z-10">
        {/* Cinematic Hero Header */}
        <section className="relative w-full h-[350px] md:h-[450px] overflow-hidden pt-20">
          <div className="absolute inset-0 bg-[#050505]">
            <img
              className="w-full h-full object-cover opacity-30 grayscale mix-blend-overlay scale-110 animate-pulse-slow"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWlKr7oMbDA123Frddr-m5AvItRFCbHavt7W3YUGAzvwzqHjMTqyQxn6aqKVcUbL7S8DpCf5lhEcQronwB2Hbx76PV8Osbdkqklphct_COEjwFWVQUAmcSX2R1lPkvXsqvSk_PCdAM4Z2S5W73FsLqbFYxKTTz4pbh-YYFQJXHPOMuU4Nd1xSn9Z5p0_Vv0X7E8ySnMtgBLAcA7jk7TxTuHLWS9HRdXGnZN93qRqeWRW4lpDgO8svx-NWJQyNm10hvx5_5BgTtTUI"
              alt="Luxury Tech Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          </div>
          <div className="relative h-full max-w-7xl mx-auto px-8 flex flex-col justify-center items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-black/40 backdrop-blur-md font-bold text-[9px] uppercase tracking-[0.3em] text-[#d4af37] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Diamond className="w-3 h-3 fill-[#d4af37]" />
              Catálogo Exclusivo
            </div>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 tracking-tight">
              JR <span className="text-[#d4af37] italic">acessórios</span>
            </h1>
            <p className="text-white/40 max-w-md font-medium text-sm md:text-base animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              A curadoria definitiva das marcas mais prestigiadas do mundo tech, selecionadas para quem não aceita nada menos que a perfeição.
            </p>
          </div>
        </section>

        {/* Dynamic Category Selector */}
        <div className="bg-[#0a0a0a] border-y border-white/5 py-6 z-40">
          <div className="container mx-auto px-8 overflow-x-auto scrollbar-hide">
            <div className="flex justify-between md:justify-center gap-6 md:gap-16 min-w-max">
              {categoryIcons.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setFilters(prev => ({ ...prev, category: cat.value }))}
                  className="flex flex-col items-center gap-3 group transition-all"
                >
                  <div className={`transition-all duration-700 rounded-full ${cat.color} flex items-center justify-center shadow-2xl border border-white/5 group-hover:border-[#d4af37]/40 relative overflow-hidden h-14 w-14`}>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <cat.icon className="w-6 h-6 transition-transform duration-700" />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${filters.category === cat.value ? 'text-[#d4af37]' : 'text-white/20 group-hover:text-white/60'}`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-32">

            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-[220px] bg-[#0f0f0f]/40 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 shadow-2xl space-y-10">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Filtros</h2>
                  <FilterIcon className="h-4 w-4 text-[#d4af37]" />
                </div>
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  priceRange={priceRange}
                />
              </div>
            </aside>

            {/* Products Listing Area */}
            <div className="lg:col-span-9 space-y-10">

              {/* Toolbar Section */}
              <div className="bg-[#0f0f0f]/30 backdrop-blur-xl p-4 md:p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-8">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                  {/* Luxury Search Bar */}
                  <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-[#d4af37]/40 group-focus-within:text-[#d4af37] transition-colors" />
                    <input
                      placeholder="Pesquisar na coleção..."
                      className="w-full bg-white/5 border border-white/5 focus:border-[#d4af37]/40 pl-14 h-14 rounded-full text-white placeholder:text-white/10 outline-none transition-all font-medium text-sm"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>

                  {/* Actions Tools */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="lg:hidden flex-1 border-white/10 text-white/60 h-14 rounded-full bg-white/5">
                          <FilterIcon className="mr-3 h-4 w-4 text-[#d4af37]" />
                          Filtrar
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="bg-black border-white/10 w-[320px] p-8 overflow-y-auto">
                        <SheetHeader className="mb-10">
                          <SheetTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Menu de Filtros</SheetTitle>
                        </SheetHeader>
                        <ProductFilters
                          filters={filters}
                          onFiltersChange={setFilters}
                          categories={categories}
                          priceRange={priceRange}
                          isMobile
                        />
                      </SheetContent>
                    </Sheet>

                    <div className="relative flex-1 md:flex-none">
                      <select
                        className="w-full md:w-48 appearance-none bg-white/5 text-white/60 px-8 py-2 rounded-full border border-white/10 h-14 outline-none cursor-pointer text-[10px] font-black uppercase tracking-widest focus:border-[#d4af37]/40 transition-all"
                        value={filters.sortBy}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                      >
                        <option value="created_at_desc">Recentes</option>
                        <option value="price_asc">Menor Preço</option>
                        <option value="price_desc">Maior Preço</option>
                        <option value="name_asc">Nome A-Z</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
                  <span>Vault Explorer</span>
                  <span>{filteredProducts.length} Items Encontrados</span>
                </div>
              </div>

              {/* Grid Layout */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <Search className="h-6 w-6 text-white/10" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white mb-2">Coleção não encontrada</h3>
                  <p className="text-white/20 mb-10 max-w-xs mx-auto text-sm font-medium">Nenhum item em nosso vault corresponde aos filtros selecionados atualmente.</p>
                  <Button variant="outline" onClick={() => setFilters({ ...filters, search: '', category: '' })} className="border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10 rounded-full px-12 h-14 text-[10px] font-black uppercase tracking-widest transition-all">
                    Reiniciar Busca
                  </Button>
                </div>
              )}

              {/* Sophisticated Pagination */}
              {!isLoading && filteredProducts.length > 0 && (
                <div className="pt-20 flex justify-center items-center gap-10">
                  <button className="text-white/20 hover:text-[#d4af37] transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-0" disabled>
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <div className="flex gap-4">
                    {[1].map(n => (
                      <button key={n} className="w-12 h-12 rounded-full bg-[#d4af37] text-black font-black text-sm shadow-2xl">1</button>
                    ))}
                  </div>
                  <button className="text-white/20 hover:text-[#d4af37] transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Luxury Quick View Dialog */}
      <Dialog open={!!quickViewProduct} onOpenChange={(open) => !open && setQuickViewProduct(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-[#050505] border-white/10 rounded-[40px] gap-0 shadow-[0_0_100px_rgba(0,0,0,1)]">
          {quickViewProduct && (
            <div className="grid grid-cols-1 lg:grid-cols-2 max-h-[90vh]">
              <div className="bg-[#0a0a0a] flex items-center justify-center p-12 relative border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-30"></div>
                <img src={quickViewProduct.image || '/placeholder.svg'} alt={quickViewProduct.name} className="w-full h-full object-contain mix-blend-lighten relative z-10" />
              </div>
              <div className="p-10 md:p-16 flex flex-col h-full overflow-y-auto bg-black">
                <div className="mb-10 space-y-2">
                  <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.4em] mb-4 block">{quickViewProduct.category || 'EXCLUSIVA'}</span>
                  <h2 className="text-5xl font-serif font-bold text-white leading-tight tracking-tight">{quickViewProduct.name}</h2>
                </div>

                <div className="mb-10">
                  <div className="text-4xl font-serif font-bold text-[#d4af37] mb-1">R$ {quickViewProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Autenticidade Garantida</span>
                </div>

                <div className="space-y-6 flex-grow">
                  <p className="text-base text-white/40 leading-relaxed font-medium">{quickViewProduct.description}</p>
                </div>

                <div className="space-y-4 mt-12 pt-10 border-t border-white/5">
                  <Button className="w-full h-16 bg-[#d4af37] text-black font-black text-xs rounded-full shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:bg-[#f2ca50] transition-all uppercase tracking-[0.2em]" onClick={() => { addToCart(quickViewProduct as any); setQuickViewProduct(null); toast({ title: "Peça Selecionada", description: "O item foi adicionado ao seu vault." }); }}>
                    <ShoppingBag className="mr-3 h-5 w-5" /> Adicionar ao Vault
                  </Button>
                  <Button variant="outline" className="w-full h-16 border-white/10 bg-white/5 text-white/60 hover:text-[#25D366] hover:border-[#25D366]/40 rounded-full flex items-center justify-center gap-3 transition-all text-[10px] font-black uppercase tracking-widest" onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C+tenho+interesse+no+item+exclusivo+${quickViewProduct.name}`, '_blank')}>
                    <MessageCircle className="h-5 w-5 text-[#25D366]" /> Consultoria Via WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />

      {/* Global Bottom Navigation (Matching Profile Style) */}
      <nav className="lg:hidden bg-black/90 backdrop-blur-2xl border-t border-white/5 fixed bottom-0 w-full z-50 px-8 pt-4 pb-10 flex justify-around items-center">
        <Link to="/" className="flex flex-col items-center gap-1 text-white/20 hover:text-white transition-all">
          <Home className="w-6 h-6" />
          <span className="text-[8px] uppercase font-bold tracking-widest">Início</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-[#d4af37] relative">
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[8px] uppercase font-bold tracking-widest">Loja</span>
          <span className="absolute -bottom-2 w-1 h-1 bg-[#d4af37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
        </button>
        <Link to="/login" className="flex flex-col items-center gap-1 text-white/20 hover:text-white transition-all">
          <User className="w-6 h-6" />
          <span className="text-[8px] uppercase font-bold tracking-widest">Vault</span>
        </Link>
        <Link to="/contato" className="flex flex-col items-center gap-1 text-white/20 hover:text-white transition-all">
          <Phone className="w-6 h-6" />
          <span className="text-[8px] uppercase font-bold tracking-widest">Suporte</span>
        </Link>
      </nav>
    </div>
  );
};

export default Products;²