import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Product } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useWishlist, saveWishlistPrice } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useReducedMotion } from '@/lib/motion';
import { Heart, Plus, Zap, Star } from 'lucide-react';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const ProductCardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-[#0f0f0f] border border-white/5 animate-pulse">
    <div className="aspect-[3/4] bg-gradient-to-br from-white/[0.04] to-transparent" />
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
  index?: number;
}

// ─── Compact rating row (real data) ───────────────────────────────────────────
const RatingInline: React.FC<{ avg: number; count: number; light?: boolean }> = ({ avg, count, light }) => (
  <span className="flex items-center gap-1">
    <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
    <span className={`text-[10px] font-bold ${light ? 'text-white/70' : 'text-white/50'}`}>
      {avg.toFixed(1)}
    </span>
    <span className="text-[10px] text-white/25">({count})</span>
  </span>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails, className = '', index = 0 }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: ratings } = useProductRatings();
  const reduced = useReducedMotion();

  const cardRef = useRef<HTMLElement>(null);
  const inView = useInView(cardRef, { once: true, amount: 0.15, margin: '-8% 0px' });

  const rating = ratings?.[product.id];
  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock > 0 && product.stock <= 5;
  const isBentoLarge = className.includes('xl:col-span-2') || className.includes('md:col-span-2');

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const installment = (product.price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Spotlight que segue o cursor (desktop) — atualiza CSS vars sem re-render.
  const handlePointer = (e: React.MouseEvent<HTMLElement>) => {
    if (reduced || typeof window === 'undefined' || window.innerWidth < 768) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFavorite) saveWishlistPrice(product.id, product.price);
    toggleWishlist(product.id);
  };
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    toast({ title: 'Adicionado ✨', description: product.name });
  };
  const handleNavigate = () => {
    if (onViewDetails) onViewDetails(product);
    else navigate(`/produto/${product.id}`);
  };

  const entrance = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 36, filter: 'blur(6px)' },
        animate: inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {},
        transition: { duration: 0.7, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] as const },
      };

  // ── Bento / Featured large card ─────────────────────────────────────────────
  if (isBentoLarge) {
    return (
      <motion.article
        ref={cardRef as React.RefObject<HTMLDivElement>}
        onClick={handleNavigate}
        onMouseMove={handlePointer}
        whileHover={reduced ? undefined : { y: -6 }}
        {...entrance}
        className={`group lumina-card relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/[0.07]
          cursor-pointer transition-[border-color,box-shadow] duration-500 hover:border-[#d4af37]/30
          hover:shadow-[0_30px_80px_-30px_rgba(212,175,55,0.28)] ${className}`}
      >
        {/* Spotlight glow */}
        <div className="lumina-spot pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative h-56 sm:h-72 overflow-hidden">
          <img
            src={product.image || '/placeholder.svg'}
            alt={product.name}
            onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
            loading="lazy"
            className="w-full h-full object-cover mix-blend-lighten transition-transform duration-[900ms] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          {/* Shine sweep */}
          <div className="lumina-shine pointer-events-none absolute inset-0 z-[2]" />

          <div className="absolute top-3 left-3 flex items-center gap-2 z-[3]">
            <span className="px-2.5 py-1 rounded-full bg-[#d4af37]/15 backdrop-blur-md border border-[#d4af37]/30 text-[#d4af37] text-[9px] font-black uppercase tracking-widest">
              Destaque
            </span>
            {isLowStock && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 backdrop-blur-md border border-amber-400/30 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                <Zap className="w-2.5 h-2.5 inline mr-1" />Últimas {product.stock}
              </span>
            )}
          </div>

          <button
            onClick={handleToggleWishlist}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`absolute top-3 right-3 z-[3] w-9 h-9 rounded-full flex items-center justify-center
              backdrop-blur-md border transition-all active:scale-90
              ${isFavorite
                ? 'bg-red-500/20 border-red-400/40 text-red-400'
                : 'bg-black/40 border-white/10 text-white/50 hover:border-white/30 hover:text-white'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400' : ''}`} />
          </button>

          <div className="absolute bottom-0 inset-x-0 p-4 z-[3] flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]/70 mb-0.5">
                {product.category || 'Exclusivo'}
              </p>
              <h3 className="text-white font-serif font-bold text-lg leading-tight line-clamp-2 max-w-[220px]">
                {product.name}
              </h3>
              {rating && rating.review_count > 0 && (
                <div className="mt-1.5"><RatingInline avg={rating.avg_rating} count={rating.review_count} light /></div>
              )}
            </div>
            <div className="text-right ml-4 shrink-0">
              <p className="text-[#d4af37] font-black text-lg leading-none drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                R$ {fmt(product.price)}
              </p>
              <p className="text-white/30 text-[9px] mt-1">10× R$ {installment}</p>
            </div>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[4]">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">Esgotado</span>
            </div>
          )}
        </div>

        <div className="relative z-[3] flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <p className="text-white/40 text-xs line-clamp-1 flex-1 mr-4">{product.description}</p>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black transition-all active:scale-90 shadow-lg
              ${isOutOfStock
                ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                : 'bg-[#d4af37] text-black shadow-[0_4px_20px_-4px_rgba(212,175,55,0.5)] hover:bg-[#f2ca50] hover:scale-110'}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </motion.article>
    );
  }

  // ── Regular small card ──────────────────────────────────────────────────────
  return (
    <motion.article
      ref={cardRef as React.RefObject<HTMLDivElement>}
      onClick={handleNavigate}
      onMouseMove={handlePointer}
      whileHover={reduced ? undefined : { y: -8 }}
      {...entrance}
      className={`group lumina-card relative flex flex-col overflow-hidden rounded-2xl bg-[#0a0a0a]
        border border-white/[0.07] cursor-pointer
        transition-[border-color,box-shadow] duration-400 hover:border-[#d4af37]/25
        hover:shadow-[0_20px_60px_-24px_rgba(212,175,55,0.32)] ${className}`}
    >
      {/* Spotlight glow follows cursor */}
      <div className="lumina-spot pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* ── Image ── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#080808]">
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
          loading="lazy"
          className="w-full h-full object-contain p-5 mix-blend-lighten
            transition-transform duration-[800ms] ease-out group-hover:scale-[1.1] group-hover:-rotate-1"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
        {/* Diagonal shine sweep on hover */}
        <div className="lumina-shine pointer-events-none absolute inset-0 z-[2]" />

        {/* Wishlist */}
        <button
          onClick={handleToggleWishlist}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center
            backdrop-blur-md border transition-all active:scale-90 z-[3]
            ${isFavorite
              ? 'bg-red-500/20 border-red-400/40 text-red-400'
              : 'bg-black/50 border-white/10 text-white/40 hover:text-white/80'}`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-400' : ''}`} />
        </button>

        {/* Badge */}
        {product.is_featured && !isOutOfStock && (
          <div className="absolute top-2.5 left-2.5 z-[3]">
            <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/15 backdrop-blur-md border border-[#d4af37]/30 text-[#d4af37] text-[8px] font-black uppercase tracking-widest">Destaque</span>
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2.5 left-2.5 z-[3]">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 backdrop-blur-md border border-amber-400/30 text-amber-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-2 h-2" />Últimas {product.stock}
            </span>
          </div>
        )}

        {/* Price glass badge */}
        <div className="absolute bottom-2.5 left-2.5 z-[3]">
          <span className="px-2.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white font-black text-sm leading-none">
            R$ {fmt(product.price)}
          </span>
        </div>

        {/* Add button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={`Adicionar ${product.name} ao carrinho`}
          className={`absolute bottom-2 right-2 z-[3] w-9 h-9 rounded-full flex items-center justify-center font-black transition-all active:scale-90 shadow-lg
            ${isOutOfStock
              ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
              : 'bg-[#d4af37] text-black shadow-[0_4px_16px_-4px_rgba(212,175,55,0.6)] hover:bg-[#f2ca50] hover:scale-110'}`}
        >
          <Plus className="w-4 h-4" />
        </button>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[4]">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/35 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">Esgotado</span>
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="relative z-[3] px-3 pt-2.5 pb-3 flex-1 flex flex-col gap-1">
        <h3 className="text-white/90 font-semibold text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">
          {product.name}
        </h3>
        {rating && rating.review_count > 0 && (
          <RatingInline avg={rating.avg_rating} count={rating.review_count} />
        )}
        <p className="text-white/25 text-[10px] font-medium mt-auto">
          {product.category && <span className="text-white/35">{product.category} · </span>}
          10× R$ {installment}
        </p>
      </div>
    </motion.article>
  );
};
