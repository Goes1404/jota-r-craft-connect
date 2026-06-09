import React, { useEffect } from 'react';
import { STORE } from '@/config/store';

/** Injeta as cores do STORE como CSS variables no <html> ao montar o app.
 *  Para trocar o tema de uma nova loja, edite apenas STORE.theme em store.ts. */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    const t = STORE.theme;
    root.style.setProperty('--brand-primary', t.primary);
    root.style.setProperty('--brand-primary-light', t.primaryLight);
    root.style.setProperty('--brand-primary-dark', t.primaryDark);
    root.style.setProperty('--brand-bg', t.background);
    root.style.setProperty('--brand-surface', t.surface);
    root.style.setProperty('--brand-surface-alt', t.surfaceAlt);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.pwaTheme);
  }, []);

  return <>{children}</>;
};
