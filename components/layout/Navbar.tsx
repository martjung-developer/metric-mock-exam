// src/components/layout/Navbar.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import styles from '@/app/page.module.css'

const NAV_LINKS = [
  { label: 'Welcome',  href: '/welcome'  },
  { label: 'About',  href: '/about'  },
  { label: 'Features', href: '/features' },
  { label: 'Programs', href: '/programs' },
  { label: 'Help',     href: '/help'     },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navClass = [
    styles.navbar,
    scrolled ? styles.navbarScrolled : '',
  ].join(' ')

  return (
    <header className={navClass}>
      <div className={styles.navInner}>
        {/* Logo */}
        <Link href="/welcome" className={styles.navLogo} aria-label="Metric welcome">
          <Image
            src="/images/metric-logo.png"
            alt="Metric"
            width={140}
            height={40}
            className={styles.navLogoImg}
            priority
          />
        </Link>

        {/* Desktop center links */}
        <nav className={styles.navCenter} aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = href === '/welcome'
              ? pathname === '/welcome'
              : pathname.startsWith(href)

            return (
              <Link
                key={label}
                href={href}
                className={styles.navLink}
                style={isActive ? { color: 'var(--blue)' } : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop CTA buttons */}
        <div className={styles.navActions}>
          <Link href="/" prefetch={true} className={styles.navLoginBtn}>Log in</Link>
          <Link href="/signup" prefetch={true} className={styles.navSignupBtn}>Sign Up</Link>

          {/* Hamburger (mobile) */}
          <button
            className={`${styles.navHamburger} ${mobileOpen ? styles.navMobileOpen : ''}`}
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className={styles.mobileNavLink}
            onClick={() => setMobileOpen(false)}
          >
            {label}
          </Link>
        ))}
        <div className={styles.mobileDivider} />
        <Link href="/" prefetch={true} className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>Log in</Link>
        <Link href="/signup" prefetch={true} className={styles.mobileSignupBtn} onClick={() => setMobileOpen(false)}>Sign Up</Link>
      </div>
    </header>
  )
}
