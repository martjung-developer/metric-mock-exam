// src/animations/features/featuresAnimations.ts

import { fadeUp, scaleIn, staggerContainer } from '@/animations/variants/fade'
import type { Variants } from 'framer-motion'

// ── HERO ───────────────────────────────────────────────

export const heroContainer = {
  initial: 'hidden',
  animate: 'show',
  variants: {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  },
} as const

export const heroFadeUp = {
  variants: {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  },
} as const

export const heroImageZoom = {
  initial: { scale: 1.1, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
} as const

// ── Feature cards grid ─────────────────────────────────

export const cardsContainer = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.08 },
  variants: staggerContainer,
} as const

export const featureCard = {
  variants: scaleIn,
  whileHover: {
    y: -4,
    transition: { duration: 0.2 },
  },
} as const

// ── Split sections ─────────────────────────────────────

export const splitText = (fromLeft = true) => {
  const variants: Variants = {
    hidden: { opacity: 0, x: fromLeft ? -28 : 28 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return {
    initial: 'hidden',
    whileInView: 'show',
    viewport: { once: true, amount: 0.12 },
    variants,
  } as const
}

export const splitVisual = (fromLeft = false) => {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: fromLeft ? -28 : 28,
      scale: 0.97,
    },
    show: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.65,
        delay: 0.12,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return {
    initial: 'hidden',
    whileInView: 'show',
    viewport: { once: true, amount: 0.12 },
    variants,
  } as const
}

// ── Feature list ───────────────────────────────────────

export const featureListContainer = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.1 },
  variants: staggerContainer,
} as const

export const featureListItem = {
  variants: fadeUp,
  whileHover: {
    x: 4,
    transition: { duration: 0.18 },
  },
} as const

// ── CTA ───────────────────────────────────────────────

export const ctaSection = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.3 },
  variants: fadeUp,
} as const