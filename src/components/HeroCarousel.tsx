import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

export const HeroCarousel: React.FC = () => {
  const { data: allProducts = [] } = useProducts();
  const prefersReducedMotion = useReducedMotion();
  
  const ITEMS = React.useMemo(() => {
    const featured = allProducts.filter(p => p.is_featured).slice(0, 5);
    return featured.map(p => ({
      id: p.id,
      title: p.name,
      shortTitle: p.name.split(' ').slice(0, 3).join(' '), // shorter title for badge
      price: `R$ ${p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      image: p.image || '/placeholder.svg',
      inStock: (p.stock || 0) > 0,
    }));
  }, [allProducts]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const slideTo = useCallback((newIndex: number, dir: number) => {
    setDirection(dir);
    setCurrentIndex(newIndex);
  }, []);

  const nextSlide = useCallback(() => {
    slideTo(currentIndex === ITEMS.length - 1 ? 0 : currentIndex + 1, 1);
  }, [currentIndex, slideTo, ITEMS.length]);

  const prevSlide = useCallback(() => {
    slideTo(currentIndex === 0 ? ITEMS.length - 1 : currentIndex - 1, -1);
  }, [currentIndex, slideTo, ITEMS.length]);

  useEffect(() => {
    if (isHovered || ITEMS.length === 0) return;
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, [nextSlide, isHovered, ITEMS.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const slideVariants = {
    initial: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { 
        x: { duration: 0.3, ease: 'easeOut' }, 
        opacity: { duration: 0.3 } 
      },
    },
    exit: {
      opacity: 0,
      transition: { opacity: { duration: 0.2, ease: 'easeIn' } },
    },
  };

  const floatVariants = {
    animate: {
      y: [0, -12, 0],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  if (ITEMS.length === 0) {
    return (
      <div className="w-72 h-[480px] rounded-[40px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentItem = ITEMS[currentIndex];

  return (
    <div 
      className="relative z-10 w-72 h-[480px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Produtos em destaque"
      aria-live="polite"
    >
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={currentItem.id}
          custom={direction}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0"
        >
          <motion.div
            variants={floatVariants}
            animate={prefersReducedMotion ? {} : 'animate'}
            className="w-full h-full relative"
          >
            {/* Card Frame */}
            <div className="w-full h-full rounded-[40px] bg-[#0A0A0A] border border-white/10 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)] relative group">
              <img
                src={currentItem.image}
                alt={currentItem.title}
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                loading="eager"
              />
              {/* Gradient overlay to ensure floating elements contrast well if they overlap */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-black/30 pointer-events-none" />
            </div>

            {/* Floating badge — price */}
            <motion.div
              className="absolute -right-8 top-12 px-5 py-3 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8922A] text-black shadow-[0_10px_30px_rgba(212,175,55,0.3)] z-50 border border-[#f2ca50]/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-black/70 mb-0.5">{currentItem.shortTitle}</p>
              <p className="text-xl font-black leading-none drop-shadow-sm">{currentItem.price}</p>
            </motion.div>

            {/* Floating badge — stock */}
            <motion.div
              className="absolute -left-10 bottom-16 px-5 py-3 rounded-2xl bg-[#050505]/90 backdrop-blur-xl border border-white/10 text-white shadow-2xl z-50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">
                {currentItem.inStock ? 'Estoque' : 'Esgotado'}
              </p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentItem.inStock ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]`} />
                <p className="text-xs font-bold text-white/90">{currentItem.inStock ? 'Disponível' : 'Indisponível'}</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Produto anterior"
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/50 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all backdrop-blur-md"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Próximo produto"
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/50 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all backdrop-blur-md"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={() => slideTo(i, i > currentIndex ? 1 : -1)}
            aria-label={`Ir para o slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${i === currentIndex ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
};
