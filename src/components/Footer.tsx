import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { INSTAGRAM_URL, WHATSAPP_NUMBER, WHATSAPP_LINK } from '@/config/constants';
import { STORE } from '@/config/store';
import { Instagram, MessageCircle, Mail, MapPin, Diamond, Send, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskReveal } from '@/components/animations/MaskReveal';
import { TrackingInText } from '@/components/animations/TrackingIn';

const WHATSAPP = `${WHATSAPP_LINK}?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es!`;

export const Footer: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  // Parallax refs
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end end'],
  });

  // Scale from 0.7 → 1 as section enters viewport
  const scale = useTransform(scrollYProgress, [0, 1], [0.7, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
      toast({
        title: 'E-mail inválido',
        description: 'Verifique o endereço informado e tente novamente.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await (supabase as any).from('newsletter').insert([{ email: normalized }]);
      if (error) throw error;
      toast({
        title: 'Inscrição Realizada!',
        description: 'Você agora faz parte da nossa elite. Em breve receberá novidades exclusivas.',
      });
      setEmail('');
    } catch (error: any) {
      const isDuplicate = error?.code === '23505';
      toast({
        title: isDuplicate ? 'E-mail já cadastrado' : 'Erro ao inscrever',
        description: isDuplicate
          ? 'Este e-mail já está na nossa lista VIP.'
          : 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="cv-auto bg-[#050505] text-white/40 relative overflow-hidden">
      {/* ── Top gradient line ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

      {/* ════════════════════════════════════════════════ */}
      {/* MOTION FOOTER SECTION — dramatic CTA            */}
      {/* ════════════════════════════════════════════════ */}
      <div
        ref={sectionRef}
        className="relative w-full overflow-hidden border-b border-white/5 py-24 md:py-40 flex flex-col items-center justify-center text-center"
      >
        {/* Decorative "JR" background text */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="text-[30vw] font-serif font-black text-white leading-none"
            style={{ opacity: 0.04 }}
          >
            JR
          </span>
        </div>

        {/* Animated golden blob behind the CTA */}
        <div className="absolute w-[600px] h-[400px] rounded-full bg-[#D4AF37]/8 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* SCROLL HINT */}
        <motion.p
          className="text-[9px] font-black uppercase tracking-[0.5em] text-white/15 mb-10"
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Role para descobrir
        </motion.p>

        {/* MAIN PARALLAX HEADING */}
        <motion.div
          style={prefersReducedMotion ? {} : { scale, opacity }}
          className="relative z-10 px-4"
        >
          <h2
            className="font-serif font-black text-white leading-[0.9] tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)' }}
          >
            <TrackingInText
              text="PRONTO PARA"
              className="block"
              stagger={0.04}
              delay={0}
            />
            <TrackingInText
              text="COMEÇAR?"
              className="block"
              letterClassName="text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              stagger={0.05}
              delay={0.3}
            />
          </h2>
        </motion.div>

        {/* Subtitle */}
        <MaskReveal delay={0.5} className="mt-6 relative z-10">
          <p className="text-white/30 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Fale com nossa equipe ou explore nosso catálogo de produtos.
          </p>
        </MaskReveal>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-12 relative z-10"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
            <motion.button
              className="flex items-center gap-3 px-10 py-5 rounded-full bg-[#D4AF37] text-black font-black text-sm uppercase tracking-widest shadow-[0_0_50px_rgba(212,175,55,0.4)]"
              whileHover={prefersReducedMotion ? {} : { scale: 1.05, boxShadow: '0 0 70px rgba(212,175,55,0.7)' }}
              whileTap={{ scale: 0.97 }}
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </motion.button>
          </a>
          <Link to="/produtos">
            <motion.button
              className="flex items-center gap-3 px-10 py-5 rounded-full bg-white/[0.04] backdrop-blur-xl text-white font-bold text-sm uppercase tracking-widest border border-white/10 hover:border-[#D4AF37]/40 transition-colors"
              whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <ShoppingBag className="w-5 h-5" />
              Ver Ofertas
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* STANDARD FOOTER CONTENT                        */}
      {/* ════════════════════════════════════════════════ */}
      <div className="max-w-screen-2xl mx-auto px-8 pt-20 pb-10 relative z-10">
        {/* Newsletter */}
        <div className="mb-20 p-8 md:p-12 rounded-[40px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px] group-hover:bg-[#D4AF37]/10 transition-all duration-1000" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left space-y-4">
              <MaskReveal>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
                  Mantenha-se na <span className="text-[#D4AF37] italic">Elite</span>
                </h3>
              </MaskReveal>
              <p className="text-white/30 text-sm max-w-sm">
                Cadastre-se para receber lançamentos exclusivos e ofertas selecionadas da {STORE.name}.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="w-full lg:max-w-md flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#D4AF37] transition-colors" />
                <Input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/60 border-white/10 h-14 pl-12 rounded-2xl text-white outline-none focus:border-[#D4AF37]/40 transition-all"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 px-8 rounded-2xl bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-[10px] hover:bg-[#D4AF37]/80 transition-all flex items-center gap-2"
              >
                {isLoading ? '...' : 'Inscrever'}
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-3 group">
              <Diamond className="h-6 w-6 text-[#D4AF37]" />
              <span className="text-2xl font-serif font-black text-[#D4AF37] uppercase tracking-[0.3em]">
                {STORE.name}
              </span>
            </Link>
            <p className="text-sm font-sans leading-relaxed max-w-md text-white/30">
              Sua loja de acessórios e produtos variados. Preços justos, pagamento com PIX e cartão,
              e entrega rápida em Osasco/SP e para todo o Brasil.
            </p>
            <div className="flex gap-4">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-all">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-all">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Navegação</h4>
            <nav className="flex flex-col gap-4">
              {[
                { label: 'Início', to: '/' },
                { label: 'Produtos', to: '/produtos' },
                { label: 'Contato', to: '/contato' },
                { label: 'Perfil', to: '/perfil' },
                { label: 'Termos', to: '/termos' },
                { label: 'Privacidade', to: '/privacidade' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-xs uppercase tracking-widest font-bold hover:text-[#D4AF37] transition-colors w-fit"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Showroom</h4>
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-[#D4AF37] shrink-0" />
                <p className="text-xs leading-relaxed text-white/30">
                  {STORE.address.street}<br />
                  {STORE.address.city} - {STORE.address.state}<br />
                  {STORE.address.zip}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-[#D4AF37] shrink-0" />
                <p className="text-xs text-white/30">{STORE.contact.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/10">
            © {new Date().getFullYear()} {STORE.name.toUpperCase()}
          </p>
          <div className="flex gap-8">
            <Link to="/privacidade" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/10 hover:text-white/20 transition-colors">
              Privacidade
            </Link>
            <Link to="/termos" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/10 hover:text-white/20 transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};