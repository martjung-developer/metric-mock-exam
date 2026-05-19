'use client'

import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  resolved: ResolvedTheme
  hydrated: boolean
  setMode: (mode: ThemeMode) => void
  hydrate: () => void
}

const THEME_KEY = 'veripraxis:theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeClass(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  resolved: 'light',
  hydrated: false,
  setMode: (mode) => {
    const resolved = mode === 'system' ? getSystemTheme() : mode
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, mode)
    }
    applyThemeClass(resolved)
    set({ mode, resolved, hydrated: true })
  },
  hydrate: () => {
    const stored = typeof window !== 'undefined'
      ? window.localStorage.getItem(THEME_KEY)
      : null
    const mode: ThemeMode = stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'system'
    const resolved = mode === 'system' ? getSystemTheme() : mode
    applyThemeClass(resolved)
    set({ mode, resolved, hydrated: true })
  },
}))
