import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Diamond, Star, MessageCircle, Users, Package, Award, Smartphone, Watch, Headphones, Zap, Plus, Truck, RefreshCw, FileText, Lock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GlassHero } from '@/components/GlassHero';
import { Testimonials } from '@/components/ui/twitter-testimonial-cards';
import { WHATSAPP_LINK } from '@/config/constants';
import { SmartShowcase } from '@/components/SmartShowcase';
import { TrackingInText } from '@/components/animations/TrackingIn';
import { MaskReveal } from '@/components/animations/MaskReveal';
import { Reveal } from '@/components/animations/Reveal';
import { useAppSettings } from '@/hooks/useProducts';

const ApplePhoneIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5.5" y="2.5" width="13" height="19" rx="3.5" />
    <path d="M10.5 2.5h3" strokeWidth="1.5" />
    <circle cx="12" cy="18.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

const AppleWatchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="7" y="5" width="10" height="14" rx="3.5" />
    <path d="M8.5 2v3" />
    <path d="M15.5 2v3" />
    <path d="M8.5 19v3" />
    <path d="M15.5 19v3" />
    <path d="M17 9h1" strokeWidth="1.5" />
    <circle cx="17.5" cy="13" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const AirPodsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 14.5v-2a9 9 0 0 1 18 0v2" />
    <rect x="3" y="14.5" width="18" height="7" rx="3" />
    <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const CaseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="4" />
    <rect x="6.5" y="3.5" width="11" height="17" rx="2.5" strokeOpacity="0.5" />
    <path d="M10 2h4" strokeWidth="1.5" />
  </svg>
);

const EnergyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4v3" />
    <path d="M12 17v3" />
    <path d="M4 12h3" />
    <path d="M17 12h3" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

