import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

interface GoldenBlobProps {
  className?: string;
  size?: number;
  opacity?: number;
  duration?: number;
  /** Custom keyframes for x translation (px) */
  xPath?: number[];
  /** Custom keyframes for y translation (px) */
  yPath?: number[];
}

export const GoldenBlob: React.FC<GoldenBlobProps> = ({
  className = '',
  size = 600,
  opacity = 0.35,
  duration = 9,
  xPath = [0, 80, -60, 40, 0],
  yPath = [0, -70, 40, -30, 0],
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`rounded-full pointer-events-none absolute ${className}`}
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(circle, #D4AF37 0%, #B8960C 40%, transparent 70%)',
        filter: 'blur(120px)',
        opacity,
        willChange: prefersReducedMotion ? 'auto' : 'transform',
      }}
      animate={
        prefersReducedMotion
          ? {}
          : {
              x: xPath,
              y: yPath,
              scale: [1, 1.15, 0.9, 1.1, 1],
            }
      }
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        repeatType: 'mirror',
      }}
    />
  );
};
