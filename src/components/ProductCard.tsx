import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useWishlist, saveWishlistPrice } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus, Zap } from 'lucide-react';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const ProductCardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-[#0f0f0f] border border-white/5 animate-pulse">
    <div className="aspect-[3/4] bg-white/5" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-white/5 rounded w-3/4" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
  </div>
);

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  className?: string;
}

// ─── Small Card ───────────────────────────────────────────────────────────────
export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails, className = '' }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock > 0 && product.stock <= 5;
  const isBentoLarge = className.includes('xl:col-span-2') || className.includes('md:col-span-2');

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const installment = (product.price / 10).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  });

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFavorite) saveWishlistPrice(product.id, product.price);
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    toast({
      title: 'Adicionado ✨',
      description: product.name,
    });
  };

  const handleNavigate = () => {
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      navigate(`/produto/${product.id}`);
    }
  };

  // ── Bento / Featured large card ─────────────────────────────────────────────
  if (isBentoLarge) {
    return (
      <article
        onClick={handleNavigate}
        className={`group relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/[0.07]
          cursor-pointer transition-all duration-500 hover:border-[#d4af37]/25
          hover:shadow-[0_20px_60px_-20px_rgba(212,175,55,0.15)] ${className}`}
      >
        {/* Full-bleed image */}
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <img
            src={product.image || '/placeholder.svg'}
            alt={product.name}
            onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
            loading="lazy"
            className="w-full h-full object-cover mix-blend-lighten transition-transform duration-700 group-hover:scale-105"
          />

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#d4af37]/15 backdrop-blur-md border border-[#d4af37]/30 text-[#d4af37] text-[9px] font-black uppercase tracking-widest">
              Destaque
            </span>
            {isLowStock && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 backdrop-blur-md border border-amber-400/30 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                <Zap className="w-2.5 h-2.5 inline mr-1" />
                Últimas {product.stock}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleToggleWishlist}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center
              backdrop-blur-md border transition-all active:scale-90
              ${isFavorite
                ? 'bg-red-500/20 border-red-400/40 text-red-400'
                : 'bg-black/40 border-white/10 text-white/50 hover:border-white/30 hover:text-white'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400' : ''}`} />
          </button>

          {/* Bottom info panel */}
          <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]/70 mb-0.5">
                {product.category || 'Exclusivo'}
              </p>
              <h3 className="text-white font-serif font-bold text-lg leading-tight line-clamp-2 max-w-[220px]">
                {product.name}
              </h3>
            </div>

            <div className="text-right ml-4 shrink-0">
              <p className="text-[#d4af37] font-black text-lg leading-none">
                R$ {fmt(product.price)}
              </p>
              <p className="text-white/30 text-[9px] mt-1">
                10× R$ {installment}
              </p>
            </div>
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* Bottom CTA strip */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <p className="text-white/40 text-xs line-clamp-1 flex-1 mr-4">
            {product.description}
          </p>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black
              transition-all active:scale-90 shadow-lg
              ${isOutOfStock
                ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                : 'bg-[#d4af37] text-black shadow-[0_4px_20px_-4px_rgba(212,175,55,0.5)] hover:bg-[#f2ca50]'}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </article>
    );
  }

  // ── Regular small card ──────────────────────────────────────────────────────
  return (
    <article
      onClick={handleNavigate}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-[#0a0a0a]
        border border-white/[0.07] cursor-pointer
        transition-all duration-400 hover:border-[#d4af37]/20
        hover:shadow-[0_12px_40px_-16px_rgba(212,175,55,0.2)]
        active:scale-[0.98] ${className}`}
    >
      {/* ── Image section ── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#080808]">
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
          loading="lazy"
          className="w-full h-full object-contain p-5 mix-blend-lighten
            transition-transform duration-700 group-hover:scale-[1.06]"
        />

        {/* Gradient overlay — bottom third */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

        {/* Wishlist button — top right */}
        <button
          onClick={handleToggleWishlist}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center
            backdrop-blur-md border transition-all active:scale-90 z-10
            ${isFavorite
              ? 'bg-red-500/20 border-red-400/40 text-red-400'
              : 'bg-black/50 border-white/10 text-white/40 hover:text-white/80'}`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-400' : ''}`} />
        </button>

        {/* Badge — top left */}
        {product.is_featured && !isOutOfStock && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/15 backdrop-blur-md border border-[#d4af37]/30 text-[#d4af37] text-[8px] font-black uppercase tracking-widest">
              Destaque
            </span>
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 backdrop-blur-md border border-amber-400/30 text-amber-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-2 h-2" />
              Últimas {product.stock}
            </span>
          </div>
        )}

        {/* Price badge — bottom left */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="px-2.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white font-black text-sm leading-none">
            R$ {fmt(product.price)}
          </span>
        </div>

        {/* Add to cart button — bottom right */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={`Adicionar ${product.name} ao carrinho`}
          className={`absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center
            font-black transition-all active:scale-90 shadow-lg
            ${isOutOfStock
              ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
              : 'bg-[#d4af37] text-black shadow-[0_4px_16px_-4px_rgba(212,175,55,0.6)] hover:bg-[#f2ca50]'}`}
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/35 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* ── Info section ── */}
      <div className="px-3 pt-2.5 pb-3 flex-1 flex flex-col gap-0.5">
        <h3 className="text-white/90 font-semibold text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">
          {product.name}
        </h3>
        <p className="text-white/25 text-[10px] font-medium">
          {product.category && <span className="text-white/35">{product.category} · </span>}
          10× R$ {installment}
        </p>
      </div>
    </article>
  );
};
