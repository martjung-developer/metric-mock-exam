// src/animations/variants/fade.ts
// Core Framer Motion variants used across all pages.
// All other animation files import from here.

import type { Variants } from 'framer-motion'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  show:   { opacity: 1, y: 0,   transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show:   { opacity: 1, scale: 1,    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
}

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show:   { opacity: 1, x: 0,   transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
}

/** Staggered container — wrap a list; children animate in sequence */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren:   0.1,
    },
  },
}

/** Fast stagger for dense grids (cards, tags, etc.) */
export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren:   0.05,
    },
  },
}