/* ─── Countdown Hook ─── */
function useCountdown(targetHours: number) {
  const end = useRef(Date.now() + targetHours * 3600 * 1000);
  const calc = () => {
    const diff = Math.max(0, end.current - Date.now());
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

/* ─── Page Component ─── */
const Index: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('home');

  const countdown = useCountdown(23);
  const { data: settings } = useAppSettings();
  const bannerEnabled = settings?.offer_banner_enabled !== 'false';
  const bannerBadge = settings?.offer_banner_badge || 'Oferta Relâmpago';
  const bannerText = settings?.offer_banner_text || 'Até 20% OFF em acessórios selecionados';
  const freeShippingThreshold = settings?.free_shipping_threshold || '500';

  const WHATSAPP = `${WHATSAPP_LINK}?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es!`;

  const stats = [
    { icon: Users, value: '500+', label: 'Clientes Satisfeitos' },
    { icon: Star, value: '4.9★', label: 'Avaliação Média' },
    { icon: Package, value: '1.200+', label: 'Produtos Vendidos' },
    { icon: Award, value: '3 Anos', label: 'No Mercado' },
  ];

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-28">
      <SEO />
      <Header />

      {/* ═══ WhatsApp Floating Button ═══ */}
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-4 md:px-5 py-3 rounded-full shadow-[0_4px_24px_rgba(212,175,55,0.5)] hover:scale-105 transition-transform duration-200 whitespace-nowrap"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        <span className="hidden sm:inline">Compre pelo WhatsApp</span>
        <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-background animate-ping" />
        <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-background" />
      </a>

      {/* ═══ Hero ═══ */}
      <GlassHero />

      {/* ═══ Flash Sale Countdown ═══ */}
      {bannerEnabled && (
      <section className="bg-zinc-950 border-y border-primary/30 py-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-primary font-black uppercase tracking-widest text-xs">{bannerBadge}</p>
                <p className="text-white font-bold text-sm md:text-base">{bannerText}</p>
              </div>
            </div>
            {/* Timer + CTA — não estoura no mobile (wrap + botão full-width) */}
            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
              <p className="hidden sm:block text-white/60 text-xs uppercase tracking-wider mr-2">Termina em:</p>
              {[
                { val: String(countdown.h).padStart(2, '0'), label: 'h' },
                { val: String(countdown.m).padStart(2, '0'), label: 'm' },
                { val: String(countdown.s).padStart(2, '0'), label: 's' },
              ].map((t, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-primary font-black text-lg">:</span>}
                  <div className="flex flex-col items-center bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 min-w-[44px]">
                    <span className="text-primary font-black text-xl leading-none tabular-nums">{t.val}</span>
                    <span className="text-white/40 text-[9px] uppercase">{t.label}</span>
                  </div>
                </React.Fragment>
              ))}
              <Link to="/produtos" className="w-full sm:w-auto sm:ml-3">
                <Button size="sm" className="w-full rounded-full h-10 px-5 text-xs font-black shadow-lg shadow-primary/30">
                  Ver Ofertas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ─── Categories Nav ─── */}
      <section className="bg-[#0a0a0a] border-b border-white/5 py-4">
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex justify-between md:justify-center gap-6 md:gap-16 min-w-max">
            {[
              { label: 'iPhones', value: 'Smartphone', icon: ApplePhoneIcon, color: 'bg-blue-500/10 text-blue-500' },
              { label: 'Watches', value: 'Watch', icon: AppleWatchIcon, color: 'bg-orange-500/10 text-orange-500' },
              { label: 'AirPods', value: 'Audio', icon: AirPodsIcon, color: 'bg-purple-500/10 text-purple-500' },
              { label: 'Cases', value: 'Protection', icon: CaseIcon, color: 'bg-green-500/10 text-green-500' },
              { label: 'Energia', value: 'Power', icon: EnergyIcon, color: 'bg-yellow-500/10 text-yellow-500' },
              { label: 'Mais', value: '', icon: PlusIcon, color: 'bg-primary/10 text-primary' }
            ].map((item, i) => (
              <Link key={i} to={`/produtos${item.value ? `?category=${item.value}` : ''}`} className="flex flex-col items-center gap-3 group transition-all">
                <div className={`h-14 w-14 rounded-full ${item.color} flex items-center justify-center transition-all duration-500 shadow-lg border border-white/5 group-hover:border-primary/40 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <item.icon className="h-7 w-7 transition-transform duration-500 group-hover:scale-110" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white transition-all">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Smart Showcase Section (Vitrine Inteligente) ═══ */}
      <section className="py-14 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="container mx-auto px-4">
          <Reveal y={32}>
            <SmartShowcase
              title="Lumina Selection"
              subtitle="Nossa inteligência identificou estas peças como as mais desejadas da semana."
              mode="trending"
              limit={4}
              TitleComponent={TrackingInText}
            />
          </Reveal>
        </div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="py-10 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <Reveal key={i} delay={i * 0.08} y={20}>
                <div className="flex flex-col items-center text-center gap-2 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-foreground">{s.value}</span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Bento Showcase ═══ */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {/* Apple banner — spans 2 cols on all sizes */}
            <Link
              to="/produtos"
              className="relative col-span-2 h-48 md:h-56 rounded-2xl overflow-hidden bg-zinc-900 border border-primary/20 group cursor-pointer"
            >
              <div className="absolute inset-0 bg-zinc-800 bg-[url('https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop')] bg-cover bg-center brightness-[0.4] group-hover:brightness-50 transition-all duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-primary mb-1 opacity-80">Coleção Premium</span>
                <h3 className="text-lg md:text-2xl font-bold text-white uppercase tracking-wider">Acessórios Apple</h3>
                <p className="text-primary text-xs font-bold mt-1 group-hover:translate-x-1 transition-transform duration-300">
                  Até 20% OFF na primeira compra →
                </p>
              </div>
            </Link>

            {/* Stats card — gold accent */}
            <div className="h-48 md:h-56 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/25 p-5 flex flex-col justify-between overflow-hidden relative">
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/50">Lumina Index</span>
                <p className="text-4xl font-serif font-black text-primary mt-1 drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]">4.9★</p>
                <p className="text-[9px] text-white/35 font-bold mt-0.5 uppercase tracking-wider">Avaliação Média</p>
              </div>
              <div className="relative z-10 space-y-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Clientes</span>
                  <span className="text-sm font-black text-white">500+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Vendidos</span>
                  <span className="text-sm font-black text-white">1.2k+</span>
                </div>
              </div>
            </div>

            {/* Frete Grátis card */}
            <div className="h-48 md:h-56 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-colors duration-300 p-5 flex flex-col justify-center gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <Truck className="w-8 h-8 text-primary/40 group-hover:text-primary/60 transition-colors relative z-10" />
              <div className="relative z-10">
                <p className="text-sm font-black text-white">Frete Grátis</p>
                <p className="text-[10px] text-white/30 mt-1 leading-relaxed">
                  Compras acima de{' '}
                  <span className="text-primary font-bold">R$ {freeShippingThreshold}</span>{' '}
                  têm envio cortesia
                </p>
              </div>
              <Link
                to="/produtos"
                className="text-[9px] font-black uppercase tracking-widest text-primary/50 group-hover:text-primary transition-colors relative z-10"
              >
                Ver Produtos →
              </Link>
            </div>

            {/* Smartwatches banner — spans 2 cols on all sizes */}
            <Link
              to="/produtos?category=Watch"
              className="relative col-span-2 h-48 md:h-56 rounded-2xl overflow-hidden bg-zinc-900 border border-primary/20 group cursor-pointer"
            >
              <div className="absolute inset-0 bg-zinc-800 bg-[url('https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center brightness-[0.5] group-hover:brightness-75 transition-all duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-primary mb-1 opacity-80">Novidades</span>
                <h3 className="text-lg md:text-2xl font-bold text-white uppercase tracking-wider">Smartwatches</h3>
                <p className="text-primary text-xs font-bold mt-1 group-hover:translate-x-1 transition-transform duration-300">
                  Lançamentos exclusivos → Ver Coleção
                </p>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ═══ Depoimentos ═══ */}
      <section className="py-12 md:py-16 bg-muted/30 border-y overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: info */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                <Star className="h-3 w-3 fill-primary" /> Avaliações Reais
              </div>
              <h2 className="text-2xl md:text-4xl font-serif font-black text-foreground leading-tight">
                <TrackingInText text="O que nossos" className="block" stagger={0.05} />
                <TrackingInText text="clientes dizem" className="block text-primary italic" stagger={0.05} delay={0.4} />
              </h2>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-primary text-primary" />)}
                <span className="ml-2 font-black text-foreground text-lg">4.9</span>
                <span className="text-muted-foreground text-sm">/5 — mais de 200 avaliações</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
                Clientes reais, experiências reais com a JR acessorios.
              </p>
            </div>

            {/* Right: stacked cards */}
            <div className="flex justify-center items-center min-h-[320px] sm:min-h-[380px]">
              <Testimonials />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WhatsApp CTA Banner ═══ */}
      <section className="py-10 md:py-14 bg-card border-y border-primary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              <Diamond className="h-3 w-3 fill-primary/30" /> Atendimento Exclusivo
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-foreground">
              Prefere comprar pelo <span className="text-primary italic">WhatsApp?</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
              Fale diretamente com nossa equipe.
            </p>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 py-6 rounded-full text-base shadow-[0_4px_24px_rgba(212,175,55,0.3)] hover:scale-105 transition-all mt-2">
                <MessageCircle className="h-5 w-5 mr-2" />
                Chamar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Trust Signals ═══ */}
      <section className="py-10 bg-zinc-950 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'Pagamento Seguro', desc: 'PIX e Cartão criptografados' },
              { icon: RefreshCw, title: 'Troca em 7 dias', desc: 'Garantia pelo CDC' },
              { icon: FileText, title: 'Nota Fiscal', desc: 'Todos os produtos com NF' },
              { icon: Truck, title: 'Entrega Rápida', desc: 'Mesmo dia em Osasco' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{item.title}</p>
                  <p className="text-white/30 text-[10px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;