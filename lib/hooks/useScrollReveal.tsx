// src/hooks/useScrollReveal.tsx
'use client'

import { useEffect, useRef } from 'react'

/**
 * Attaches IntersectionObserver to all .reveal elements inside the ref container.
 * Adds .visible class when element enters the viewport.
 */
export function useScrollReveal() {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {return}

    let observer: IntersectionObserver | null = null
    let cancelled = false

    const setupObserver = () => {
      if (cancelled) { return }

      const elements = container.querySelectorAll('.reveal')

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible')
              observer?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      )

      elements.forEach((el) => observer?.observe(el))
    }

    if (document.readyState === 'complete') {
      setupObserver()
    } else {
      window.addEventListener('load', setupObserver, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', setupObserver)
      observer?.disconnect()
    }
  }, [])

  return containerRef
}
