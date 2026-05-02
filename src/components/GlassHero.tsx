import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Star, Shield, Zap } from 'lucide-react';
import { GoldenBlob } from '@/components/animations/GoldenBlob';
import { TrackingInText } from '@/components/animations/TrackingIn';
import { MaskReveal } from '@/components/animations/MaskReveal';
import { WHATSAPP_LINK } from '@/config/constants';

const WHATSAPP = `${WHATSAPP_LINK}?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es!`;

const floatVariants = {
  animate: {
    y: [0, -16, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

const pills = [
  { icon: Star, label: 'Curadoria Premium', sub: '4.9★ avaliação' },
  { icon: Shield, label: 'Garantia Total', sub: 'Troca em 7 dias' },
  { icon: Zap, label: 'Entrega Expressa', sub: 'Mesmo dia Osasco' },
];

export const GlassHero: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="relative w-full min-h-[100svh] overflow-hidden bg-[#0A0A0A] flex items-center"
      aria-label="Hero principal"
    >
      {/* ── Decorative golden gradient line at bottom ── */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent z-20" />

      {/* ── Animated blobs ── */}
      <GoldenBlob
        size={700}
        opacity={0.3}
        duration={9}
        className="-top-60 -left-40"
        xPath={[0, 100, -60, 50, 0]}
        yPath={[0, -80, 60, -40, 0]}
      />
      <GoldenBlob
        size={400}
        opacity={0.15}
        duration={12}
        className="top-1/2 right-0"
        xPath={[0, -70, 30, -50, 0]}
        yPath={[0, 50, -40, 20, 0]}
      />

      {/* ── Subtle grid overlay ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 md:px-12 pt-28 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* LEFT — text */}
        <div className="flex flex-col items-start gap-8">

          {/* Badge pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#D4AF37]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Tecnologia Premium · Osasco SP
          </motion.div>

          {/* Main heading with TrackingIn effect */}
          <h1 className="text-6xl md:text-8xl font-serif font-black leading-none tracking-tight text-white">
            <TrackingInText
              text="JR"
              className="text-[#D4AF37] block"
              stagger={0.1}
              delay={0.3}
            />
            <TrackingInText
              text="acessorios"
              className="text-white italic font-light block text-5xl md:text-7xl"
              stagger={0.06}
              delay={0.6}
            />
          </h1>

          {/* Subtitle with MaskReveal */}
          <MaskReveal delay={1.0} duration={0.8}>
            <p className="text-white/40 text-base md:text-lg font-medium max-w-md leading-relaxed">
              Curadoria digital de acessórios premium com inteligência artificial.
              Encontre o item perfeito para o seu estilo de vida.
            </p>
          </MaskReveal>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <Link to="/produtos">
              <motion.button
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#D4AF37] text-black font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(212,175,55,0.35)] border border-[#D4AF37]/60"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05, boxShadow: '0 0 60px rgba(212,175,55,0.6)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <ShoppingBag className="w-4 h-4" />
                Ver Ofertas
              </motion.button>
            </Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              <motion.button
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 backdrop-blur-xl text-white font-bold text-sm uppercase tracking-widest border border-white/10 hover:border-[#D4AF37]/30 transition-colors"
                whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </motion.button>
            </a>
          </motion.div>

          {/* Trust pills */}
          <motion.div
            className="flex flex-wrap gap-3 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            {pills.map((pill, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.07] hover:border-[#D4AF37]/20 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                  <pill.icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white">{pill.label}</p>
                  <p className="text-[9px] text-white/30">{pill.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — floating product image */}
        <div className="hidden lg:flex items-center justify-center relative">
          {/* Glow ring behind image */}
          <div className="absolute w-80 h-80 rounded-full bg-[#D4AF37]/10 blur-[60px]" />

          <motion.div
            variants={floatVariants}
            animate={prefersReducedMotion ? {} : 'animate'}
            className="relative z-10"
          >
            {/* Glassmorphism frame */}
            <div className="w-72 h-[480px] rounded-[40px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex items-center justify-center p-6">
              <img
                src="https://images.unsplash.com/photo-1695048133142-1a20484d256e?w=600"
                alt="iPhone 15 Pro Max — JR Acessórios"
                className="w-full h-full object-contain drop-shadow-2xl mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
                loading="eager"
              />
            </div>

            {/* Floating badge — price */}
            <motion.div
              className="absolute -right-8 top-16 px-5 py-3 rounded-2xl bg-[#D4AF37] text-black shadow-xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest">iPhone 15 Pro</p>
              <p className="text-lg font-black leading-none">R$9.500</p>
            </motion.div>

            {/* Floating badge — stock */}
            <motion.div
              className="absolute -left-10 bottom-20 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white shadow-xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.9, duration: 0.5 }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Em Estoque</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-xs font-black">Disponível</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Scroll</p>
        <motion.div
          className="w-[1px] h-8 bg-gradient-to-b from-[#D4AF37]/40 to-transparent"
          animate={prefersReducedMotion ? {} : { scaleY: [1, 0.3, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
};
