import React from 'react';
import { Heart } from 'lucide-react';
export const Footer: React.FC = () => {
  return <footer className="bg-charcoal text-soft-white mt-24 border-t border-primary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-serif font-semibold text-primary">JR acessorios</h3>
            <p className="text-sm text-soft-white/80 leading-relaxed">Sua conexão com a inovação. Smartphones, eletrônicos e acessórios premium para o seu estilo de vida digital.</p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-primary">Links</h4>
            <nav className="flex flex-col space-y-2">
              <a href="/" className="text-sm text-soft-white/80 hover:text-primary transition-colors">
                Início
              </a>
              <a href="/produtos" className="text-sm text-soft-white/80 hover:text-primary transition-colors">
                Produtos
              </a>
              <a href="/contato" className="text-sm text-soft-white/80 hover:text-primary transition-colors">
                Contato
              </a>
              <a href="/admin/login" className="text-sm text-soft-white/80 hover:text-primary transition-colors">
                Área Administrativa
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-primary">Contato</h4>
            <div className="space-y-2 text-sm text-soft-white/80">
              <p>WhatsApp: <span className="text-primary font-medium">(11) 95412-9039</span></p>
              <p>Email: <span className="text-primary font-medium">contato@jotar.com.br</span></p>
              <div className="pt-2">
                <p className="font-medium text-soft-white">Redes Sociais</p>
                <div className="flex space-x-4 mt-2">
                  <a href="https://www.instagram.com/jota.r_acessorios?igsh=dzNxZGVkMGg0c2Rs" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a>
                  <a href="#" className="hover:text-primary transition-colors">Facebook</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary/20 mt-8 pt-8 text-center">
          <p className="text-sm text-soft-white/60 flex items-center justify-center space-x-1">
            <span>© 2025 JR acessorios. Inovação para o seu dia a dia.</span>
          </p>
        </div>
      </div>
    </footer>;
};