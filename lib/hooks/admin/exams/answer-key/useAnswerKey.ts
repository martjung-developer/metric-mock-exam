// lib/hooks/admin/exams/answer-key/useAnswerKey.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central state hook for the Answer Key editor.
//
// Responsibilities:
//  - Owns all mutable state (entries, meta, UI flags)
//  - Derives dirty state via snapshot comparison (no fragile boolean hacks)
//  - Implements debounced autosave
//  - Warns before unload when unsaved changes exist
//  - Calls ONLY the service layer — no direct Supabase calls
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createClient }                     from '@/lib/supabase/client'
import * as AnswerKeyService                from '@/lib/services/admin/exams/answer-key/answerKey.service'
import {
  effectiveAnswer,
  isEntryDirty,
  type AnswerKeyEntry,
  type ExamMeta,
  type QuestionType,
  type SavePayload,
  type ToastState,
} from '@/lib/types/admin/exams/answer-key/answerKey.types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseAnswerKeyReturn {
  // Data
  entries:     AnswerKeyEntry[]
  examMeta:    ExamMeta | null
  // UI
  loading:     boolean
  saving:      boolean
  error:       string | null
  toast:       ToastState
  search:      string
  expandedTypes: Set<QuestionType>
  previewMode: boolean
  rubricTarget: AnswerKeyEntry | null
  dirty:       boolean
  // Derived
  filtered:    AnswerKeyEntry[]
  grouped:     Partial<Record<QuestionType, AnswerKeyEntry[]>>
  totalDefined:    number
  totalQuestions:  number
  coveragePercent: number
  // Actions
  setSearch:        (v: string)             => void
  setPreviewMode:   (v: boolean)            => void
  setRubricTarget:  (e: AnswerKeyEntry | null) => void
  setToast:         (t: ToastState)         => void
  toggleExpand:     (type: QuestionType)    => void
  setOverride:      (questionId: string, value: string | null) => void
  saveRubric:       (questionId: string, rubric: string)       => void
  handleSaveAll:    () => Promise<void>
  handleReset:      () => void
  refetch:          () => Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

const AUTOSAVE_DELAY_MS = 3000

