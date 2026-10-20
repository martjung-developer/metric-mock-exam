// lib/hooks/auth/useSignup.ts
// ─────────────────────────────────────────────────────────────────────────────
// All state and logic for the student signup wizard.
// Zero JSX — returns plain values and callbacks consumed by SignupPage.
//
// On successful signup the page shows a success modal then routes to /login.
// The hook itself never navigates — it returns the AuthResult and lets the
// page layer decide.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react'
import { useRouter }             from 'next/navigation'
import {
  signUpStudent,
  signInWithGoogle,
  signInWithFacebook,
} from '@/lib/services/auth'
import {
  validateStudentIdInput,
  validateFullName,
  validateEmail,
  validatePhone,
  validateYearLevel,
  extractErrorMessage,
  getPasswordStrength,
} from '@/lib/utils/auth'
import type { Database } from '@/lib/types/database'
// Local types and initial state to avoid missing exports.
type SignupStep = 'id' | 'credentials' | 'program' | 'review'
type ProgramCode = string
type YearLevel = number
type AuthResult = { success: boolean; error?: string | null; emailConfirmationRequired?: boolean }
export type SignupProgram = Pick<
  Database['public']['Tables']['programs']['Row'],
  'id' | 'code' | 'name' | 'full_name' | 'major' | 'years' | 'school_id'
>

interface SignupState {
  step: SignupStep
  studentId: string
  fullName: string
  email: string
  phone: string
  password: string
  programCode: ProgramCode | null
  selectedProgram: SignupProgram | null
  yearLevel: YearLevel | null
}

const INITIAL_SIGNUP_STATE: SignupState = {
  step: 'id',
  studentId: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  programCode: null,
  selectedProgram: null,
  yearLevel: null,
}

// ── Step order ────────────────────────────────────────────────────────────────

const STEPS: SignupStep[] = ['id', 'credentials', 'program', 'review']
export { STEPS as SIGNUP_STEPS }

// ── Return shape ──────────────────────────────────────────────────────────────

export interface UseSignupReturn {
  state:     SignupState
  stepIndex: number
  loading:   boolean
  error:     string | null
  showPw:    boolean
  strength:  ReturnType<typeof getPasswordStrength>

  patch:      (partial: Partial<SignupState>) => void
  togglePw:   () => void
  clearError: () => void

  goBack: () => void

  handleIdNext:          () => void
  handleCredentialsNext: () => void
  handleProgramNext:     () => void

  handleSignupWithReturn: () => Promise<AuthResult>

  handleGoogle:   () => Promise<void>
  handleFacebook: () => Promise<void>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSignup(): UseSignupReturn {
  const router = useRouter()

  const [state,   setState]   = useState<SignupState>(INITIAL_SIGNUP_STATE)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [showPw,  setShowPw]  = useState(false)

  const stepIndex = STEPS.indexOf(state.step)
  const strength  = getPasswordStrength(state.password)

  // ── Helpers ───────────────────────────────────────────────────────────────

  const patch = useCallback((partial: Partial<SignupState>) => {
    setState((prev) => ({ ...prev, ...partial }))
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])
  const togglePw   = useCallback(() => setShowPw((v) => !v), [])

  // ── Navigation ────────────────────────────────────────────────────────────

  const goBack = useCallback(() => {
    if (stepIndex === 0) { router.push('/login'); return }
    patch({ step: STEPS[stepIndex - 1] })
  }, [stepIndex, router, patch])

  // ── Step 1 ────────────────────────────────────────────────────────────────

  const handleIdNext = useCallback(() => {
    const err = validateStudentIdInput(state.studentId)
    if (err) { setError(err); return }
    patch({ step: 'credentials' })
  }, [state.studentId, patch])

  // ── Step 2 ────────────────────────────────────────────────────────────────

  const handleCredentialsNext = useCallback(() => {
    const nameErr = validateFullName(state.fullName)
    if (nameErr) { setError(nameErr); return }

    const emailErr = validateEmail(state.email)
    if (emailErr) { setError(emailErr); return }

    const phoneErr = validatePhone(state.phone)
    if (phoneErr) { setError(phoneErr); return }

    if (state.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    patch({ step: 'program' })
  }, [state.fullName, state.email, state.phone, state.password, patch])

  // ── Step 3 ────────────────────────────────────────────────────────────────

  const handleProgramNext = useCallback(() => {
    if (!state.programCode || !state.selectedProgram) { setError('Please select your program.'); return }

    const yrErr = validateYearLevel(state.yearLevel)
    if (yrErr) { setError(yrErr); return }

    patch({ step: 'review' })
  }, [state.programCode, state.selectedProgram, state.yearLevel, patch])

  // ── Step 4: Final submit ──────────────────────────────────────────────────

  const handleSignupWithReturn = useCallback(async (): Promise<AuthResult> => {
    if (!state.programCode || !state.selectedProgram) {
      const err = 'Invalid program. Please go back and select one.'
      setError(err)
      return { success: false, error: err }
    }
    if (state.yearLevel === null) {
      const err = 'Year level is required.'
      setError(err)
      return { success: false, error: err }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await signUpStudent(
        state.studentId,
        state.fullName,
        state.email,
        state.password,
        state.selectedProgram,
        state.yearLevel   as YearLevel,
        state.phone       || undefined,
      )
      if (!result.success) { setError(result.error ?? null) }
      return result
    } catch (err) {
      const msg = extractErrorMessage(err)
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [state])

  // ── Social auth ───────────────────────────────────────────────────────────

  const handleGoogle = useCallback(async () => {
    setError(null)
    const result = await signInWithGoogle()
    if (!result.success) { setError(result.error ?? null) }
  }, [])

  const handleFacebook = useCallback(async () => {
    setError(null)
    const result = await signInWithFacebook()
    if (!result.success) { setError(result.error ?? null) }
  }, [])

  return {
    state, stepIndex, loading, error, showPw, strength,
    patch, togglePw, clearError, goBack,
    handleIdNext, handleCredentialsNext, handleProgramNext,
    handleSignupWithReturn,
    handleGoogle, handleFacebook,
  }
}
