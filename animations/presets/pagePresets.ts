// src/animations/variants/page.ts
// Page-level Framer Motion variants shared across all public pages.
// Sits alongside your existing fade.ts, hover.ts, drawer.ts, etc.
/*
import type { Variants } from 'framer-motion'

// ── Staggered container ──────────────────────────────────────────────────────
// Wrap a group of items with this to stagger their children automatically.
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren:  0.08,
      delayChildren:    0.1,
    },
  },
}

// ── Fade up (default reveal for most elements) ────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
}

// ── Fade in (no vertical movement — for full-width hero sections) ─────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

// ── Slide in from left ────────────────────────────────────────────────────────
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show:   { opacity: 1, x: 0,   transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
}

// ── Slide in from right ───────────────────────────────────────────────────────
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
}

// ── Scale in (for cards on hover entry) ──────────────────────────────────────
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show:   { opacity: 1, scale: 1,    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
}

// ── Card hover (lift effect — use as whileHover prop directly) ────────────────
export const cardHover = {
  y:          -4,
  boxShadow:  '0 12px 40px rgba(15,23,42,0.14)',
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
}

// ── Button hover ─────────────────────────────────────────────────────────────
export const buttonHover = {
  y:          -2,
  transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
}
  */