// src/app/cookies/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  legalHeroPanelLeft,
  legalHeroRightContainer,
  legalHeroRightItem,
  toc,
  tocContainer,
  tocItem,
  contentBody,
  sectionCard,
  infoBlockReveal,
  relatedContainer,
  relatedBtn,
} from '@/animations/legal/legalAnimations'
import PageShell from '@/components/layout/PageShell'
import styles from './cookies.module.css'

import {
  Cookie,
  ShieldCheck,
  Settings2,
  BarChart2,
  Globe,
  BookOpen,
  Mail,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  ListChecks,
  MonitorSmartphone,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'what',        title: '1. What Are Cookies?',        icon: <Cookie         size={16} strokeWidth={2} /> },
  { id: 'types',       title: '2. Types of Cookies We Use',  icon: <ListChecks     size={16} strokeWidth={2} /> },
  { id: 'third-party', title: '3. Third-Party Cookies',       icon: <Globe          size={16} strokeWidth={2} /> },
  { id: 'manage',      title: '4. Managing Cookies',          icon: <Settings2      size={16} strokeWidth={2} /> },
  { id: 'updates',     title: '5. Policy Updates',            icon: <Clock          size={16} strokeWidth={2} /> },
  { id: 'contact',     title: '6. Contact',                   icon: <Mail           size={16} strokeWidth={2} /> },
]

const COOKIE_TABLE = [
  { name: 'vp_session',    type: 'Essential',  duration: 'Session', purpose: 'Keeps you logged in during your session.'       },
  { name: 'vp_auth_token', type: 'Essential',  duration: '30 days', purpose: 'Remembers your login across sessions.'           },
  { name: 'vp_prefs',      type: 'Functional', duration: '1 year',  purpose: 'Stores your exam and display preferences.'       },
  { name: '_vp_analytics', type: 'Analytics',  duration: '2 years', purpose: 'Measures platform usage and feature adoption.'   },
  { name: '_ga',           type: 'Analytics',  duration: '2 years', purpose: 'Google Analytics session tracking (if enabled).' },
]

const TYPE_LEGEND = [
  {
    icon:  <ShieldCheck size={14} strokeWidth={2} />,
    label: 'Essential',
    text:  'Required for core functionality — login, security, session management.',
    badge: 'badgeEssential',
  },
  {
    icon:  <Settings2 size={14} strokeWidth={2} />,
    label: 'Functional',
    text:  'Remembers your preferences and personalises your experience.',
    badge: 'badgeFunctional',
  },
  {
    icon:  <BarChart2 size={14} strokeWidth={2} />,
    label: 'Analytics',
    text:  'Helps us understand how the platform is used in aggregate.',
    badge: 'badgeAnalytics',
  },
]

const BROWSERS = [
  'Google Chrome — Settings › Privacy & Security › Cookies',
  'Mozilla Firefox — Options › Privacy & Security › Cookies',
  'Safari — Preferences › Privacy › Manage Website Data',
  'Microsoft Edge — Settings › Cookies and Site Permissions',
]

