// components/auth/signup/SignupStepDots.tsx
import styles from '@/app/(auth)/auth.module.css'
import type { SignupStep } from '@/lib/types/auth/'

const STEPS: SignupStep[] = ['id', 'credentials', 'program',]

interface SignupStepDotsProps {
  stepIndex: number
}

export function SignupStepDots({ stepIndex }: SignupStepDotsProps) {
  return (
    <div className={styles.stepRow}>
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={[
            styles.stepDot,
            i === stepIndex ? styles.stepDotActive : '',
            i  < stepIndex  ? styles.stepDotDone   : '',
          ].join(' ')}
        />
      ))}
    </div>
  )
}