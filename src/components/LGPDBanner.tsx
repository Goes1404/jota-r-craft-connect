import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ChevronDown, ChevronUp, Shield, BarChart3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'jr_cookie_consent';

interface CookiePrefs {
  analytics: boolean;
  personalization: boolean;
}

interface ConsentData {
  essential: true;
  analytics: boolean;
  personalization: boolean;
  timestamp: string;
}

export const LGPDBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({ analytics: true, personalization: true });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Small delay so banner doesn't flash before hydration
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (data: ConsentData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setVisible(false);
  };

  const acceptAll = () => {
    save({ essential: true, analytics: true, personalization: true, timestamp: new Date().toISOString() });
  };

  const acceptSelected = () => {
    save({ essential: true, ...prefs, timestamp: new Date().toISOString() });
  };

  const rejectAll = () => {
    save({ essential: true, analytics: false, personalization: false, timestamp: new Date().toISOString() });
  };

  const togglePref = (key: keyof CookiePrefs) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop blur on mobile only */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={acceptAll}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Configurações de cookies e privacidade"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px] z-[999]"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-5 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                    <Cookie className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Privacidade</p>
                    <h2 className="text-sm font-bold text-white leading-tight mt-0.5">Cookies & Dados</h2>
                  </div>
                </div>
                <button
                  onClick={rejectAll}
                  aria-label="Recusar todos e fechar"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-xs text-white/45 leading-relaxed mb-4">
                  Utilizamos cookies essenciais para o funcionamento da plataforma e, com seu consentimento, cookies analíticos e de personalização para melhorar sua experiência. Seus dados são tratados conforme a{' '}
                  <Link to="/privacidade" onClick={rejectAll} className="text-[#D4AF37] underline underline-offset-2 hover:text-[#f2ca50] transition-colors">
                    Lei 13.709/2018 (LGPD)
                  </Link>.
                </p>

                {/* Expandable preferences */}
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-4"
                  aria-expanded={expanded}
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? 'Ocultar preferências' : 'Personalizar preferências'}
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 mb-4">
                        {/* Essential (always on) */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-2.5">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <div>
                              <p className="text-xs font-bold text-white/80">Essenciais</p>
                              <p className="text-[10px] text-white/30">Sempre ativos — necessários para uso</p>
                            </div>
                          </div>
                          <div className="w-10 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-end px-1">
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
                          </div>
                        </div>

                        {/* Analytics */}
                        <button
                          onClick={() => togglePref('analytics')}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                          aria-pressed={prefs.analytics}
                        >
                          <div className="flex items-center gap-2.5">
                            <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-white/80">Analíticos</p>
                              <p className="text-[10px] text-white/30">Nos ajudam a melhorar o site</p>
                            </div>
                          </div>
                          <div className={`w-10 h-5 rounded-full border flex items-center px-1 transition-all duration-300 ${prefs.analytics ? 'bg-[#D4AF37]/20 border-[#D4AF37]/30 justify-end' : 'bg-white/5 border-white/10 justify-start'}`}>
                            <div className={`w-3.5 h-3.5 rounded-full transition-colors duration-300 ${prefs.analytics ? 'bg-[#D4AF37]' : 'bg-white/20'}`} />
                          </div>
                        </button>

                        {/* Personalization */}
                        <button
                          onClick={() => togglePref('personalization')}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                          aria-pressed={prefs.personalization}
                        >
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-white/80">Personalização</p>
                              <p className="text-[10px] text-white/30">Recomendações da IA Lumina</p>
                            </div>
                          </div>
                          <div className={`w-10 h-5 rounded-full border flex items-center px-1 transition-all duration-300 ${prefs.personalization ? 'bg-[#D4AF37]/20 border-[#D4AF37]/30 justify-end' : 'bg-white/5 border-white/10 justify-start'}`}>
                            <div className={`w-3.5 h-3.5 rounded-full transition-colors duration-300 ${prefs.personalization ? 'bg-[#D4AF37]' : 'bg-white/20'}`} />
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={acceptAll}
                    className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-black text-[11px] uppercase tracking-widest hover:bg-[#f2ca50] transition-colors shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                  >
                    Aceitar Todos
                  </button>
                  {expanded ? (
                    <button
                      onClick={acceptSelected}
                      className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white/60 font-bold text-[11px] uppercase tracking-widest hover:bg-white/10 hover:text-white/80 transition-all"
                    >
                      Salvar Selecionados
                    </button>
                  ) : (
                    <button
                      onClick={rejectAll}
                      className="w-full py-2.5 rounded-xl text-white/25 font-bold text-[10px] uppercase tracking-widest hover:text-white/40 transition-colors"
                    >
                      Recusar opcionais
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook to read consent
export const useCookieConsent = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { essential: true, analytics: false, personalization: false };
  try {
    return JSON.parse(stored) as ConsentData;
  } catch {
    return { essential: true, analytics: false, personalization: false };
  }
};
