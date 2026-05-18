import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'jr_cookie_consent';

type Consent = 'accepted' | 'declined' | null;

export const CookieBanner: React.FC = () => {
  const [consent, setConsent] = useState<Consent>(null);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Consent;
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
    setConsent(stored);
  }, []);

  const dismiss = (value: 'accepted' | 'declined') => {
    setLeaving(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, value);
      
      // Salva preferências granulares
      const prefs = value === 'accepted' 
        ? { essential: true, analytics: true, marketing: true }
        : { essential: true, analytics: false, marketing: false };
      localStorage.setItem('jr_cookie_consent_prefs', JSON.stringify(prefs));
      
      setConsent(value);
      setVisible(false);
      setLeaving(false);
      
      if (value === 'accepted') {
        import('@/hooks/useAnalytics').then(({ initGA }) => initGA());
      }
    }, 400);
  };

  if (!visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies e privacidade"
      aria-live="polite"
      className={`fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 sm:px-6
        transition-all duration-500 ease-out
        ${leaving ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <div className="mx-auto max-w-4xl bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_-8px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Gold top line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
          {/* Icon */}
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-[#d4af37]" aria-hidden="true" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white mb-0.5">
              Sua privacidade importa para nós
            </p>
            <p className="text-xs text-white/40 leading-relaxed">
              Usamos cookies para melhorar sua experiência, personalizar conteúdo e analisar o tráfego. Em conformidade com a{' '}
              <span className="text-[#d4af37]/70 font-semibold">LGPD (Lei 13.709/2018)</span>.{' '}
              Saiba mais em nossa{' '}
              <Link
                to="/privacidade"
                className="text-[#d4af37] hover:text-[#f2ca50] underline underline-offset-2 transition-colors"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => dismiss('declined')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-full border border-white/10 text-white/40
                hover:text-white/70 hover:border-white/20 transition-all text-[10px] font-bold uppercase tracking-widest
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Recusar
            </button>
            <button
              onClick={() => dismiss('accepted')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full
                bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest
                hover:bg-[#f2ca50] shadow-[0_4px_20px_rgba(212,175,55,0.3)]
                active:scale-[0.98] transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Aceitar
            </button>
            <button
              onClick={() => dismiss('declined')}
              aria-label="Fechar aviso de cookies"
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full text-white/20
                hover:text-white/50 hover:bg-white/5 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
