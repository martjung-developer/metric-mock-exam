// src/animations/blog/blogAnimations.ts
// Page-specific animations for the Blog page.
// Imports from: @/animations/variants/fade

import { fadeUp, scaleIn, staggerContainer } from '@/animations/variants/fade'

// ── Posts grid ────────────────────────────────────────────────────────────────
export const postsContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.05 },
  variants:    staggerContainer,
} as const

export const postCard = {
  variants:   scaleIn,
  whileHover: { y: -4, transition: { duration: 0.2 } },
} as const

// ── Featured card ─────────────────────────────────────────────────────────────
export const featuredCard = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.15 },
  variants:    fadeUp,
  whileHover:  { y: -4, transition: { duration: 0.2 } },
} as const

// ── Filter row ────────────────────────────────────────────────────────────────
export const filterRow = {
  initial:    { opacity: 0, y: 12 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay: 0.25, duration: 0.45, ease: [0.4, 0, 0.2, 1] },
} as const

// ── Newsletter ────────────────────────────────────────────────────────────────
export const newsletter = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.3 },
  variants:    fadeUp,
} as const