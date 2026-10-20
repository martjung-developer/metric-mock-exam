// animations/admin/settings/settings.ts

import type { Variants } from 'framer-motion'

// ── Page container — staggered children on mount ─────────────────────────────
export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

// ── Individual section cards / form blocks ───────────────────────────────────
export const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// ── Form fields — slide in from left, staggered ───────────────────────────────
export const formVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

export const fieldVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// ── Avatar — scale + fade in ──────────────────────────────────────────────────
export const avatarVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.34, 1.56, 0.64, 1], // spring-like overshoot
    },
  },
}

// ── Avatar overlay — appears on hover (use with whileHover on wrapper) ────────
export const avatarOverlayVariants: Variants = {
  rest: {
    opacity: 0,
    scale: 1,
  },
  hover: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
    },
  },
}

// ── Primary / danger buttons ──────────────────────────────────────────────────
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(13,21,35,0.12)',
  },
  hover: {
    scale: 1.025,
    boxShadow: '0 4px 14px rgba(13,37,64,0.22)',
    transition: {
      duration: 0.16,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
}

export const dangerButtonVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(220,38,38,0.10)',
  },
  hover: {
    scale: 1.025,
    boxShadow: '0 4px 14px rgba(220,38,38,0.22)',
    transition: {
      duration: 0.16,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
}

// ── Toast / success banner ────────────────────────────────────────────────────
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -12,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

// ── Toggle switch knob ────────────────────────────────────────────────────────
export const toggleKnobVariants: Variants = {
  off: { x: 2 },
  on:  { x: 22, transition: { type: 'spring', stiffness: 500, damping: 30 } },
}