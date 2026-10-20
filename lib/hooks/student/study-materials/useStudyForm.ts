// lib/hooks/admin/study-materials/useStudyForm.ts
// ─────────────────────────────────────────────────────────────────────────────
// Extends the existing hook with external_url, meeting_url, link_type fields.
// All original upload logic is preserved exactly.
// Only additions: default values for the three new fields + validation rule.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import {
  useState, useRef, useCallback, type RefObject, type DragEvent,
} from 'react'
import type {
  StudyMaterial,
  StudyMaterialForm,
  StudyMaterialFormErrors,
} from '@/lib/types/admin/study-materials/study-materials'
import type { LinkType } from '@/lib/types/database'

// ── Blank form ────────────────────────────────────────────────────────────────

const BLANK: StudyMaterialForm = {
  title:         '',
  description:   '',
  type:          'document',
  program_id:    '',
  category:      '',
  is_published:  false,
  notes_content: '',
  // ── new fields ────────────────────────────────────────────────────────────
  external_url:  '',
  meeting_url:   '',
  link_type:     '',
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(
  form: StudyMaterialForm,
  file: File | null,
  existingFileUrl: string | null,
): StudyMaterialFormErrors {
  const errors: StudyMaterialFormErrors = {}

  if (!form.title.trim()) {
    errors.title = 'Title is required.'
  }

  // For notes: notes_content is the payload
  if (form.type === 'notes' && !form.notes_content.trim()) {
    errors.notes_content = 'Notes content is required.'
  }

  // For document / video: at least one of file_url, external_url, or
  // (for video) notes_content must be present.
  if (form.type !== 'notes') {
    const hasFile     = file !== null || existingFileUrl !== null
    const hasExternal = form.external_url.trim() !== ''
    if (!hasFile && !hasExternal) {
      errors.external_url =
        'Provide a file upload or an external URL (YouTube, Drive, etc.).'
    }
  }

  return errors
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseStudyFormReturn {
  form:         StudyMaterialForm
  errors:       StudyMaterialFormErrors
  file:         File | null
  submitting:   boolean
  dragOver:     boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  editTarget:   StudyMaterial | null
  showForm:     boolean

  openCreate: () => void
  openEdit:   (mat: StudyMaterial) => void
  closeForm:  () => void
  patchForm:  <K extends keyof StudyMaterialForm>(field: K, value: StudyMaterialForm[K]) => void
  setFile:    (file: File | null) => void
  setDragOver:(over: boolean) => void
  handleDrop: (e: DragEvent<HTMLDivElement>) => void
  handleSubmit: (
    create: (form: StudyMaterialForm, file: File | null) => Promise<void>,
    update: (id: string, form: StudyMaterialForm, file: File | null) => Promise<void>,
  ) => Promise<void>
}

export function useStudyForm(): UseStudyFormReturn {
  const [form,       setForm]       = useState<StudyMaterialForm>(BLANK)
  const [errors,     setErrors]     = useState<StudyMaterialFormErrors>({})
  const [file,       setFile]       = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [dragOver,   setDragOver]   = useState(false)
  const [editTarget, setEditTarget] = useState<StudyMaterial | null>(null)
  const [showForm,   setShowForm]   = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ── openCreate ─────────────────────────────────────────────────────────────

  const openCreate = useCallback(() => {
    setForm(BLANK)
    setErrors({})
    setFile(null)
    setEditTarget(null)
    setShowForm(true)
  }, [])

  // ── openEdit ───────────────────────────────────────────────────────────────

  const openEdit = useCallback((mat: StudyMaterial) => {
    setForm({
      title:         mat.title,
      description:   mat.description   ?? '',
      type:          mat.type,
      program_id:    mat.program_id    ?? '',
      category:      mat.category      ?? '',
      is_published:  mat.is_published,
      notes_content: mat.notes_content ?? '',
      // ── new fields ────────────────────────────────────────────────────────
      external_url:  mat.external_url  ?? '',
      meeting_url:   mat.meeting_url   ?? '',
      link_type:     (mat.link_type    ?? '') as LinkType | '',
    })
    setErrors({})
    setFile(null)
    setEditTarget(mat)
    setShowForm(true)
  }, [])

  // ── closeForm ──────────────────────────────────────────────────────────────

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditTarget(null)
    setForm(BLANK)
    setErrors({})
    setFile(null)
  }, [])

  // ── patchForm ──────────────────────────────────────────────────────────────

  const patchForm = useCallback(
    <K extends keyof StudyMaterialForm>(field: K, value: StudyMaterialForm[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  // ── handleDrop ─────────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {setFile(dropped)}
  }, [])

  // ── handleSubmit ───────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (
      create: (form: StudyMaterialForm, file: File | null) => Promise<void>,
      update: (id: string, form: StudyMaterialForm, file: File | null) => Promise<void>,
    ) => {
      const existingFileUrl = editTarget?.file_url ?? null
      const errs = validate(form, file, existingFileUrl)
      setErrors(errs)
      if (Object.keys(errs).length > 0) {return}

      if (submitting) {return}
      setSubmitting(true)

      try {
        if (editTarget) {
          await update(editTarget.id, form, file)
        } else {
          await create(form, file)
        }
        closeForm()
      } finally {
        setSubmitting(false)
      }
    },
    [form, file, editTarget, submitting, closeForm],
  )

  return {
    form, errors, file, submitting, dragOver,
    fileInputRef, editTarget, showForm,
    openCreate, openEdit, closeForm,
    patchForm, setFile, setDragOver, handleDrop,
    handleSubmit,
  }
}