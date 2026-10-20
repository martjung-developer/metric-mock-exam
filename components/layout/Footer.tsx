// src/components/layout/Footer.tsx
import Link from 'next/link'
import Image from 'next/image'
import styles from '@/app/page.module.css'

const FOOTER_LINKS = {
  Product:  [
    { label: 'Features', href: '#features' },
    { label: 'Programs', href: '#programs' },
    { label: 'Pricing',  href: '#pricing'  },
    { label: 'Roadmap',  href: '/roadmap'  },
  ],
  Company:  [
    { label: 'About Us', href: '/about'   },
    { label: 'Blog',     href: '/blog'    },
    { label: 'Contact',  href: '/contact' },
  ],
  Legal:    [
    { label: 'Privacy Policy',   href: '/privacy' },
    { label: 'Terms of Service', href: '/terms'   },
    { label: 'Cookie Policy',    href: '/cookies' },
  ],
}

export default function Footer() {
  return (
    <footer className={styles.footer} aria-label="Site footer">
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogoLink} aria-label="Metric home">
              <Image
                src="/images/metric-logo.png"
                alt="Metric"
                width={140}
                height={40}
                className={styles.footerLogoImg}
              />
            </Link>
            <p className={styles.footerTagline}>
              Helping Filipino professionals pass their board exams with confidence.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <div className={styles.footerColTitle}>{group}</div>
              <ul className={styles.footerLinks}>
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className={styles.footerLink}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Metric. All rights reserved.</span>
          <span>Built for Filipino reviewees 🇵🇭</span>
        </div>
      </div>
    </footer>
  )
}