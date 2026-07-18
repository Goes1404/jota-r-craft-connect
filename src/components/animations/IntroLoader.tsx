import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Diamond } from 'lucide-react';
import { easing, useReducedMotion } from '@/lib/motion';

/**
 * Premium intro loader: black screen + brand reveal, dismisses once
 * per session. Skipped entirely for prefers-reduced-motion.
 */
export const IntroLoader = () => {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('intro-shown');
  });

  useEffect(() => {
    if (!show || reduced) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => {
      localStorage.setItem('intro-shown', '1');
      setShow(false);
    }, 1400);
    return () => clearTimeout(t);
  }, [show, reduced]);

  if (reduced) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: easing.smooth } }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.6, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.0, ease: easing.expo }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1.6, ease: easing.expo }}
            >
              <Diamond className="h-10 w-10 text-[#d4af37] drop-shadow-[0_0_24px_rgba(212,175,55,0.6)]" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, letterSpacing: '0.5em' }}
              animate={{ opacity: 1, letterSpacing: '0.25em' }}
              transition={{ duration: 1.2, delay: 0.2, ease: easing.expo }}
              className="text-3xl font-serif font-black text-[#d4af37] uppercase"
            >
              JR <span className="text-white italic lowercase font-light tracking-normal opacity-70">acessorios</span>
            </motion.span>
          </motion.div>

          {/* Sweep gold line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, delay: 0.4, ease: easing.brand }}
            style={{ originX: 0 }}
            className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
