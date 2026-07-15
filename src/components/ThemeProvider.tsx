import React, { useEffect } from 'react';
import { STORE } from '@/config/store';

/** Injeta as cores do STORE como CSS variables no <html> ao montar o app.
 *  Para trocar o tema de uma nova loja, edite apenas STORE.theme em store.ts. */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    const t = STORE.theme;
    // Apenas as cores de marca (iguais nos modos claro/escuro).
    // bg/surface ficam no CSS (:root e .light) para o toggle de tema funcionar —
    // estilo inline no <html> venceria os overrides do modo claro.
    root.style.setProperty('--brand-primary', t.primary);
    root.style.setProperty('--brand-primary-light', t.primaryLight);
    root.style.setProperty('--brand-primary-dark', t.primaryDark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.pwaTheme);
  }, []);

  return <>{children}</>;
};
