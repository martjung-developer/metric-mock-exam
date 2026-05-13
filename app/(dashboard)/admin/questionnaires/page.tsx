// app/(dashboard)/admin/questionnaires/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR ONLY — this file's responsibilities:
//   1. Auth guard (redirect if not admin/faculty)
//   2. Call useQuestionnaires()
//   3. Compose layout from pure components
//   4. Render two views: programs grid ↔ program-detail
//
// ❌ No JSX business logic
// ❌ No inline modal markup  (→ ImportModal / QuestionFormModal / DeleteModal / ViewModal)
// ❌ No event handler definitions (→ useQuestionnaires hook)
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useEffect }       from 'react'
import { useRouter }       from 'next/navigation'
import {
  FileText, Plus, Search, X, Upload,
  AlertTriangle, GraduationCap, Layers,
  HelpCircle, ListChecks, CheckCircle2,
  BarChart2, ArrowLeft, RefreshCw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useUser }             from '@/lib/context/AuthContext'
import { useQuestionnaires }   from '@/lib/hooks/admin/questionnaires/useQuestionnaires'
import {
  TYPE_ORDER,
  TYPE_COLORS,
  PROGRAM_COLORS,
} from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import { pageVariants, childVariants } from '@/animations/admin/questionnaires/questionnaires'

// ── Extracted modal components ────────────────────────────────────────────────
import { ImportModal }       from '@/components/dashboard/admin/questionnaires/ImportModal'
import { QuestionFormModal } from '@/components/dashboard/admin/questionnaires/QuestionFormModal'
import { DeleteModal }       from '@/components/dashboard/admin/questionnaires/DeleteModal'
import { ViewModal }         from '@/components/dashboard/admin/questionnaires/ViewModal'

// ── Existing sub-components (already extracted in original codebase) ───────────
import { ProgramCard }         from '@/components/dashboard/admin/questionnaires/ProgramCard'
import { QuestionTypeSection } from '@/components/dashboard/admin/questionnaires/QuestionTypeSection'

import styles from './questionnaires.module.css'

// ─────────────────────────────────────────────────────────────────────────────

