// app/(dashboard)/student/help/page.tsx
// Orchestrator only — calls hooks, composes components, contains ZERO business logic.

'use client'

import React, { useCallback } from 'react'
import { useUser }          from '@/lib/context/AuthContext'
import { useFaqs }          from '@/lib/hooks/student/help/useFaqs'
import { useSubmitTicket }  from '@/lib/hooks/student/help/useSubmitTicket'
import {
  HelpHero,
  CategoryGrid,
  FaqAccordion,
  ContactChannels,
  TicketForm,
} from '@/components/dashboard/student/help'
import styles from './help.module.css'

export default function StudentHelpPage() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { user } = useUser()

  // ── FAQ state ────────────────────────────────────────────────────────────────
  const {
    filteredFaqs,
    categoriesWithCounts,
    loading,
    search,
    activeCategory,
    openFaqId,
    setSearch,
    setActiveCategory,
    toggleFaq,
  } = useFaqs()

  // ── Ticket state ─────────────────────────────────────────────────────────────
  const {
    form,
    formErrors,
    submitting,
    notifying,
    submitSuccess,
    submitError,
    setField,
    submit,
  } = useSubmitTicket(user?.id ?? null)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // Hero search → also clears category
  const handleSearchChange = useCallback(
    (value: string) => setSearch(value),
    [setSearch],
  )

  const handleSearchClear = useCallback(
    () => setSearch(''),
    [setSearch],
  )

  // Program pill → sets search to program name, resets category to 'programs'
  const handleProgramPill = useCallback(
    (program: string) => {
      setSearch(program)
      setActiveCategory('programs')
    },
    [setSearch, setActiveCategory],
  )

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setActiveCategory('all')
  }, [setSearch, setActiveCategory])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Hero with search ── */}
      <HelpHero
        search={search}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        onProgramPillClick={handleProgramPill}
      />

      <div className={styles.body}>

        {/* ── Category filter strip ── */}
        <CategoryGrid
          categories={categoriesWithCounts}
          activeCategory={activeCategory}
          loading={loading}
          onSelect={setActiveCategory}
        />

        {/* ── FAQ accordion ── */}
        <FaqAccordion
          faqs={filteredFaqs}
          categories={categoriesWithCounts}
          loading={loading}
          search={search}
          activeCategory={activeCategory}
          openFaqId={openFaqId}
          onToggle={toggleFaq}
          onClearFilters={handleClearFilters}
        />

        {/* ── Contact channels ── */}
        <ContactChannels />

        {/* ── Support ticket form ── */}
        <TicketForm
          form={form}
          formErrors={formErrors}
          submitting={submitting}
          notifying={notifying}
          submitSuccess={submitSuccess}
          submitError={submitError}
          setField={setField}
          onSubmit={submit}
        />

      </div>
    </div>
  )
}
