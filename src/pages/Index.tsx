import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Shield, Gift, MapPin, Clock, Instagram, ChevronRight, Diamond, Star, MessageCircle, Users, Package, Award, ChevronDown, Smartphone, Watch, Headphones, Zap, Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/hooks/useProducts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { GlowCard } from '@/components/ui/spotlight-card';
import { Testimonials } from '@/components/ui/twitter-testimonial-cards';
import { INSTAGRAM_URL, WHATSAPP_LINK } from '@/config/constants';
import { SmartShowcase } from '@/components/SmartShowcase';

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const WHATSAPP = `${WHATSAPP_LINK}?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es!`;

  const testimonials = [
    { name: 'Rafaela M.', city: 'Osasco', stars: 5, text: 'Comprei meu iPhone aqui e chegou no mesmo dia, embalado com muito cuidado. Atendimento impecável pelo WhatsApp!' },
    { name: 'Carlos S.', city: 'São Paulo', stars: 5, text: 'Melhor loja de acessórios da região! Case e película de qualidade, preço justo e entrega rápida. Super recomendo.' },
    { name: 'Juliana P.', city: 'Barueri', stars: 5, text: 'Atendimento personalizado incrível! Me ajudaram a escolher o smartwatch ideal. Produto 100% original e com nota fiscal.' },
    { name: 'Marcos T.', city: 'Carapicuíba', stars: 5, text: 'Já é a terceira vez que compro aqui. Sempre entrega no prazo, produto original e suporte pós-venda excelente!' },
  ];

  const faqs = [
    { q: 'Os produtos são originais?', a: 'Sim! Todos os nossos produtos são 100% originais, com nota fiscal e garantia do fabricante. Trabalhamos apenas com marcas certificadas.' },
    { q: 'Como funciona a retirada em mãos?', a: 'Após confirmar seu pedido pelo WhatsApp, você agenda a retirada em nossa loja em Osasco (Rua Martim Afonso, 431) no mesmo dia ou no dia seguinte.' },
    { q: 'Vocês fazem entrega?', a: 'Sim! Entregamos para todo o Brasil via Correios e transportadoras. Para a região de Osasco e adjacências, oferecemos entrega expressa no mesmo dia.' },
    { q: 'Qual o prazo de garantia?', a: 'Produtos eletrônicos possuem garantia mínima de 90 dias. Smartphones e smartwatches têm garantia de 12 meses do fabricante mais 3 meses adicionais da nossa loja.' },
    { q: 'Posso trocar se o produto não servir?', a: 'Com certeza! Aceitamos trocas em até 7 dias após a compra, conforme o Código de Defesa do Consumidor, desde que o produto esteja em perfeito estado.' },
  ];

  const brands = [
    { name: 'Apple', logo: '🍎' },
    { name: 'Samsung', logo: '📲' },
    { name: 'Xiaomi', logo: '⚡' },
    { name: 'JBL', logo: '🎵' },
    { name: 'Motorola', logo: '📡' },
    { name: 'Anker', logo: '🔋' },
  ];

  const stats = [
    { icon: Users, value: '500+', label: 'Clientes Satisfeitos' },
    { icon: Star, value: '4.9★', label: 'Avaliação Média' },
    { icon: Package, value: '1.200+', label: 'Produtos Vendidos' },
    { icon: Award, value: '3 Anos', label: 'No Mercado' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO />
      <Header />

      {/* ═══ WhatsApp Floating Button ═══ */}
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-4 py-3 rounded-full shadow-[0_4px_24px_rgba(212,175,55,0.5)] hover:scale-105 transition-transform duration-200"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Compre pelo WhatsApp</span>
        <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-background animate-ping" />
        <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-background" />
      </a>

      {/* ═══ Hero ═══ */}
      <BackgroundPaths title="JR acessorios" />

      {/* ═══ Flash Sale Countdown ═══ */}
      <section className="bg-zinc-950 border-y border-primary/30 py-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-primary font-black uppercase tracking-widest text-xs">Oferta Relâmpago</p>
                <p className="text-white font-bold text-sm md:text-base">Até <span className="text-primary">20% OFF</span> em acessórios selecionados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-white/60 text-xs uppercase tracking-wider mr-2">Termina em:</p>
              {[
                { val: String(countdown.h).padStart(2, '0'), label: 'h' },
                { val: String(countdown.h).padStart(2, '0'), label: 'h' }, // Wait, h was twice? Fixed h, m, s
                { val: String(countdown.m).padStart(2, '0'), label: 'm' },
                { val: String(countdown.s).padStart(2, '0'), label: 's' },
              ].slice(1).map((t, i) => ( // Fixed map logic
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-primary font-black text-lg">:</span>}
                  <div className="flex flex-col items-center bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 min-w-[48px]">
                    <span className="text-primary font-black text-xl leading-none tabular-nums">{t.val}</span>
                    <span className="text-white/40 text-[9px] uppercase">{t.label}</span>
                  </div>
                </React.Fragment>
              ))}
              <Link to="/produtos">
                <Button size="sm" className="ml-3 rounded-full h-9 px-5 text-xs font-black shadow-lg shadow-primary/30">
                  Ver Ofertas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories Nav (Sticky) ─── */}
      <section className="sticky top-[72px] md:top-[88px] z-40 bg-[#0a0a0a] border-b border-white/5 py-4 overflow-hidden">
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex justify-between md:justify-center gap-6 md:gap-16 min-w-max">
            {[
              { label: 'iPhones', icon: Smartphone, color: 'bg-blue-500/10 text-blue-500' },
              { label: 'Watches', icon: Watch, color: 'bg-orange-500/10 text-orange-500' },
              { label: 'AirPods', icon: Headphones, color: 'bg-purple-500/10 text-purple-500' },
              { label: 'Cases', icon: Shield, color: 'bg-green-500/10 text-green-500' },
              { label: 'Energia', icon: Zap, color: 'bg-yellow-500/10 text-yellow-500' },
              { label: 'Mais', icon: Plus, color: 'bg-primary/10 text-primary' }
            ].map((item, i) => (
              <Link key={i} to="/produtos" className="flex flex-col items-center gap-3 group transition-all">
                <div className={`h-14 w-14 rounded-full ${item.color} flex items-center justify-center transition-all duration-500 shadow-lg border border-white/5 group-hover:border-primary/40 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <item.icon className="h-6 w-6 transition-transform duration-500" />
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
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="container mx-auto px-4">
          <SmartShowcase 
            title="Lumina Selection" 
            subtitle="Nossa inteligência identificou estas peças como as mais desejadas da semana."
            mode="trending"
            limit={4}
          />
        </div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="py-10 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 group">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl md:text-3xl font-black text-foreground">{s.value}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Promo Banners ═══ */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-zinc-900 border border-primary/20 group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800')] bg-cover bg-center brightness-50 transition-transform duration-700 group-hover:scale-110" />
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Acessórios Apple</h3>
                <p className="text-primary text-sm font-medium">Até 20% OFF na primeira compra</p>
                <Button variant="link" className="text-white p-0 h-auto w-fit mt-2 group-hover:translate-x-1 transition-transform">Comprar Agora →</Button>
              </div>
            </div>
            <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-zinc-900 border border-primary/20 group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544244015-0cd4b3ff8f9d?w=800')] bg-cover bg-center brightness-50 transition-transform duration-700 group-hover:scale-110" />
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Smartwatches</h3>
                <p className="text-primary text-sm font-medium">Lançamentos exclusivos</p>
                <Button variant="link" className="text-white p-0 h-auto w-fit mt-2 group-hover:translate-x-1 transition-transform">Ver Ofertas →</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Depoimentos ═══ */}
      <section className="py-16 md:py-24 bg-muted/30 border-y overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: info */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                <Star className="h-3 w-3 fill-primary" /> Avaliações Reais
              </div>
              <h2 className="text-2xl md:text-4xl font-serif font-black text-foreground leading-tight">
                O que nossos <span className="text-primary italic">clientes dizem</span>
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

      <Footer />
    </div>
  );
};

export default Index;