// app/(dashboard)/student/study-materials/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Thin orchestrator — no data logic, no filter logic, no Supabase calls.
// All behaviour is identical to the original; only the structure is cleaner.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useState }                    from 'react'
import { AlertTriangle, X }            from 'lucide-react'
import { useStudyMaterials }           from '@/lib/hooks/student/study-materials/useStudyMaterials'
import { StudyMaterialsHeader }        from '@/components/dashboard/student/study-materials/StudyMaterialsHeader'
import { StudyMaterialsFilters }       from '@/components/dashboard/student/study-materials/StudyMaterialsFilters'
import { StudyMaterialsGrid }          from '@/components/dashboard/student/study-materials/StudyMaterialsGrid'
import { StudyMaterialsEmpty }         from '@/components/dashboard/student/study-materials/StudyMaterialsEmpty'
import { StudyMaterialsPagination }    from '@/components/dashboard/student/study-materials/StudyMaterialsPagination'
import { PreviewModal }                from '@/components/dashboard/student/study-materials/PreviewModal'
import type { StudyMaterial }          from '@/lib/types/student/study-materials/study-materials'
import styles from './study-materials.module.css'

export default function StudyMaterialsPage() {
  const {
    loading, error, totalCount,
    filters, setSearch, setCategory, setType, clearFilters,
    categoryNames, filtered,
    setPage, totalPages, safePage, paginated, pageNums,
    refresh, toggleFav,
    recordViewed,
  } = useStudyMaterials()

  const [dismissedError, setDismissedError] = useState(false)
  const [preview,        setPreview]        = useState<StudyMaterial | null>(null)

  function openPreview(item: StudyMaterial) {
    setPreview(item)
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <StudyMaterialsHeader
        totalCount={totalCount}
        loading={loading}
        onRefresh={refresh}
      />

      {/* Error banner */}
      {error && !dismissedError && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={14} />
          {error}
          <button onClick={() => setDismissedError(true)} aria-label="Dismiss">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Filters */}
      <StudyMaterialsFilters
        filters={filters}
        categoryNames={categoryNames}
        filteredCount={filtered.length}
        loading={loading}
        onSearch={setSearch}
        onCategory={setCategory}
        onType={setType}
      />

      {/* Loading skeleton or grid */}
      {loading || paginated.length > 0 ? (
        <StudyMaterialsGrid
          items={paginated}
          loading={loading}
          onView={openPreview}
          onToggleFav={toggleFav}
        />
      ) : (
        <StudyMaterialsEmpty
          hasAnyMaterials={totalCount > 0}
          onClearFilters={clearFilters}
        />
      )}

      {/* Pagination */}
      <StudyMaterialsPagination
        safePage={safePage}
        totalPages={totalPages}
        totalCount={filtered.length}
        pageNums={pageNums}
        onPageChange={setPage}
      />

      {/* Preview modal — rendered at root level so it overlays everything */}
      {preview && (
        <PreviewModal
          item={preview}
          onClose={() => setPreview(null)}
          onViewed={recordViewed}
        />
      )}

    </div>
  )
}
