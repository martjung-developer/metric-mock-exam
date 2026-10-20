// components/dashboard/student/notifications/NotificationToastContainer.tsx
//
// Renders the live toast queue from the Zustand store.
// Each toast auto-dismisses after 4 seconds.
// No external toast library required.

'use client'

import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import {
  useNotificationStore,
  selectToastQueue,
} from '@/lib/stores/notifications/notificationStore'
import type { JSX } from 'react'

// ── Inline styles (no CSS module dependency needed for a floating overlay) ──

const containerStyle: React.CSSProperties = {
  position:      'fixed',
  bottom:        '1.5rem',
  right:         '1.5rem',
  display:       'flex',
  flexDirection: 'column',
  gap:           '0.6rem',
  zIndex:        200,
  pointerEvents: 'none',
}

const toastStyle: React.CSSProperties = {
  display:         'flex',
  alignItems:      'flex-start',
  gap:             '0.75rem',
  padding:         '0.85rem 1rem',
  background:      '#fff',
  border:          '1.5px solid #c3dde9',
  borderRadius:    '12px',
  boxShadow:       '0 8px 28px rgba(13,37,64,0.14)',
  maxWidth:        '320px',
  pointerEvents:   'auto',
  animation:       'fadeSlideInToast 0.25s ease both',
}

const iconWrapStyle: React.CSSProperties = {
  flexShrink:      0,
  width:           '34px',
  height:          '34px',
  borderRadius:    '9px',
  background:      '#dce8f5',
  color:           '#1e3a5f',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
}

const titleStyle: React.CSSProperties = {
  fontWeight:      700,
  fontSize:        '0.82rem',
  color:           '#0d1117',
  margin:          '0 0 2px',
  letterSpacing:   '-0.01em',
}

const messageStyle: React.CSSProperties = {
  fontSize:        '0.75rem',
  color:           '#6b7280',
  margin:          0,
  lineHeight:      1.5,
  display:         '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow:        'hidden',
}

// ── Component ──────────────────────────────────────────────────────────────

export function NotificationToastContainer(): JSX.Element | null {
  const toastQueue = useNotificationStore(selectToastQueue)
  const shiftToast = useNotificationStore((s) => s.shiftToast)

  // Auto-dismiss the oldest toast after 4 seconds
  useEffect(() => {
    if (toastQueue.length === 0) {return}
    const timer = setTimeout(shiftToast, 4000)
    return () => clearTimeout(timer)
  }, [toastQueue, shiftToast])

  if (toastQueue.length === 0) {return null}

  return (
    <>
      {/* Keyframe injection — scoped to this component */}
      <style>{`
        @keyframes fadeSlideInToast {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={containerStyle}>
        {toastQueue.map((t) => (
          <div key={t.id} style={toastStyle}>
            <div style={iconWrapStyle}>
              <Bell size={16} />
            </div>
            <div>
              <p style={titleStyle}>{t.title}</p>
              <p style={messageStyle}>{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}