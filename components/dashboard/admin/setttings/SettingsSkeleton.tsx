// components/dashboard/admin/settings/SettingsSkeleton.tsx
//
// Pure UI — no logic, no hooks beyond what React provides.
// Rendered while auth + profile data are loading.

import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

export function SettingsSkeleton(): JSX.Element {
  return (
    <div className={s.page}>
      <div className={s.layout}>
        <div className={s.nav} />
        <div className={s.content}>
          {([1, 2, 3] as const).map((i) => (
            <div
              key={i}
              className={s.card}
              style={{ height: 160, background: 'var(--surface-tint)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}