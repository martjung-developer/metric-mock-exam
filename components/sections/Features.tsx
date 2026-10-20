// src/components/sections/Features.tsx
import Image from 'next/image'
import styles from '@/app/page.module.css'

const FEATURES = [
  {
    title: 'Realistic Mock Exams',
    desc: 'Timed, full-length exams that mirror the actual board exam format, question difficulty, and subject distribution from PRC.',
    icon: (
      <svg className={styles.featureIconSvg} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Performance Analytics',
    desc: 'Topic-level breakdowns, score trends, and pinpointed weak areas so you can stop guessing and study with precision.',
    icon: (
      <svg className={styles.featureIconSvg} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Curated Study Materials',
    desc: 'Access concise reviewers, topic summaries, and flashcard sets organized by subject area and aligned with exam coverage.',
    icon: (
      <svg className={styles.featureIconSvg} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Peer Discussion Forums',
    desc: 'Connect with thousands of reviewees. Ask questions, clarify concepts, and share strategies with fellow board exam takers.',
    icon: (
      <svg className={styles.featureIconSvg} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-heading">
      <div className={styles.section}>
        <div className={styles.featuresLayout}>
          {/* Left: image */}
          <div className={`${styles.featuresImage} reveal`}>
            <Image
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80"
              alt="Students collaborating on exam review"
              width={900}
              height={640}
              className={styles.featImgMain}
            />
            <Image
              src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500&q=80"
              alt="Focused student studying with notes"
              width={500}
              height={340}
              className={styles.featImgOverlay}
            />
          </div>

          {/* Right: features list */}
          <div>
            <div className={`${styles.sectionHeader} reveal`}>
              <span className={styles.sectionLabel}>Platform Features</span>
              <h2 id="features-heading" className={styles.sectionTitle}>
                Everything you need to pass
              </h2>
              <p className={styles.sectionSub}>
                VERIPRAXIS combines structured practice, intelligent feedback,
                and community support into one focused review platform.
              </p>
            </div>

            <div className={styles.featuresList}>
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`${styles.featureItem} reveal reveal-delay-${i + 1}`}
                >
                  <div className={styles.featureIconWrap} aria-hidden="true">
                    {f.icon}
                  </div>
                  <div className={styles.featureText}>
                    <div className={styles.featureTitle}>{f.title}</div>
                    <p className={styles.featureDesc}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}