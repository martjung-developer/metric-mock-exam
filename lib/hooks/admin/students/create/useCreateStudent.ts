// lib/hooks/admin/students/create/useCreateStudent.ts
//
// Main hook for the Create Student page.
// Owns: form state, field updates, validation, submit, loading, success, redirect.
//
// Uses useReducer for atomic state transitions — prevents the class of bugs
// where setSaving(false) and setErrors({...}) race against each other.

import { useReducer, useCallback, useMemo } from 'react'
import { useRouter }           from 'next/navigation'
import { createClient }        from '@/lib/supabase/client'
import { createStudent }       from '@/lib/services/admin/students/student.service'
import { validateStudentForm, hasErrors } from '@/lib/utils/admin/students/create/validators'
import { mapFormToPayload }    from '@/lib/utils/admin/students/mappers'
import type {
  StudentFormData,
  StudentFormErrors,
} from '@/lib/types/admin/students/student.types'
import { EMPTY_STUDENT_FORM }  from '@/lib/types/admin/students/student.types'

// ── State ─────────────────────────────────────────────────────────────────────

interface FormState {
  form:       StudentFormData
  errors:     StudentFormErrors
  saving:     boolean
  success:    boolean
}

// ── Actions ───────────────────────────────────────────────────────────────────

type FormAction =
  | { type: 'PATCH_FIELD';    field: keyof StudentFormData; value: string }
  | { type: 'SET_ERRORS';     errors: StudentFormErrors }
  | { type: 'SET_SAVING';     value: boolean }
  | { type: 'SET_SUCCESS' }
  | { type: 'CLEAR_FIELD_ERROR'; field: keyof StudentFormData }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'PATCH_FIELD':
      return {
        ...state,
        form:   { ...state.form, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined, general: undefined },
      }

    case 'SET_ERRORS':
      return { ...state, errors: action.errors, saving: false }

    case 'SET_SAVING':
      return { ...state, saving: action.value }

    case 'SET_SUCCESS':
      return { ...state, success: true, saving: false }

    case 'CLEAR_FIELD_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: undefined } }

    default:
      return state
  }
}

const INITIAL_STATE: FormState = {
  form:    EMPTY_STUDENT_FORM,
  errors:  {},
  saving:  false,
  success: false,
}

// ── Hook return shape ─────────────────────────────────────────────────────────

export interface UseCreateStudentReturn {
  form:         StudentFormData
  errors:       StudentFormErrors
  saving:       boolean
  success:      boolean
  handleChange: (field: keyof StudentFormData, value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCreateStudent(): UseCreateStudentReturn {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE)

  // ── Field change handler ────────────────────────────────────────────────────
  // useCallback gives a stable reference — prevents AccountSection /
  // AcademicSection from re-rendering when unrelated state changes.
  const handleChange = useCallback(
    (field: keyof StudentFormData, value: string) => {
      dispatch({ type: 'PATCH_FIELD', field, value })
    },
    [],
  )

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault()

      // Client-side validation
      const validationErrors = validateStudentForm(state.form)
      if (hasErrors(validationErrors)) {
        dispatch({ type: 'SET_ERRORS', errors: validationErrors })
        return
      }

      dispatch({ type: 'SET_SAVING', value: true })

      // Map form → payload (trim, coerce nulls, lowercase email)
      const payload = mapFormToPayload(state.form)

      // Delegate all async work to the service layer
      const result = await createStudent(supabase, payload)

      if (!result.success) {
        // Map service error code → which form field shows the message
        const { code, message } = result.error
        if (code === 'EMAIL_DUPLICATE') {
          dispatch({ type: 'SET_ERRORS', errors: { email: message } })
        } else if (code === 'STUDENT_INSERT_FAILED') {
          dispatch({
            type:   'SET_ERRORS',
            errors: { general: `Account created but student record failed: ${message}` },
          })
        } else {
          dispatch({ type: 'SET_ERRORS', errors: { general: message } })
        }
        return
      }

      // ── Optimistic success: show success UI immediately, redirect after delay
      dispatch({ type: 'SET_SUCCESS' })
      setTimeout(() => router.push('/admin/students'), 1500)
    },
    [state.form, supabase, router],
  )

  return {
    form:         state.form,
    errors:       state.errors,
    saving:       state.saving,
    success:      state.success,
    handleChange,
    handleSubmit,
  }
}
