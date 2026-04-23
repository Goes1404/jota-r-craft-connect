import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, Filter } from 'lucide-react';

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
  isMobile?: boolean;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  priceRange,
  isMobile = false,
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

  return (
    <div className={`space-y-8 ${isMobile ? 'pb-20' : ''}`}>
      {/* Categories - Premium Selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Categorias
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleFilterChange('category', '')}
            className={`text-left px-4 py-2 rounded-lg text-sm transition-all ${
              filters.category === '' 
                ? 'bg-primary/10 text-primary border border-primary/30 font-bold' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Todas as categorias
          </button>
          {categories.filter(category => category && category.trim() !== '').map((category) => (
            <button
              key={category}
              onClick={() => handleFilterChange('category', category)}
              className={`text-left px-4 py-2 rounded-lg text-sm transition-all ${
                filters.category === category 
                  ? 'bg-primary/10 text-primary border border-primary/30 font-bold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4 pt-4 border-t border-primary/10">
        <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Faixa de Preço</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-white/50 uppercase">Mín</Label>
              <Input
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) => handleFilterChange('priceRange', [parseFloat(e.target.value) || 0, filters.priceRange[1]])}
                className="bg-background border-primary/20 text-white h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/50 uppercase">Máx</Label>
              <Input
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseFloat(e.target.value) || 0])}
                className="bg-background border-primary/20 text-white h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-4 pt-4 border-t border-primary/10">
        <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Status</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={filters.inStockOnly}
              onCheckedChange={(checked) => handleFilterChange('inStockOnly', !!checked)}
              className="border-primary/50 data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-white/70 group-hover:text-white transition-colors">Em Estoque</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={filters.featuredOnly}
              onCheckedChange={(checked) => handleFilterChange('featuredOnly', !!checked)}
              className="border-primary/50 data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-white/70 group-hover:text-white transition-colors">Destaques</span>
          </label>
        </div>
      </div>

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full border-primary/20 text-primary hover:bg-primary/10 rounded-full h-12 mt-6"
        >
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
};