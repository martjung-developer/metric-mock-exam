// animations/admin/programs/programs.ts

import type { Variants } from 'framer-motion'

export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

/**
 * Individual program card — slides up and fades in.
 * Inherits stagger timing from containerVariants.
 */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  hover: {
    y: -3,
    boxShadow: '0 8px 24px rgba(13,21,35,0.12)',
    transition: {
      duration: 0.18,
      ease: 'easeOut',
    },
  },
}

/**
 * Action button press feedback.
 * Apply to each action button inside a card.
 */
export const buttonVariants: Variants = {
  idle: { scale: 1 },
  tap:  { scale: 0.95, transition: { duration: 0.1 } },
}