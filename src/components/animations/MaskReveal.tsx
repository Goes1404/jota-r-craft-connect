import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface MaskRevealProps {
  children: React.ReactNode;
  /** Extra Tailwind classes on the outer wrapper */
  className?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Tag for the outer wrapper — default 'div' */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Reveals its children via a clip-path curtain sliding from right to left.
 * Uses whileInView with once:true so it triggers once per mount.
 * Respects prefers-reduced-motion.
 */
export const MaskReveal: React.FC<MaskRevealProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  as: Tag = 'div',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    // Outer wrapper clips the content
    <Tag className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{
          duration,
          delay,
          ease: [0.77, 0, 0.18, 1],
        }}
      >
        {children}
      </motion.div>
    </Tag>
  );
};
