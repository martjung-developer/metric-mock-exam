// animations/dashboard/dashboardAnimations.ts
// Animations for the student dashboard page.
// Philosophy: staggered entrance only — no looping or persistent motion.
// Everything settles quickly so it never feels slow or distracting.

import type { Variants } from 'framer-motion'

// ── Page container ────────────────────────────────────────────────────────────
// Wrap the top-level <div className={styles.page}> with this.
// Triggers a stagger cascade down through all child sections.

export const dashboardPageVariants: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

export const dashboardPage = {
  variants: dashboardPageVariants,
  initial:  'hidden',
  animate:  'visible',
} as const

// ── Section entrance ──────────────────────────────────────────────────────────
// Apply to: header row, hero banner, stats grid, main grid.
// Each fades up from a few pixels below.

export const sectionVariants: Variants = {
  hidden:  { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] },
  },
}

export const section = {
  variants: sectionVariants,
} as const

// ── Stat cards stagger ────────────────────────────────────────────────────────
// Wrap the stats grid container with statsGrid, each card with statCard.

export const statsGridVariants: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

export const statsGrid = {
  variants: statsGridVariants,
} as const

export const statCardVariants: Variants = {
  hidden:  { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.2, 0.64, 1] },
  },
}

export const statCard = {
  variants: statCardVariants,
} as const

// ── Quick action cards stagger ────────────────────────────────────────────────
// Wrap the quick grid container with quickGrid, each Link with quickItem.

export const quickGridVariants: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.05 },
  },
}

export const quickGrid = {
  variants: quickGridVariants,
} as const

export const quickItemVariants: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
  },
}

export const quickItem = {
  variants: quickItemVariants,
} as const

// ── Card entrance ─────────────────────────────────────────────────────────────
// For individual cards (Recent Activity, Progress, Assigned, Tip).
// Fades in from slightly below with a soft spring.

export const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  },
}

export const card = {
  variants: cardVariants,
} as const

// ── Card hover lift ───────────────────────────────────────────────────────────
// Spread onto any card or quick-action item for a subtle hover lift.
// Use instead of CSS transform so Framer handles the state cleanly.

export const cardHover = {
  whileHover: {
    y: -3,
    boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
    transition: { duration: 0.18 },
  },
  whileTap: { scale: 0.985 },
} as const

// ── Progress bar fill ─────────────────────────────────────────────────────────
// Animate the width of a progress fill bar on mount.
// Usage: pass `custom={pct}` and use `variants={progressFillVariants}`.

export const progressFillVariants: Variants = {
  hidden:  { width: '0%' },
  visible: (pct: number) => ({
    width: `${pct}%`,
    transition: { duration: 0.7, ease: [0.34, 1.1, 0.64, 1], delay: 0.2 },
  }),
}

export const progressFill = {
  variants: progressFillVariants,
  initial:  'hidden',
  animate:  'visible',
} as const

// ── Sidebar nav link ──────────────────────────────────────────────────────────
// Stagger sidebar nav links on first render.

export const sidebarNavVariants: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.08 },
  },
}

export const sidebarNav = {
  variants: sidebarNavVariants,
  initial:  'hidden',
  animate:  'visible',
} as const

export const sidebarNavItemVariants: Variants = {
  hidden:  { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
}

export const sidebarNavItem = {
  variants: sidebarNavItemVariants,
} as const