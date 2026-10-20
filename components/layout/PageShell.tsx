// src/components/layout/PageShell.tsx
// Wraps every public page with Navbar + Footer.
// No scroll-reveal init needed — pages use Framer Motion's whileInView directly.

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './PageShell.module.css'

interface PageShellProps {
  children: React.ReactNode
  padded?: boolean
}

export default function PageShell({ children, padded = true }: PageShellProps) {
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={padded ? styles.mainPadded : styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  )
}