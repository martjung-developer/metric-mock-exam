'use client'
// components/dashboard/admin/questionnaires/ImportModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Self-contained Import Questions modal.
// All state lives in `useQuestionnaires` — this component is purely presentational.
// CHANGES FROM PREVIOUS VERSION:
//   + Second drop zone in FileTab for attaching image files referenced by a
//     CSV/XLSX `image` column (filename match, not a URL)
//   + Per-file chip list with remove buttons, and a warning banner listing
//     any referenced filenames that weren't attached
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, useRef }  from 'react'
import {
  Upload, X, FileSpreadsheet, FileText, Download,
  Link2, Globe, File, Loader2, CheckCheck,
  CheckCircle2, AlertCircle, ChevronDown, AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { downloadTemplate }    from '@/lib/utils/admin/questionnaires/questionnaires.utils'
import { TYPE_COLORS }         from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import { ParseSummary }        from './ParseSummary'
import { modalVariants }       from '@/animations/admin/questionnaires/questionnaires'
import type { QuestionType }   from '@/lib/types/database'
import type { UseQuestionnairesReturn } from '@/lib/hooks/admin/questionnaires/useQuestionnaires'
import styles                  from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

// ── File-type icon ──────────────────────────────────────────────────────────

function FileTypeIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf')                   {return <FileText       size={15} color="#dc2626" />}
  if (['docx', 'doc'].includes(ext))   {return <File           size={15} color="#2563eb" />}
  if (['xlsx', 'xls'].includes(ext))   {return <FileSpreadsheet size={15} color="#059669" />}
  return <FileText size={15} color="#4f5ff7" />
}

// ── Props ────────────────────────────────────────────────────────────────────

type Q = UseQuestionnairesReturn

