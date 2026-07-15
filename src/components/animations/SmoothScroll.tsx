import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from '@/lib/motion';

/** Smooth scroll global via Lenis. Respeita prefers-reduced-motion. */
export const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    // Em telas touch o scroll nativo já é suave; o loop de rAF do Lenis só
    // consome main-thread e piora a fluidez em celulares mais fracos.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
};
