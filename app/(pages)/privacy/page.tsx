// src/app/privacy/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  Calendar,
  Globe,
  Lock,
  Share2,
  Eye,
  Edit,
  Trash2,
  XCircle,
  Package,
  Scale,
  FileText,
  Cookie,
  Mail,
} from 'lucide-react'
import {
  legalHeroPanelLeft,
  legalHeroPanelRight,
  legalHeroRightContainer,
  legalHeroRightItem,
  legalChipsContainer,
  legalChip,
  toc,
  tocContainer,
  tocItem,
  contentBody,
  contentSection,
  sectionCard,
  infoBlockReveal,
  relatedContainer,
  relatedBtn,
} from '@/animations/legal/legalAnimations'
import PageShell from '@/components/layout/PageShell'
import styles from './privacy.module.css'

// ─── Data ────────────────────────────────────────────────────────────────────

const HERO_CHIPS = [
  { icon: Calendar, label: 'Effective Jan 1, 2025' },
  { icon: Globe, label: 'Philippines – NPC Compliant' },
  { icon: Lock, label: 'TLS + bcrypt encrypted' },
  { icon: Share2, label: 'Never sold to third parties' },
]

const HERO_STATS = [
  { num: '0',    label: 'Data sold to third parties' },
  { num: '256b', label: 'AES encryption at rest' },
  { num: '24h',  label: 'Max breach notification' },
]

const SECTIONS = [
  { id: 'information', title: '1. Information We Collect' },
  { id: 'use',         title: '2. How We Use Your Information' },
  { id: 'sharing',     title: '3. Information Sharing' },
  { id: 'cookies',     title: '4. Cookies & Tracking' },
  { id: 'security',    title: '5. Data Security' },
  { id: 'rights',      title: '6. Your Rights' },
  { id: 'children',    title: "7. Children's Privacy" },
  { id: 'changes',     title: '8. Changes to This Policy' },
  { id: 'contact',     title: '9. Contact Us' },
]

