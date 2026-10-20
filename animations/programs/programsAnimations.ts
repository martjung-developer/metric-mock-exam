// src/animations/programs/programsAnimations.ts
// Page-specific animations for the Programs page.
// Imports from: @/animations/variants/fade

import { fadeUp, scaleIn, staggerContainer } from '@/animations/variants/fade'

// ── Program cards grid ────────────────────────────────────────────────────────
export const programsContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.05 },
  variants:    staggerContainer,
} as const

export const programCard = {
  variants:   scaleIn,
  whileHover: { y: -6, transition: { duration: 0.22 } },
} as const

// ── Category filter tabs ──────────────────────────────────────────────────────
export const filterRow = {
  initial:    { opacity: 0, y: 10 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
} as const

// ── Program detail panel (when a card is expanded) ───────────────────────────
export const detailPanel = {
  initial:    { opacity: 0, height: 0 },
  animate:    { opacity: 1, height: 'auto' },
  exit:       { opacity: 0, height: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
} as const

// ── Stats strip ───────────────────────────────────────────────────────────────
export const statsStrip = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.3 },
  variants:    staggerContainer,
} as const

export const statItem = {
  variants: fadeUp,
} as const

// ── CTA section ───────────────────────────────────────────────────────────────
export const ctaSection = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.3 },
  variants:    fadeUp,
} as const