export default function QuestionnairesPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useUser()
  const q = useQuestionnaires()

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) {return}
    if (!user) { router.replace('/login'); return }
    if (profile?.role !== 'admin' && profile?.role !== 'faculty') {
      router.replace('/unauthorized')
    }
  }, [user, profile, authLoading, router]) 

  if (authLoading) {return null}

  // ── Shared modals (rendered in both views) ─────────────────────────────────
  const modals = (
    <>
      <ImportModal       q={q} />
      <QuestionFormModal q={q} />
      <DeleteModal       q={q} />
      <ViewModal         q={q} />
    </>
  )

  // ── PROGRAM DETAIL VIEW ────────────────────────────────────────────────────
  if (q.viewMode === 'program-detail' && q.selectedProgram) {
    const selectedProgram = q.selectedProgram
    if (!selectedProgram) { return null }
    const colorIdx       = q.programs.findIndex((p) => p.id === selectedProgram.id)
    const color          = PROGRAM_COLORS[colorIdx % PROGRAM_COLORS.length]
    const totalInProgram = q.programDetailQuestions.length

    return (
      <motion.div className={styles.page} variants={pageVariants} initial="hidden" animate="visible">

        {/* Breadcrumb */}
        <motion.div className={styles.breadcrumb} variants={childVariants}>
          <button className={styles.backBtn} onClick={q.backToPrograms}>
            <ArrowLeft size={14} /> Question Bank
          </button>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent} style={{ color: color.accent }}>
            {selectedProgram.code}
          </span>
        </motion.div>

        {/* Header */}
        <motion.div className={styles.header} variants={childVariants}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon} style={{ background: color.accent }}>
              <GraduationCap size={20} color="#fff" />
            </div>
            <div>
              <h1 className={styles.heading}>{selectedProgram.code}</h1>
              <p className={styles.headingSub}>
                {selectedProgram.name} — {totalInProgram} question{totalInProgram !== 1 ? 's' : ''} across{' '}
                {TYPE_ORDER.filter((t) => q.questionsByType[t].length > 0).length} type
                {TYPE_ORDER.filter((t) => q.questionsByType[t].length > 0).length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.btnSecondary} ${styles.refreshBtn}`}
              onClick={q.handleRefresh}
              disabled={q.refreshing}
            >
              <RefreshCw size={14} className={q.refreshing ? styles.spinning : ''} />
              {q.refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button className={styles.btnSecondary} onClick={q.openImport}>
              <Upload size={14} /> Import
            </button>
            <button className={styles.btnPrimary} onClick={q.openCreate}>
              <Plus size={15} /> Add Question
            </button>
          </div>
        </motion.div>

        {/* Type summary strip */}
        <motion.div className={styles.typeSummaryStrip} variants={childVariants}>
          {TYPE_ORDER.map((t) => {
            const count = q.questionsByType[t].length
            const c     = TYPE_COLORS[t]
            return (
              <div key={t} className={styles.typeSummaryCard} style={{ borderLeftColor: c.color }}>
                <div className={styles.typeSummaryCount} style={{ color: c.color }}>{count}</div>
                <div className={styles.typeSummaryLabel}>
                  {t.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Search */}
        <motion.div variants={childVariants} style={{ marginBottom: '1.25rem' }}>
          <div className={styles.searchWrap} style={{ maxWidth: 420 }}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder={`Search questions in ${selectedProgram.code}…`}
              value={q.search}
              onChange={(e) => q.setSearch(e.target.value)}
            />
            {q.search && (
              <button className={styles.searchClear} onClick={() => q.setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Questions by type */}
        <motion.div className={styles.typeSections} variants={childVariants}>
          {TYPE_ORDER.map((t) => (
            <QuestionTypeSection
              key={t}
              type={t}
              questions={q.questionsByType[t]}
              loading={q.loading}
              onView={q.setViewQ}
              onEdit={q.openEdit}
              onDelete={q.setDeleteId}
            />
          ))}
        </motion.div>

        {modals}
      </motion.div>
    )
  }

  // ── PROGRAMS GRID VIEW ─────────────────────────────────────────────────────
  return (
    <motion.div className={styles.page} variants={pageVariants} initial="hidden" animate="visible">

      {/* Header */}
      <motion.div className={styles.header} variants={childVariants}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><FileText size={20} color="#fff" /></div>
          <div>
            <h1 className={styles.heading}>Question Bank</h1>
            <p className={styles.headingSub}>Select a degree program to manage its questions</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.btnSecondary} ${styles.refreshBtn}`}
            onClick={q.handleRefresh}
            disabled={q.refreshing}
          >
            <RefreshCw size={14} className={q.refreshing ? styles.spinning : ''} />
            {q.refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className={styles.btnSecondary} onClick={q.openImport}>
            <Upload size={14} /> Import
          </button>
          <button className={styles.btnPrimary} onClick={q.openCreate}>
            <Plus size={15} /> Add Question
          </button>
        </div>
      </motion.div>

      {/* Stat strip */}
      <motion.div className={styles.statStrip} variants={childVariants}>
        {[
          { label: 'Total Questions', value: q.overallStats.total, icon: <HelpCircle    size={16} color="#0d2540" />, bg: 'rgba(13,37,64,0.1)'  },
          { label: 'Multiple Choice', value: q.overallStats.mcq,   icon: <ListChecks    size={16} color="#4f5ff7" />, bg: 'rgba(79,95,247,0.1)' },
          { label: 'Easy',            value: q.overallStats.easy,  icon: <CheckCircle2  size={16} color="#059669" />, bg: 'rgba(5,150,105,0.1)' },
          { label: 'Hard',            value: q.overallStats.hard,  icon: <BarChart2     size={16} color="#dc2626" />, bg: 'rgba(220,38,38,0.1)' },
        ].map((stat) => (
          <div className={styles.statCard} key={stat.label}>
            <div className={styles.statIconWrap} style={{ background: stat.bg }}>{stat.icon}</div>
            <div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {q.error && (
          <motion.div
            className={styles.errorBanner}
            variants={childVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
          >
            <AlertTriangle size={15} /> {q.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section label */}
      <motion.div variants={childVariants} className={styles.sectionLabel}>
        <Layers size={13} />
        <span>{q.programs.length} Degree Programs</span>
      </motion.div>

      {/* Programs grid */}
      <motion.div className={styles.programsGrid} variants={childVariants}>
        {q.loading ? (
          Array.from({ length: q.programs.length || 9 }).map((_, i) => (
            <div key={i} className={styles.programCardSkeleton}>
              <div className={styles.skeleton} style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 12 }} />
              <div className={styles.skeleton} style={{ width: '50%', height: 16, marginBottom: 8 }} />
              <div className={styles.skeleton} style={{ width: '80%', height: 11 }} />
            </div>
          ))
        ) : q.programs.length === 0 ? (
          <div className={styles.emptyState} style={{ gridColumn: '1/-1' }}>
            <div className={styles.emptyIcon}><GraduationCap size={22} color="#94a3b8" /></div>
            <p className={styles.emptyTitle}>No programs found</p>
            <p className={styles.emptySub}>Add programs first to organize your question bank.</p>
          </div>
        ) : (
          q.programs.map((program, idx) => (
            <ProgramCard
              key={program.id}
              program={program}
              questions={q.questionsByProgram[program.id] ?? []}
              colorScheme={PROGRAM_COLORS[idx % PROGRAM_COLORS.length]}
              onClick={() => q.openProgram(program)}
            />
          ))
        )}
      </motion.div>

      {modals}
    </motion.div>
  )
}
