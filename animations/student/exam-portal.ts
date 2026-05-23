import type { Variants } from 'framer-motion'

export const questionVariants: Variants = {
  enterFromRight: {
    opacity: 0,
    x: 32,
    transition: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  enterFromLeft: {
    opacity: 0,
    x: -32,
    transition: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  fadeIn: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
}

export const bubbleVariants: Variants = {
  idle: { scale: 1 },
  pop: {
    scale: [1, 1.22, 1],
    transition: { duration: 0.22, ease: 'easeInOut' },
  },
}

export const timerVariants: Variants = {
  normal: { opacity: 1 },
  warning: { opacity: 1 },
  danger: {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

