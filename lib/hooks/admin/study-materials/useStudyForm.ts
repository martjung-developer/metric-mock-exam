// lib/hooks/admin/study-materials/useStudyForm.ts
//
// Manages all form state for the create/edit study material modal.
//
// KEY FIXES vs original:
//   1. showForm + editTarget are now useState (not refs) so AnimatePresence
//      actually receives the updated boolean and mounts/unmounts the modal.
//   2. patchForm signature changed to (field, value) to match what
//      MaterialFormModal calls: onPatch('title', e.target.value)
//   3. RawFormState includes all new fields: external_url, meeting_url, link_type
//   4. openEdit populates all new fields from the existing material

import { useReducer, useRef, useCallback, useState } from 'react'
import type { StudyMaterial }  from '@/lib/types/admin/study-materials/study-materials'
import {
  EMPTY_FORM,
  validateMaterialForm,
  type RawFormState,
  type ValidationErrors,
} from '@/lib/utils/admin/study-materials/validators'
import type { UploadProgressHandler } from '@/lib/services/admin/study-materials/storage.service'

// ── State shape ───────────────────────────────────────────────────────────────

interface FormReducerState {
  form:       RawFormState
  errors:     ValidationErrors
  file:       File | null
  submitting: boolean
  dragOver:   boolean
  uploadProgress: number | null
}

// ── Actions ───────────────────────────────────────────────────────────────────

type FormAction =
  | { type: 'PATCH';          payload: Partial<RawFormState> }
  | { type: 'SET_FILE';       payload: File | null }
  | { type: 'SET_ERRORS';     payload: ValidationErrors }
  | { type: 'SET_DRAG';       payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_UPLOAD_PROGRESS'; payload: number | null }
  | { type: 'RESET';          payload: RawFormState }

function formReducer(
  state: FormReducerState,
  action: FormAction,
): FormReducerState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, form: { ...state.form, ...action.payload } }
    case 'SET_FILE':
      return { ...state, file: action.payload }
    case 'SET_ERRORS':
      return { ...state, errors: action.payload }
    case 'SET_DRAG':
      return { ...state, dragOver: action.payload }
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.payload }
    case 'SET_UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.payload }
    case 'RESET':
      return {
        form:       action.payload,
        errors:     {},
        file:       null,
        submitting: false,
        dragOver:   false,
        uploadProgress: null,
      }
    default:
      return state
  }
}

const INITIAL_STATE: FormReducerState = {
  form:       EMPTY_FORM,
  errors:     {},
  file:       null,
  submitting: false,
  dragOver:   false,
  uploadProgress: null,
}

// ── Hook return shape ─────────────────────────────────────────────────────────

export interface UseStudyFormReturn {
  // state
  form:         RawFormState
  errors:       ValidationErrors
  file:         File | null
  submitting:   boolean
  dragOver:     boolean
  uploadProgress: number | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  editTarget:   StudyMaterial | null
  showForm:     boolean
  // actions
  openCreate:   () => void
  openEdit:     (mat: StudyMaterial) => void
  closeForm:    () => void
  /** Key-value patch: onPatch('title', 'My title') */
  patchForm:    <K extends keyof RawFormState>(field: K, value: RawFormState[K]) => void
  setFile:      (file: File | null) => void
  setDragOver:  (v: boolean) => void
  handleDrop:   (e: React.DragEvent) => void
  /** Validates + calls onCreate or onUpdate. Returns true on success. */
  handleSubmit: (
    onCreate: (form: RawFormState, file: File | null, onUploadProgress?: UploadProgressHandler) => Promise<void>,
    onUpdate: (
      id: string,
      form: RawFormState,
      file: File | null,
      existingUrl: string | null,
      onUploadProgress?: UploadProgressHandler,
    ) => Promise<void>,
  ) => Promise<boolean>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStudyForm(): UseStudyFormReturn {
  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE)

  // FIX: use useState so changes trigger re-renders and AnimatePresence works
  const [showForm,    setShowForm]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<StudyMaterial | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Open / close ───────────────────────────────────────────────────────────

  const openCreate = useCallback(() => {
    setEditTarget(null)
    dispatch({ type: 'RESET', payload: EMPTY_FORM })
    setShowForm(true)
  }, [])

  const openEdit = useCallback((mat: StudyMaterial) => {
    setEditTarget(mat)
    const populated: RawFormState = {
      title:         mat.title,
      description:   mat.description ?? '',
      type:          mat.type,
      youtube_url:   mat.type === 'video' ? (mat.file_url ?? '') : '',
      notes_content: mat.notes_content ?? '',
      program_id:    mat.program_id ?? '',
      category:      mat.category ?? '',
      is_published:  mat.is_published,
      external_url:  mat.external_url ?? '',
      meeting_url:   mat.meeting_url ?? '',
      link_type:     (mat.link_type as RawFormState['link_type']) ?? '',
    }
    dispatch({ type: 'RESET', payload: populated })
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditTarget(null)
    dispatch({ type: 'RESET', payload: EMPTY_FORM })
  }, [])

  // ── Field updates ──────────────────────────────────────────────────────────

  // FIX: key-value signature matches what MaterialFormModal calls
  const patchForm = useCallback(
    <K extends keyof RawFormState>(field: K, value: RawFormState[K]) => {
      dispatch({ type: 'PATCH', payload: { [field]: value } as Partial<RawFormState> })
    },
    [],
  )

  const setFile = useCallback((file: File | null) => {
    dispatch({ type: 'SET_FILE', payload: file })
  }, [])

  const setDragOver = useCallback((v: boolean) => {
    dispatch({ type: 'SET_DRAG', payload: v })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dispatch({ type: 'SET_DRAG', payload: false })
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      dispatch({ type: 'SET_FILE', payload: dropped })
    }
  }, [])

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (
      onCreate: (form: RawFormState, file: File | null) => Promise<void>,
      onUpdate: (
        id: string,
        form: RawFormState,
        file: File | null,
        existingUrl: string | null,
      ) => Promise<void>,
    ): Promise<boolean> => {
      const errors = validateMaterialForm(
        state.form,
        state.file,
        editTarget !== null,
      )

      if (Object.keys(errors).length > 0) {
        dispatch({ type: 'SET_ERRORS', payload: errors })
        return false
      }

      dispatch({ type: 'SET_SUBMITTING', payload: true })
      dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: state.file ? 0 : null })

      const onUploadProgress: UploadProgressHandler = (progress) => {
        dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: progress })
      }

      try {
        if (editTarget) {
          await onUpdate(
            editTarget.id,
            state.form,
            state.file,
            editTarget.file_url,
            state.file ? onUploadProgress : undefined,
          )
        } else {
          await onCreate(state.form, state.file, state.file ? onUploadProgress : undefined)
        }
        closeForm()
        return true
      } catch {
        // Errors are surfaced by the parent hook via its own error state
        return false
      } finally {
        dispatch({ type: 'SET_SUBMITTING', payload: false })
        dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: null })
      }
    },
    [state.form, state.file, editTarget, closeForm],
  )

  return {
    form:         state.form,
    errors:       state.errors,
    file:         state.file,
    submitting:   state.submitting,
    dragOver:     state.dragOver,
    uploadProgress: state.uploadProgress,
    fileInputRef,
    editTarget,
    showForm,
    openCreate,
    openEdit,
    closeForm,
    patchForm,
    setFile,
    setDragOver,
    handleDrop,
    handleSubmit,
  }
}
