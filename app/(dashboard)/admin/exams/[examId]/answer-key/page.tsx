// app/(dashboard)/admin/exams/[examId]/answer-key/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Layout + wiring only.
// All state lives in useAnswerKey. All UI logic in components.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import Link                from 'next/link'
import { useParams }       from 'next/navigation'
import {
  AlertCircle, Loader2, Save, Search, X,
  Zap, Pencil,
} from 'lucide-react'
import { useAnswerKey }    from '@/lib/hooks/admin/exams/answer-key/useAnswerKey'
import { GROUP_ORDER }     from '@/lib/types/admin/exams/answer-key/answerKey.types'
import {
  Toast,
  RubricModal,
  AnswerKeyHeader,
  CoverageBar,
  AnswerKeyGroup,
} from '@/components/dashboard/admin/exams/answer-key'
import s from './answer-key.module.css'

export default function AnswerKeyPage() {
  const { examId } = useParams<{ examId: string }>()

  const {
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
  } = useAnswerKey(examId)

  return (
    <div className={s.page}>
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <AnswerKeyHeader
        examId={examId}
        examMeta={examMeta}
        totalDefined={totalDefined}
        totalQuestions={totalQuestions}
        dirty={dirty}
        saving={saving}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        onSave={handleSaveAll}
        onReset={handleReset}
      />

      {/* Error banner */}
      {error && (
        <div className={s.errorBanner}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Coverage bar */}
      {!loading && totalQuestions > 0 && (
        <CoverageBar
          totalDefined={totalDefined}
          totalQuestions={totalQuestions}
          coveragePercent={coveragePercent}
        />
      )}

      {/* Legend */}
      <div className={s.legend}>
        <div className={s.legendItem}>
          <span className={s.legendDotAuto} />
          <span>Auto-graded (MCQ, T/F, Fill Blank)</span>
          <Zap size={11} className={s.legendIcon} />
        </div>
        <div className={s.legendItem}>
          <span className={s.legendDotManual} />
          <span>Manual / AI-assisted (Essay, Short Answer, Matching)</span>
          <Pencil size={11} className={s.legendIcon} />
        </div>
        {dirty && (
          <div className={s.legendDirty}>
            <span className={s.legendDotDirty} />
            Unsaved changes
          </div>
        )}
      </div>

      {/* Search */}
      <div className={s.searchBar}>
        <Search size={14} className={s.searchIcon} />
        <input
          className={s.searchInput}
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className={s.searchClear} onClick={() => setSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className={s.loadingState}>
          <Loader2 size={22} className={s.spinner} />
          <p>Loading questions…</p>
        </div>
      ) : totalQuestions === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon} />
          <p className={s.emptyTitle}>No questions found</p>
          <p className={s.emptySub}>
            Add questions to this exam first from the{' '}
            <Link href={`/admin/exams/${examId}/questions`} className={s.emptyLink}>
              Questions
            </Link>{' '}
            page.
          </p>
        </div>
      ) : (
        <div className={s.groups}>
          {GROUP_ORDER.map((type) => {
            const typeEntries = grouped[type]
            if (!typeEntries?.length) {return null}
            return (
              <AnswerKeyGroup
                key={type}
                type={type}
                entries={typeEntries}
                isExpanded={expandedTypes.has(type)}
                previewMode={previewMode}
                onToggle={toggleExpand}
                onSetOverride={setOverride}
                onOpenRubric={setRubricTarget}
              />
            )
          })}
        </div>
      )}

      {/* Sticky save bar */}
      {dirty && !loading && (
        <div className={s.stickyBar}>
          <span className={s.stickyBarMsg}>
            <AlertCircle size={13} /> You have unsaved changes
          </span>
          <div className={s.stickyBarActions}>
            <button className={s.btnSecondarySmall} onClick={handleReset} disabled={saving}>
              Discard
            </button>
            <button className={s.btnPrimarySmall} onClick={handleSaveAll} disabled={saving}>
              {saving
                ? <><Loader2 size={12} className={s.spinner} /> Saving…</>
                : <><Save size={12} /> Save Now</>}
            </button>
          </div>
        </div>
      )}

      {/* Rubric modal */}
      {rubricTarget && (
        <RubricModal
          entry={rubricTarget}
          onSave={saveRubric}
          onClose={() => setRubricTarget(null)}
        />
      )}
    </div>
  )
}