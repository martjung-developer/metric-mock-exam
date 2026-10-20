// src/animations/about/aboutAnimations.ts
// Page-specific animations for the About page.
// Imports from: @/animations/variants/fade  &  @/animations/presets/publicPage

import type { Variants } from 'framer-motion'
import { fadeUp, scaleIn, staggerContainer } from '@/animations/variants/fade'

// ── Stats bar ────────────────────────────────────────────────────────────────
export const statsContainer = {
    initial:     'hidden',
    whileInView: 'show',
    viewport:    { once: true, amount: 0.3 },
    variants:    staggerContainer,
} as const

export const statCard = {
    variants: scaleIn,
} as const

// ── Mission split ────────────────────────────────────────────────────────────
export const missionText = {
    initial:     'hidden',
    whileInView: 'show',
    viewport:    { once: true, amount: 0.15 },
    variants:    {
        hidden: { opacity: 0, x: -28 },
        show:   { 
            opacity: 1, 
            x: 0, 
            transition: { 
                duration: 0.6, 
                ease: [0.4, 0, 0.2, 1] as [number, number, number, number] // valid cubic-bezier
            } 
        },
    } as Variants,
} as const

export const missionImage = {
    initial:     'hidden',
    whileInView: 'show',
    viewport:    { once: true, amount: 0.15 },
    variants:    {
        hidden: { opacity: 0, x: 28, scale: 0.97 },
        show:   { 
            opacity: 1, 
            x: 0, 
            scale: 1, 
            transition: { 
                duration: 0.65, 
                delay: 0.15, 
                ease: [0.4, 0, 0.2, 1] as [number, number, number, number] // valid cubic-bezier
            } 
        },
    } as Variants,
} as const

// ── Values list ──────────────────────────────────────────────────────────────
export const valuesContainer = {
    initial:     'hidden',
    whileInView: 'show',
    viewport:    { once: true, amount: 0.1 },
    variants:    staggerContainer,
} as const

export const valueItem = {
    variants:   fadeUp,
    whileHover: { x: 4, transition: { duration: 0.18 } },
} as const

// ── Team grid ────────────────────────────────────────────────────────────────
export const teamContainer = {
    initial:     'hidden',
    whileInView: 'show',
    viewport:    { once: true, amount: 0.1 },
    variants:    staggerContainer,
} as const

export const teamCard = {
    variants:   fadeUp,
    whileHover: { y: -4, transition: { duration: 0.2 } },
} as const