const HERO_RULE_ITEMS = [
  { icon: <Cookie size={13} strokeWidth={2} />,     label: 'Cookie Policy' },
  { icon: <Clock  size={13} strokeWidth={2} />,     label: 'Updated Jan 1, 2025' },
  { icon: <ShieldCheck size={13} strokeWidth={2} />, label: 'RA 10173 Compliant' },
  { icon: <MonitorSmartphone size={13} strokeWidth={2} />, label: 'All Devices' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CookiesPage() {
  const [consent, setConsent] = useState<'all' | 'essential' | null>(null)

  return (
    <PageShell>
      <main className={styles.page}>

        {/* ══════════════════════════════════════════════════════
            HERO — centered typographic lockup + inline consent
        ══════════════════════════════════════════════════════ */}
        <section className={styles.hero}>
          <motion.div {...legalHeroPanelLeft} className={styles.heroInner}>
            <motion.div {...legalHeroRightContainer}>

              {/* Eyebrow badge */}
              <motion.div {...legalHeroRightItem} className={styles.heroBadge}>
                <Cookie size={11} strokeWidth={2.2} className={styles.heroBadgeIcon} />
                M.E.T.R.I.C. Legal
              </motion.div>

              <motion.h1 {...legalHeroRightItem} className={styles.heroTitle}>
                Cookie{' '}
                <span className={styles.heroTitleAccent}>Policy</span>
              </motion.h1>

              <motion.p {...legalHeroRightItem} className={styles.heroSub}>
                We use cookies to keep you signed in, remember your study preferences,
                and understand how our platform is used. Your consent, your choice.
              </motion.p>

              {/* Inline consent widget */}
              <motion.div {...legalHeroRightItem}>
                <AnimatePresence mode="wait">
                  {!consent ? (
                    <motion.div
                      key="widget"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28 }}
                      className={styles.consentWidget}
                    >
                      <div className={styles.consentWidgetLeft}>
                        <div className={styles.consentWidgetIconWrap}>
                          <Cookie size={16} strokeWidth={2} />
                        </div>
                        <div className={styles.consentWidgetText}>
                          <div className={styles.consentWidgetTitle}>Manage your cookie preferences</div>
                          <div className={styles.consentWidgetSub}>
                            Choose &apos;Essential Only&apos; to allow only necessary cookies, or &apos;Accept All&apos; to enable analytics and preference cookies too.
                          </div>
                        </div>
                      </div>
                      <div className={styles.consentWidgetActions}>
                        <motion.button
                          className={styles.consentEssentialBtn}
                          onClick={() => setConsent('essential')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Essential Only
                        </motion.button>
                        <motion.button
                          className={styles.consentAllBtn}
                          onClick={() => setConsent('all')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Accept All
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className={styles.consentConfirm}
                    >
                      <div className={styles.consentConfirmText}>
                        <CheckCircle2 size={15} strokeWidth={2.2} className={styles.consentConfirmIcon} />
                        Preferences saved — {consent === 'all' ? 'all cookies accepted' : 'essential cookies only'}.
                      </div>
                      <button className={styles.consentResetBtn} onClick={() => setConsent(null)}>
                        Change preferences
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

            </motion.div>
          </motion.div>

          {/* Bottom rule strip */}
          <div className={styles.heroRule}>
            {HERO_RULE_ITEMS.map((item) => (
              <div key={item.label} className={styles.heroRuleItem}>
                <span className={styles.heroRuleItemIcon}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            LAYOUT — sticky TOC + content
        ══════════════════════════════════════════════════════ */}
        <div className={styles.layout}>

          {/* TOC sidebar */}
          <motion.aside className={styles.toc} {...toc}>
            <div className={styles.tocHeader}>
              <BookOpen size={12} strokeWidth={2.2} className={styles.tocHeaderIcon} />
              Contents
            </div>
            <motion.ul className={styles.tocList} {...tocContainer}>
              {SECTIONS.map((s) => (
                <motion.li key={s.id} {...tocItem} className={styles.tocItem}>
                  <a href={`#${s.id}`} className={styles.tocLink}>
                    {s.title}
                    <ChevronRight size={12} strokeWidth={2.2} className={styles.tocLinkArrow} />
                  </a>
                </motion.li>
              ))}
            </motion.ul>

            {/* Dark bottom card */}
            <motion.div {...infoBlockReveal} className={styles.tocCard}>
              <div className={styles.tocCardIconWrap}>
                <Info size={13} strokeWidth={2} />
              </div>
              <div className={styles.tocCardTitle}>Cookie questions?</div>
              <div className={styles.tocCardText}>
                Contact our Data Privacy Officer for any questions about how cookies are used on Metric.
              </div>
              <a href="mailto:privacy@metric.ph" className={styles.tocCardLink}>
                privacy@metric.ph
                <ArrowRight size={11} strokeWidth={2.4} />
              </a>
            </motion.div>
          </motion.aside>

          {/* Content */}
          <motion.div className={styles.content} {...contentBody}>

            {/* 1. What Are Cookies */}
            <motion.section {...sectionCard} className={styles.section} id="what">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Cookie size={16} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 01</span>
                  <h2 className={styles.sectionTitle}>What Are Cookies?</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                Cookies are small text files stored on your device when you visit a website. They help the
                site remember your preferences, keep you signed in, and understand how you interact with
                the platform — without identifying you personally unless you&apos;re logged in.
              </p>
            </motion.section>

            {/* 2. Types of Cookies */}
            <motion.section {...sectionCard} className={styles.section} id="types">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><ListChecks size={16} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 02</span>
                  <h2 className={styles.sectionTitle}>Types of Cookies We Use</h2>
                </div>
              </div>

              {/* Legend cards */}
              <div className={styles.typeLegend}>
                {TYPE_LEGEND.map((t) => (
                  <div key={t.label} className={styles.legendCard}>
                    <div className={styles.legendCardIconRow}>
                      {t.icon}
                      <span className={styles.legendCardTitle}>{t.label}</span>
                    </div>
                    <div className={styles.legendCardText}>{t.text}</div>
                  </div>
                ))}
              </div>

              <p className={styles.paragraph}>Below is the full list of cookies Metric may set on your device:</p>

              {/* Cookie table */}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cookie Name</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COOKIE_TABLE.map((row) => (
                      <tr key={row.name}>
                        <td><code className={styles.code}>{row.name}</code></td>
                        <td>
                          <span className={`${styles.typeBadge} ${
                            row.type === 'Essential'  ? styles.badgeEssential  :
                            row.type === 'Functional' ? styles.badgeFunctional :
                            styles.badgeAnalytics
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td>{row.duration}</td>
                        <td>{row.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>

            {/* 3. Third-Party Cookies */}
            <motion.section {...sectionCard} className={styles.section} id="third-party">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Globe size={16} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 03</span>
                  <h2 className={styles.sectionTitle}>Third-Party Cookies</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                We may use third-party services such as Google Analytics for aggregated usage measurement.
                These services may set their own cookies subject to their own privacy policies. We do not
                use third-party advertising cookies of any kind.
              </p>
            </motion.section>

            {/* 4. Managing Cookies */}
            <motion.section {...sectionCard} className={styles.section} id="manage">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Settings2 size={16} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 04</span>
                  <h2 className={styles.sectionTitle}>Managing Cookies</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                You can manage or delete cookies at any time through your browser settings. Note that
                disabling essential cookies may prevent you from logging in or using core platform features.
                Instructions for major browsers:
              </p>
              <ul className={styles.browserList}>
                {BROWSERS.map((b) => (
                  <li key={b} className={styles.browserItem}>
                    <MonitorSmartphone size={13} strokeWidth={2} className={styles.browserItemIcon} />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* 5. Policy Updates */}
            <motion.section {...sectionCard} className={styles.section} id="updates">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Clock size={16} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 05</span>
                  <h2 className={styles.sectionTitle}>Policy Updates</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                We may update this Cookie Policy as we add new features or change how analytics are
                collected. Material changes will be communicated via a prominent in-app notice at least
                14 days before taking effect.
              </p>
            </motion.section>

            {/* 6. Contact */}
            <motion.section {...sectionCard} className={styles.section} id="contact">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Mail size={16} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 06</span>
                  <h2 className={styles.sectionTitle}>Contact</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                Questions about this Cookie Policy? Email our Data Privacy Officer at{' '}
                <a href="mailto:privacy@metric.ph" className={styles.email}>privacy@metric.ph</a>.
              </p>
              <p className={styles.paragraph}>
                For general inquiries visit our{' '}
                <Link href="/contact" className={styles.email}>Contact page</Link>
                {' '}or see our full{' '}
                <Link href="/privacy" className={styles.email}>Privacy Policy</Link>.
              </p>
            </motion.section>

          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RELATED LINKS
        ══════════════════════════════════════════════════════ */}
        <div className={styles.relatedLinks}>
          <div className={styles.relatedInner}>
            <div className={styles.relatedTitle}>Related Legal Documents</div>
            <motion.div className={styles.relatedGrid} {...relatedContainer}>
              {[
                { label: 'Privacy Policy',   href: '/privacy' },
                { label: 'Terms of Service', href: '/terms'   },
                { label: 'Contact Us',       href: '/contact' },
              ].map(({ label, href }) => (
                <motion.div key={label} {...relatedBtn}>
                  <Link href={href} className={styles.relatedBtn}>{label}</Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

      </main>
    </PageShell>
  )
}