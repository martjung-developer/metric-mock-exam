// components/dashboard/student/help/FaqAccordion.tsx
// Pure UI — renders the FAQ list with accordion behavior and skeleton/empty states.

import React from 'react'
import { FileQuestion, ChevronDown, Search } from 'lucide-react'
import type { FaqItem, FaqCategoryWithCount } from '@/lib/types/student/help/faq.types'
import styles from '@/app/(dashboard)/student/help/help.module.css'

interface FaqAccordionProps {
  faqs:           FaqItem[]
  categories:     FaqCategoryWithCount[]
  loading:        boolean
  search:         string
  activeCategory: string
  openFaqId:      string | null
  onToggle:       (id: string) => void
  onClearFilters: () => void
}

export default function FaqAccordion({
  faqs,
  categories,
  loading,
  search,
  activeCategory,
  openFaqId,
  onToggle,
  onClearFilters,
}: FaqAccordionProps) {
  const activeCatLabel =
    categories.find((c) => c.key === activeCategory)?.label ?? 'All Topics'

  const sectionTitle = search
    ? `Results for "${search}"`
    : activeCategory === 'all'
    ? 'Frequently Asked Questions'
    : `${activeCatLabel} — FAQ`

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <FileQuestion size={16} strokeWidth={2} className={styles.sectionIcon} />
        <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
        {!loading && (
          <span className={styles.faqCount}>
            {faqs.length} article{faqs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className={styles.faqList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonFaq} />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <EmptyState onClearFilters={onClearFilters} />
      ) : (
        <div className={styles.faqList}>
          {faqs.map((faq) => {
            const isOpen   = openFaqId === faq.id
            const catMeta  = categories.find((c) => c.key === faq.category)
            return (
              <div
                key={faq.id}
                className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
              >
                <button
                  className={styles.faqQ}
                  onClick={() => onToggle(faq.id)}
                >
                  <div className={styles.faqQLeft}>
                    {catMeta && (
                      <span
                        className={styles.faqCatTag}
                        style={{ background: catMeta.bg, color: catMeta.color }}
                      >
                        {catMeta.label}
                      </span>
                    )}
                    <span className={styles.faqQText}>{faq.question}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className={styles.faqA}>
                    <p className={styles.faqAText}>{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── EmptyState (local — only used inside FaqAccordion) ────────────────────────

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className={styles.emptyFaq}>
      <Search size={36} strokeWidth={1.4} color="#cbd5e1" />
      <p className={styles.emptyTitle}>No results found</p>
      <p className={styles.emptyText}>
        Try a different keyword or select another topic above.
      </p>
      <button className={styles.emptyReset} onClick={onClearFilters}>
        Clear filters
      </button>
    </div>
  )
}