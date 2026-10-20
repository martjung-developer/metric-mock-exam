'use client'
// lib/hooks/admin/questionnaires/useQuestionnaires.ts
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES FROM PREVIOUS VERSION:
//   + importImageFiles state — Files dropped/selected alongside a CSV/XLSX
//     upload, matched to rows by filename (row.image acts as a filename ref
//     when it isn't already an absolute URL)
//   + importImageMatchWarnings — filenames referenced by rows but not found
//     among the attached files, recomputed whenever rows or files change
//   + handleImageFilesSelected — appends newly picked/dropped image files
//   + handleImportSave now uploads importImageFiles to the public
//     `questionnaire-assets` Supabase bucket before inserting, resolving each
//     row's image reference (filename -> uploaded public URL, or passthrough
//     if it was already an absolute URL)
//   + openImport / closeImport reset the new image-related state
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient }     from '@/lib/supabase/client'
import { useUser } from '@/lib/context/AuthContext'
import type { QuestionType, QuestionOption } from '@/lib/types/database'
import type {
  DisplayQuestion,
  ProgramOption,
  ExamOption,
  FormState,
  ImportRow,
  DifficultyLevel,
  QuestionInsertPayload,
  EmbeddedImageData,
} from '@/lib/types/admin/questionnaires/questionnaires'
import {
  fetchPrograms,
  fetchExams,
  fetchQuestions,
  insertQuestion,
  updateQuestion,
  updateQuestionImageUrl,
  deleteQuestion,
  deleteQuestions,
  importQuestionsWithoutDuplicates,
} from '@/lib/services/admin/questionnaires/questionnaires.service'
import {
  uploadImportedQuestionImages,
  isAbsoluteImageUrl,
} from '@/lib/services/admin/questionnaires/uploadQuestionImage'
import {
  stripDifficultyTag,
  encodeDifficulty,
  validateImportRow,
  filterQuestionnaireQuestions,
  normalizeImageFilename,
  normalizeQuestionText,
  attachEmbeddedImagesToRows,
  embeddedImageToFile,
} from '@/lib/utils/admin/questionnaires/questionnaires.utils'
import {
  parseFile,
  fetchAndParseLink,
  detectLinkSource,
} from '@/lib/utils/admin/questionnaires/questionnaires.parsers'
import {
  TYPE_ORDER,
  VALID_DIFF,
} from '@/lib/constants/admin/questionnaires/questionnaires.constants'

// ── BLANK_FORM ────────────────────────────────────────────────────────────────

const BLANK_FORM: FormState = {
  question_text:  '',
  question_type:  'multiple_choice',
  points:         1,
  correct_answer: '',
  explanation:    '',
  exam_id:        '',
  difficulty:     'medium',
  choices: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
  program_id: '',
  scenario:   '',
  image_url:  '',
}

export type ViewMode  = 'programs' | 'program-detail'
export type ImportTab = 'file' | 'link'

type DuplicateFileCheck = {
  blocking:      boolean
  message:       string
  allowImageFix: boolean
}

