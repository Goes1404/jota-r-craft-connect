import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export interface FilterState {
  search: string;
  category: string;
  priceRange: [number, number];
  sortBy: string;
  inStockOnly: boolean;
  featuredOnly: boolean;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
  priceRange: [number, number];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  priceRange,
}) => {
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: '',
      priceRange: priceRange,
      sortBy: 'created_at_desc',
      inStockOnly: false,
      featuredOnly: false,
    });
  };

  const hasActiveFilters = filters.search || filters.category || filters.inStockOnly || 
    filters.featuredOnly || filters.priceRange[0] > priceRange[0] || 
    filters.priceRange[1] < priceRange[1];

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium text-foreground">
          Buscar Produtos
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="search"
            type="text"
            placeholder="Digite o nome do produto..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Categoria</Label>
        <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.filter(category => category && category.trim() !== '').map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Faixa de Preço</Label>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mínimo</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={filters.priceRange[0]}
                onChange={(e) => {
                  const value = Math.max(0, parseFloat(e.target.value) || 0);
                  handleFilterChange('priceRange', [value, filters.priceRange[1]]);
                }}
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Máximo</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={filters.priceRange[1]}
                onChange={(e) => {
                  const value = Math.max(filters.priceRange[0], parseFloat(e.target.value) || 0);
                  handleFilterChange('priceRange', [filters.priceRange[0], value]);
                }}
                className="h-8 text-sm"
                placeholder="1000"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('priceRange', [0, 100])}
              className="text-xs h-6 px-2"
            >
              Até R$ 100
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('priceRange', [100, 300])}
              className="text-xs h-6 px-2"
            >
              R$ 100-300
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('priceRange', [300, 1000])}
              className="text-xs h-6 px-2"
            >
              R$ 300+
            </Button>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Ordenar por</Label>
        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">Mais Recentes</SelectItem>
            <SelectItem value="created_at_asc">Mais Antigos</SelectItem>
            <SelectItem value="price_asc">Menor Preço</SelectItem>
            <SelectItem value="price_desc">Maior Preço</SelectItem>
            <SelectItem value="name_asc">Nome A-Z</SelectItem>
            <SelectItem value="name_desc">Nome Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => handleFilterChange('inStockOnly', !!checked)}
          />
          <Label htmlFor="inStock" className="text-sm font-medium text-foreground">
            Apenas em estoque
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={filters.featuredOnly}
            onCheckedChange={(checked) => handleFilterChange('featuredOnly', !!checked)}
          />
          <Label htmlFor="featured" className="text-sm font-medium text-foreground">
            Produtos em destaque
          </Label>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block w-80 bg-card border border-border rounded-lg p-6 h-fit sticky top-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
          <Filter className="h-5 w-5 text-primary" />
        </div>
        <FilterContent />
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full mb-6">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Ativo
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filtros de Produtos</SheetTitle>
              <SheetDescription>
                Refine sua busca usando os filtros abaixo
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};