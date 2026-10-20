// animations/admin/study-materials/study-materials.ts
// 3 animations only — all use `initial: false` or zero-delay to avoid blocking render.

import type { Variants } from 'framer-motion'

// ── 1. Container — instant mount, staggers children with minimal delay ─────────
export const containerVariants: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.04, // fast stagger — won't feel sluggish
    },
  },
}

// ── 2. Item — simple fade-up for header, stat strip, filter bar, table ────────
export const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: 'easeOut' },
  },
}

// ── 3. Modal — scale-in from center, used for all three modals ────────────────
export const overlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit:    { opacity: 0, transition: { duration: 0.12 } },
}

export const modalVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
}

// ── Micro-interactions (not counted as "page animations") ─────────────────────
// Used on buttons and table rows — these are interaction-driven, not render-driven.

export const buttonVariants: Variants = {
  idle:  {},
  hover: { scale: 1.03, transition: { duration: 0.1 } },
  tap:   { scale: 0.97, transition: { duration: 0.08 } },
}

export const tableRowVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.12 } },
}