export interface UseQuestionnairesReturn {
  questions:               DisplayQuestion[]
  exams:                   ExamOption[]
  programs:                ProgramOption[]
  loading:                 boolean
  refreshing:              boolean
  error:                   string | null
  viewMode:                ViewMode
  selectedProgram:         ProgramOption | null
  openProgram:             (p: ProgramOption) => void
  backToPrograms:          () => void
  search:                  string
  setSearch:               (s: string) => void
  examFilter:              string
  setExamFilter:           (id: string) => void
  selectedQuestionIds:     Set<string>
  selectedQuestionCount:   number
  toggleQuestionSelection: (id: string) => void
  setSelectedQuestions:    (ids: string[]) => void
  clearQuestionSelection:  () => void
  bulkDeleting:            boolean
  bulkDeleteMessage:       { message: string; type: 'success' | 'error' } | null
  deleteSelectedQuestions: () => Promise<boolean>
  questionsByProgram:      Record<string, DisplayQuestion[]>
  programDetailQuestions:  DisplayQuestion[]
  questionsByType:         Record<QuestionType, DisplayQuestion[]>
  overallStats:            { total: number; mcq: number; easy: number; hard: number }
  showForm:                boolean
  formMode:                'create' | 'edit'
  form:                    FormState
  formError:               string
  saving:                  boolean
  openCreate:              () => void
  openEdit:                (q: DisplayQuestion) => void
  closeForm:               () => void
  setField:                <K extends keyof FormState>(key: K, value: FormState[K]) => void
  setChoiceText:           (idx: number, text: string) => void
  handleSave:              () => Promise<void>
  attachImageToCurrentQuestion: (imageUrl: string) => Promise<void>
  examsForForm:            ExamOption[]
  deleteId:                string | null
  deleting:                boolean
  setDeleteId:             (id: string | null) => void
  handleDelete:            () => Promise<void>
  viewQ:                   DisplayQuestion | null
  setViewQ:                (q: DisplayQuestion | null) => void
  showImport:              boolean
  importTab:               ImportTab
  importExamId:            string
  importProgramId:         string
  importRows:              ImportRow[]
  importParsing:           boolean
  importError:             string
  importWarning:           string
  importSaving:            boolean
  importDone:              boolean
  importCounts:            { inserted: number; skippedDuplicates: number; failedToParse: number; imageCorrections: number }
  dragOver:                boolean
  importedFileName:        string
  linkUrl:                 string
  linkSource:              ReturnType<typeof detectLinkSource> | null
  linkFetching:            boolean
  validCount:              number
  invalidCount:            number
  existingDuplicateCount:  number
  missingImageCorrectionCount: number
  canImport:               boolean
  examsForImport:          ExamOption[]
  openImport:              () => void
  closeImport:             () => void
  setImportTab:            (t: ImportTab) => void
  setImportExamId:         (id: string) => void
  setImportProgramId:      (id: string) => void
  handleFileDrop:          (file: File) => Promise<void>
  handleLinkChange:        (url: string) => void
  handleFetchLink:         () => Promise<void>
  handleImportSave:        () => Promise<void>
  setDragOver:             (v: boolean) => void
  handleRefresh:           () => void
  stripDifficultyTag:      typeof stripDifficultyTag
  // ── ADDED — image bundle for CSV/XLSX imports ──
  importImageFiles:          File[]
  importImageMatchWarnings:  string[]
  handleImageFilesSelected:  (files: File[]) => void
  removeImportImageFile:     (filename: string) => void
}

