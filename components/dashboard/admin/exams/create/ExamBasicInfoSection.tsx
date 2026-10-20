// components/dashboard/admin/exams/create/ExamBasicInfoSection.tsx
// Pure UI — renders the Basic Information card (title, description, category, program, exam type).
// No data fetching, no business logic.
//
// FIXED:
//  1. Program dropdown removed hardcoded text options
//  2. Now receives `programs` prop (array of { id, code, name } from DB)
//  3. option value={p.id} (UUID) — matches program_id FK column
//  4. Binds to form.program_id / errors.program_id

import React, { useState } from 'react'
import { BookOpen, FileText, Tag, AlignLeft, Layers, AlertCircle, Plus } from 'lucide-react'
import { EXAM_TYPE_META, type ExamType } from '@/lib/types/database'
import type { ExamFormData, ExamFormErrors, CategoryOption } from '@/lib/types/admin/exams/create/exam.types'
import s from '@/app/(dashboard)/admin/exams/create/create.module.css'

// ProgramOption matches what useExamCategories returns
interface ProgramOption {
  id:   string
  code: string
  name: string
}

interface ExamBasicInfoSectionProps {
  form:        ExamFormData
  errors:      ExamFormErrors
  categories:  CategoryOption[]
  programs:    ProgramOption[]        // ← NEW: from DB via useExamCategories
  catLoading:  boolean
  setField:    <K extends keyof ExamFormData>(field: K, value: ExamFormData[K]) => void
  addCategory: (name: string, programId: string) => Promise<CategoryOption>
}

