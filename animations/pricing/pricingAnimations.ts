// src/animations/pricing/pricingAnimations.ts
// Page-specific animations for the Pricing page.
// Imports from: @/animations/variants/fade

import { fadeUp, scaleIn, staggerContainer, staggerFast } from '@/animations/variants/fade'

// ── Pricing cards ─────────────────────────────────────────────────────────────
export const pricingCardsContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.15 },
  variants:    staggerContainer,
} as const

export const pricingCard = {
  variants:   scaleIn,
  whileHover: { y: -6, transition: { duration: 0.22 } },
} as const

// ── Feature comparison checklist ──────────────────────────────────────────────
export const checklistContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.05 },
  variants:    staggerFast,
} as const

export const checklistItem = {
  variants: fadeUp,
} as const

// ── Toggle (monthly / annual) ─────────────────────────────────────────────────
export const toggleRow = {
  initial:    { opacity: 0, y: 10 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
} as const

// ── FAQ below pricing ─────────────────────────────────────────────────────────
export const faqContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.05 },
  variants:    staggerContainer,
} as const

export const faqItem = {
  variants: fadeUp,
} as const

// ── CTA ───────────────────────────────────────────────────────────────────────
export const ctaSection = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.3 },
  variants:    fadeUp,
} as const