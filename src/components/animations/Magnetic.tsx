import { motion, useMotionValue, useSpring } from 'framer-motion';
import React, { useRef } from 'react';
import { useReducedMotion } from '@/lib/motion';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

/** Magnetic hover: o elemento se aproxima do cursor. Só desktop. */
export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.25, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 18, mass: 0.4 });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
    >
      {children}
    </motion.div>
  );
};
