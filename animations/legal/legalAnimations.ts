// src/animations/legal/legalAnimations.ts
// Enriched animations — Privacy, Terms, Cookie Policy pages.
// Inspired by the Contact page's panel splits, stagger chips, and scroll reveals.

import { fadeUp, slideLeft, staggerContainer } from '@/animations/variants/fade'

// ── Hero — left dark panel slides in, right content fades up ─────────────────
export const legalHeroPanelLeft = {
  initial:   { x: -60, opacity: 0 },
  animate:   { x: 0,   opacity: 1 },
  transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
} as const

export const legalHeroPanelRight = {
  initial:    { x: 50, opacity: 0 },
  animate:    { x: 0,  opacity: 1 },
  transition: { duration: 0.68, delay: 0.12, ease: [0.22, 1, 0.36, 1] },
} as const

// Stagger container for right panel children
export const legalHeroRightContainer = {
  initial:  'hidden',
  animate:  'show',
  variants: {
    hidden: {},
    show:   { transition: { staggerChildren: 0.09, delayChildren: 0.22 } },
  },
} as const

export const legalHeroRightItem = {
  variants: fadeUp,
} as const

// ── Stat badge chips (scroll-safe, viewport) ──────────────────────────────────
export const legalChipsContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.5 },
  variants:    {
    hidden: {},
    show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  },
} as const

export const legalChip = {
  variants:   {
    hidden: { opacity: 0, y: 12, scale: 0.94 },
    show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] } },
  },
  whileHover: { y: -2, scale: 1.04, transition: { duration: 0.15 } },
  whileTap:   { scale: 0.97 },
} as const

// ── TOC sidebar — slides in from left ────────────────────────────────────────
export const toc = {
  initial:    'hidden',
  animate:    'show',
  variants:   slideLeft,
  transition: { delay: 0.28 },
} as const

// ── TOC items stagger ─────────────────────────────────────────────────────────
export const tocContainer = {
  initial:  'hidden',
  animate:  'show',
  variants: {
    hidden: {},
    show:   { transition: { staggerChildren: 0.055, delayChildren: 0.35 } },
  },
} as const

export const tocItem = {
  variants: {
    hidden: { opacity: 0, x: -14 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  },
} as const

// ── Content body — stagger sections ──────────────────────────────────────────
export const contentBody = {
  initial:  'hidden',
  animate:  'show',
  variants: { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } },
} as const

export const contentSection = {
  variants: fadeUp,
} as const

// ── Section scroll reveal (whileInView variant) ───────────────────────────────
export const sectionReveal = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.18 },
  variants:    {
    hidden: { opacity: 0, y: 28 },
    show:   { opacity: 1, y: 0,  transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
  },
} as const

// ── Section card hover (channel-card style) ───────────────────────────────────
export const sectionCard = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.15 },
  variants: {
    hidden: { opacity: 0, y: 32 },
    show:   { opacity: 1, y: 0,  transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
  },
  whileHover: { y: -3, transition: { duration: 0.2 } },
} as const

// ── Office-hours-style info block reveal ──────────────────────────────────────
export const infoBlockReveal = {
  initial:     { opacity: 0, y: 24, scale: 0.97 },
  whileInView: { opacity: 1, y: 0,  scale: 1 },
  viewport:    { once: true, amount: 0.3 },
  transition:  { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
} as const

// ── Related links ─────────────────────────────────────────────────────────────
export const relatedContainer = {
  initial:     'hidden',
  whileInView: 'show',
  viewport:    { once: true, amount: 0.4 },
  variants:    staggerContainer,
} as const

export const relatedBtn = {
  variants:   fadeUp,
  whileHover: { y: -2, transition: { duration: 0.15 } },
  whileTap:   { scale: 0.97 },
} as const

// ── Legacy aliases (keeps old imports working) ────────────────────────────────
export const legalHero        = { initial: 'hidden', animate: 'show', variants: fadeUp, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } } as const
export const legalHeroVariant = legalHero