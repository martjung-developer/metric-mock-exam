// src/animations/roadmap/roadmapAnimations.ts
// Page-specific animations for the Roadmap page.
// Imports from: @/animations/variants/fade

import { fadeUp, scaleIn, staggerContainer } from '@/animations/variants/fade'

// ── Board columns ─────────────────────────────────────────────────────────────
export const boardContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.05 },
  variants:    staggerContainer,
} as const

export const column = {
  variants: fadeUp,
} as const

// ── Items inside columns ──────────────────────────────────────────────────────
export const columnItems = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.05 },
  variants:    { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } },
} as const

export const itemCard = {
  variants:   scaleIn,
  whileHover: { y: -2, transition: { duration: 0.15 } },
} as const

// ── Vote CTA ──────────────────────────────────────────────────────────────────
export const voteCta = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.4 },
  variants:    fadeUp,
} as const