import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import React from 'react';
import { easing, useReducedMotion } from '@/lib/motion';

/** Transição suave entre páginas — fade + leve slide up. */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: easing.smooth }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
