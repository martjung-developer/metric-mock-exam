// src/app/terms/page.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  legalHeroPanelLeft,
  legalHeroPanelRight,
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
import styles from './terms.module.css'

import {
  CalendarDays,
  FileText,
  ShieldCheck,
  UserCheck,
  Landmark,
  CreditCard,
  AlertTriangle,
  Scale,
  LogOut,
  BookOpen,
  Mail,
  ChevronRight,
  Ban,
  Clock,
  RefreshCcw,
  ArrowRight,
  Info,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const HERO_FACTS = [
  {
    icon: <UserCheck size={16} strokeWidth={2} />,
    title: 'Age Requirement',
    sub:   'Must be 18+ to create an account',
  },
  {
    icon: <ShieldCheck size={16} strokeWidth={2} />,
    title: 'Personal Use Only',
    sub:   'Non-commercial, PRC licensure preparation',
  },
  {
    icon: <CreditCard size={16} strokeWidth={2} />,
    title: '7-Day Money-Back',
    sub:   'First-time Pro subscribers only',
  },
  {
    icon: <Landmark size={16} strokeWidth={2} />,
    title: 'Governing Law',
    sub:   'Republic of the Philippines — Pasig City courts',
  },
]

const SECTIONS = [
  { id: 'acceptance',  title: '1. Acceptance of Terms',     icon: <FileText    size={16} strokeWidth={2} /> },
  { id: 'account',     title: '2. Account Responsibilities', icon: <UserCheck   size={16} strokeWidth={2} /> },
  { id: 'use',         title: '3. Permitted Use',            icon: <BookOpen    size={16} strokeWidth={2} /> },
  { id: 'prohibited',  title: '4. Prohibited Conduct',       icon: <Ban         size={16} strokeWidth={2} /> },
  { id: 'ip',          title: '5. Intellectual Property',    icon: <ShieldCheck size={16} strokeWidth={2} /> },
  { id: 'payments',    title: '6. Payments & Refunds',       icon: <CreditCard  size={16} strokeWidth={2} /> },
  { id: 'disclaimer',  title: '7. Disclaimers',              icon: <Info        size={16} strokeWidth={2} /> },
  { id: 'liability',   title: '8. Limitation of Liability',  icon: <AlertTriangle size={16} strokeWidth={2} /> },
  { id: 'termination', title: '9. Termination',              icon: <LogOut      size={16} strokeWidth={2} /> },
  { id: 'governing',   title: '10. Governing Law',           icon: <Scale       size={16} strokeWidth={2} /> },
  { id: 'contact',     title: '11. Contact',                 icon: <Mail        size={16} strokeWidth={2} /> },
]

const PROHIBITED = [
  { text: 'Share, redistribute, or resell exam questions or answer keys.' },
  { text: 'Use automated tools, bots, or scrapers to extract platform content.' },
  { text: 'Attempt to reverse engineer or hack any part of the Platform.' },
  { text: 'Create multiple accounts to circumvent usage limits.' },
  { text: 'Post or transmit any harmful, offensive, or misleading content.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <PageShell>
      <main className={styles.page}>

        {/* ══════════════════════════════════════════════════════
            HERO — typographic dark lockup
        ══════════════════════════════════════════════════════ */}
        <section className={styles.hero}>

          <div className={styles.heroInner}>

            {/* Left: typographic lockup */}
            <motion.div {...legalHeroPanelLeft} className={styles.heroLeft}>
              <div className={styles.heroEyebrow}>
                <span className={styles.heroEyebrowLine} />
                VeriPraxis Legal
                <span className={styles.heroEyebrowLine} />
              </div>

              <h1 className={styles.heroTitle}>
                Terms of
                <span className={styles.heroTitleAccent}>Service</span>
              </h1>

              <div className={styles.heroMeta}>
                <div className={styles.heroMetaRow}>
                  <CalendarDays size={13} strokeWidth={2} className={styles.heroMetaIcon} />
                  Last updated: January 1, 2025
                </div>
                <div className={styles.heroMetaRow}>
                  <Clock size={13} strokeWidth={2} className={styles.heroMetaIcon} />
                  Effective: January 1, 2025
                </div>
              </div>
            </motion.div>

            {/* Right: ruled quick-facts list */}
            <motion.div {...legalHeroPanelRight} className={styles.heroRight}>
              <div className={styles.heroFactsLabel}>Key provisions at a glance</div>
              <div className={styles.heroFacts}>
                {HERO_FACTS.map((f) => (
                  <div key={f.title} className={styles.heroFact}>
                    <div className={styles.heroFactIconWrap}>{f.icon}</div>
                    <div className={styles.heroFactText}>
                      <div className={styles.heroFactTitle}>{f.title}</div>
                      <div className={styles.heroFactSub}>{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* Bottom rule strip */}
          <div className={styles.heroRule}>
            <span className={styles.heroRuleLabel}>Document</span>
            <span className={styles.heroRuleLine} />
            <span className={styles.heroRuleTag}>
              <FileText size={11} strokeWidth={2.2} />
              TOS-2025-01
            </span>
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════
            LAYOUT — sticky TOC + content
        ══════════════════════════════════════════════════════ */}
        <div className={styles.layout}>

          {/* TOC sidebar */}
          <motion.aside className={styles.toc} {...toc}>
            <div className={styles.tocHeader}>
              <BookOpen size={13} strokeWidth={2.2} className={styles.tocHeaderIcon} />
              Contents
            </div>
            <motion.ul className={styles.tocList} {...tocContainer}>
              {SECTIONS.map((s) => (
                <motion.li key={s.id} {...tocItem} className={styles.tocItem}>
                  <a href={`#${s.id}`} className={styles.tocLink}>
                    {s.title}
                    <ChevronRight size={13} strokeWidth={2.2} className={styles.tocLinkArrow} />
                  </a>
                </motion.li>
              ))}
            </motion.ul>

            {/* Dark bottom card */}
            <motion.div {...infoBlockReveal} className={styles.tocCard}>
              <div className={styles.tocCardIcon}>
                <Mail size={14} strokeWidth={2} />
              </div>
              <div className={styles.tocCardTitle}>Legal questions?</div>
              <div className={styles.tocCardText}>
                Our legal team is available for questions about how these Terms apply to you.
              </div>
              <a href="mailto:legal@veripraxis.ph" className={styles.tocCardLink}>
                legal@veripraxis.ph
                <ArrowRight size={12} strokeWidth={2.4} />
              </a>
            </motion.div>
          </motion.aside>

          {/* Content */}
          <motion.div className={styles.content} {...contentBody}>

            {/* Lead highlight */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className={styles.highlight}
            >
              <Info size={17} strokeWidth={2} className={styles.highlightIcon} />
              <span>
                Please read these Terms of Service carefully before using Veripraxis. By accessing or
                using our platform, you agree to be bound by these terms.
              </span>
            </motion.div>

            {/* 1. Acceptance */}
            <motion.section {...sectionCard} className={styles.section} id="acceptance">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><FileText size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 01</span>
                  <h2 className={styles.sectionTitle}>Acceptance of Terms</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                By creating an account or using any feature of Veripraxis (&quot;the Platform&quot;), you agree
                to these Terms and our Privacy Policy. If you do not agree, please do not use the Platform.
              </p>
            </motion.section>

            {/* 2. Account */}
            <motion.section {...sectionCard} className={styles.section} id="account">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><UserCheck size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 02</span>
                  <h2 className={styles.sectionTitle}>Account Responsibilities</h2>
                </div>
              </div>
              <ul className={styles.list}>
                <li>You must be at least 18 years old to create an account.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li>You must provide accurate and complete information during registration.</li>
                <li>
                  Notify us immediately at{' '}
                  <a href="mailto:support@veripraxis.ph" className={styles.email}>support@veripraxis.ph</a>
                  {' '}if you suspect unauthorized access.
                </li>
              </ul>
            </motion.section>

            {/* 3. Permitted Use */}
            <motion.section {...sectionCard} className={styles.section} id="use">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><BookOpen size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 03</span>
                  <h2 className={styles.sectionTitle}>Permitted Use</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                Veripraxis is licensed to you for personal, non-commercial use to prepare for PRC
                licensure examinations only. Any other use requires our prior written consent.
              </p>
            </motion.section>

            {/* 4. Prohibited */}
            <motion.section {...sectionCard} className={styles.section} id="prohibited">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Ban size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 04</span>
                  <h2 className={styles.sectionTitle}>Prohibited Conduct</h2>
                </div>
              </div>
              <p className={styles.paragraph}>You agree not to engage in any of the following:</p>
              <ul className={styles.prohibitedList}>
                {PROHIBITED.map((p) => (
                  <li key={p.text} className={styles.prohibitedItem}>
                    <Ban size={13} strokeWidth={2} className={styles.prohibitedItemIcon} />
                    {p.text}
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* 5. IP */}
            <motion.section {...sectionCard} className={styles.section} id="ip">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><ShieldCheck size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 05</span>
                  <h2 className={styles.sectionTitle}>Intellectual Property</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                All content on Veripraxis — including exam questions, rationales, software, design, and
                branding — is the exclusive property of Veripraxis Inc. You may not reproduce or distribute
                any content without prior written permission.
              </p>
            </motion.section>

            {/* 6. Payments */}
            <motion.section {...sectionCard} className={styles.section} id="payments">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><CreditCard size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 06</span>
                  <h2 className={styles.sectionTitle}>Payments &amp; Refunds</h2>
                </div>
              </div>
              <div className={styles.paymentsGrid}>
                <div className={styles.paymentCard}>
                  <div className={styles.paymentCardIconRow}>
                    <CreditCard size={14} strokeWidth={2} />
                    <span className={styles.paymentCardTitle}>Billing</span>
                  </div>
                  <div className={styles.paymentCardText}>
                    Pro subscriptions are billed monthly or annually in Philippine Pesos (PHP) via Paymongo.
                  </div>
                </div>
                <div className={styles.paymentCard}>
                  <div className={styles.paymentCardIconRow}>
                    <RefreshCcw size={14} strokeWidth={2} />
                    <span className={styles.paymentCardTitle}>Refunds</span>
                  </div>
                  <div className={styles.paymentCardText}>
                    7-day money-back guarantee for first-time Pro subscribers. After 7 days, non-refundable.
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 7. Disclaimer */}
            <motion.section {...sectionCard} className={styles.section} id="disclaimer">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Info size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 07</span>
                  <h2 className={styles.sectionTitle}>Disclaimers</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                Veripraxis is not affiliated with, endorsed by, or an official product of the Professional
                Regulation Commission (PRC). Passing a mock exam does not guarantee passing the actual board
                examination. The Platform is provided &quot;as is&quot; without warranties of any kind.
              </p>
            </motion.section>

            {/* 8. Liability */}
            <motion.section {...sectionCard} className={styles.section} id="liability">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><AlertTriangle size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 08</span>
                  <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                To the maximum extent permitted by Philippine law, Veripraxis Inc. shall not be liable for
                any indirect, incidental, or consequential damages arising from your use of the Platform.
                Our total aggregate liability shall not exceed the amount you paid us in the three months
                preceding the claim.
              </p>
            </motion.section>

            {/* 9. Termination */}
            <motion.section {...sectionCard} className={styles.section} id="termination">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><LogOut size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 09</span>
                  <h2 className={styles.sectionTitle}>Termination</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                We reserve the right to suspend or terminate your account at any time for violations of
                these Terms, without prior notice. You may delete your account at any time from your account
                settings. Upon termination, your right to use the Platform ceases immediately.
              </p>
            </motion.section>

            {/* 10. Governing Law */}
            <motion.section {...sectionCard} className={styles.section} id="governing">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Scale size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 10</span>
                  <h2 className={styles.sectionTitle}>Governing Law</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                These Terms are governed by the laws of the Republic of the Philippines. Any disputes
                arising from these Terms or your use of the Platform shall be subject to the exclusive
                jurisdiction of the courts of Pasig City, Metro Manila.
              </p>
            </motion.section>

            {/* 11. Contact */}
            <motion.section {...sectionCard} className={styles.section} id="contact">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrap}><Mail size={17} strokeWidth={2} /></div>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionNum}>Section 11</span>
                  <h2 className={styles.sectionTitle}>Contact</h2>
                </div>
              </div>
              <p className={styles.paragraph}>
                Questions about these Terms? Email{' '}
                <a href="mailto:legal@veripraxis.ph" className={styles.email}>legal@veripraxis.ph</a>.
              </p>
              <p className={styles.paragraph}>
                For account or support issues, visit our{' '}
                <Link href="/contact" className={styles.email}>Contact page</Link>
                {' '}or email{' '}
                <a href="mailto:support@veripraxis.ph" className={styles.email}>support@veripraxis.ph</a>.
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
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Cookie Policy',  href: '/cookies' },
                { label: 'Contact Us',     href: '/contact' },
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
