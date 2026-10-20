/**
 * app/(dashboard)/admin/programs/page.tsx
 *
 * ── Responsibilities ──────────────────────────────────────────────────────────
 *   1. Call usePrograms() — the single source of truth for all logic
 *   2. Render layout shell
 *   3. Pass typed props down to pure UI components
 *
 * ── NOT allowed here ──────────────────────────────────────────────────────────
 *   ✗  Supabase calls
 *   ✗  Filtering / mapping logic
 *   ✗  State beyond hook destructuring
 *   ✗  Inline editing logic
 */

'use client'

import { motion }            from 'framer-motion'
import { AlertTriangle }     from 'lucide-react'

import { usePrograms }          from '@/lib/hooks/admin/programs/usePrograms'
import { ProgramsHeader }       from '@/components/dashboard/admin/programs/ProgramsHeader'
import { ProgramsStatStrip }    from '@/components/dashboard/admin/programs/ProgramsStatStrip'
import { ProgramsFilterBar }    from '@/components/dashboard/admin/programs/ProgramsFilterBar'
import { ProgramGrid }          from '@/components/dashboard/admin/programs/ProgramGrid'
import { ProgramModal }         from '@/components/dashboard/admin/programs/ProgramModal'

import styles              from './programs.module.css'
import { containerVariants, cardVariants } from '@/animations/admin/programs/programs'

export default function ProgramsPage() {
  const {
    programs,
    filteredPrograms,
    stats,
    degreeTypes,
    departmentOptions,
    groupedPrograms,
    loading,
    error,
    filters,
    setSearch,
    setFilterDeg,
    setDepartment,
    selectedProgram,
    openModal,
    closeModal,
    editState,
    startEditDescription,
    setEditDesc,
    saveDescription,
    cancelEdit,
    refreshPrograms,
  } = usePrograms()

  // Resolve accent colour index for the modal from the full (unfiltered) list
  const modalColorIndex: number = selectedProgram
    ? programs.findIndex((p) => p.id === selectedProgram.id)
    : 0

  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={cardVariants}>
        <ProgramsHeader
          totalCount={programs.length}
          onRefresh={refreshPrograms}
        />
      </motion.div>

      {/* Stat strip */}
      <motion.div variants={cardVariants}>
        <ProgramsStatStrip stats={stats} />
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div className={styles.errorBanner} variants={cardVariants}>
          <AlertTriangle size={15} /> {error}
        </motion.div>
      )}

      {/* Filter bar */}
      <motion.div variants={cardVariants}>
        <ProgramsFilterBar
          filters={filters}
          degreeTypes={degreeTypes}
          departmentOptions={departmentOptions}
          resultCount={filteredPrograms.length}
          onSearchChange={setSearch}
          onDegreeChange={setFilterDeg}
          onDepartmentChange={setDepartment}
        />
      </motion.div>

      {/* Cards grid grouped by school/department */}
      {loading ? (
        <ProgramGrid
          programs={filteredPrograms}
          loading={loading}
          editState={editState}
          onView={openModal}
          onStartEdit={startEditDescription}
          onChangeDesc={setEditDesc}
          onSave={saveDescription}
          onCancel={cancelEdit}
        />
      ) : groupedPrograms.length === 0 ? (
        <ProgramGrid
          programs={filteredPrograms}
          loading={loading}
          editState={editState}
          onView={openModal}
          onStartEdit={startEditDescription}
          onChangeDesc={setEditDesc}
          onSave={saveDescription}
          onCancel={cancelEdit}
        />
      ) : (
        groupedPrograms.map((section) => (
          <motion.div
            key={section.key}
            variants={cardVariants}
            initial={false}
            animate="visible"
            className={styles.sectionWrap}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{section.label}</h2>
              <span className={styles.sectionCount}>
                {section.programs.length} program{section.programs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ProgramGrid
              programs={section.programs}
              loading={false}
              editState={editState}
              onView={openModal}
              onStartEdit={startEditDescription}
              onChangeDesc={setEditDesc}
              onSave={saveDescription}
              onCancel={cancelEdit}
            />
          </motion.div>
        ))
      )}

      {/* Detail modal */}
      <ProgramModal
        program={selectedProgram}
        colorIndex={modalColorIndex}
        editState={editState}
        onClose={closeModal}
        onStartEdit={startEditDescription}
        onChangeDesc={setEditDesc}
        onSave={saveDescription}
        onCancel={cancelEdit}
      />
    </motion.div>
  )
}
