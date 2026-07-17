import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { WHATSAPP_LINK } from '@/config/constants';
import { hasOwnFixedActionBar } from '@/lib/mobileChrome';

export const FloatingWhatsApp: React.FC = () => {
  const { pathname } = useLocation();
  const WHATSAPP = `${WHATSAPP_LINK}?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es!`;

  // No mobile, esconde onde a página já tem barra de compra fixa (evita cobrir o CTA).
  if (hasOwnFixedActionBar(pathname)) {
    return (
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex fixed md:bottom-6 md:left-6 z-[60] items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-5 py-3 rounded-full shadow-[0_4px_24px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-300 whitespace-nowrap"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        <span>Compre pelo WhatsApp</span>
      </a>
    );
  }

  return (
    <a
      href={WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 left-4 md:bottom-6 md:left-6 z-[60] flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-4 md:px-5 py-3 rounded-full shadow-[0_4px_24px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-300 whitespace-nowrap"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="hidden sm:inline">Compre pelo WhatsApp</span>
      <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-background animate-ping" />
      <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-background" />
    </a>
  );
};
