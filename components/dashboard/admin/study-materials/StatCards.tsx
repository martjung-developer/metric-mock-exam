// components/dashboard/admin/study-materials/StatCards.tsx
'use client'

import { BookOpen, FileText, Video, StickyNote } from 'lucide-react'
import { motion } from 'framer-motion'
import type { StudyMaterial } from '@/lib/types/admin/study-materials/study-materials'
import styles from '@/app/(dashboard)/admin/study-materials/study-materials.module.css'
import { itemVariants } from '@/animations/admin/study-materials/study-materials'

interface Props {
  materials: StudyMaterial[]
}

export function StatCards({ materials }: Props) {
  const stats = {
    total:     materials.length,
    documents: materials.filter((m) => m.type === 'document').length,
    videos:    materials.filter((m) => m.type === 'video').length,
    notes:     materials.filter((m) => m.type === 'notes').length,
  }

  const cards = [
    {
      label: 'Total',
      value: stats.total,
      icon:  <BookOpen   size={15} color="#0d2540" />,
      bg:    'rgba(13,37,64,0.09)',
    },
    {
      label: 'Documents',
      value: stats.documents,
      icon:  <FileText   size={15} color="#1d4ed8" />,
      bg:    'rgba(59,130,246,0.10)',
    },
    {
      label: 'Videos',
      value: stats.videos,
      icon:  <Video      size={15} color="#b91c1c" />,
      bg:    'rgba(239,68,68,0.10)',
    },
    {
      label: 'Notes',
      value: stats.notes,
      icon:  <StickyNote size={15} color="#047857" />,
      bg:    'rgba(16,185,129,0.10)',
    },
  ] as const

  return (
    <motion.div className={styles.statStrip} variants={itemVariants}>
      {cards.map((c) => (
        <div className={styles.statCard} key={c.label}>
          <div className={styles.statIconWrap} style={{ background: c.bg }}>
            {c.icon}
          </div>
          <div>
            <div className={styles.statValue}>{c.value}</div>
            <div className={styles.statLabel}>{c.label}</div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}