import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from './ProductCard';
import { Sparkles, ArrowRight, Diamond } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

interface SmartShowcaseProps {
  title?: string;
  subtitle?: string;
  category?: string;
  excludeProductId?: string;
  limit?: number;
  mode?: 'trending' | 'related' | 'personalized';
}

export const SmartShowcase: React.FC<SmartShowcaseProps> = ({ 
  title = "Seleção Inteligente", 
  subtitle = "Curadoria exclusiva baseada em dados",
  category,
  excludeProductId,
  limit = 4,
  mode = 'trending'
}) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['smart-showcase', mode, category, excludeProductId],
    queryFn: async () => {
      let query = supabase.from('products').select('*');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      if (excludeProductId) {
        query = query.neq('id', excludeProductId);
      }

      // If mode is trending, we could join with product_views if we had a view count column,
      // but let's simulate it with featured + random for variety for now.
      const { data, error } = await query.limit(12);
      
      if (error) throw error;

      // Sort logic for "Smart" feel
      let sorted = [...data];
      if (mode === 'trending') {
        sorted = sorted.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
      }

      return sorted.slice(0, limit);
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-3xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#d4af37]">
            <Sparkles className="w-4 h-4 fill-[#d4af37]/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">{mode === 'trending' ? 'Trending' : 'Personalized'} Selection</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-white/30 text-sm max-w-lg">{subtitle}</p>
        </div>
        <Link to="/produtos">
          <Button variant="ghost" className="text-white/40 hover:text-[#d4af37] text-[10px] uppercase font-black tracking-widest p-0 group">
            Ver Coleção Completa <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
    </div>
  );
};
