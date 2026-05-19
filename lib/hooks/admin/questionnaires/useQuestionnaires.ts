'use client'
// lib/hooks/admin/questionnaires/useQuestionnaires.ts

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
} from '@/lib/types/admin/questionnaires/questionnaires'
import {
  fetchPrograms,
  fetchExams,
  fetchQuestions,
  insertQuestion,
  updateQuestion,
  deleteQuestion,
  bulkInsertQuestions,
} from '@/lib/services/admin/questionnaires/questionnaires.service'
import {
  stripDifficultyTag,
  encodeDifficulty,
  validateImportRow,
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
}

export type ViewMode  = 'programs' | 'program-detail'
export type ImportTab = 'file' | 'link'

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
  importSaving:            boolean
  importDone:              boolean
  importCounts:            { inserted: number; skipped: number }
  dragOver:                boolean
  importedFileName:        string
  linkUrl:                 string
  linkSource:              ReturnType<typeof detectLinkSource> | null
  linkFetching:            boolean
  validCount:              number
  invalidCount:            number
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
  const [search,          setSearch]          = useState('')

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
  const [importSaving,     setImportSaving]     = useState(false)
  const [importDone,       setImportDone]       = useState(false)
  const [importCounts,     setImportCounts]     = useState({ inserted: 0, skipped: 0 })
  const [dragOver,         setDragOver]         = useState(false)
  const [importedFileName, setImportedFileName] = useState('')
  const [linkUrl,          setLinkUrl]          = useState('')
  const [linkSource,       setLinkSource]       = useState<ReturnType<typeof detectLinkSource> | null>(null)
  const [linkFetching,     setLinkFetching]     = useState(false)

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

  useEffect(() => { void fetchAll() }, [fetchAll])
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
    if (!search.trim()) { return qs }
    const q = search.toLowerCase()
    return qs.filter((item) => item.question_text.toLowerCase().includes(q))
  }, [selectedProgram, questionsByProgram, search])

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
  }

  function backToPrograms(): void {
    setViewMode('programs')
    setSelectedProgram(null)
    setSearch('')
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
    setImportExamId('')
    setImportProgramId('')
    setImportDone(false)
    setImportCounts({ inserted: 0, skipped: 0 })
    setImportTab('file')
    setLinkUrl('')
    setLinkSource(null)
    setImportedFileName('')
  }

  function closeImport(): void {
    setShowImport(false)
    setImportRows([])
    setImportError('')
    setImportDone(false)
    setLinkUrl('')
    setLinkSource(null)
  }

  async function handleFileDrop(file: File): Promise<void> {
    setImportError('')
    setImportRows([])
    setImportParsing(true)
    setImportedFileName(file.name)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

      if (ext === 'docx' || ext === 'doc') {
        // ── DOCX / DOC: parse server-side ──────────────────────────────────
        // mammoth is CPU-heavy and runs synchronously. Running it in the browser
        // blocks the main thread for seconds on large files → "page not responding".
        // We POST the raw file to the API route which runs mammoth in Node.js.
        // The route returns already-validated ImportRow[] so no further processing
        // is needed on the client.

        const body = new FormData()
        body.append('file', file)

        let res: Response
        try {
          res = await fetch('/api/admin/questionnaires/parse-docx', {
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

        const rows = json.rows ?? []
        if (rows.length === 0) {
          setImportError('No questions were detected. Check the formatting guide.')
          return
        }

        setImportRows(rows)

      } else {
        // ── CSV / XLSX / PDF: existing local parser (unchanged) ─────────────
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

  async function handleImportSave(): Promise<void> {
    if (!importExamId) {
      setImportError('Please select an exam to assign these questions to.')
      return
    }

    const validRows = importRows.filter((r) => r._valid)
    if (validRows.length === 0) { setImportError('No valid rows to import.'); return }

    setImportSaving(true)
    setImportError('')

    try {
      const payloads: QuestionInsertPayload[] = validRows.map((r) => {
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

        return {
          question_text:  r.question_text,
          question_type:  r.question_type as QuestionType,
          points:         r.points,
          options:        isMCQ && opts.length > 0 ? opts : null,
          correct_answer: r.correct_answer || null,
          explanation:    encodeDifficulty(diff, r.explanation),
          exam_id:        importExamId,
          scenario:       r.scenario.trim() || null,
        }
      })

      await bulkInsertQuestions(supabase, payloads)
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
      setImportDone(true)
      setImportCounts({
        inserted: validRows.length,
        skipped:  importRows.length - validRows.length,
      })
      await fetchAll(true)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImportSaving(false)
    }
  }

  const validCount   = importRows.filter((r) =>  r._valid).length
  const invalidCount = importRows.filter((r) => !r._valid).length

  return {
    questions, exams, programs,
    loading, refreshing, error,
    viewMode, selectedProgram, openProgram, backToPrograms,
    search, setSearch,
    questionsByProgram, programDetailQuestions, questionsByType, overallStats,
    showForm, formMode, form, formError, saving,
    openCreate, openEdit, closeForm, setField, setChoiceText, handleSave,
    examsForForm,
    deleteId, deleting, setDeleteId, handleDelete,
    viewQ, setViewQ,
    showImport, importTab, importExamId, importProgramId,
    importRows, importParsing, importError, importSaving,
    importDone, importCounts, dragOver, importedFileName,
    linkUrl, linkSource, linkFetching,
    validCount, invalidCount, examsForImport,
    openImport, closeImport, setImportTab,
    setImportExamId, setImportProgramId,
    handleFileDrop, handleLinkChange, handleFetchLink, handleImportSave,
    setDragOver,
    handleRefresh,
    stripDifficultyTag,
  }
}
