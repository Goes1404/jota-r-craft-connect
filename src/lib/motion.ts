import { useEffect, useState } from 'react';

/** Detecta `prefers-reduced-motion` — todas as animações respeitam isso. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/** Detecta breakpoint atual de forma reativa. */
export function useBreakpoint() {
  const [bp, setBp] = useState<'sm' | 'md' | 'lg' | 'xl'>(() => {
    if (typeof window === 'undefined') return 'lg';
    const w = window.innerWidth;
    return w < 640 ? 'sm' : w < 768 ? 'md' : w < 1280 ? 'lg' : 'xl';
  });
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? 'sm' : w < 768 ? 'md' : w < 1280 ? 'lg' : 'xl');
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return bp;
}

export const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

/** Easing curves de "luxo" (cubic-bezier) reaproveitadas no projeto. */
export const easing = {
  smooth: [0.22, 1, 0.36, 1] as const,
  expo: [0.16, 1, 0.3, 1] as const,
  brand: [0.77, 0, 0.18, 1] as const,
};
