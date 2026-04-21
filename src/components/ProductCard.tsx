import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from '@/components/ui/carousel';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onViewDetails 
}) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const images = (product.images || [product.image]).filter(Boolean);
  const hasMultipleImages = images.length > 1;
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
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
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

  return (
    <Card 
      onClick={handleViewDetails}
      className={`group cursor-pointer overflow-hidden border-border bg-gradient-card transition-all duration-500 hover:shadow-hover hover:-translate-y-1 ${isOutOfStock ? 'opacity-80' : ''}`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/20">
        {/* Status Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {isOutOfStock ? (
            <Badge variant="destructive" className="font-semibold shadow-sm">
              Esgotado
            </Badge>
          ) : product.stock <= 5 ? (
            <Badge variant="secondary" className="bg-orange-500 text-white border-none font-semibold shadow-sm">
              Últimas unidades
            </Badge>
          ) : null}
          
          {product.is_featured && (
            <Badge variant="default" className="bg-primary text-primary-foreground font-semibold shadow-sm">
              Destaque
            </Badge>
          )}
        </div>

        {hasMultipleImages ? (
          <Carousel className="w-full h-full">
            <CarouselContent className="h-full">
              {images.map((image, index) => (
                <CarouselItem key={index} className="h-full">
                  <img
                    src={image}
                    alt={`${product.name} - Imagem ${index + 1}`}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90 border-0 h-8 w-8" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90 border-0 h-8 w-8" />
          </Carousel>
        ) : (
          <img
            src={images[0] || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        )}
        
        {/* Quick View Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-xs font-medium text-center">Clique para ver detalhes</p>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-serif font-bold text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>
          <p className="text-2xl font-bold text-primary">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2 h-10">
            {product.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-2">
          <Button 
            variant="default"
            disabled={isOutOfStock}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm transition-all active:scale-95"
            onClick={handleAddToCart}
          >
            {isOutOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
;