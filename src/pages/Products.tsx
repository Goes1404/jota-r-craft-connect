import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductFilters, FilterState } from '@/components/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import { useAnalytics } from '@/hooks/useAnalytics';

const Products: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('products');

  const { data: products = [], isLoading } = useProducts();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    priceRange: [0, 1000],
    sortBy: 'created_at_desc',
    inStockOnly: false,
    featuredOnly: false,
  });

  // Get categories and price range from products
  const { categories, priceRange } = useMemo(() => {
    if (!products.length) return { categories: [], priceRange: [0, 1000] as [number, number] };
    
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    const prices = products.map(p => Number(p.price));
    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));
    
    return {
      categories: cats,
      priceRange: [minPrice, maxPrice] as [number, number]
    };
  }, [products]);

  // Initialize price range when products load
  React.useEffect(() => {
    if (priceRange[0] !== filters.priceRange[0] || priceRange[1] !== filters.priceRange[1]) {
      setFilters(prev => ({ ...prev, priceRange }));
    }
  }, [priceRange]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Price range filter
    filtered = filtered.filter(product =>
      Number(product.price) >= filters.priceRange[0] &&
      Number(product.price) <= filters.priceRange[1]
    );

    // Stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(product => product.stock && product.stock > 0);
    }

    // Featured filter
    if (filters.featuredOnly) {
      filtered = filtered.filter(product => product.is_featured);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'created_at_asc':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'created_at_desc':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [products, filters]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
              Todos os Produtos
            </h1>
          <p className="text-lg text-muted-foreground">
            Explore nossa coleção completa de acessórios feitos à mão. 
            Cada peça é criada com carinho e materiais selecionados especialmente.
          </p>
          </div>

          {/* Content with Filters */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              priceRange={priceRange}
            />

            {/* Products Content */}
            <div className="flex-1">
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {isLoading ? 'Carregando...' : `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground mb-4">
                    Nenhum produto encontrado
                  </p>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou buscar por outros termos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground">
              Novos acessórios são criados regularmente. Acompanhe nosso Instagram @jota.r_acessorios para não perder as novidades!
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;