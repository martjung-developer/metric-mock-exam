// animations/profile/profile.ts
// Framer Motion variants for the student profile page.
// All animations are intentionally subtle — single staggered
// entrance pass on mount, light hover lifts, no looping motion.

import type { Variants } from "framer-motion";

/* ── Page wrapper: fades in immediately ── */
export const pageVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

/* ── Staggered container: children animate in sequence ── */
export const staggerContainer: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren:   0.1,
    },
  },
};

/* ── Individual stagger child: slides up + fades in ── */
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ── Hero card: slightly larger rise ── */
export const heroVariants: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ── Avatar: scale-in from slightly smaller ── */
export const avatarVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 },
  },
};

/* ── Stat counter card: pop-in ── */
export const statCardVariants: Variants = {
  hidden:  { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ── Table rows: subtle slide from left ── */
export const tableRowVariants: Variants = {
  hidden:  { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      delay: i * 0.05,
    },
  }),
};

/* ── Progress bar fill: width expands from 0 ── */
export const progressBarVariants: Variants = {
  hidden:  { scaleX: 0, originX: 0 },
  visible: (pct: number) => ({
    scaleX: pct / 100,
    originX: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
  }),
};

/* ── Info row items inside the detail section ── */
export const infoItemVariants: Variants = {
  hidden:  { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};