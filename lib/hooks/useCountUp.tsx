// src/hooks/useCountUp.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface UseCountUpOptions {
  end: number
  duration?: number // ms
  prefix?: string
  suffix?: string
  startOnMount?: boolean
}

export function useCountUp({
  end,
  duration = 1800,
  prefix = '',
  suffix = '',
  startOnMount = false,
}: UseCountUpOptions) {
  const [value, setValue] = useState(startOnMount ? 0 : end)
  const [started, setStarted] = useState(startOnMount)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (startOnMount) {return} 
    const el = ref.current
    if (!el) {return}

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [startOnMount])

  useEffect(() => {
    if (!started) {return}

    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) {startTime = timestamp}
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * end))

      if (progress < 1) {requestAnimationFrame(step)}
    }

    requestAnimationFrame(step)
  }, [started, end, duration])

  const display = `${prefix}${value.toLocaleString()}${suffix}`
  return { display, ref }
}