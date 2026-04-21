import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Shield, Gift, MapPin, Clock, Instagram, ChevronRight, Diamond } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useFeaturedProducts, useAppSettings } from '@/hooks/useProducts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BackgroundPaths } from '@/components/ui/background-paths';

/* ─── GlitterCanvas Removed to use BackgroundPaths ─── */

/* ─── Page Component ─── */
const Index: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('home');

  const { data: featuredProducts = [], isLoading } = useFeaturedProducts(4);
  const { data: settings } = useAppSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ═══ Hero – Background Paths Component ═══ */}
      <BackgroundPaths title="JR acessorios" />

      {/* Quick Nav – Inspired by Decathlon Sports Bubbles */}
      <section className="bg-background py-6 border-b">
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex justify-between md:justify-center gap-6 md:gap-14 min-w-max pb-2">
            {[
              { label: 'iPhones', icon: '📱' },
              { label: 'Watches', icon: '⌚' },
              { label: 'AirPods', icon: '🎧' },
              { label: 'Cases', icon: '🛡️' },
              { label: 'Carregadores', icon: '⚡' },
              { label: 'Mais', icon: '➕' }
            ].map((item, i) => (
              <Link key={i} to="/produtos" className="flex flex-col items-center gap-2 group">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-2xl transition-all group-hover:bg-primary/20 group-hover:scale-110 shadow-sm border border-border">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:text-primary">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banners – Inspired by Decathlon Cards */}
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

      {/* ═══ Departamentos ═══ */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Departamentos</h2>
              <p className="text-sm text-muted-foreground mt-1">Tudo o que você precisa em tecnologia</p>
            </div>
            <Link to="/produtos" className="hidden md:flex items-center text-primary text-sm font-bold hover:underline gap-1">
              Ver tudo <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {[
              { title: 'Celulares e Acessórios', img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=400&fit=crop', link: '/produtos' },
              { title: 'Smart Home', img: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop', link: '/produtos' },
              { title: 'Eletrônicos e Gadgets', img: 'https://images.unsplash.com/photo-1461151304267-38535e770d71?w=600&h=400&fit=crop', link: '/produtos' },
            ].map((cat, i) => (
              <Link key={i} to={cat.link} className="group relative h-40 sm:h-52 md:h-64 rounded-xl overflow-hidden shadow-md">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 text-white">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold leading-tight">{cat.title}</h3>
                  <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Explorar →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Os Mais Procurados ═══ */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Os Mais Procurados</h2>
            <div className="w-16 h-0.5 bg-primary mx-auto rounded-full" />
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Confira os produtos que são tendência e mantenha-se sempre conectado.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square bg-muted animate-pulse rounded-xl" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/produtos">
              <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white px-8 rounded-full h-10 text-sm font-bold">
                Ver Loja Completa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Sobre Nós + Mascote ═══ */}
      <section className="py-12 md:py-16 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="relative order-2 md:order-1 max-w-xs mx-auto md:max-w-sm">
              <div className="absolute -inset-3 bg-primary/10 rounded-xl rotate-2" />
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.25)] border-2 border-primary/20">
                <img
                  src="/mascot.png"
                  alt="Mascote JR acessorios"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            <div className="space-y-5 order-1 md:order-2">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-serif font-black text-foreground">JR acessorios</h2>
                <p className="text-base text-primary font-medium italic">"Inovação para o seu dia a dia."</p>
              </div>
              <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                <p>Nascemos com a missão de trazer as últimas tendências mundiais em tecnologia para as suas mãos. De smartphones de última geração a acessórios que facilitam sua rotina, cada produto passa por um rigoroso teste de qualidade.</p>
                <p>Acreditamos que a tecnologia deve ser acessível e descomplicada. Oferecemos consultoria especializada para garantir que você faça sempre a melhor escolha.</p>
              </div>
              <Button variant="ghost" className="p-0 text-primary font-bold text-sm hover:bg-transparent hover:ml-2 transition-all">
                Conheça nossos serviços <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Localização + Mapa ═══ */}
      <section id="location" className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Onde nos encontrar</h2>
            <p className="text-sm text-muted-foreground mt-1">Visite nosso showroom e conheça as novidades pessoalmente</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 bg-card rounded-2xl overflow-hidden shadow-xl border">
            {/* Info column */}
            <div className="p-6 md:p-8 space-y-5 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Endereço</h4>
                    <p className="text-xs text-muted-foreground">Rua Martim Afonso, 431</p>
                    <p className="text-xs text-muted-foreground">Piratininga — Osasco, SP</p>
                    <p className="text-xs text-muted-foreground">CEP 06233-130</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Horário</h4>
                    <p className="text-xs text-muted-foreground">Seg — Sex: 09:00 – 18:00</p>
                    <p className="text-xs text-muted-foreground">Sábado: 09:00 – 13:00</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Retirada em Mãos</h4>
                    <p className="text-xs text-muted-foreground">Disponível via WhatsApp</p>
                  </div>
                </div>
              </div>

              <Button className="w-full h-10 rounded-lg shadow font-bold text-sm gap-1" asChild>
                <a href="https://www.google.com/maps/dir/?api=1&destination=Rua+Martim+Afonso+431+Piratininga+Osasco+SP" target="_blank" rel="noopener noreferrer">
                  Como Chegar <ChevronRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Map column */}
            <div className="lg:col-span-2 h-64 sm:h-80 lg:h-auto lg:min-h-[350px]">
              <iframe
                title="Localização JR acessorios"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.694602283!2d-46.78453472390234!3d-23.525547960142647!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cf0164670f5e1f%3A0xc319bc30d31e9e0d!2sRua%20Martim%20Afonso%2C%20431%20-%20Piratininga%2C%20Osasco%20-%20SP%2C%2006233-130!5e0!3m2!1spt-BR!2sbr!4v1713735000000"
                className="w-full h-full border-0 transition-all duration-700 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Selos de Confiança ═══ */}
      <section className="py-10 md:py-14 bg-muted/40 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: 'Entrega Expressa', desc: 'Envio rápido e seguro para todo o Brasil.' },
              { icon: Shield, title: 'Produtos Originais', desc: 'Garantia de procedência em todo catálogo.' },
              { icon: Instagram, title: 'Comunidade Tech', desc: 'Reviews, unboxings e novidades.' },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-card flex items-center justify-center shadow text-primary border border-border">
                  <badge.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif font-bold text-base">{badge.title}</h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">{badge.desc}</p>
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