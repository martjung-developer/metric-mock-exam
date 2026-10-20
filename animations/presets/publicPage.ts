// src/animations/presets/publicPage.ts
// Shared Framer Motion prop bundles for all public-facing pages.
// Naming follows your existing convention: adminPage.ts, authPage.ts, dashboardPage.ts, etc.
// Import from this file — do NOT use the erroneously-created pagePresets.ts.

import type { Variants } from 'framer-motion'
import { fadeUp, fadeIn, scaleIn, staggerContainer } from '@/animations/variants/fade'

// ─────────────────────────────────────────────────────────────────────────────
// HERO — animate on mount (not scroll), staggered children
// ─────────────────────────────────────────────────────────────────────────────

/** Wrap the hero section content; children stagger in automatically */
export const heroContainer = {
  initial:   'hidden',
  animate:   'show',
  variants:  staggerContainer,
} as const

/** Each direct child of heroContainer */
export const heroItem = {
  variants: fadeUp,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL — whileInView triggers
// ─────────────────────────────────────────────────────────────────────────────

/** Single element that fades up when it enters the viewport */
export const revealUp = (delay = 0) => ({
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.12 },
  variants:    fadeUp,
  transition:  { delay },
} as const)

/** Container that staggers its children as they scroll into view */
export const revealStagger = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.08 },
  variants:    staggerContainer,
} as const

/** Child item inside a revealStagger container — fade up */
export const revealItem = {
  variants: fadeUp,
} as const

/** Child item inside a revealStagger container — scale in */
export const revealCard = {
  variants: scaleIn,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT SPLITS — slide in from opposite sides
// ─────────────────────────────────────────────────────────────────────────────

export const slideFromLeft = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.12 },
  variants:    {
    hidden: { opacity: 0, x: -32 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
  } satisfies Variants,
} as const

export const slideFromRight = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.12 },
  variants:    {
    hidden: { opacity: 0, x: 32 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
  } satisfies Variants,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ENTRY — wraps the full page body
// ─────────────────────────────────────────────────────────────────────────────

export const pageEntry = {
  initial:  'hidden',
  animate:  'show',
  variants: fadeIn,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// FAQ ACCORDION — AnimatePresence height animation
// ─────────────────────────────────────────────────────────────────────────────

export const faqAnswer = {
  initial:    { height: 0, opacity: 0 },
  animate:    { height: 'auto', opacity: 1 },
  exit:       { height: 0, opacity: 0 },
  transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// STAT COUNTERS — staggered reveal with scale
// ─────────────────────────────────────────────────────────────────────────────

export const statsContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.3 },
  variants:    staggerContainer,
} as const

export const statCard = {
  variants: scaleIn,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE MICRO-ANIMATIONS — spread as whileHover / whileTap
// ─────────────────────────────────────────────────────────────────────────────

export const hoverLift   = { y: -4, transition: { duration: 0.2,  ease: [0.4, 0, 0.2, 1] } }
export const hoverSlideX = { x:  4, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } }
export const tapShrink   = { scale: 0.97 }
export const hoverBtn    = { y: -2, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } }