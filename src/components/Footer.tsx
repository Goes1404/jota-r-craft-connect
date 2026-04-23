import React from 'react';
import { Link } from 'react-router-dom';
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from '@/config/constants';
import { Instagram, MessageCircle, Mail, MapPin, Diamond } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050505] text-white/40 border-t border-primary/10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="max-w-screen-2xl mx-auto px-8 py-20 relative z-10">
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