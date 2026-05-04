import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/database';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist, saveWishlistPrice } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = {
  // Small card
  card: 'group relative flex flex-col bg-background rounded-2xl border border-primary transition-all duration-500 overflow-hidden shadow-luxury hover:shadow-luxury-hover cursor-pointer h-full',
  imageSection: 'h-52 bg-background relative overflow-hidden flex items-center justify-center p-5 border-b border-primary/20',
  ofertaBadge: 'absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm text-primary px-3 py-1 rounded-md font-serif text-xs uppercase tracking-wider border border-primary',
  wishlistBtn: (active: boolean) =>
    `absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
      active ? 'bg-primary text-background' : 'bg-background/80 backdrop-blur-md text-primary hover:scale-110'
    }`,
  productImg: 'w-full h-full object-contain mix-blend-lighten group-hover:scale-105 transition-transform duration-700 ease-out',
  cardBody: 'p-6 flex flex-col flex-grow bg-background',
  cardTitle: 'text-xl font-serif font-bold text-foreground mb-4 group-hover:text-primary transition-colors',
  priceBlock: 'mt-auto mb-6',
  priceMain: 'block text-2xl font-bold text-primary mb-1',
  priceInstallments: 'block text-sm text-white/70',
  addBtn: 'w-full bg-background border border-primary text-primary hover:bg-primary hover:text-background transition-all duration-300 py-3 rounded-full font-bold uppercase tracking-wider shadow-luxury',
  // Large (bento) card
  largeCard: 'group relative flex flex-col sm:flex-row bg-background rounded-2xl border border-primary transition-all duration-500 overflow-hidden shadow-luxury hover:shadow-luxury-hover cursor-pointer',
  largeImageSection: 'sm:w-1/2 h-64 sm:h-auto bg-background relative overflow-hidden flex items-center justify-center p-8 border-b sm:border-b-0 sm:border-r border-primary/20',
  largeDestaqueBadge: 'absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm text-primary px-3 py-1 rounded-md font-serif text-xs uppercase tracking-wider border border-primary',
  largeWishlistBtn: (active: boolean) =>
    `absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
      active ? 'bg-primary text-background' : 'bg-background/80 backdrop-blur-md text-primary hover:scale-110'
    }`,
  largeBody: 'sm:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-background',
  largePremiumBadge: 'bg-muted text-foreground text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wider border border-primary/30',
  largeTitle: 'text-2xl font-serif font-bold text-foreground mb-2 group-hover:text-primary transition-colors',
  largeDesc: 'text-sm text-white/80 mb-5 line-clamp-2',
  largePriceMain: 'block text-2xl font-bold text-primary mb-1',
  largePriceInstallments: 'block text-sm text-white/70',
  largeAddBtn: 'w-full bg-background border border-primary text-primary hover:bg-primary hover:text-background transition-all duration-300 py-3 rounded-full font-bold uppercase tracking-wider shadow-luxury',
};

// ─── skeleton ─────────────────────────────────────────────────────────────────
export const ProductCardSkeleton = () => (
  <div className="h-[450px] rounded-2xl border border-primary/20 bg-background animate-pulse p-6 flex flex-col gap-4">
    <div className="h-48 bg-muted/50 rounded-xl" />
    <div className="h-6 bg-muted/50 rounded w-3/4" />
    <div className="h-4 bg-muted/50 rounded w-1/2 mt-auto" />
    <div className="h-10 bg-muted/50 rounded w-full" />
  </div>
);
// ─────────────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails, className = '' }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = product.stock === 0;
  const isBentoLarge = className.includes('xl:col-span-2') || className.includes('md:col-span-2');

  const installmentPrice = (product.price / 10).toFixed(2).replace('.', ',');
  const formattedPrice = product.price.toFixed(2).replace('.', ',');

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFavorite) saveWishlistPrice(product.id, product.price);
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    toast({ title: 'Adicionado ao Carrinho', description: `${product.name} agora faz parte da sua seleção.` });
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      navigate(`/produto/${product.id}`);
    }
  };

  if (isBentoLarge) {
    return (
      <article onClick={handleViewDetails} className={`${styles.largeCard} ${className}`}>
        <div className={styles.largeImageSection}>
          <div className={styles.largeDestaqueBadge}>Destaque</div>
          <button
            onClick={handleToggleWishlist}
            aria-label={isFavorite ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`}
            className={styles.largeWishlistBtn(isFavorite)}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <img
            className={styles.productImg}
            src={product.image || '/placeholder.svg'}
            alt={`${product.name} — ${product.category || 'Acessório'}`}
            loading="lazy"
          />
        </div>
        <div className={styles.largeBody}>
          <div className="mb-2">
            <span className={styles.largePremiumBadge}>Premium</span>
          </div>
          <h3 className={styles.largeTitle}>{product.name}</h3>
          <p className={styles.largeDesc}>{product.description}</p>
          <div className="mb-6">
            <span className={styles.largePriceMain}>R$ {formattedPrice}</span>
            <span className={styles.largePriceInstallments}>ou 10x de R$ {installmentPrice} sem juros</span>
          </div>
          <Button className={styles.largeAddBtn} onClick={handleAddToCart} disabled={isOutOfStock}>
            {isOutOfStock ? 'Esgotado' : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article onClick={handleViewDetails} className={`${styles.card} ${className}`}>
      <div className={styles.imageSection}>
        {product.is_featured && <div className={styles.ofertaBadge}>Oferta</div>}
        <button
          onClick={handleToggleWishlist}
          aria-label={isFavorite ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`}
          className={styles.wishlistBtn(isFavorite)}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <img
          className={styles.productImg}
          src={product.image || '/placeholder.svg'}
          alt={`${product.name} — ${product.category || 'Acessório'}`}
          loading="lazy"
        />
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{product.name}</h3>
        <div className={styles.priceBlock}>
          <span className={styles.priceMain}>R$ {formattedPrice}</span>
          <span className={styles.priceInstallments}>ou 10x de R$ {installmentPrice} sem juros</span>
        </div>
        <Button className={styles.addBtn} onClick={handleAddToCart} disabled={isOutOfStock}>
          {isOutOfStock ? 'Esgotado' : 'Adicionar'}
        </Button>
      </div>
    </article>
  );
};