const YOUR_RIGHTS = [
  { icon: Eye, title: 'Access',  text: 'See what data we hold about you at any time.' },
  { icon: Edit, title: 'Correct', text: 'Fix inaccurate or outdated information.' },
  { icon: Trash2, title: 'Delete',  text: 'Remove your account and all associated data.' },
  { icon: XCircle, title: 'Opt Out', text: 'Unsubscribe from marketing emails instantly.' },
  { icon: Package, title: 'Export',  text: 'Download your exam history and analytics.' },
  { icon: Scale, title: 'Object',  text: 'Dispute how your data is processed or used.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  return (
    <PageShell>
      <main className={styles.page}>

        {/* ══════════════════════════════════════════════════════
            HERO — asymmetric split
        ══════════════════════════════════════════════════════ */}
        <section className={styles.hero}>

          {/* Left: teal photo panel */}
          <motion.div {...legalHeroPanelLeft} className={styles.heroPhoto}>
            <Image
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80"
              alt="Secure data center servers"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
            <div className={styles.heroPhotoOverlay} />
            <div className={styles.heroPhotoLines} />

            {/* Floating glass stat card */}
            <div className={styles.heroPhotoCard}>
              <div className={styles.heroPhotoCardEyebrow}>At a glance</div>
              <div className={styles.heroPhotoStats}>
                {HERO_STATS.map((s, i) => (
                  <div key={s.label} className={styles.heroPhotoStat}>
                    {i > 0 && <div className={styles.heroPhotoStatDivider} />}
                    <div className={styles.heroPhotoStatNum}>{s.num}</div>
                    <div className={styles.heroPhotoStatLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: content panel */}
          <motion.div {...legalHeroPanelRight} className={styles.heroContent}>
            <motion.div {...legalHeroRightContainer}>

              <motion.span {...legalHeroRightItem} className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} />
                Privacy Policy
              </motion.span>

              <motion.h1 {...legalHeroRightItem} className={styles.heroTitle}>
                Your data,{' '}
                <span className={styles.heroTitleAccent}>your rights</span>,
                our responsibility.
              </motion.h1>

              <motion.p {...legalHeroRightItem} className={styles.heroSub}>
                We collect only what&apos;s necessary to power your review experience.
                Your information is never sold, and you remain in full control.
              </motion.p>

              {/* Stat chips */}
              <motion.div {...legalChipsContainer} className={styles.heroChips}>
                {HERO_CHIPS.map((c) => (
                  <motion.span key={c.label} {...legalChip} className={styles.heroChip}>
                    <c.icon className={styles.heroChipIcon} size={18} />
                    {c.label}
                  </motion.span>
                ))}
              </motion.div>

              {/* NPC compliance badge */}
              <motion.div {...legalHeroRightItem} className={styles.heroComplianceRow}>
                <Scale size={18} className={styles.heroComplianceIcon} />
                <span className={styles.heroComplianceText}>
                  Compliant with RA 10173 — Data Privacy Act of 2012
                </span>
              </motion.div>

            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            LAYOUT — sticky TOC + section cards
        ══════════════════════════════════════════════════════ */}
        <div className={styles.layout}>

          {/* TOC sidebar */}
          <motion.aside className={styles.toc} {...toc}>
            <div className={styles.tocHeader}>Contents</div>
            <motion.ul className={styles.tocList} {...tocContainer}>
              {SECTIONS.map((s) => (
                <motion.li key={s.id} {...tocItem} className={styles.tocItem}>
                  <a href={`#${s.id}`} className={styles.tocLink}>{s.title}</a>
                </motion.li>
              ))}
            </motion.ul>

            {/* Dark info card */}
            <motion.div {...infoBlockReveal} className={styles.tocInfoCard}>
              <div className={styles.tocInfoCardTitle}>
                <Lock size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                Questions about your data?
              </div>
              <div className={styles.tocInfoCardText}>
                Our Data Privacy Officer is available to address any concerns about how your information is handled.
              </div>
              <a href="mailto:privacy@veripraxis.ph" className={styles.tocInfoCardLink}>
                privacy@veripraxis.ph
                <ChevronRight size={13} strokeWidth={2.4} />
              </a>
            </motion.div>
          </motion.aside>

          {/* Content */}
          <motion.div className={styles.content} {...contentBody}>

            {/* Lead highlight */}
            <motion.div {...contentSection} className={styles.highlight}>
              Veripraxis collects only what&apos;s necessary to provide and improve your review experience.
              We do <strong>not</strong> sell your personal data to third parties — ever.
            </motion.div>

            {/* 1. Information We Collect */}
            <motion.section {...sectionCard} className={styles.section} id="information">
              <span className={styles.sectionNum}>Section 01</span>
              <h2 className={styles.sectionTitle}>Information We Collect</h2>
              <p className={styles.paragraph}>When you register and use Veripraxis, we may collect the following types of information:</p>
              <ul className={styles.list}>
                <li><strong>Account data</strong>: Your name, email address, and password (bcrypt-hashed — we never see the plaintext).</li>
                <li><strong>Profile data</strong>: Exam program, educational background, and study goals you voluntarily provide.</li>
                <li><strong>Usage data</strong>: Exam scores, question responses, time spent per item, and feature interactions.</li>
                <li><strong>Device data</strong>: Browser type, operating system, IP address, and device identifiers.</li>
                <li><strong>Payment data</strong>: Processed securely via Paymongo under PCI-DSS standards; we do not store card numbers.</li>
              </ul>
            </motion.section>

            {/* 2. How We Use */}
            <motion.section {...sectionCard} className={styles.section} id="use">
              <span className={styles.sectionNum}>Section 02</span>
              <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
              <p className={styles.paragraph}>Your data powers a better, more personalized review experience:</p>
              <ul className={styles.list}>
                <li>Provide and maintain your account and real-time exam sessions.</li>
                <li>Personalize your study experience and analytics dashboard.</li>
                <li>Send transactional emails — receipts, password resets, exam reminders.</li>
                <li>Send optional marketing emails. You can unsubscribe at any time, one click.</li>
                <li>Improve our question bank, features, and overall platform quality.</li>
                <li>Comply with legal obligations under RA 10173 and prevent fraudulent activity.</li>
              </ul>
            </motion.section>

            {/* 3. Sharing */}
            <motion.section {...sectionCard} className={styles.section} id="sharing">
              <span className={styles.sectionNum}>Section 03</span>
              <h2 className={styles.sectionTitle}>Information Sharing</h2>
              <p className={styles.paragraph}>We do <strong>not</strong> sell, trade, or rent your personal information. Sharing is limited to three narrow circumstances:</p>
              <ul className={styles.list}>
                <li><strong>Service providers</strong>: Payment processors, email delivery, and cloud hosting — under strict data processing agreements.</li>
                <li><strong>Legal requirements</strong>: If compelled by Philippine law or a valid legal process from a competent authority.</li>
                <li><strong>Business transfers</strong>: In the event of a merger or acquisition, your data may transfer with appropriate advance notice.</li>
              </ul>
            </motion.section>

            {/* 4. Cookies */}
            <motion.section {...sectionCard} className={styles.section} id="cookies">
              <span className={styles.sectionNum}>Section 04</span>
              <h2 className={styles.sectionTitle}>Cookies &amp; Tracking</h2>
              <p className={styles.paragraph}>
                We use cookies and similar technologies to keep you logged in, remember your preferences, and understand how the platform is used in aggregate.
                We do not use third-party advertising trackers.
                See our{' '}
                <Link href="/cookies" className={styles.email}>Cookie Policy</Link>
                {' '}for the full list of cookies and how to manage or disable them.
              </p>
            </motion.section>

            {/* 5. Security */}
            <motion.section {...sectionCard} className={styles.section} id="security">
              <span className={styles.sectionNum}>Section 05</span>
              <h2 className={styles.sectionTitle}>Data Security</h2>
              <p className={styles.paragraph}>
                We implement layered, industry-standard security: TLS 1.3 in transit, AES-256 at rest,
                bcrypt password hashing, role-based access controls, and regular third-party audits.
                If you believe your account has been compromised, contact us immediately at{' '}
                <a href="mailto:security@veripraxis.ph" className={styles.email}>security@veripraxis.ph</a>.
              </p>
            </motion.section>

            {/* 6. Your Rights — card grid */}
            <motion.section {...sectionCard} className={styles.section} id="rights">
              <span className={styles.sectionNum}>Section 06</span>
              <h2 className={styles.sectionTitle}>Your Rights</h2>
              <p className={styles.paragraph}>Under the Data Privacy Act of 2012, you have the following rights as a data subject:</p>
              <div className={styles.rightsGrid}>
                {YOUR_RIGHTS.map((r) => (
                  <div key={r.title} className={styles.rightCard}>
                    <r.icon className={styles.rightCardIcon} size={24} />
                    <div className={styles.rightCardTitle}>{r.title}</div>
                    <div className={styles.rightCardText}>{r.text}</div>
                  </div>
                ))}
              </div>
              <p className={styles.paragraph} style={{ marginTop: '1rem' }}>
                To exercise any of these rights, email{' '}
                <a href="mailto:privacy@veripraxis.ph" className={styles.email}>privacy@veripraxis.ph</a>.
                We will respond within 15 business days.
              </p>
            </motion.section>

            {/* 7. Children */}
            <motion.section {...sectionCard} className={styles.section} id="children">
              <span className={styles.sectionNum}>Section 07</span>
              <h2 className={styles.sectionTitle}>Children&apos;s Privacy</h2>
              <p className={styles.paragraph}>
                Veripraxis is intended for users 18 years of age and older, consistent with the eligibility
                requirements for Philippine licensure examinations. We do not knowingly collect data from
                minors. If you believe a child under 18 has created an account, please contact us immediately
                and we will delete the account promptly.
              </p>
            </motion.section>

            {/* 8. Changes */}
            <motion.section {...sectionCard} className={styles.section} id="changes">
              <span className={styles.sectionNum}>Section 08</span>
              <h2 className={styles.sectionTitle}>Changes to This Policy</h2>
              <p className={styles.paragraph}>
                We may update this Privacy Policy as our platform evolves. Material changes — such as new
                data uses or sharing arrangements — will be communicated via email and a prominent in-app
                notice at least 30 days before taking effect. Continued use of the platform after that date
                constitutes acceptance of the updated policy.
              </p>
            </motion.section>

            {/* 9. Contact */}
            <motion.section {...sectionCard} className={styles.section} id="contact">
              <span className={styles.sectionNum}>Section 09</span>
              <h2 className={styles.sectionTitle}>Contact Us</h2>
              <p className={styles.paragraph}>
                For privacy-related questions or to exercise your data subject rights, reach our
                Data Privacy Officer at{' '}
                <a href="mailto:privacy@veripraxis.ph" className={styles.email}>privacy@veripraxis.ph</a>.
              </p>
              <p className={styles.paragraph}>
                For general inquiries, visit our{' '}
                <Link href="/contact" className={styles.email}>Contact page</Link>{' '}
                or email{' '}
                <a href="mailto:support@veripraxis.ph" className={styles.email}>support@veripraxis.ph</a>.
              </p>
            </motion.section>

          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RELATED LINKS — dark footer band
        ══════════════════════════════════════════════════════ */}
        <div className={styles.relatedLinks}>
          <div className={styles.relatedInner}>
            <div className={styles.relatedTitle}>Related Legal Documents</div>
            <motion.div className={styles.relatedGrid} {...relatedContainer}>
              {[
                { label: 'Terms of Service', href: '/terms', icon: FileText },
                { label: 'Cookie Policy',    href: '/cookies', icon: Cookie },
                { label: 'Contact Us',        href: '/contact', icon: Mail },
              ].map(({ label, href, icon: Icon }) => (
                <motion.div key={label} {...relatedBtn}>
                  <Link href={href} className={styles.relatedBtn}>
                    <Icon size={16} style={{ marginRight: '0.5rem' }} />
                    {label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

      </main>
    </PageShell>
  )
}
