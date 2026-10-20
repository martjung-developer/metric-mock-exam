export function highlightPulse(element: Element, color: string): void {
  if (!element || !('animate' in element)) {return}
  const target = element as HTMLElement
  target.style.color = color
  target.animate(
    [
      { boxShadow: '0 0 0 0px currentColor' },
      { boxShadow: '0 0 8px 3px currentColor' },
      { boxShadow: '0 0 0 0px currentColor' },
    ],
    {
      duration: 500,
      iterations: 1,
      easing: 'ease-out',
      fill: 'forwards',
    },
  )
}
