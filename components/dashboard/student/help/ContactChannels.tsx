// components/dashboard/student/help/ContactChannels.tsx
// Pure UI — renders the three contact channel cards.

import React from 'react'
import { Mail, Phone, MessageSquare, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import styles from '@/app/(dashboard)/student/help/help.module.css'

interface ContactChannel {
  icon:   LucideIcon
  color:  string
  bg:     string
  title:  string
  desc:   string
  action: string
  href:   string
}

const CONTACT_CHANNELS: ContactChannel[] = [
  {
    icon:   Mail,
    color:  '#1e3a5f',
    bg:     '#dce8f5',
    title:  'Email Support',
    desc:   'For exam issues, score disputes, or account problems. Response within 1–2 business days.',
    action: 'examsupport@metric.edu.ph',
    href:   'mailto:examsupport@metric.edu.ph',
  },
  {
    icon:   MessageSquare,
    color:  '#059669',
    bg:     '#d1fae5',
    title:  'Live Chat',
    desc:   'Chat with a coordinator during office hours. Best for urgent exam session issues.',
    action: 'Start a chat',
    href:   '#chat',
  },
  {
    icon:   Phone,
    color:  '#d97706',
    bg:     '#fef3c7',
    title:  'Program Coordinator',
    desc:   'Mon–Fri, 8 AM – 5 PM. Call for degree program concerns or assignment issues.',
    action: '(034) 123-4567',
    href:   'tel:+63341234567',
  },
]

export default function ContactChannels() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <MessageSquare size={16} strokeWidth={2} className={styles.sectionIcon} />
        <h2 className={styles.sectionTitle}>Contact Support</h2>
      </div>

      <div className={styles.contactGrid}>
        {CONTACT_CHANNELS.map((ch) => {
          const Icon = ch.icon
          return (
            <a key={ch.title} href={ch.href} className={styles.contactCard}>
              <div className={styles.contactIcon} style={{ background: ch.bg }}>
                <Icon size={20} color={ch.color} strokeWidth={2} />
              </div>
              <div className={styles.contactBody}>
                <p className={styles.contactTitle}>{ch.title}</p>
                <p className={styles.contactDesc}>{ch.desc}</p>
                <span className={styles.contactAction}>
                  {ch.action}
                  <ChevronRight size={13} strokeWidth={2.5} />
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}