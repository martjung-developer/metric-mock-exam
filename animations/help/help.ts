// animations/help/help.ts
// Animation variants for the Student Help dashboard page.
// Named exports match the exact import in the help page component.

import type { Variants, HTMLMotionProps } from 'framer-motion'

/* ══════════════════════════════════════════
   TIMING & EASING CONSTANTS
   Single source of truth — referenced by
   every variant and helper below.
══════════════════════════════════════════ */
export const ANIMATION_DURATION = {
  fast:    200,
  normal:  350,
  slow:    500,
  stagger:  80,
} as const

export const EASING = {
  smooth:  [0.4, 0, 0.2, 1]   as const,
  spring:  [0.34, 1.56, 0.64, 1] as const,
  easeOut: [0, 0, 0.2, 1]     as const,
  easeIn:  [0.4, 0, 1, 1]     as const,
} as const

/** Stagger delay groups for section-level animations (ms) */
export const SECTION_DELAYS = {
  hero:       0,
  searchBar: 120,
  categories:240,
  faq:       360,
  contact:   480,
  ticket:    560,
} as const

/* ══════════════════════════════════════════
   UTILITY HELPERS
══════════════════════════════════════════ */

/** Returns inline style for a staggered fade-in-up entry animation */
export function staggerFadeInUp(index: number, baseDelayMs = 0) {
  return {
    animationDelay: `${baseDelayMs + index * ANIMATION_DURATION.stagger}ms`,
  }
}

/** Returns inline style for fade-in with a custom delay */
export function fadeInDelay(delayMs: number) {
  return {
    animationDelay: `${delayMs}ms`,
  }
}

/** Per-card stagger within the quick-links grid */
export function cardStagger(index: number) {
  return SECTION_DELAYS.categories + index * ANIMATION_DURATION.stagger
}

/** Per-FAQ-item stagger within an accordion group */
export function faqStagger(index: number) {
  return SECTION_DELAYS.faq + index * 60
}

/* ══════════════════════════════════════════
   NAMED VARIANT EXPORTS
   These are the five exports imported by the
   dashboard help page component:

     import {
       quickLinksContainer,
       quickCard,
       faqGroups,
       faqGroup,
       faqAnswer,
     } from '@/animations/help/help'

   Each export is spread directly onto a
   <motion.*> element, e.g.:
     <motion.div {...quickLinksContainer}>
══════════════════════════════════════════ */

/* ── 1. quickLinksContainer ──────────────
   Spread onto the wrapper <motion.div>
   that holds all four quick-link cards.
   Orchestrates staggered child entrance.
─────────────────────────────────────────*/
export const quickLinksContainer: Pick<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'variants'
> = {
  initial:  'hidden',
  animate:  'visible',
  variants: {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren:  0.09,
        delayChildren:    SECTION_DELAYS.categories / 1000,
      },
    },
  } satisfies Variants,
}

/* ── 2. quickCard ────────────────────────
   Spread onto each <motion.button> card
   inside the quick-links grid.
   Uses a spring pop-in so cards feel lively
   without being distracting.
─────────────────────────────────────────*/
export const quickCard: Pick<
  HTMLMotionProps<'button'>,
  'variants' | 'whileHover' | 'whileTap'
> = {
  variants: {
    hidden: {
      opacity: 0,
      y:       14,
      scale:   0.94,
    },
    visible: {
      opacity: 1,
      y:       0,
      scale:   1,
      transition: {
        duration: 0.38,
        ease:     EASING.spring,
      },
    },
  } satisfies Variants,

  /** Lift + deepen shadow on hover */
  whileHover: {
    y:         -3,
    boxShadow: '0 8px 24px rgba(30, 58, 95, 0.13)',
    transition: { duration: 0.2, ease: EASING.easeOut },
  },

  /** Slight press-down on tap/click */
  whileTap: {
    scale: 0.97,
    transition: { duration: 0.12 },
  },
}

/* ── 3. faqGroups ────────────────────────
   Spread onto the <motion.div> that wraps
   the entire FAQ column layout.
   Staggered so groups enter one by one.
─────────────────────────────────────────*/
export const faqGroups: Pick<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'variants'
> = {
  initial:  'hidden',
  animate:  'visible',
  variants: {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren: 0.11,
        delayChildren:   SECTION_DELAYS.faq / 1000,
      },
    },
  } satisfies Variants,
}

/* ── 4. faqGroup ─────────────────────────
   Spread onto each <motion.div> that
   represents a single FAQ category block.
   Slides up gently as its parent staggers it.
─────────────────────────────────────────*/
export const faqGroup: Pick<
  HTMLMotionProps<'div'>,
  'variants'
> = {
  variants: {
    hidden: {
      opacity: 0,
      y:       18,
    },
    visible: {
      opacity: 1,
      y:       0,
      transition: {
        duration: 0.44,
        ease:     EASING.smooth,
      },
    },
  } satisfies Variants,
}

/* ── 5. faqAnswer ────────────────────────
   Spread onto the <motion.div> accordion
   panel that reveals/hides a FAQ answer.
   Used inside <AnimatePresence> so the
   exit animation fires when panel closes.

   Height collapses to 0 on exit — the
   component must set overflow: 'hidden'
   on the element this is spread onto.
─────────────────────────────────────────*/
export const faqAnswer: Pick<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'exit' | 'variants' | 'transition'
> = {
  initial:  'hidden',
  animate:  'visible',
  exit:     'exit',

  variants: {
    hidden: {
      opacity:    0,
      height:     0,
      marginTop:  0,
    },
    visible: {
      opacity:    1,
      height:    'auto',
      marginTop:  0,
      transition: {
        height:  { duration: 0.28, ease: EASING.easeOut },
        opacity: { duration: 0.22, ease: EASING.easeOut, delay: 0.06 },
      },
    },
    exit: {
      opacity:    0,
      height:     0,
      marginTop:  0,
      transition: {
        height:  { duration: 0.22, ease: EASING.easeIn },
        opacity: { duration: 0.15, ease: EASING.easeIn },
      },
    },
  } satisfies Variants,

  /* Fallback top-level transition (overridden by per-property above) */
  transition: {
    duration: 0.28,
    ease: EASING.easeOut,
  },
}