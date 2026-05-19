'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/hooks/theme/useTheme'

interface ThemeToggleButtonProps {
  className: string
}

export default function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { resolved, setMode } = useTheme()

  const isDark = resolved === 'dark'
  const nextMode = isDark ? 'light' : 'dark'

  return (
    <button
      type="button"
      className={className}
      onClick={() => setMode(nextMode)}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