interface ImportModalProps {
  q: Q
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImportModal({ q }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <AnimatePresence>
      {q.showImport && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) {q.closeImport()} }}
        >
          <motion.div
            className={styles.formModal}
            style={{ maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
            variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          >
            {/* ── Header ── */}
            <div className={styles.formModalHeader}>
              <span className={styles.formModalTitle}>
                <span className={styles.formModalTitleIcon}><Upload size={13} color="#fff" /></span>
                Import Questions
              </span>
              <button className={styles.btnIconClose} onClick={q.closeImport}><X size={14} /></button>
            </div>

            <div className={styles.form} style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {/* ── Success state ── */}
              {q.importDone ? (
                <ImportSuccess q={q} />
              ) : (
                <>
                  {/* ── Tabs ── */}
                  <div className={styles.importTabs}>
                    <button
                      className={`${styles.importTab} ${q.importTab === 'file' ? styles.importTabActive : ''}`}
                      onClick={() => q.setImportTab('file')}
                    >
                      <Upload size={13} /> Upload File
                    </button>
                    <button
                      className={`${styles.importTab} ${q.importTab === 'link' ? styles.importTabActive : ''}`}
                      onClick={() => q.setImportTab('link')}
                    >
                      <Link2 size={13} /> Import from Link
                    </button>
                  </div>

                  {/* ── File tab ── */}
                  {q.importTab === 'file' && (
                    <FileTab q={q} fileInputRef={fileInputRef} />
                  )}

                  {/* ── Link tab ── */}
                  {q.importTab === 'link' && (
                    <LinkTab q={q} />
                  )}

                  {/* ── Parsed rows preview ── */}
                  {q.importRows.length > 0 && (
                    <ParsedRowsSection q={q} />
                  )}

                  {/* ── Error ── */}
                  {q.importWarning && (
                    <p className={styles.formError} style={{ marginTop: '0.4rem', background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
                      <AlertTriangle size={13} /> {q.importWarning}
                    </p>
                  )}

                  {q.importError && (
                    <p className={styles.formError} style={{ marginTop: '0.4rem' }}>
                      <AlertTriangle size={13} /> {q.importError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Footer ── */}
            {!q.importDone && (
              <div className={styles.formModalFooter}>
                <button className={styles.btnSecondary} onClick={q.closeImport}>
                  <X size={13} /> Cancel
                </button>
                {q.importRows.length > 0 && q.validCount > 0 && (
                  <button
                    className={styles.btnPrimary}
                    onClick={() => void q.handleImportSave()}
                    disabled={q.importSaving || !q.importExamId || !q.canImport}
                  >
                    {q.importSaving
                      ? <Loader2 size={14} className={styles.spinner} />
                      : <Upload size={14} />}
                    {q.importSaving
                      ? 'Importing…'
                      : `Import ${q.validCount} Question${q.validCount !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Sub-sections ───────────────────────────────────────────────────────────────

function ImportSuccess({ q }: { q: Q }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(5,150,105,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1rem',
      }}>
        <CheckCheck size={26} color="#059669" />
      </div>
      <p style={{ fontWeight: 800, fontSize: '1rem', color: '#0d1523', marginBottom: 6 }}>
        Import Complete
      </p>
      <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
        <strong style={{ color: '#059669' }}>{q.importCounts.inserted}</strong>{' '}
        question{q.importCounts.inserted !== 1 ? 's' : ''} imported successfully
      </p>
      <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
        <strong style={{ color: '#d97706' }}>{q.importCounts.skippedDuplicates}</strong>{' '}
        question{q.importCounts.skippedDuplicates !== 1 ? 's' : ''} skipped - already exist in this bank
      </p>
      {q.importCounts.imageCorrections > 0 && (
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
          <strong style={{ color: '#2563eb' }}>{q.importCounts.imageCorrections}</strong>{' '}
          missing image{q.importCounts.imageCorrections !== 1 ? 's' : ''} attached to existing questions
        </p>
      )}
      {q.importCounts.failedToParse > 0 && (
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
          <strong style={{ color: '#dc2626' }}>{q.importCounts.failedToParse}</strong>{' '}
          question{q.importCounts.failedToParse !== 1 ? 's' : ''} failed to parse
        </p>
      )}
      <button className={styles.btnPrimary} onClick={q.closeImport} style={{ marginTop: '1.25rem' }}>
        Done
      </button>
    </div>
  )
}

function FileTab({
  q,
  fileInputRef,
}: {
  q: Q
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  // Image bundle only makes sense for CSV/XLSX (DOCX/PDF embed images differently and aren't in scope)
  const ext = q.importedFileName.split('.').pop()?.toLowerCase() ?? ''
  const showImageBundle = q.importRows.length > 0 && !['docx', 'doc', 'pdf'].includes(ext)

  return (
    <>
      {/* Template banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(79,95,247,0.06)',
        border: '1px solid rgba(79,95,247,0.15)',
        borderRadius: 10, padding: '0.6rem 0.9rem',
      }}>
        <FileSpreadsheet size={15} color="#4f5ff7" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0d1523' }}>Need a template? </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Download the CSV template to see required columns.</span>
        </div>
        <button className={styles.btnSecondary} onClick={downloadTemplate}
          style={{ fontSize: '0.74rem', padding: '0.28rem 0.65rem', flexShrink: 0 }}>
          <Download size={12} /> Template
        </button>
      </div>

      {/* DOCX hint */}
      <div className={styles.facultyHint}>
        <div className={styles.facultyHintIcon}><FileText size={13} color="#7c3aed" /></div>
        <div>
          <span className={styles.facultyHintTitle}>Any exam formats supported</span>
          <span className={styles.facultyHintDesc}>
            DOCX files with numbered questions and bold correct answers are automatically detected.
            For CSV/XLSX, put an image filename in the <code>image</code> column and attach the matching
            file below.
          </span>
        </div>
      </div>

      {/* Format pills */}
      <div className={styles.supportedFormats}>
        <span className={styles.supportedFormatsLabel}>Supported formats:</span>
        <div className={styles.formatPills}>
          {[
            { ext: 'CSV',        color: '#059669', bg: '#ecfdf5' },
            { ext: 'XLSX / XLS', color: '#059669', bg: '#ecfdf5' },
            { ext: 'DOCX / DOC', color: '#2563eb', bg: '#eff6ff' },
            { ext: 'PDF',        color: '#dc2626', bg: '#fef2f2' },
          ].map((f) => (
            <span key={f.ext} style={{
              fontSize: '0.68rem', fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
              background: f.bg, color: f.color,
            }}>{f.ext}</span>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${q.dragOver ? styles.dropZoneActive : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); q.setDragOver(true) }}
        onDragLeave={() => q.setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); q.setDragOver(false)
          const f = e.dataTransfer.files[0]
          if (f) {void q.handleFileDrop(f)}
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.docx,.doc,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {void q.handleFileDrop(f)}
            e.target.value = ''
          }}
        />

        {q.importParsing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Loader2 size={22} color="#4f5ff7" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Parsing file…</span>
          </div>
        ) : q.importedFileName && q.importRows.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <FileTypeIcon fileName={q.importedFileName} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d1523' }}>
              {q.importedFileName.length > 40
                ? `${q.importedFileName.slice(0, 40)}…`
                : q.importedFileName}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Click to replace</span>
          </div>
        ) : (
          <>
            <Upload size={22} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0d1523', marginBottom: 4 }}>
              Drag &amp; drop or click to browse
            </p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              CSV, XLSX, DOCX, PDF — max 20 MB
            </p>
          </>
        )}
      </div>

      {/* ── Image bundle (CSV/XLSX only) ── */}
      {showImageBundle && (
        <div>
          <label className={styles.formLabel} style={{ marginBottom: 5, display: 'block' }}>
            Question images (optional)
          </label>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: 6 }}>
            Attach any images referenced by the <code>image</code> column. Filenames must match exactly
            (e.g. <code>filipino-timeline.jpg</code>).
          </p>

          <div
            className={styles.dropZone}
            style={{ padding: '0.9rem', minHeight: 'auto' }}
            onClick={() => imageInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              q.handleImageFilesSelected(Array.from(e.dataTransfer.files))
            }}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                q.handleImageFilesSelected(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <ImageIcon size={16} color="#94a3b8" />
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Drag &amp; drop images here, or click to browse
              </span>
            </div>
          </div>

          {q.importImageFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {q.importImageFiles.map((file) => (
                <span key={file.name} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: '0.72rem', fontWeight: 600, color: '#0d1523',
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  borderRadius: 20, padding: '3px 6px 3px 10px',
                }}>
                  {file.name}
                  <button
                    type="button"
                    onClick={() => q.removeImportImageFile(file.name)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 16, height: 16, borderRadius: '50%', border: 'none',
                      background: '#e2e8f0', cursor: 'pointer', color: '#475569',
                    }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {q.importImageMatchWarnings.length > 0 && (
            <p className={styles.formError} style={{ marginTop: 8, background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
              <AlertTriangle size={13} />
              {q.importImageMatchWarnings.length} referenced image{q.importImageMatchWarnings.length !== 1 ? 's' : ''} not
              attached: {q.importImageMatchWarnings.join(', ')}
            </p>
          )}
        </div>
      )}
    </>
  )
}

function LinkTab({ q }: { q: Q }) {
  const SOURCES = [
    { icon: <Globe size={14} color="#ea4335" />,           label: 'Google Forms',  desc: 'Public form URL',    bg: '#fef2f2', border: '#fecaca' },
    { icon: <FileSpreadsheet size={14} color="#34a853" />,  label: 'Google Sheets', desc: 'Shared spreadsheet', bg: '#f0fdf4', border: '#bbf7d0' },
    { icon: <File size={14} color="#4285f4" />,             label: 'Google Docs',   desc: 'Shared document',    bg: '#eff6ff', border: '#bfdbfe' },
    { icon: <Link2 size={14} color="#7c3aed" />,            label: 'Custom URL',    desc: 'CSV / JSON endpoint',bg: '#f5f3ff', border: '#ddd6fe' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className={styles.linkSourceCards}>
        {SOURCES.map((src) => (
          <div key={src.label} className={styles.linkSourceCard}
            style={{ background: src.bg, borderColor: src.border }}>
            {src.icon}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0d1523' }}>{src.label}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{src.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: 9, padding: '0.55rem 0.8rem',
        fontSize: '0.75rem', color: '#92400e',
      }}>
        <strong>Note:</strong> Google Forms / Drive links must be set to{' '}
        <em>&quot;Anyone with the link → Viewer&quot;</em>.
      </div>

      <div>
        <label className={styles.formLabel} style={{ marginBottom: 5, display: 'block' }}>
          Paste your link
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Link2 size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className={styles.formInput}
              style={{ paddingLeft: '2rem' }}
              placeholder="https://docs.google.com/forms/…"
              value={q.linkUrl}
              onChange={(e) => q.handleLinkChange(e.target.value)}
            />
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => void q.handleFetchLink()}
            disabled={!q.linkSource?.valid || q.linkFetching}
            style={{ flexShrink: 0 }}
          >
            {q.linkFetching
              ? <Loader2 size={14} className={styles.spinner} />
              : <Download size={14} />}
            {q.linkFetching ? 'Fetching…' : 'Fetch'}
          </button>
        </div>
        {q.linkSource && (
          <p style={{
            fontSize: '0.72rem',
            color: q.linkSource.valid ? '#059669' : '#dc2626',
            marginTop: 5, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {q.linkSource.valid ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
            {q.linkSource.hint}
          </p>
        )}
      </div>
    </div>
  )
}

function ParsedRowsSection({ q }: { q: Q }) {
  function toRoman(num: number): string {
    const pairs: Array<[number, string]> = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ]
    let n = Math.max(1, Math.floor(num))
    let out = ''
    for (const [v, s] of pairs) {
      while (n >= v) {
        out += s
        n -= v
      }
    }
    return out
  }

  const sectionCounts = q.importRows.reduce<Record<string, number>>((acc, row) => {
    const hasSection = Boolean(row.section_title?.trim()) && typeof row.section_number === 'number'
    if (!hasSection) {return acc}
    const key = `${row.section_number}|${row.section_title?.trim()}`
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const sectionDividerIndexes = q.importRows.reduce<{ lastSectionKey: string | null; indexes: number[] }>(
    (state, row, index) => {
      const hasSection = Boolean(row.section_title?.trim()) && typeof row.section_number === 'number'
      if (!hasSection) {return state}
      const sectionKey = `${row.section_number}|${row.section_title?.trim()}`
      return {
        lastSectionKey: sectionKey,
        indexes: sectionKey !== state.lastSectionKey ? [...state.indexes, index] : state.indexes,
      }
    },
    { lastSectionKey: null, indexes: [] },
  ).indexes

  return (
    <>
      {/* Count badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: '0.76rem', fontWeight: 600, color: '#059669',
          background: 'rgba(5,150,105,0.08)', borderRadius: 20, padding: '0.2rem 0.65rem',
        }}>
          <CheckCircle2 size={12} /> {q.validCount} valid
        </span>
        {q.invalidCount > 0 && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.76rem', fontWeight: 600, color: '#dc2626',
            background: 'rgba(220,38,38,0.08)', borderRadius: 20, padding: '0.2rem 0.65rem',
          }}>
            <AlertCircle size={12} /> {q.invalidCount} issues
          </span>
        )}
        <span style={{ fontSize: '0.76rem', color: '#94a3b8', marginLeft: 'auto' }}>
          {q.importRows.length} rows detected
        </span>
      </div>

      <ParseSummary rows={q.importRows} />
      {!!q.importExamId && q.existingDuplicateCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid #fcd34d',
          background: '#fffbeb',
          color: '#92400e',
          borderRadius: 10,
          padding: '0.55rem 0.7rem',
          fontSize: '0.76rem',
          fontWeight: 600,
        }}>
          <AlertTriangle size={13} />
          {q.missingImageCorrectionCount > 0
            ? `${q.missingImageCorrectionCount} existing question${q.missingImageCorrectionCount !== 1 ? 's have' : ' has'} missing images that can be attached from this import.`
            : q.existingDuplicateCount === q.validCount
            ? 'This file matches existing questions in the selected exam. Upload is blocked to prevent questionnaire reuse.'
            : `${q.existingDuplicateCount} question${q.existingDuplicateCount !== 1 ? 's are' : ' is'} already in this exam and will be skipped.`}
        </div>
      )}

      {/* Preview table */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', maxHeight: 210, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
              {['#', 'Question', 'Type', 'Diff.', 'Pts', 'Status'].map((h) => (
                <th key={h} style={{ padding: '0.42rem 0.6rem', textAlign: 'left', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.importRows.map((row, rowIndex) => {
              const tc = TYPE_COLORS[row.question_type as QuestionType]
              const hasSection = Boolean(row.section_title?.trim()) && typeof row.section_number === 'number'
              const sectionKey = hasSection ? `${row.section_number}|${row.section_title?.trim()}` : null
              const showSectionDivider = sectionKey !== null && sectionDividerIndexes.includes(rowIndex)

              return (
                <Fragment key={`row-block-${row._rowIndex}`}>
                  {showSectionDivider && (
                    <tr key={`section-${sectionKey}`}>
                      <td colSpan={6} style={{ padding: '6px 12px' }}>
                        <div style={{
                          background: '#f0f4ff',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: '#1d2951',
                          padding: '6px 12px',
                          borderRadius: 6,
                        }}>
                          {toRoman(row.section_number ?? 1)}. {row.section_title?.trim()} - {sectionCounts[sectionKey ?? ''] ?? 0} questions
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr key={row._rowIndex} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: row._valid ? 'transparent' : 'rgba(220,38,38,0.025)',
                  }}>
                    <td style={{ padding: '0.38rem 0.6rem', color: '#94a3b8' }}>{row._rowIndex}</td>
                    <td style={{ padding: '0.38rem 0.6rem', color: '#0d1523', maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.question_text || <span style={{ color: '#dc2626', fontStyle: 'italic' }}>missing</span>}
                      </div>
                    </td>
                    <td style={{ padding: '0.38rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '0.67rem', fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                        background: tc?.bg ?? '#f1f5f9',
                        color: tc?.color ?? '#64748b',
                      }}>
                        {row.question_type === 'multiple_choice' ? 'MCQ'
                          : row.question_type === 'true_false' ? 'T/F'
                          : row.question_type || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '0.38rem 0.6rem', color: '#4a5568', textTransform: 'capitalize' }}>{row.difficulty}</td>
                    <td style={{ padding: '0.38rem 0.6rem', color: '#4a5568' }}>{row.points}</td>
                    <td style={{ padding: '0.38rem 0.6rem' }}>
                      {row._valid
                        ? <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> OK</span>
                        : <span
                            title={row._errors.join(' · ')}
                            style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}>
                            <AlertCircle size={12} />
                            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row._errors[0]}
                            </span>
                          </span>}
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Program + exam selects */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Degree Program <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div className={styles.selectWrap}>
            <select
              className={styles.formSelect}
              value={q.importProgramId}
              onChange={(e) => { q.setImportProgramId(e.target.value); q.setImportExamId('') }}
            >
              <option value="">- Select program -</option>
              {q.programs.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
            <ChevronDown size={13} className={styles.selectChevron} />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Assign to Exam <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div className={styles.selectWrap}>
            <select
              className={styles.formSelect}
              value={q.importExamId}
              onChange={(e) => q.setImportExamId(e.target.value)}
              disabled={!q.importProgramId}
            >
              <option value="">{q.importProgramId ? '- Select exam -' : '- Select program first -'}</option>
              {q.examsForImport.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.title}</option>
              ))}
            </select>
            <ChevronDown size={13} className={styles.selectChevron} />
          </div>
        </div>
      </div>
    </>
  )
}
