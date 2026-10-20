// src/animations/utils/pageAnimations.ts
// Universal scroll-reveal utility used by all public pages.
// Sits in the shared animations folder alongside your existing utils.

/**
 * Attaches an IntersectionObserver to every `.reveal` element
 * and adds `.visible` when it enters the viewport.
 * Returns a cleanup function — call it in useEffect's return.
 *
 * Usage in any 'use client' page/component:
 *   useEffect(() => initReveal(), [])
 */
export function initReveal(
  selector    = '.reveal',
  rootMargin  = '0px 0px -60px 0px',
  threshold   = 0.12,
): () => void {
  const els = document.querySelectorAll<HTMLElement>(selector)
  if (!els.length) {return () => {}}

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      })
    },
    { rootMargin, threshold },
  )

  els.forEach((el) => observer.observe(el))
  return () => observer.disconnect()
}

/**
 * Returns an inline style object that staggers transition-delay
 * for index-based reveal sequences.
 *
 * @example
 * <div className="reveal" style={staggerStyle(i)} />
 */
export function staggerStyle(index: number, base = 0.08): React.CSSProperties {
  return { transitionDelay: `${(index * base).toFixed(2)}s` }
}