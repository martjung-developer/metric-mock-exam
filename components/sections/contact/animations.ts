// animations.ts — ContactSection

let observer: IntersectionObserver | null = null

export function initAnimations() {
  const els = document.querySelectorAll('.reveal')
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer?.unobserve(e.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )
  els.forEach((el) => { if (observer) { observer.observe(el) } })
}

export function cleanupAnimations() {
  observer?.disconnect()
  observer = null
}