export function useQuestionnaires(): UseQuestionnairesReturn {
  const supabase = useMemo(() => createClient(), [])
  const { profile } = useUser()

  const [questions,  setQuestions]  = useState<DisplayQuestion[]>([])
  const [exams,      setExams]      = useState<ExamOption[]>([])
  const [programs,   setPrograms]   = useState<ProgramOption[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const [viewMode,        setViewMode]        = useState<ViewMode>('programs')
  const [selectedProgram, setSelectedProgram] = useState<ProgramOption | null>(null)
  const [search,          setSearchState]     = useState('')
  const [examFilter,      setExamFilterState] = useState('')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteMessage, setBulkDeleteMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [showForm,  setShowForm]  = useState(false)
  const [formMode,  setFormMode]  = useState<'create' | 'edit'>('create')
  const [editId,    setEditId]    = useState<string | null>(null)
  const [form,      setForm]      = useState<FormState>(BLANK_FORM)
  const [formError, setFormError] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [deleteId,  setDeleteId]  = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)
  const [viewQ,     setViewQ]     = useState<DisplayQuestion | null>(null)

  const [showImport,       setShowImport]       = useState(false)
  const [importTab,        setImportTab]        = useState<ImportTab>('file')
  const [importExamId,     setImportExamId]     = useState('')
  const [importProgramId,  setImportProgramId]  = useState('')
  const [importRows,       setImportRows]       = useState<ImportRow[]>([])
  const [importParsing,    setImportParsing]    = useState(false)
  const [importError,      setImportError]      = useState('')
  const [importWarning,    setImportWarning]    = useState('')
  const [importSaving,     setImportSaving]     = useState(false)
  const [importDone,       setImportDone]       = useState(false)
  const [importCounts,     setImportCounts]     = useState({ inserted: 0, skippedDuplicates: 0, failedToParse: 0, imageCorrections: 0 })
  const [dragOver,         setDragOver]         = useState(false)
  const [importedFileName, setImportedFileName] = useState('')
  const [importedFileMeta, setImportedFileMeta] = useState<{ fileType: string; fileSize: number; fingerprint: string } | null>(null)
  const [linkUrl,          setLinkUrl]          = useState('')
  const [linkSource,       setLinkSource]       = useState<ReturnType<typeof detectLinkSource> | null>(null)
  const [linkFetching,     setLinkFetching]     = useState(false)

  // ── ADDED — image bundle state ──
  const [importImageFiles, setImportImageFiles] = useState<File[]>([])

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async (silent = false) => {
    if (silent) { setRefreshing(true) } else { setLoading(true) }
    setError(null)
    try {
      const [progs, exs, qs] = await Promise.all([
        fetchPrograms(supabase),
        fetchExams(supabase),
        fetchQuestions(supabase),
      ])
      setPrograms(progs)
      setExams(exs)
      setQuestions(qs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error loading data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    // Load questionnaire data when the Supabase client is ready.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll()
  }, [fetchAll])
  useEffect(() => {
    if (profile?.role !== 'faculty') {
      return
    }
    const es = new EventSource('/api/admin/approvals/stream')
    es.addEventListener('approval', (evt) => {
      const e = evt as MessageEvent<string>
      try {
        const payload = JSON.parse(e.data) as { entityType?: string; status?: string }
        if (payload.entityType === 'exam' && (payload.status === 'published' || payload.status === 'rejected')) {
          setError(payload.status === 'published' ? 'One of your exam submissions was approved and published.' : 'One of your exam submissions was rejected. Check review notes.')
          void fetchAll(true)
        }
      } catch {
        // ignore malformed events
      }
    })
    return () => {
      es.close()
    }
  }, [profile?.role, fetchAll])

  const handleRefresh = useCallback(() => { void fetchAll(true) }, [fetchAll])

  // ── Derived ────────────────────────────────────────────────────────────────

  const questionsByProgram = useMemo(() => {
    const map: Record<string, DisplayQuestion[]> = {}
    programs.forEach((p) => { map[p.id] = [] })
    questions.forEach((q) => {
      if (q.examProgramId !== null && map[q.examProgramId] !== undefined) {
        map[q.examProgramId].push(q)
      }
    })
    return map
  }, [questions, programs])

  const programDetailQuestions = useMemo(() => {
    if (selectedProgram === null) { return [] }
    const qs = questionsByProgram[selectedProgram.id] ?? []
    return filterQuestionnaireQuestions(qs, search, examFilter)
  }, [selectedProgram, questionsByProgram, search, examFilter])

  const selectedQuestionCount = useMemo(
    () => programDetailQuestions.filter((question) => selectedQuestionIds.has(question.id)).length,
    [programDetailQuestions, selectedQuestionIds],
  )

  const clearQuestionSelection = useCallback(() => setSelectedQuestionIds(new Set()), [])
  const setSearch = useCallback((value: string) => {
    setSearchState(value)
    clearQuestionSelection()
  }, [clearQuestionSelection])
  const setExamFilter = useCallback((id: string) => {
    setExamFilterState(id)
    clearQuestionSelection()
  }, [clearQuestionSelection])
  const toggleQuestionSelection = useCallback((id: string) => {
    setSelectedQuestionIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])
  const setSelectedQuestions = useCallback((ids: string[]) => {
    setSelectedQuestionIds(new Set(ids))
  }, [])
  const deleteSelectedQuestions = useCallback(async (): Promise<boolean> => {
    const selected = programDetailQuestions.filter((question) => selectedQuestionIds.has(question.id))
    if (selected.length === 0) { return false }

    setBulkDeleting(true)
    setBulkDeleteMessage(null)
    try {
      const result = await deleteQuestions(supabase, selected.map((question) => ({
        id: question.id,
        exam_id: question.exam_id,
        question_bank_id: question.question_bank_id,
      })))
      if (result.error !== null) {
        setBulkDeleteMessage({ message: `Could not delete selected questions: ${result.error}`, type: 'error' })
        return false
      }

      clearQuestionSelection()
      await fetchAll(true)
      setBulkDeleteMessage({
        message: `${selected.length} question${selected.length === 1 ? '' : 's'} deleted.`,
        type: 'success',
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown deletion error.'
      setBulkDeleteMessage({ message: `Could not delete selected questions: ${message}`, type: 'error' })
      return false
    } finally {
      setBulkDeleting(false)
    }
  }, [programDetailQuestions, selectedQuestionIds, supabase, clearQuestionSelection, fetchAll])

  const questionsByType = useMemo(() => {
    const map = {} as Record<QuestionType, DisplayQuestion[]>
    TYPE_ORDER.forEach((t) => {
      map[t] = programDetailQuestions.filter((q) => q.question_type === t)
    })
    return map
  }, [programDetailQuestions])

  const overallStats = useMemo(() => ({
    total: questions.length,
    mcq:   questions.filter((q) => q.question_type === 'multiple_choice').length,
    easy:  questions.filter((q) => q.difficulty === 'easy').length,
    hard:  questions.filter((q) => q.difficulty === 'hard').length,
  }), [questions])

  // ── Navigation ─────────────────────────────────────────────────────────────

  function openProgram(program: ProgramOption): void {
    setSelectedProgram(program)
    setViewMode('program-detail')
    setSearch('')
    setExamFilter('')
  }

  function backToPrograms(): void {
    setViewMode('programs')
    setSelectedProgram(null)
    setSearch('')
    setExamFilter('')
  }

  // ── Form helpers ───────────────────────────────────────────────────────────

  function openCreate(): void {
    const pid             = selectedProgram?.id ?? ''
    const prefilledExamId = pid
      ? (exams.find((e) => e.program_id === pid)?.id ?? '')
      : ''
    setForm({ ...BLANK_FORM, exam_id: prefilledExamId, program_id: pid })
    setFormMode('create')
    setEditId(null)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(q: DisplayQuestion): void {
    const exam = exams.find((e) => e.id === q.exam_id)
    setForm({
      question_text:  q.question_text,
      question_type:  q.question_type,
      points:         q.points,
      correct_answer: q.correct_answer ?? '',
      explanation:    stripDifficultyTag(q.explanation),
      exam_id:        q.exam_id ?? '',
      difficulty:     q.difficulty,
      program_id:     exam?.program_id ?? '',
      choices:        (q.options && q.options.length > 0) ? q.options : BLANK_FORM.choices,
      scenario:       q.scenario ?? '',
      image_url:      q.image_url ?? '',
    })
    setFormMode('edit')
    setEditId(q.id)
    setFormError('')
    setShowForm(true)
  }

  function closeForm(): void {
    setShowForm(false)
    setFormError('')
    setEditId(null)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'program_id') { next.exam_id = '' }
      return next
    })
  }

  function setChoiceText(idx: number, text: string): void {
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.map((c, i) => (i === idx ? { ...c, text } : c)),
    }))
  }

  const examsForForm = useMemo(() => {
    if (!form.program_id) { return exams }
    return exams.filter((e) => e.program_id === form.program_id)
  }, [exams, form.program_id])

  async function handleSave(): Promise<void> {
    setFormError('')
    if (!form.question_text.trim()) { setFormError('Question text is required.'); return }
    if (!form.exam_id)              { setFormError('Please select an exam.'); return }

    const isMCQ = form.question_type === 'multiple_choice'
    const isTF  = form.question_type === 'true_false'

    if (isMCQ) {
      if (form.choices.filter((c) => c.text.trim()).length < 2) {
        setFormError('Provide at least 2 answer choices.'); return
      }
      if (!form.correct_answer) { setFormError('Mark the correct answer.'); return }
    }
    if (isTF && !form.correct_answer) { setFormError('Select True or False.'); return }

    const payload: QuestionInsertPayload = {
      question_text:  form.question_text.trim(),
      question_type:  form.question_type,
      points:         form.points,
      options:        isMCQ ? form.choices.filter((c) => c.text.trim()) : null,
      correct_answer: form.correct_answer || null,
      explanation:    encodeDifficulty(form.difficulty, form.explanation),
      exam_id:        form.exam_id || null,
      scenario:       form.scenario.trim() || null,
      image_url:      form.image_url.trim() || null,
    }

    setSaving(true)
    try {
      if (formMode === 'create') {
        await insertQuestion(supabase, payload)
      } else {
        if (editId === null) { setFormError('Missing edit ID'); return }
        await updateQuestion(supabase, editId, payload)
      }
      closeForm()
      await fetchAll(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(): Promise<void> {
    if (deleteId === null) { return }
    setDeleting(true)
    try {
      await deleteQuestion(supabase, deleteId)
      setSelectedQuestionIds((previous) => {
        const next = new Set(previous)
        next.delete(deleteId)
        return next
      })
      setDeleteId(null)
      await fetchAll(true)
    } finally {
      setDeleting(false)
    }
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  function openImport(): void {
    setShowImport(true)
    setImportRows([])
    setImportError('')
    setImportWarning('')
    setImportExamId('')
    setImportProgramId('')
    setImportDone(false)
    setImportCounts({ inserted: 0, skippedDuplicates: 0, failedToParse: 0, imageCorrections: 0 })
    setImportTab('file')
    setLinkUrl('')
    setLinkSource(null)
    setImportedFileName('')
    setImportedFileMeta(null)
    setImportImageFiles([])           // ── ADDED
  }

  function closeImport(): void {
    setShowImport(false)
    setImportRows([])
    setImportError('')
    setImportWarning('')
    setImportDone(false)
    setLinkUrl('')
    setLinkSource(null)
    setImportedFileMeta(null)
    setImportImageFiles([])           // ── ADDED
  }

  // ── ADDED — image bundle handlers ──
  function handleImageFilesSelected(files: File[]): void {
    if (files.length === 0) { return }
    setImportImageFiles((prev) => {
      const existingNames = new Set(prev.map((f) => normalizeImageFilename(f.name)))
      const additions = files.filter((file) => {
        const normalizedName = normalizeImageFilename(file.name)
        if (existingNames.has(normalizedName)) { return false }
        existingNames.add(normalizedName)
        return true
      })
      return [...prev, ...additions]
    })
  }

  function removeImportImageFile(filename: string): void {
    setImportImageFiles((prev) => prev.filter((f) => f.name !== filename))
  }

  // ── ADDED — which row.image filename refs have no matching attached file ──
  const importImageMatchWarnings = useMemo(() => {
    const attachedNames = new Set(importImageFiles.map((f) => normalizeImageFilename(f.name)))
    const missing = new Set<string>()
    importRows.forEach((row) => {
      const ref = row.image?.trim()
      if (!ref || isAbsoluteImageUrl(ref)) { return }
      if (!attachedNames.has(normalizeImageFilename(ref))) { missing.add(ref) }
    })
    return [...missing]
  }, [importRows, importImageFiles])

  async function computeFileFingerprint(file: File): Promise<string> {
    const buf = await file.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', buf)
    const bytes = Array.from(new Uint8Array(digest))
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  function getRelatedExamId(filePath: string): string | null {
    const parts = filePath.split('/')
    const examIndex = parts.indexOf('exams')
    return examIndex >= 0 ? (parts[examIndex + 1] ?? null) : null
  }

  function hasAttachedImageReference(row: ImportRow, attachedNames: Set<string>): boolean {
    const ref = row.image?.trim() ?? ''
    return Boolean(row.embeddedImage) || (Boolean(ref) && (
      isAbsoluteImageUrl(ref) || attachedNames.has(normalizeImageFilename(ref))
    ))
  }

  async function checkDuplicateFile(fileHash: string): Promise<DuplicateFileCheck | null> {
    const { data: duplicateFiles, error: duplicateLookupError } = await supabase
      .from('storage_files')
      .select('id, file_name, file_path')
      .eq('purpose', 'exam_questions')
      .eq('file_hash', fileHash)
      .limit(10)

    if (duplicateLookupError !== null) {
      throw new Error(`Could not verify duplicate file: ${duplicateLookupError.message}`)
    }

    const duplicates = duplicateFiles ?? []
    if (duplicates.length === 0) { return null }

    const relatedExamIds = Array.from(new Set(
      duplicates
        .map((file) => getRelatedExamId(file.file_path))
        .filter((id): id is string => id !== null),
    ))

    if (relatedExamIds.length > 0) {
      const { data: relatedExams, error: relatedExamError } = await supabase
        .from('exams')
        .select('id, title, approval_status')
        .in('id', relatedExamIds)

      if (relatedExamError !== null) {
        throw new Error(`Could not verify duplicate approval status: ${relatedExamError.message}`)
      }

      const approvedExam = (relatedExams ?? []).find((exam) =>
        exam.approval_status === 'approved' || exam.approval_status === 'published',
      )

      if (approvedExam !== undefined) {
        const { count: unresolvedCount, error: unresolvedError } = await supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('exam_id', approvedExam.id)
          .is('image_url', null)

        if (unresolvedError !== null) {
          throw new Error(`Could not verify missing question images: ${unresolvedError.message}`)
        }

        if ((unresolvedCount ?? 0) > 0) {
          return {
            blocking: false,
            allowImageFix: true,
            message:  `This exact questionnaire file matches an already-verified upload for "${approvedExam.title}", but that exam has ${unresolvedCount} question${unresolvedCount !== 1 ? 's' : ''} without images. You may import again to attach missing images.`,
          }
        }

        return {
          blocking: true,
          allowImageFix: false,
          message:  `This exact questionnaire file matches an already-verified upload for "${approvedExam.title}". Please upload a different file.`,
        }
      }
    }

    return {
      blocking: false,
      allowImageFix: false,
      message:  'This exact questionnaire file was previously uploaded but is not tied to an approved exam yet. You may continue, but please verify it is the intended file.',
    }
  }

  async function attachImageToCurrentQuestion(imageUrl: string): Promise<void> {
    const trimmed = imageUrl.trim()
    if (!trimmed) { return }

    if (formMode !== 'edit' || editId === null) {
      setField('image_url', trimmed)
      return
    }

    setFormError('')
    await updateQuestionImageUrl(supabase, editId, trimmed)
    setField('image_url', trimmed)
    await fetchAll(true)
  }

  async function handleFileDrop(file: File): Promise<void> {
    setImportError('')
    setImportWarning('')
    setImportRows([])
    setImportParsing(true)
    setImportedFileName(file.name)
    setImportedFileMeta(null)

    try {
      const fingerprint = await computeFileFingerprint(file)
      const duplicateCheck = await checkDuplicateFile(fingerprint)

      if (duplicateCheck?.blocking === true) {
        setImportError(duplicateCheck.message)
        return
      }
      if (duplicateCheck !== null) {
        setImportWarning(duplicateCheck.message)
      }

      setImportedFileMeta({
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fingerprint,
      })

      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

      if (ext === 'docx' || ext === 'doc' || ext === 'pdf') {
        const body = new FormData()
        body.append('file', file)

        let res: Response
        try {
          res = await fetch('/api/admin/questionnaires/parse-questionnaire', {
            method: 'POST',
            body,
          })
        } catch {
          throw new Error('Network error — could not reach the server. Check your connection.')
        }

        let json: { rows?: ImportRow[]; error?: string }
        try {
          json = await res.json() as { rows?: ImportRow[]; error?: string }
        } catch {
          throw new Error(`Unexpected server response (HTTP ${res.status}).`)
        }

        if (!res.ok) {
          throw new Error(json.error ?? `Server error (HTTP ${res.status}).`)
        }

        let rows = json.rows ?? []
        if (rows.length === 0) {
          setImportError('No questions were detected. Check the formatting guide.')
          return
        }

        if (ext === 'docx') {
          const imageBody = new FormData()
          imageBody.append('file', file)
          imageBody.append('imagesOnly', 'true')
          try {
            const imageResponse = await fetch('/api/admin/questionnaires/parse-docx', {
              method: 'POST',
              body: imageBody,
            })
            const imageResult = await imageResponse.json() as {
              embeddedImages?: EmbeddedImageData[]
              error?: string
            }
            if (!imageResponse.ok) {
              throw new Error(imageResult.error ?? `Image extraction failed (HTTP ${imageResponse.status}).`)
            }
            const embeddedImages = imageResult.embeddedImages ?? []
            rows = attachEmbeddedImagesToRows(rows, embeddedImages)
            if (embeddedImages.length > rows.length) {
              setImportWarning((current) => [
                current,
                `${embeddedImages.length - rows.length} embedded image${embeddedImages.length - rows.length === 1 ? ' was' : 's were'} not matched to a question.`,
              ].filter(Boolean).join(' '))
            }
          } catch (imageError) {
            const message = imageError instanceof Error ? imageError.message : 'Embedded images could not be extracted.'
            setImportWarning((current) => [current, message].filter(Boolean).join(' '))
          }
        }

        setImportRows(rows)

      } else {
        const rawRows = await parseFile(file)
        if (rawRows.length === 0) {
          setImportError('The file appears empty or no question blocks were detected.')
          return
        }
        setImportRows(rawRows.map((row, idx) => validateImportRow(row, idx)))
      }

    } catch (err) {
      setImportError(`Failed to parse file: ${(err as Error).message}`)
    } finally {
      setImportParsing(false)
    }
  }

  function handleLinkChange(url: string): void {
    setLinkUrl(url)
    setImportWarning('')
    if (url.trim().length > 5) {
      setLinkSource(detectLinkSource(url.trim()))
    } else {
      setLinkSource(null)
    }
  }

  async function handleFetchLink(): Promise<void> {
    if (!linkUrl.trim() || linkSource?.valid !== true) { return }
    setLinkFetching(true)
    setImportError('')
    setImportRows([])
    try {
      const rawRows = await fetchAndParseLink(linkUrl.trim(), linkSource.source)
      if (rawRows.length === 0) {
        setImportError('No question data found at this URL.')
        return
      }
      setImportRows(rawRows.map((row, idx) => validateImportRow(row, idx)))
      setImportedFileName(linkUrl.trim())
    } catch (err) {
      setImportError(`Could not fetch from URL: ${(err as Error).message}`)
    } finally {
      setLinkFetching(false)
    }
  }

  const examsForImport = useMemo(() => {
    if (!importProgramId) { return exams }
    return exams.filter((e) => e.program_id === importProgramId)
  }, [exams, importProgramId])
  const validCount   = importRows.filter((r) =>  r._valid).length
  const invalidCount = importRows.filter((r) => !r._valid).length

  const existingDuplicateCount = useMemo(() => {
    if (!importExamId) { return 0 }
    const existingTexts = new Set(
      questions
        .filter((q) => q.exam_id === importExamId)
        .map((q) => normalizeQuestionText(q.question_text)),
    )
    return importRows
      .filter((r) => r._valid)
      .reduce((count, row) => (
        existingTexts.has(normalizeQuestionText(row.question_text)) ? count + 1 : count
      ), 0)
  }, [questions, importRows, importExamId])

  const missingImageCorrectionCount = useMemo(() => {
    if (!importExamId) { return 0 }
    const attachedNames = new Set(importImageFiles.map((file) => normalizeImageFilename(file.name)))
    const existingByText = new Map(
      questions
        .filter((q) => q.exam_id === importExamId)
        .map((q) => [normalizeQuestionText(q.question_text), q]),
    )

    return importRows
      .filter((row) => row._valid && hasAttachedImageReference(row, attachedNames))
      .reduce((count, row) => {
        const existing = existingByText.get(normalizeQuestionText(row.question_text))
        return existing && !existing.image_url ? count + 1 : count
      }, 0)
  }, [questions, importRows, importExamId, importImageFiles])

  const canImport = validCount > 0 && (existingDuplicateCount < validCount || missingImageCorrectionCount > 0)

  async function handleImportSave(): Promise<void> {
    if (!importExamId) {
      setImportError('Please select an exam to assign these questions to.')
      return
    }

    const validRows = importRows.filter((r) => r._valid)
    if (validRows.length === 0) { setImportError('No valid rows to import.'); return }
    if (existingDuplicateCount >= validRows.length && missingImageCorrectionCount === 0) {
      setImportError('This questionnaire appears to be already imported for the selected exam. Re-upload blocked to prevent duplicates.')
      return
    }

    setImportSaving(true)
    setImportError('')

    try {
      // ── ADDED — upload attached images to Supabase Storage first, so we
      // have a filename -> public URL map to resolve against each row.
      let uploadedUrlByFilename = new Map<string, string>()
      const embeddedFiles: File[] = []
      for (const row of validRows) {
        if (!row.embeddedImage) { continue }
        try {
          embeddedFiles.push(embeddedImageToFile(row.embeddedImage))
        } catch (error) {
          const message = error instanceof Error ? error.message : row.embeddedImage.fileName
          setImportWarning((current) => [current, `Embedded image failed to prepare: ${message}`].filter(Boolean).join(' '))
        }
      }
      const imagesToUpload = [...importImageFiles, ...embeddedFiles]
      if (imagesToUpload.length > 0) {
        const targetExam = exams.find((exam) => exam.id === importExamId)
        const programCode = programs.find((program) => program.id === targetExam?.program_id)?.code
        const upload = programCode
          ? await uploadImportedQuestionImages(supabase, imagesToUpload, programCode)
          : {
              results: [],
              errors: imagesToUpload.map((file) => ({ filename: file.name, error: 'Program code is unavailable.' })),
            }
        uploadedUrlByFilename = new Map(upload.results.map((r) => [normalizeImageFilename(r.filename), r.publicUrl]))
        const { errors } = upload
        if (errors.length > 0) {
          const failureWarning = `${errors.length} image${errors.length !== 1 ? 's' : ''} failed to upload and were skipped: ${errors.map((e) => `${e.filename} (${e.error})`).join(', ')}`
          setImportWarning((current) => [current, failureWarning].filter(Boolean).join(' '))
        }
      }

      const preparedRows = validRows.map((r) => {
        const isMCQ = r.question_type === 'multiple_choice'
        const opts: QuestionOption[] = []

        if (isMCQ) {
          if (r.option_a) { opts.push({ label: 'A', text: r.option_a }) }
          if (r.option_b) { opts.push({ label: 'B', text: r.option_b }) }
          if (r.option_c) { opts.push({ label: 'C', text: r.option_c }) }
          if (r.option_d) { opts.push({ label: 'D', text: r.option_d }) }
        }

        const diff: DifficultyLevel = (VALID_DIFF as readonly string[]).includes(r.difficulty)
          ? (r.difficulty as DifficultyLevel)
          : 'medium'

        // ── ADDED — resolve r.image: absolute URL passes through untouched;
        // otherwise treat it as a filename and look up its uploaded public URL.
        const rawImageRef = r.image?.trim() ?? ''
        const imageFilename = r.embeddedImage?.fileName ?? rawImageRef
        let resolvedImageUrl: string | null = null
        if (r.embeddedImage) {
          resolvedImageUrl = uploadedUrlByFilename.get(normalizeImageFilename(imageFilename)) ?? null
        } else if (rawImageRef) {
          resolvedImageUrl = isAbsoluteImageUrl(rawImageRef)
            ? rawImageRef
            : (uploadedUrlByFilename.get(normalizeImageFilename(rawImageRef)) ?? null)
        }

        const payload: QuestionInsertPayload = {
          question_text:  r.question_text,
          question_type:  r.question_type as QuestionType,
          points:         r.points,
          options:        isMCQ && opts.length > 0 ? opts : null,
          correct_answer: r.correct_answer || null,
          explanation:    encodeDifficulty(diff, r.explanation),
          exam_id:        importExamId,
          scenario:       r.scenario.trim() || null,
          image_url:      resolvedImageUrl,
          section_title:  r.section_title?.trim() ? r.section_title.trim() : null,
          section_number: typeof r.section_number === 'number' ? r.section_number : null,
        }

        return { row: r, payload, resolvedImageUrl }
      })

      const payloads = preparedRows.map((item) => item.payload)
      const importResult = await importQuestionsWithoutDuplicates(supabase, payloads)

      if (profile?.role === 'faculty') {
        const submitRes = await fetch('/api/admin/approvals/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: 'exam', entityId: importExamId }),
        })
        let submitJson: { error?: string } | null = null
        try {
          submitJson = await submitRes.json() as { error?: string }
        } catch {
          submitJson = null
        }
        if (!submitRes.ok) {
          throw new Error(submitJson?.error ?? 'Questions imported, but submission for approval failed.')
        }
      }
      if (importedFileMeta !== null) {
        const filePath = `questionnaire-fingerprint/exams/${importExamId}/${importedFileMeta.fingerprint}`

        const { data: userRes, error: userError } = await supabase.auth.getUser()
        if (userError !== null || !userRes.user) {
          throw new Error('Questions imported, but your session expired before the file fingerprint could be saved. Please refresh and try again.')
        }

        const { error: fileLogError } = await supabase
          .from('storage_files')
          .insert({
            file_name:   importedFileName || 'questionnaire-upload',
            file_path:   filePath,
            file_type:   importedFileMeta.fileType,
            file_size:   importedFileMeta.fileSize,
            file_hash:   importedFileMeta.fingerprint,
            purpose:     'exam_questions',
            uploaded_by: userRes.user.id,
          })
        if (fileLogError !== null) {
          throw new Error(`Questions imported, but file fingerprint could not be saved: ${fileLogError.message}`)
        }
      }
      setImportDone(true)
      setImportCounts({
        inserted: importResult.inserted,
        skippedDuplicates: Math.max(0, importResult.skippedDuplicates - importResult.imageCorrections),
        failedToParse: importRows.length - validRows.length,
        imageCorrections: importResult.imageCorrections,
      })
      await fetchAll(true)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImportSaving(false)
    }
  }

  return {
    questions, exams, programs,
    loading, refreshing, error,
    viewMode, selectedProgram, openProgram, backToPrograms,
    search, setSearch, examFilter, setExamFilter,
    selectedQuestionIds, selectedQuestionCount, toggleQuestionSelection,
    setSelectedQuestions, clearQuestionSelection, bulkDeleting, bulkDeleteMessage,
    deleteSelectedQuestions,
    questionsByProgram, programDetailQuestions, questionsByType, overallStats,
    showForm, formMode, form, formError, saving,
    openCreate, openEdit, closeForm, setField, setChoiceText, handleSave, attachImageToCurrentQuestion,
    examsForForm,
    deleteId, deleting, setDeleteId, handleDelete,
    viewQ, setViewQ,
    showImport, importTab, importExamId, importProgramId,
    importRows, importParsing, importError, importWarning, importSaving,
    importDone, importCounts, dragOver, importedFileName,
    linkUrl, linkSource, linkFetching,
    validCount, invalidCount, existingDuplicateCount, missingImageCorrectionCount, canImport, examsForImport,
    openImport, closeImport, setImportTab,
    setImportExamId, setImportProgramId,
    handleFileDrop, handleLinkChange, handleFetchLink, handleImportSave,
    setDragOver,
    handleRefresh,
    stripDifficultyTag,
    importImageFiles, importImageMatchWarnings, handleImageFilesSelected, removeImportImageFile,
  }
}
