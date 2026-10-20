// animations/auth/authAnimations.ts
// Animations for auth pages (login ↔ signup swap).
// Kept deliberately light — 2 animation types max to avoid delay buildup.

import type { Variants } from 'framer-motion'

// ── Full panel slide (counterclockwise swap) ──────────────────────────────────
// When switching Login → Signup:
//   • Form panel slides OUT to the RIGHT, new form slides IN from the LEFT
//   • Photo panel slides OUT to the LEFT, new photo slides IN from the RIGHT

export const formSwapVariants: Variants = {
  hidden:  { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.48, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 1, 1] },
  },
}

export const formSwap = {
  variants: formSwapVariants,
  initial:  'hidden',
  animate:  'visible',
  exit:     'exit',
} as const

// Photo slides in the opposite direction to the form
export const photoPanelVariants: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.48, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 1, 1] },
  },
}

export const photoPanel = {
  variants: photoPanelVariants,
  initial:  'hidden',
  animate:  'visible',
  exit:     'exit',
} as const

// ── Photo panel crossfade ─────────────────────────────────────────────────────

export const photoSwapVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.55, ease: 'easeInOut' } },
  exit:    { opacity: 0, transition: { duration: 0.3,  ease: 'easeInOut' } },
}

export const photoSwap = {
  variants: photoSwapVariants,
  initial:  'hidden',
  animate:  'visible',
  exit:     'exit',
} as const

// ── Submit button micro-interaction ──────────────────────────────────────────

export const authSubmitBtn = {
  whileHover: { y: -1, transition: { duration: 0.15 } },
  whileTap:   { scale: 0.985 },
} as const

// ── Auth page initial entrance ────────────────────────────────────────────────
// The entire auth page fades + rises gently on first load.

export const authPageVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
}

export const authPage = {
  variants: authPageVariants,
  initial:  'hidden',
  animate:  'visible',
} as const

// ── Form field stagger ────────────────────────────────────────────────────────
// Use on the <form> container to stagger child fields in on load.

export const formFieldsVariants: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

export const formFields = {
  variants: formFieldsVariants,
  initial:  'hidden',
  animate:  'visible',
} as const

// Each individual field fades + slides up
export const formFieldItemVariants: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
}

export const formFieldItem = {
  variants: formFieldItemVariants,
} as const

// ── Error banner shake ────────────────────────────────────────────────────────
// Spread onto the error <div> so it shakes in when an auth error appears.

export const errorBannerVariants: Variants = {
  hidden:  { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type:      'spring',
      stiffness: 400,
      damping:   20,
    },
  },
}

export const errorBanner = {
  variants: errorBannerVariants,
  initial:  'hidden',
  animate:  'visible',
} as const