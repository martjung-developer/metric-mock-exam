// src/components/sections/Programs.tsx
import Image from 'next/image'
import styles from '@/app/page.module.css'

const PROGRAMS = [
  {
    name: 'Librarian Licensure Examination (LLE)',
    desc: 'Covers cataloging & classification, reference services, library administration, collection development, and information technology for aspiring registered librarians.',
    img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80',
    imgAlt: 'Library shelves filled with books',
  },
  {
    name: 'Psychometrician Licensure Examination (PLE)',
    desc: 'Covers psychological assessment, statistics, research methodology, and the ethical and professional standards of psychometry practice in the Philippines.',
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
    imgAlt: 'Psychology and mental health assessment',
  },
  {
    name: 'LET — Elementary Education',
    desc: 'Assesses foundational teaching competencies: professional education theory, child development, curriculum planning, and general education content areas.',
    img: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80',
    imgAlt: 'Elementary school classroom with teacher',
  },
  {
    name: 'LET Secondary Education — Filipino',
    desc: 'Focuses on Filipino language proficiency, panitikang Pilipino, retorika, and the pedagogy of teaching Filipino in secondary schools.',
    img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80',
    imgAlt: 'Books and Filipino literature',
  },
  {
    name: 'LET Secondary Education — Mathematics',
    desc: 'Covers algebra, geometry, trigonometry, statistics, and calculus alongside pedagogical content knowledge for effective secondary math instruction.',
    img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
    imgAlt: 'Mathematics equations and formulas',
  },
  {
    name: 'LET Secondary Education — English',
    desc: 'Evaluates grammar, communication arts, literature, language teaching methodology, and assessment strategies for secondary English educators.',
    img: 'https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=600&q=80',
    imgAlt: 'English language books and reading',
  },
  {
    name: 'LET Secondary Education — Science',
    desc: 'Encompasses biology, chemistry, physics, and earth science content with emphasis on inquiry-based and laboratory teaching approaches.',
    img: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&q=80',
    imgAlt: 'Science laboratory glassware and experiments',
  },
  {
    name: 'Architect Licensure Examination (ALE)',
    desc: 'Tests architectural design, building technology, structure and construction, utilities, and the legal and professional practice of architecture in the Philippines.',
    img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80',
    imgAlt: 'Architecture blueprints and technical drawings',
  },
  {
    name: 'Interior Designer Licensure Exam (IDLE)',
    desc: 'Covers design principles, space planning, materials and specifications, environmental systems, and professional practice for aspiring registered interior designers.',
    img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
    imgAlt: 'Modern interior design and space planning',
  },
]

export default function Programs() {
  return (
    <section id="programs" className={styles.sectionAlt} aria-labelledby="programs-heading">
      <div className={styles.sectionAltInner}>
        <div className={`${styles.sectionHeader} ${styles.sectionHeaderCenter} reveal`}>
          <span className={styles.sectionLabel}>Available Programs</span>
          <h2 id="programs-heading" className={styles.sectionTitle}>
            Covering Major Philippine Licensure Exams
          </h2>
          <p className={styles.sectionSub}>
            Each program is tailored to the PRC syllabus with questions vetted
            by licensed professionals and recent board exam passers.
          </p>
        </div>

        <div className={styles.programsGrid}>
          {PROGRAMS.map((p, i) => (
            <article
              key={`${p.name}-${i}`}
              className={`${styles.programCard} reveal reveal-delay-${(i % 3) + 1}`}
            >
              <Image
                src={p.img}
                alt={p.imgAlt}
                width={600}
                height={280}
                className={styles.programImg}
              />
              <div className={styles.programName}>{p.name}</div>
              <p className={styles.programDesc}>{p.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}