export function useAnswerKey(examId: string): UseAnswerKeyReturn {
  const supabase = useMemo(() => createClient(), [])

  // ── Core state ──────────────────────────────────────────────────────────────
  const [entries,       setEntries]       = useState<AnswerKeyEntry[]>([])
  const [examMeta,      setExamMeta]      = useState<ExamMeta | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [toast,         setToast]         = useState<ToastState>(null)
  const [search,        setSearch]        = useState('')
  const [expandedTypes, setExpandedTypes] = useState<Set<QuestionType>>(
    new Set<QuestionType>(['multiple_choice', 'true_false', 'fill_blank']),
  )
  const [previewMode,   setPreviewMode]   = useState(false)
  const [rubricTarget,  setRubricTarget]  = useState<AnswerKeyEntry | null>(null)

  // ── Refs ────────────────────────────────────────────────────────────────────
  const mountedRef      = useRef(true)
  const autosaveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Derived: dirty ──────────────────────────────────────────────────────────
  const dirty = useMemo(() => entries.some(isEntryDirty), [entries])

  // ── Derived: filtered + grouped ─────────────────────────────────────────────
  const filtered = useMemo<AnswerKeyEntry[]>(() => {
    if (!search.trim()) {return entries}
    const q = search.toLowerCase()
    return entries.filter(
      (e) =>
        e.question_text.toLowerCase().includes(q) ||
        effectiveAnswer(e).toLowerCase().includes(q),
    )
  }, [entries, search])

  const grouped = useMemo<Partial<Record<QuestionType, AnswerKeyEntry[]>>>(() => {
    const map: Partial<Record<QuestionType, AnswerKeyEntry[]>> = {}
    for (const e of filtered) {
      const bucket = map[e.question_type]
      if (bucket) {
        bucket.push(e)
      } else {
        map[e.question_type] = [e]
      }
    }
    return map
  }, [filtered])

  // ── Derived: coverage ───────────────────────────────────────────────────────
  const totalQuestions  = entries.length
  const totalDefined    = useMemo(
    () => entries.filter((e) => !!effectiveAnswer(e)).length,
    [entries],
  )
  const coveragePercent = totalQuestions > 0
    ? Math.round((totalDefined / totalQuestions) * 100)
    : 0

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!mountedRef.current) {return}
    setLoading(true)
    setError(null)

    const [metaResult, entriesResult] = await Promise.all([
      AnswerKeyService.fetchExamMeta(supabase, examId),
      AnswerKeyService.fetchAnswerKeyEntries(supabase, examId),
    ])

    if (!mountedRef.current) {return}

    if (metaResult.data)    {setExamMeta(metaResult.data)}
    if (entriesResult.error) {setError(entriesResult.error)}
    setEntries(entriesResult.data ?? [])
    setLoading(false)
  }, [supabase, examId])

  useEffect(() => {
    mountedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch()
    return () => {
      mountedRef.current = false
      if (autosaveTimer.current) {clearTimeout(autosaveTimer.current)}
    }
  }, [refetch])

  // ── Warn on unload when dirty ───────────────────────────────────────────────
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) {return}
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const setOverride = useCallback((questionId: string, value: string | null) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.question_id === questionId ? { ...e, override: value } : e,
      ),
    )
  }, [])

  const saveRubric = useCallback((questionId: string, rubric: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.question_id === questionId
          ? { ...e, explanation: rubric || null }
          : e,
      ),
    )
  }, [])

  const toggleExpand = useCallback((type: QuestionType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  // ── Save all ────────────────────────────────────────────────────────────────
  const handleSaveAll = useCallback(async () => {
    const dirtyEntries = entries.filter(isEntryDirty)
    if (!dirtyEntries.length) {return}

    setSaving(true)

    const payloads: SavePayload[] = dirtyEntries.map((e) => ({
      question_id:    e.question_id,
      correct_answer: e.override !== null ? (e.override || null) : e.correct_answer,
      explanation:    e.explanation,
    }))

    const result = await AnswerKeyService.saveAnswerKeyEntries(supabase, payloads)
    setSaving(false)

    if (result.error) {
      setToast({ message: result.error, type: 'error' })
      return
    }

    // Merge overrides into correct_answer, advance snapshots, clear overrides
    setEntries((prev) =>
      prev.map((e) => {
        if (!isEntryDirty(e)) {return e}
        const savedAnswer = e.override !== null
          ? (e.override || null)
          : e.correct_answer
        return {
          ...e,
          correct_answer:        savedAnswer,
          override:              null,
          originalCorrectAnswer: savedAnswer,
          originalExplanation:   e.explanation,
        }
      }),
    )

    setToast({ message: 'Answer key saved successfully.', type: 'success' })
  }, [entries, supabase])

  // ── Autosave (debounced) ────────────────────────────────────────────────────
  useEffect(() => {
    if (!dirty) {return}
    if (autosaveTimer.current) {clearTimeout(autosaveTimer.current)}
    autosaveTimer.current = setTimeout(() => {
      void handleSaveAll()
    }, AUTOSAVE_DELAY_MS)
    return () => {
      if (autosaveTimer.current) {clearTimeout(autosaveTimer.current)}
    }
  }, [dirty, entries, handleSaveAll])

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        override:    null,
        explanation: e.originalExplanation,
      })),
    )
    setToast({ message: 'Unsaved overrides discarded.', type: 'success' })
  }, [])

  return {
    entries,
    examMeta,
    loading,
    saving,
    error,
    toast,
    search,
    expandedTypes,
    previewMode,
    rubricTarget,
    dirty,
    filtered,
    grouped,
    totalDefined,
    totalQuestions,
    coveragePercent,
    setSearch,
    setPreviewMode,
    setRubricTarget,
    setToast,
    toggleExpand,
    setOverride,
    saveRubric,
    handleSaveAll,
    handleReset,
    refetch,
  }
}
