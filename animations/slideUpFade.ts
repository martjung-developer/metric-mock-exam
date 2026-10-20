export function slideUpFade(element: Element, delayIndex: number): void {
  if (!element || !('animate' in element)) {return}
  element.animate(
    [
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ],
    {
      duration: 300,
      delay: delayIndex * 60,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  )
}
