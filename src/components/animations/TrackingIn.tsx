import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface TrackingInTextProps {
  /** The full text string to animate letter-by-letter */
  text: string;
  /** Extra Tailwind classes for the outer wrapper */
  className?: string;
  /** Extra Tailwind classes applied to every letter span */
  letterClassName?: string;
  /** Delay between letters in seconds (stagger) */
  stagger?: number;
  /** Optional initial delay in seconds */
  delay?: number;
  /** Tag for the outer wrapper — default 'span' */
  as?: keyof JSX.IntrinsicElements;
}

const letterVariants = {
  hidden: { opacity: 0, scale: 0.8, filter: 'blur(20px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
};

/**
 * Animates each letter of `text` individually from blur+opacity-0 to clear.
 * Uses whileInView so it triggers every time the element enters the viewport.
 * Respects prefers-reduced-motion.
 */
export const TrackingInText: React.FC<TrackingInTextProps> = ({
  text,
  className = '',
  letterClassName = '',
  stagger = 0.06,
  delay = 0,
  as: Tag = 'span',
}) => {
  const prefersReducedMotion = useReducedMotion();

  // If the user prefers reduced motion, render plain text
  if (prefersReducedMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  const letters = Array.from(text);

  return (
    <Tag className={`inline-block ${className}`}>
      <motion.span
        className="inline-block"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: '-20px' }}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
        aria-label={text}
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            className={`inline-block ${letter === ' ' ? 'mr-[0.25em]' : ''}`}
            variants={letterVariants}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          >
            <span className={letterClassName || undefined}>
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
};
