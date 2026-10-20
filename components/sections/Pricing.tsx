// src/components/sections/Pricing.tsx
import Link from 'next/link'
import styles from '@/app/page.module.css'

const FREE_FEATURES = [
  '50 reviewer questions per month',
  'Basic performance summary',
  'Access to community forums',
  '1 mock exam per month',
]

const PRO_FEATURES = [
  'Unlimited reviewer questions',
  'Full analytics dashboard',
  'Unlimited mock exams',
  'All study materials & reviewers',
  'Topic-level weak area detection',
  'Priority support',
]

function CheckIcon() {
  return (
    <svg className={styles.pricingCheckSvg} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Pricing() {
  return (
    <section id="pricing" className={styles.sectionAlt} aria-labelledby="pricing-heading">
      <div className={styles.sectionAltInner}>
        <div className={`${styles.sectionHeader} ${styles.sectionHeaderCenter} reveal`}>
          <span className={styles.sectionLabel}>Pricing</span>
          <h2 id="pricing-heading" className={styles.sectionTitle}>
            Simple, Transparent Pricing
          </h2>
          <p className={styles.sectionSub}>
            No hidden fees. Cancel anytime. Start free and upgrade when you&apos;re ready.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {/* Free plan */}
          <div className={`${styles.pricingCard} reveal reveal-delay-1`}>
            <div>
              <div className={styles.pricingName}>Free</div>
              <p className={styles.pricingDesc}>Start your review journey with no commitment.</p>
            </div>

            <div className={styles.pricingAmount}>
              <span className={styles.pricingCurrency}>₱</span>
              <span className={styles.pricingPrice}>0</span>
              <span className={styles.pricingPeriod}>/forever</span>
            </div>

            <div className={styles.pricingDivider} />

            <ul className={styles.pricingFeatures} aria-label="Free plan features">
              {FREE_FEATURES.map((f) => (
                <li key={f} className={styles.pricingFeatureItem}>
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/signup" className={styles.pricingCtaFree}>
              Create Free Account
            </Link>
          </div>

          {/* Pro plan */}
          <div className={`${styles.pricingCard} ${styles.pricingCardFeatured} reveal reveal-delay-2`}>
            <div>
              <div className={styles.pricingBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Most Popular
              </div>
              <div className={styles.pricingName}>Pro</div>
              <p className={styles.pricingDesc}>Full access for serious board exam reviewees.</p>
            </div>

            <div className={styles.pricingAmount}>
              <span className={styles.pricingCurrency}>₱</span>
              <span className={styles.pricingPrice}>299</span>
              <span className={styles.pricingPeriod}>/month</span>
            </div>

            <div className={styles.pricingDivider} />

            <ul className={styles.pricingFeatures} aria-label="Pro plan features">
              {PRO_FEATURES.map((f) => (
                <li key={f} className={styles.pricingFeatureItem}>
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/register?plan=pro" className={styles.pricingCtaPro}>
              Start Pro — 7 Days Free
            </Link>
          </div>
        </div>

        <p className={styles.pricingNote}>
          Student or group pricing available —{' '}
          <Link href="/contact" className={styles.pricingNoteLink}>contact us</Link>
        </p>
      </div>
    </section>
  )
}
