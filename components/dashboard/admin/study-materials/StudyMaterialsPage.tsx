'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Search, X, Filter, Plus, AlertTriangle, RefreshCw,
} from 'lucide-react'
import type { StudyMaterial } from '@/lib/types/admin/study-materials/study-materials'
import type { MaterialType } from '@/lib/types/admin/study-materials/study-materials'
import { useStudyMaterials } from '@/lib/hooks/admin/study-materials/useStudyMaterials'
import { useStudyForm } from '@/lib/hooks/admin/study-materials/useStudyForm'
import { StatCards } from '@/components/dashboard/admin/study-materials/StatCards'
import { MaterialTable } from '@/components/dashboard/admin/study-materials/MaterialTable'
import { MaterialFormModal } from '@/components/dashboard/admin/study-materials/MaterialFormModal'
import { DeleteModal } from '@/components/dashboard/admin/study-materials/DeleteModal'
import { PreviewModal } from '@/components/dashboard/admin/study-materials/PreviewModal'
import styles from '@/app/(dashboard)/admin/study-materials/study-materials.module.css'
import {
  containerVariants,
  itemVariants,
  buttonVariants,
} from '@/animations/admin/study-materials/study-materials'

export function StudyMaterialsPage() {
  const {
    materials,
    programs,
    loading,
    error,
    refresh,
    clearError,
    create,
    update,
    remove,
    togglePublish,
  } = useStudyMaterials()

  const {
    form, errors, file, submitting, dragOver, uploadProgress,
    fileInputRef, editTarget, showForm,
    openCreate, openEdit, closeForm,
    patchForm, setFile, setDragOver, handleDrop,
    handleSubmit,
  } = useStudyForm()

  const [deleteTarget, setDeleteTarget] = useState<StudyMaterial | null>(null)
  const [previewItem, setPreviewItem] = useState<StudyMaterial | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [search, setSearch] = useState('')
  const [filterProg, setFilterProg] = useState('all')
  const [filterType, setFilterType] = useState<'all' | MaterialType>('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return materials.filter((m) => {
      if (filterProg !== 'all' && m.program_id !== filterProg) {
        return false
      }
      if (filterType !== 'all' && m.type !== filterType) {
        return false
      }
      if (q && !m.title.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [materials, search, filterProg, filterType])

  const handleSubmitForm = useCallback(async () => {
    await handleSubmit(create, update)
  }, [handleSubmit, create, update])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) {
      return
    }
    setDeletePending(true)
    await remove(deleteTarget.id)
    setDeletePending(false)
    setDeleteTarget(null)
  }, [deleteTarget, remove])

  const handleTogglePublish = useCallback((mat: StudyMaterial) => {
    void togglePublish(mat.id, mat.is_published)
  }, [togglePublish])

  const handleOpenEdit = useCallback((mat: StudyMaterial) => {
    setPreviewItem(null)
    openEdit(mat)
  }, [openEdit])

  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className={styles.header} variants={itemVariants}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <h1 className={styles.heading}>Study Materials</h1>
            <p className={styles.headingSub}>
              {materials.length} material{materials.length !== 1 ? 's' : ''} across{' '}
              {programs.length} program{programs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <motion.button
            className={styles.btnSecondary}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            onClick={refresh}
            aria-label="Refresh materials"
          >
            <RefreshCw size={13} /> Refresh
          </motion.button>
          <motion.button
            className={styles.btnPrimary}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            onClick={openCreate}
          >
            <Plus size={14} /> Add Material
          </motion.button>
        </div>
      </motion.div>

      <StatCards materials={materials} />

      {error && (
        <motion.div className={styles.errorBanner} variants={itemVariants}>
          <AlertTriangle size={14} /> {error}
          <button
            style={{
              marginLeft: 'auto', background: 'none',
              border: 'none', cursor: 'pointer', color: '#c53030',
            }}
            onClick={clearError}
            aria-label="Dismiss error"
          >
            <X size={13} />
          </button>
        </motion.div>
      )}

      <motion.div className={styles.filterBar} variants={itemVariants}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} aria-hidden />
          <input
            className={styles.searchInput}
            placeholder="Search materials…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search materials"
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <Filter size={12} className={styles.filterIcon} aria-hidden />
          <select
            className={styles.filterSelect}
            value={filterProg}
            onChange={(e) => setFilterProg(e.target.value)}
            aria-label="Filter by program"
          >
            <option value="all">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.code}</option>
            ))}
          </select>
        </div>

        <select
          className={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | MaterialType)}
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          <option value="document">Document</option>
          <option value="video">Video</option>
          <option value="notes">Notes</option>
        </select>

        <p className={styles.resultCount} aria-live="polite">
          <strong>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <MaterialTable
          materials={filtered}
          loading={loading}
          onPreview={setPreviewItem}
          onEdit={handleOpenEdit}
          onDelete={setDeleteTarget}
          onTogglePublish={handleTogglePublish}
        />
      </motion.div>

      <MaterialFormModal
        open={showForm}
        isEditing={editTarget !== null}
        form={form}
        errors={errors}
        file={file}
        submitting={submitting}
        uploadProgress={uploadProgress}
        dragOver={dragOver}
        programs={programs}
        existingFileUrl={editTarget?.file_url ?? null}
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        onClose={closeForm}
        onPatch={patchForm}
        onSetFile={setFile}
        onDragOver={setDragOver}
        onDrop={handleDrop}
        onSubmit={handleSubmitForm}
      />

      <DeleteModal
        target={deleteTarget}
        submitting={deletePending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <PreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onEdit={handleOpenEdit}
      />
    </motion.div>
  )
}