export default function ExamBasicInfoSection({
  form,
  errors,
  categories,
  programs,
  catLoading,
  setField,
  addCategory,
}: ExamBasicInfoSectionProps) {
  const examTypes: ExamType[] = ['mock', 'practice']
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [categoryName, setCategoryName]       = useState('')
  const [categorySaving, setCategorySaving]   = useState(false)
  const [categoryError, setCategoryError]     = useState<string | null>(null)

  const visibleCategories = categories.filter((c) => {
    if (!form.program_id) {return c.program_id === null}
    return c.program_id === null || c.program_id === form.program_id
  })

  function handleProgramChange(programId: string) {
    const selectedCategory = categories.find((c) => c.id === form.category_id)
    setField('program_id', programId)
    if (
      selectedCategory !== undefined &&
      selectedCategory.program_id !== null &&
      selectedCategory.program_id !== programId
    ) {
      setField('category_id', '')
    }
  }

  async function handleAddCategory() {
    const trimmed = categoryName.trim()
    if (!form.program_id) {
      setCategoryError('Select a program before adding a category.')
      return
    }
    if (!trimmed) {
      setCategoryError('Enter a category name.')
      return
    }

    setCategorySaving(true)
    setCategoryError(null)
    try {
      const created = await addCategory(trimmed, form.program_id)
      setField('category_id', created.id)
      setCategoryName('')
      setShowAddCategory(false)
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Could not create category.')
    } finally {
      setCategorySaving(false)
    }
  }

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardHeaderIcon}>
          <FileText size={15} color="var(--primary)" />
        </div>
        <div>
          <h2 className={s.cardTitle}>Basic Information</h2>
          <p className={s.cardSub}>Exam title, description, and category</p>
        </div>
      </div>

      <div className={s.cardBody}>

        {/* Title */}
        <div className={s.fieldGroup}>
          <label className={s.label} htmlFor="title">
            <Tag size={12} /> Exam Title <span className={s.required}>*</span>
          </label>
          <input
            id="title"
            type="text"
            className={`${s.input} ${errors.title ? s.inputError : ''}`}
            placeholder="e.g. BSPsych Psychometrician Mock Exam – Set 1"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            maxLength={200}
          />
          {errors.title && (
            <p className={s.fieldError}>
              <AlertCircle size={11} /> {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className={s.fieldGroup}>
          <label className={s.label} htmlFor="description">
            <AlignLeft size={12} /> Description
          </label>
          <textarea
            id="description"
            className={s.textarea}
            rows={4}
            placeholder="Brief overview of the exam content and objectives…"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            maxLength={1000}
          />
          <p className={s.hint}>{form.description.length}/1000 characters</p>
        </div>

        {/* Category */}
        <div className={s.fieldGroup}>
          <label className={s.label} htmlFor="category">
            <BookOpen size={12} /> Category <span className={s.required}>*</span>
          </label>
          <div className={`${s.selectWrap} ${errors.category_id ? s.inputError : ''}`}>
            <select
              id="category"
              className={s.select}
              value={form.category_id}
              onChange={(e) => setField('category_id', e.target.value)}
              disabled={catLoading}
            >
              <option value="">
                {catLoading ? 'Loading categories…' : 'Select a category…'}
              </option>
              {visibleCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={s.inlineAddBtn}
            onClick={() => {
              setShowAddCategory((value) => !value)
              setCategoryError(null)
            }}
            disabled={!form.program_id || catLoading}
          >
            <Plus size={12} /> Add category
          </button>
          {showAddCategory && (
            <div className={s.inlineAddPanel}>
              <input
                type="text"
                className={s.input}
                placeholder="Subject or topic area"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                maxLength={120}
              />
              <button
                type="button"
                className={s.btnSecondary}
                onClick={() => { void handleAddCategory() }}
                disabled={categorySaving}
              >
                {categorySaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
          {categoryError && (
            <p className={s.fieldError}>
              <AlertCircle size={11} /> {categoryError}
            </p>
          )}
          {errors.category_id && (
            <p className={s.fieldError}>
              <AlertCircle size={11} /> {errors.category_id}
            </p>
          )}
        </div>

        {/* Program — FIXED: values are UUIDs from DB, bound to form.program_id */}
        <div className={s.fieldGroup}>
          <label className={s.label} htmlFor="program">
            <BookOpen size={12} /> Program <span className={s.required}>*</span>
          </label>
          <div className={`${s.selectWrap} ${errors.program_id ? s.inputError : ''}`}>
            <select
              id="program"
              className={s.select}
              value={form.program_id}
              onChange={(e) => handleProgramChange(e.target.value)}
              disabled={catLoading}
            >
              <option value="">
                {catLoading ? 'Loading programs…' : 'Select a program…'}
              </option>
              {programs.map((p) => (
                // value is the UUID — this is what gets written to program_id FK column
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
          {errors.program_id && (
            <p className={s.fieldError}>
              <AlertCircle size={11} /> {errors.program_id}
            </p>
          )}
        </div>

        {/* Exam Type */}
        <div className={s.fieldGroup}>
          <label className={s.label} htmlFor="examType">
            <Layers size={12} /> Exam Type <span className={s.required}>*</span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {examTypes.map((type) => {
              const isSelected = form.exam_type === type
              const meta       = EXAM_TYPE_META[type]
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setField('exam_type', type)}
                  style={{
                    padding:      '0.75rem 0.9rem',
                    border:       `1.5px solid ${isSelected ? 'var(--primary, #0d2540)' : '#e2e8f0'}`,
                    borderRadius: 10,
                    background:   isSelected ? 'rgba(13,37,64,0.05)' : '#f8fafc',
                    cursor:       'pointer',
                    textAlign:    'left',
                    transition:   'all 0.15s',
                    boxShadow:    isSelected ? '0 0 0 3px rgba(13,37,64,0.08)' : 'none',
                  }}
                >
                  <div style={{
                    fontWeight:   700,
                    fontSize:     '0.82rem',
                    color:        isSelected ? 'var(--primary, #0d2540)' : '#374151',
                    marginBottom: '0.2rem',
                  }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.4 }}>
                    {meta.description}
                  </div>
                </button>
              )
            })}
          </div>

          {errors.exam_type && (
            <p className={s.fieldError}>
              <AlertCircle size={11} /> {errors.exam_type}
            </p>
          )}

          {/* Fallback hidden select for screen readers / form semantics */}
          <select
            id="examType"
            className={s.select}
            value={form.exam_type}
            onChange={(e) => setField('exam_type', e.target.value as ExamType)}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }}
            aria-hidden="true"
            tabIndex={-1}
          >
            <option value="mock">Mock Exam</option>
            <option value="practice">Reviewer</option>
          </select>
        </div>

      </div>
    </div>
  )
}
