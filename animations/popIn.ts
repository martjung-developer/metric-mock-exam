export function popIn(element: Element): void {
  if (!element || !('animate' in element)) {return}
  element.animate(
    [
      { transform: 'scale(0.7)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    {
      duration: 250,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards',
    },
  )
}
