// src/animations/contact/contactAnimations.ts
// Page-specific animations for the Contact page.

import { fadeUp, staggerContainer } from '@/animations/variants/fade'

// ── Hero panels ───────────────────────────────────────────────────────────────
export const heroPanelLeft = {
  initial:   'hidden',
  animate:   'show',
  variants: {
    hidden: { opacity: 0, x: -40 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.72, ease: [0.4, 0, 0.2, 1] } },
  },
} as const

export const heroPanelRight = {
  initial:   'hidden',
  animate:   'show',
  variants: {
    hidden: { opacity: 0, y: 28 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.68, delay: 0.18, ease: [0.4, 0, 0.2, 1] } },
  },
} as const

export const heroRightContainer = {
  initial:  'hidden',
  animate:  'show',
  variants: staggerContainer,
} as const

export const heroRightItem = {
  variants: fadeUp,
} as const

// ── Quick-contact chips ────────────────────────────────────────────────────────
export const chipsContainer = {
  initial:  'hidden',
  animate:  'show',
  variants: {
    hidden: {},
    show:   { transition: { staggerChildren: 0.08, delayChildren: 0.55 } },
  },
} as const

export const chip = {
  variants: {
    hidden: { opacity: 0, scale: 0.88, y: 12 },
    show:   { opacity: 1, scale: 1, y: 0, transition: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] } },
  },
  whileHover: { y: -3, scale: 1.04, transition: { duration: 0.18 } },
  whileTap:   { scale: 0.97 },
} as const

// ── Layout split ──────────────────────────────────────────────────────────────
export const channelsCol = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.08 },
  variants: {
    hidden: { opacity: 0, x: -32 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.62, ease: [0.4, 0, 0.2, 1] } },
  },
} as const

export const formCol = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.08 },
  variants: {
    hidden: { opacity: 0, x: 32 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.62, ease: [0.4, 0, 0.2, 1] } },
  },
} as const

// ── Channel cards ─────────────────────────────────────────────────────────────
export const channelsContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.1 },
  variants:    staggerContainer,
} as const

export const channelCard = {
  variants: {
    hidden: { opacity: 0, y: 22 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.4, 0, 0.2, 1] } },
  },
} as const

// ── Office hours ──────────────────────────────────────────────────────────────
export const officeHoursReveal = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.2 },
  variants: {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] } },
  },
} as const

// ── Form fields ───────────────────────────────────────────────────────────────
export const formContainer = {
  initial:  'hidden',
  animate:  'show',
  variants: {
    hidden: {},
    show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  },
} as const

export const formField = {
  variants: {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] } },
  },
} as const

// ── Success ───────────────────────────────────────────────────────────────────
export const successReveal = {
  initial:    { opacity: 0, scale: 0.92, y: 16 },
  animate:    { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 0.44, ease: [0.34, 1.56, 0.64, 1] },
} as const