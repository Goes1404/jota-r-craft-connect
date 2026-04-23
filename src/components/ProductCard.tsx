import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onViewDetails,
  className = ""
}) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description || '',
      images: product.images
    } as any);

    toast({
      title: "Adicionado ao Carrinho",
      description: `${product.name} agora faz parte da sua seleção.`,
    });
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      navigate(`/produto/${product.id}`);
    }
  };

  // Check if it's the featured card (based on className or prop)
  const isBentoLarge = className.includes('xl:col-span-2');

  if (isBentoLarge) {
    return (
      <article 
        onClick={handleViewDetails}
        className={`group relative flex flex-col sm:flex-row bg-background rounded-2xl border border-primary transition-all duration-500 overflow-hidden shadow-luxury hover:shadow-luxury-hover cursor-pointer ${className}`}
      >
        <div className="sm:w-1/2 h-64 sm:h-auto bg-background relative overflow-hidden flex items-center justify-center p-8 border-b sm:border-b-0 sm:border-r border-primary/20">
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm text-primary px-3 py-1 rounded-md font-serif text-xs uppercase tracking-wider border border-primary">
            Destaque
          </div>
          <img 
            className="w-full h-full object-contain mix-blend-lighten group-hover:scale-105 transition-transform duration-700 ease-out" 
            src={product.image || '/placeholder.svg'} 
            alt={product.name}
          />
        </div>
        <div className="sm:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-background">
          <div className="mb-2">
            <span className="bg-muted text-foreground text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wider border border-primary/30">Premium</span>
          </div>
          <h3 className="text-3xl font-serif font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-base text-white/80 mb-6 line-clamp-2">{product.description}</p>
          <div className="mb-6">
            <span className="block text-3xl font-bold text-primary mb-1">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
            <span className="block text-sm text-white/70">ou 10x de R$ {(product.price / 10).toFixed(2).replace('.', ',')} sem juros</span>
          </div>
          <Button 
            className="w-full bg-background border border-primary text-primary hover:bg-primary hover:text-background transition-all duration-300 py-6 rounded-full font-bold uppercase tracking-wider shadow-luxury"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Esgotado' : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article 
      onClick={handleViewDetails}
      className={`group relative flex flex-col bg-background rounded-2xl border border-primary transition-all duration-500 overflow-hidden shadow-luxury hover:shadow-luxury-hover cursor-pointer h-full ${className}`}
    >
      <div className="h-64 bg-background relative overflow-hidden flex items-center justify-center p-6 border-b border-primary/20">
        {product.is_featured && (
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm text-primary px-3 py-1 rounded-md font-serif text-xs uppercase tracking-wider border border-primary">
            Oferta
          </div>
        )}
        <img 
          className="w-full h-full object-contain mix-blend-lighten group-hover:scale-105 transition-transform duration-700 ease-out" 
          src={product.image || '/placeholder.svg'} 
          alt={product.name}
        />
      </div>
      <div className="p-6 flex flex-col flex-grow bg-background">
        <h3 className="text-xl font-serif font-bold text-foreground mb-4 group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="mt-auto mb-6">
          <span className="block text-2xl font-bold text-primary mb-1">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          <span className="block text-sm text-white/70">ou 10x de R$ {(product.price / 10).toFixed(2).replace('.', ',')} sem juros</span>
        </div>
        <Button 
          className="w-full bg-background border border-primary text-primary hover:bg-primary hover:text-background transition-all duration-300 py-6 rounded-full font-bold uppercase tracking-wider shadow-luxury"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Esgotado' : 'Adicionar'}
        </Button>
      </div>
    </article>
  );
};

export const ProductCardSkeleton = () => (
  <div className="h-[450px] rounded-2xl border border-primary/20 bg-background animate-pulse p-6 flex flex-col gap-4">
    <div className="h-48 bg-muted/50 rounded-xl" />
    <div className="h-6 bg-muted/50 rounded w-3/4" />
    <div className="h-4 bg-muted/50 rounded w-1/2 mt-auto" />
    <div className="h-10 bg-muted/50 rounded w-full" />
  </div>
);