'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/stores/theme/themeStore'

export function useTheme(): {
  mode: 'light' | 'dark' | 'system'
  resolved: 'light' | 'dark'
  hydrated: boolean
  setMode: (mode: 'light' | 'dark' | 'system') => void
} {
  const mode = useThemeStore((s) => s.mode)
  const resolved = useThemeStore((s) => s.resolved)
  const hydrated = useThemeStore((s) => s.hydrated)
  const setMode = useThemeStore((s) => s.setMode)
  const hydrate = useThemeStore((s) => s.hydrate)

  useEffect(() => {
    if (!hydrated) {
      hydrate()
    }
  }, [hydrate, hydrated])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (mode === 'system') {
        setMode('system')
      }
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [mode, setMode])

  return { mode, resolved, hydrated, setMode }
}
