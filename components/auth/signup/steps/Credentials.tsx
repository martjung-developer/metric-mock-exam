// components/auth/signup/steps/Step2Credentials.tsx
import { motion }            from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import type { SignupState }  from '@/lib/types/auth/'
import type { PasswordStrength } from '@/lib/utils/auth'
import { SignupBackButton }  from '../SignupBackButton'
import styles from '@/app/(auth)/auth.module.css'

// ── Strength → CSS class helper (no `any`) ────────────────────────────────────
const STRENGTH_CLASS_MAP: Record<PasswordStrength, string> = {
  weak:   'strengthWeak',
  fair:   'strengthFair',
  good:   'strengthGood',
  strong: 'strengthStrong',
}

function strengthClass(s: PasswordStrength | null): string {
  if (!s) {return ''}
  return (styles as Record<string, string>)[STRENGTH_CLASS_MAP[s]] ?? ''
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Step2CredentialsProps {
  fullName: SignupState['fullName']
  email:    SignupState['email']
  password: SignupState['password']
  showPw:   boolean
  strength: PasswordStrength | null
  onChange: (partial: Partial<Pick<SignupState, 'fullName' | 'email' | 'password'>>) => void
  onTogglePw: () => void
  onNext:     () => void
  onBack:     () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Step2Credentials({
  fullName, email, password,
  showPw, strength,
  onChange, onTogglePw, onNext, onBack,
}: Step2CredentialsProps) {
  return (
    <div className={styles.form}>

      {/* Full Name */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-fullname">Full Name</label>
        <input
          id="signup-fullname"
          className={styles.input}
          type="text"
          placeholder="e.g. Juan Dela Cruz"
          value={fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          autoComplete="name"
          spellCheck={false}
        />
        <span className={styles.fieldHint}>
          Enter your first and last name as it appears on school records.
        </span>
      </div>

      {/* Email */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-email">Email Address</label>
        <input
          id="signup-email"
          className={styles.input}
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => onChange({ email: e.target.value })}
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-password">Password</label>
        <div className={styles.inputWrap}>
          <input
            id="signup-password"
            className={styles.input}
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => onChange({ password: e.target.value })}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.inputToggle}
            onClick={onTogglePw}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw
              ? <EyeOff size={15} strokeWidth={2} />
              : <Eye   size={15} strokeWidth={2} />
            }
          </button>
        </div>

        {strength && (
          <div className={`${styles.strengthRow} ${strengthClass(strength)}`}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.strengthBar} />
            ))}
            <span className={styles.strengthLabel}>
              {{ weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' }[strength]}
            </span>
          </div>
        )}
      </div>

      {/* Nav row */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <SignupBackButton onClick={onBack} />
        <motion.button
          type="button"
          className={styles.submitBtn}
          style={{ flex: 1, marginTop: 0 }}
          onClick={onNext}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
        >
          Continue <ArrowRight size={15} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  )
}