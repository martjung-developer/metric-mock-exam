// animations/admin/questionnaires.ts

import type { Variants } from 'framer-motion'

/**
 * Animation 1: Page fade-up
 * Used on the root .page container.
 * Single entry animation — staggered children via `staggerChildren`.
 */
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.06,
    },
  },
}

/**
 * Animation 2: Modal slide-in
 * Used on the form modal, delete modal, and view modal overlays.
 * Scales slightly from 0.97 to avoid a jarring full-size snap.
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: -8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.34, 1.56, 0.64, 1], // slight spring overshoot
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -6,
    transition: {
      duration: 0.16,
      ease: 'easeIn',
    },
  },
}

/**
 * Child variant — used by pageVariants staggerChildren.
 * Attach this to stat cards, table card, filter bar, etc.
 * They inherit the stagger from pageVariants automatically.
 */
export const childVariants: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
}