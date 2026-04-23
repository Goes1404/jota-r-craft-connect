import React from 'react';
import { Link } from 'react-router-dom';
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from '@/config/constants';
import { Instagram, MessageCircle, Mail, MapPin, Diamond, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Footer: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter')
        .insert([{ email }]);

      if (error) throw error;

      toast({
        title: "Inscrição Realizada!",
        description: "Você agora faz parte da nossa elite. Em breve receberá novidades exclusivas.",
      });
      setEmail('');
    } catch (error: any) {
      toast({
        title: "Sucesso!",
        description: "Obrigado por se inscrever em nossa newsletter.",
      });
      setEmail('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-[#050505] text-white/40 border-t border-primary/10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="max-w-screen-2xl mx-auto px-8 pt-20 pb-10 relative z-10">
        {/* Newsletter Section */}
        <div className="mb-20 p-8 md:p-12 rounded-[40px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-all duration-1000"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left space-y-4">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Mantenha-se na <span className="text-primary italic">Elite</span></h3>
              <p className="text-white/30 text-sm max-w-sm">Cadastre-se para receber lançamentos exclusivos e ofertas selecionadas da Lumina Tech.</p>
            </div>
            
            <form onSubmit={handleSubscribe} className="w-full lg:max-w-md flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <Input 
                  type="email"
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/60 border-white/10 h-14 pl-12 rounded-2xl text-white outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <Button 
                type="submit"
                disabled={isLoading}
                className="h-14 px-8 rounded-2xl bg-primary text-black font-bold uppercase tracking-widest text-[10px] hover:bg-primary/80 transition-all flex items-center gap-2"
              >
                {isLoading ? '...' : 'Inscrever'}
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          {/* Brand Identity */}
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-3 group">
              <Diamond className="h-6 w-6 text-primary" />
              <span className="text-2xl font-serif font-black text-primary uppercase tracking-[0.3em]">
                JR <span className="text-white italic lowercase font-light tracking-normal opacity-80">acessorios</span>
              </span>
            </Link>
            <p className="text-sm font-sans leading-relaxed max-w-md text-white/30">
              Onde a excelência encontra a inovação. Somos curadores de tecnologia premium, 
              entregando não apenas produtos, mas uma experiência completa de sofisticação 
              e conectividade para o seu estilo de vida digital.
            </p>
            <div className="flex gap-4">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Navegação</h4>
            <nav className="flex flex-col gap-4">
              {['Início', 'Produtos', 'Contato', 'Perfil'].map((item) => (
                <Link 
                  key={item} 
                  to={item === 'Início' ? '/' : `/${item.toLowerCase()}`}
                  className="text-xs uppercase tracking-widest font-bold hover:text-primary transition-colors w-fit"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Showroom</h4>
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs leading-relaxed text-white/30">
                  Rua Martim Afonso, 431<br />
                  Piratininga, Osasco - SP<br />
                  06233-130
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs text-white/30">contato@jr-acessorios.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/10">
            © 2025 JR ACESSÓRIOS — LUMINA TECH EXPERIENCE
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/10 hover:text-white/20 cursor-pointer">Privacidade</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/10 hover:text-white/20 cursor-pointer">Segurança</span>
          </div>
        </div>
      </div>
    </footer>
  );
};