'use client'

import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Mail, ArrowRight, Mail as MailIcon, MessageSquare, Facebook, Users, Clock, CheckCircle } from 'lucide-react'

import PageShell from '@/components/layout/PageShell'
import styles from './contact.module.css'

import {
  heroPanelLeft,
  heroPanelRight,
  heroRightContainer,
  heroRightItem,
  chipsContainer,
  chip,
  channelsCol,
  formCol,
  channelsContainer,
  channelCard,
  officeHoursReveal,
  formContainer,
  formField,
  successReveal,
} from '@/animations/contact/contactAnimations'

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUICK_CHIPS = [
  { icon: MailIcon, label: 'support@metric.ph', href: 'mailto:support@metric.ph' },
  { icon: MessageSquare, label: 'Live Chat',              href: '#chat' },
  { icon: Facebook, label: 'Facebook',               href: 'https://facebook.com/metric' },
]

const CHANNELS = [
  {
    icon:  MailIcon,
    title: 'Email Support',
    value: 'support@metric.ph',
    note:  'We reply within 24 hours',
  },
  {
    icon:  MessageSquare,
    title: 'Live Chat',
    value: 'Chat available on the platform',
    note:  'Mon–Fri, 9AM–6PM PHT',
  },
  {
    icon:  Facebook,
    title: 'Facebook Page',
    value: 'facebook.com/metric',
    note:  'DMs answered daily',
  },
  {
    icon:  Users,
    title: 'Community Forum',
    value: 'Join our reviewee Discord',
    note:  '3,500+ active members',
  },
]

const OFFICE_HOURS = [
  { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM PHT' },
  { day: 'Saturday',        time: '10:00 AM – 3:00 PM PHT' },
  { day: 'Sunday',          time: 'Closed' },
]

const TOPICS = [
  'General Inquiry',
  'Technical Support',
  'Billing / Subscription',
  'Content / Question Error',
  'Partnership',
  'Press / Media',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <PageShell>
      <main className={styles.page}>

        {/* ══════════════════════════════════════════════════════
            HERO — asymmetric split
        ══════════════════════════════════════════════════════ */}
        <section className={styles.hero}>

          {/* Left: dark photo panel */}
          <motion.div {...heroPanelLeft} className={styles.heroPhoto}>
            <Image
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1000&q=80"
              alt="Team collaborating at work"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
            <div className={styles.heroPhotoOverlay} />

            {/* Floating stat card */}
            <div className={styles.heroPhotoCard}>
              <div className={styles.heroPhotoCardEyebrow}>Average response time</div>
              <div className={styles.heroPhotoCardStat}>&lt; 4 hrs</div>
              <div className={styles.heroPhotoCardNote}>
                Our support team is on standby Monday through Saturday.
              </div>
            </div>
          </motion.div>

          {/* Right: content panel */}
          <motion.div {...heroPanelRight} className={styles.heroContent}>
            <motion.div {...heroRightContainer}>
              <motion.span {...heroRightItem} className={styles.heroBadge}>
                <MessageCircle size={11} strokeWidth={2.5} />
                Contact M.E.T.R.I.C.
              </motion.span>

              <motion.h1 {...heroRightItem} className={styles.heroTitle}>
                We&apos;re here{' '}
                <span className={styles.heroTitleAccent}>whenever</span>{' '}
                you need us.
              </motion.h1>

              <motion.p {...heroRightItem} className={styles.heroSub}>
                Whether it&apos;s a technical issue, a billing question, or just a
                suggestion — reach out and we&apos;ll get back to you as soon as possible.
              </motion.p>

              {/* Quick-contact chips */}
              <motion.div {...chipsContainer} className={styles.heroChips}>
                {QUICK_CHIPS.map((c) => (
                  <motion.a
                    key={c.label}
                    href={c.href}
                    className={styles.heroChip}
                    {...chip}
                  >
                    <c.icon size={16} strokeWidth={2} className={styles.heroChipIcon} />
                    {c.label}
                  </motion.a>
                ))}
              </motion.div>

              {/* Response indicator */}
              <motion.div {...heroRightItem} className={styles.heroResponseRow}>
                <span className={styles.heroResponseDot} />
                <span className={styles.heroResponseText}>
                  Support team is online now
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CHANNELS + FORM
        ══════════════════════════════════════════════════════ */}
        <div className={styles.main}>

          {/* Channels column */}
          <motion.section {...channelsCol} className={styles.channelsCol}>
            <span className={styles.colLabel}>Get in Touch</span>
            <h2 className={styles.colTitle}>Choose your preferred channel</h2>
            <p className={styles.colSub}>
              Multiple ways to reach us — pick the one that&apos;s most convenient for you.
            </p>

            <motion.div {...channelsContainer} className={styles.channels}>
              {CHANNELS.map((ch) => (
                <motion.div
                  key={ch.title}
                  {...channelCard}
                  className={styles.channelCard}
                >
                  <ch.icon size={24} strokeWidth={2} className={styles.channelIcon} />
                  <div className={styles.channelText}>
                    <div className={styles.channelTitle}>{ch.title}</div>
                    <div className={styles.channelValue}>{ch.value}</div>
                    <div className={styles.channelNote}>{ch.note}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div {...officeHoursReveal} className={styles.officeHours}>
              <div className={styles.officeHoursTitle}>
                <Clock size={16} strokeWidth={2} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                Office Hours
              </div>
              {OFFICE_HOURS.map((row) => (
                <div key={row.day} className={styles.officeHoursRow}>
                  <span className={styles.officeHoursDay}>{row.day}</span>
                  <span>{row.time}</span>
                </div>
              ))}
            </motion.div>
          </motion.section>

          {/* Form card */}
          <motion.section {...formCol} className={styles.formCard}>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" {...successReveal} className={styles.success}>
                  <CheckCircle size={48} strokeWidth={2} className={styles.successIcon} />
                  <h3 className={styles.formTitle}>Message sent!</h3>
                  <p className={styles.formSub}>
                    We&apos;ll get back to you within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className={styles.formTitle}>Send us a message</h2>
                  <p className={styles.formSub}>
                    Fill out the form and we&apos;ll respond promptly.
                  </p>

                  <motion.form onSubmit={handleSubmit} {...formContainer}>
                    <motion.div {...formField} className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>First Name</label>
                        <input required className={styles.formInput} placeholder="Maria" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Last Name</label>
                        <input required className={styles.formInput} placeholder="Santos" />
                      </div>
                    </motion.div>

                    <motion.div {...formField} className={styles.formGroup}>
                      <label className={styles.formLabel}>Email Address</label>
                      <input
                        type="email"
                        required
                        className={styles.formInput}
                        placeholder="maria@email.com"
                      />
                    </motion.div>

                    <motion.div {...formField} className={styles.formGroup}>
                      <label className={styles.formLabel}>Topic</label>
                      <select required className={styles.formSelect}>
                        <option value="">Select a topic…</option>
                        {TOPICS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div {...formField} className={styles.formGroup}>
                      <label className={styles.formLabel}>Message</label>
                      <textarea
                        required
                        className={styles.formTextarea}
                        placeholder="Tell us how we can help…"
                      />
                    </motion.div>

                    <motion.button
                      type="submit"
                      className={styles.submitBtn}
                      whileHover={{ y: -1, scale: 1.005 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Mail size={15} strokeWidth={2.2} />
                      Send Message
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </motion.button>

                    <p className={styles.formNote}>
                      We respect your privacy. Your information is never shared.
                    </p>
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

      </main>
    </PageShell>
  )
}