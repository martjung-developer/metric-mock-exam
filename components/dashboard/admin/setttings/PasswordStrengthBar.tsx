// components/dashboard/admin/settings/PasswordStrengthBar.tsx
//
// Pure UI — displays a colour-coded strength bar and label.

import type { PasswordStrength } from '@/lib/types/admin/settings/settings.types'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

interface PasswordStrengthBarProps {
  strength: PasswordStrength
}

const STRENGTH_CONFIG: Record<
  PasswordStrength,
  { fillClass: string; labelClass: string; label: string }
> = {
  weak:   { fillClass: s.pwStrengthWeak,   labelClass: s.pwStrengthLabelWeak,   label: 'Weak password'            },
  fair:   { fillClass: s.pwStrengthFair,   labelClass: s.pwStrengthLabelFair,   label: 'Fair — could be stronger' },
  strong: { fillClass: s.pwStrengthStrong, labelClass: s.pwStrengthLabelStrong, label: 'Strong password'          },
}

export function PasswordStrengthBar({ strength }: PasswordStrengthBarProps): JSX.Element {
  const { fillClass, labelClass, label } = STRENGTH_CONFIG[strength]

  return (
    <>
      <div className={s.pwStrength}>
        <div className={`${s.pwStrengthFill} ${fillClass}`} />
      </div>
      <span className={`${s.pwStrengthLabel} ${labelClass}`}>{label}</span>
    </>
  )
}