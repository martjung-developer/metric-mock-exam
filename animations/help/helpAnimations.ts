// animations/help/helpAnimations.ts

/* ══════════════════════════════════════
   TIMING
══════════════════════════════════════ */
export const ANIMATION_DURATION = {
  fast: 0.2,        // seconds (Framer Motion)
  normal: 0.35,
  slow: 0.5,
  stagger: 0.08,
} as const;

/* ══════════════════════════════════════
   CSS TIMING (ms for inline styles)
══════════════════════════════════════ */
export const ANIMATION_MS = {
  fast: 200,
  normal: 350,
  slow: 500,
  stagger: 80,
} as const;

/* ══════════════════════════════════════
   EASING
══════════════════════════════════════ */
export const EASING = {
  smooth: [0.4, 0, 0.2, 1],
  spring: [0.34, 1.56, 0.64, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
} as const;

/* ══════════════════════════════════════
   FRAMER MOTION VARIANTS
══════════════════════════════════════ */
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeOut,
      delay,
    },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: ANIMATION_DURATION.stagger,
    },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeOut,
    },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.spring,
    },
  },
};

/* ══════════════════════════════════════
   SECTION DELAYS (seconds)
══════════════════════════════════════ */
export const SECTION_DELAYS = {
  hero: 0,
  searchBar: 0.12,
  categories: 0.24,
  faq: 0.36,
  contact: 0.48,
  ticket: 0.56,
} as const;

/* ══════════════════════════════════════
   HELPERS (FRAMER)
══════════════════════════════════════ */
export const getDelay = (base: number, index = 0) =>
  base + index * ANIMATION_DURATION.stagger;

export const cardDelay = (index: number) =>
  getDelay(SECTION_DELAYS.categories, index);

export const faqDelay = (index: number) =>
  getDelay(SECTION_DELAYS.faq, index);

/* ══════════════════════════════════════
   HELPERS (CSS / INLINE STYLE)
══════════════════════════════════════ */

/** Staggered fade-in-up (for CSS animations) */
export function staggerFadeInUp(index: number, baseDelayMs = 0) {
  return {
    animationDelay: `${baseDelayMs + index * ANIMATION_MS.stagger}ms`,
  };
}

/** Simple delay */
export function fadeInDelay(delayMs: number) {
  return {
    animationDelay: `${delayMs}ms`,
  };
}

/** Per-card stagger (ms) */
export function cardStagger(index: number) {
  return (
    SECTION_DELAYS.categories * 1000 +
    index * ANIMATION_MS.stagger
  );
}

/** Per-FAQ stagger (ms) */
export function faqStagger(index: number) {
  return (
    SECTION_DELAYS.faq * 1000 +
    index * 60
  );
}

/* ══════════════════════════════════════
   KEYFRAMES (UNCHANGED)
══════════════════════════════════════ */
export const KEYFRAMES = {
  fadeInUp: "helpFadeInUp",
  fadeIn: "helpFadeIn",
  slideInRight: "helpSlideInRight",
  pulse: "helpPulse",
  shimmer: "helpShimmer",
  scaleIn: "helpScaleIn",
} as const;
