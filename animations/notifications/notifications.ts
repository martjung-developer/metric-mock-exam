// animations/notifications.ts
// Keyframe definitions and animation utilities for the Notifications page.
// Import these class names alongside notifications.module.css.

export const notifAnimations = {
  /** Fade + slide up — used on page mount for header, tabs, and list items */
  fadeSlideIn: 'anim-fadeSlideIn',

  /** Plain opacity fade — used for modal overlay and empty state */
  fadeIn: 'anim-fadeIn',

  /** Skeleton shimmer — use on placeholder elements while loading */
  shimmer: 'anim-shimmer',

  /** Pulsing dot — used on the unread indicator dot */
  dotPulse: 'anim-dotPulse',

  /**
   * Stagger helper — add this class AND anim-fadeSlideIn to a list child.
   * CSS nth-child rules (1–12) apply the delay automatically.
   */
  staggerChild: 'anim-staggerChild',
} as const;

/**
 * Returns a combined class string for a staggered list item.
 * Example:
 *   <div className={getStaggerClass(index)} />
 */
export function getStaggerClass(): string {
  return `${notifAnimations.fadeSlideIn} ${notifAnimations.staggerChild}`;
}
