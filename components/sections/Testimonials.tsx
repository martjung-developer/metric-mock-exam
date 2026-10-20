// src/components/sections/Testimonials.tsx
import Image from 'next/image'
import styles from '@/app/page.module.css'

const TESTIMONIALS = [
  {
    quote: 'VERIPRAXIS helped me identify that I was weak in cataloging systems. After two weeks of targeted review, I passed SBIT on my first attempt.',
    name: 'Creztann Mustre',
    meta: 'Licensed Librarian · SBIT Passer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80',
  },
  {
    quote: 'The mock exams felt exactly like the real thing. I was confident walking into the test center because I already knew what to expect.',
    name: 'Eric Garinggo',
    meta: 'Licensed Teacher · SSLATE Passer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
  },
  {
    quote: 'The analytics dashboard showed me exactly where I was losing points. I stopped wasting time on topics I already knew and focused on what mattered.',
    name: 'Zen Mercado',
    meta: 'Licensed Architect · SARFAID Passer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
  },
]

function Star() {
  return (
    <svg className={styles.starSvg} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading">
      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionHeaderCenter} reveal`}>
          <span className={styles.sectionLabel}>Testimonials</span>
          <h2 id="testimonials-heading" className={styles.sectionTitle}>
            Trusted by Thousands of Reviewees
          </h2>
        </div>

        <div className={styles.testimonialGrid}>
          {TESTIMONIALS.map((t, i) => (
            <article
              key={t.name}
              className={`${styles.testimonialCard} reveal reveal-delay-${i + 1}`}
            >
              <div className={styles.testimonialStars} aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, s) => <Star key={s} />)}
              </div>
              <blockquote className={styles.testimonialQuote}>
                {`"${t.quote}"`}
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={80}
                  height={80}
                  className={styles.testimonialAvatar}
                />
                <div>
                  <div className={styles.testimonialName}>{t.name}</div>
                  <div className={styles.testimonialMeta}>{t.meta}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}