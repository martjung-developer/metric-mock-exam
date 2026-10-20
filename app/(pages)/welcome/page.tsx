// app/(pages)/welcome/page.tsx
'use client'

import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/sections/Hero'
import styles from '@/app/page.module.css'
import { useScrollReveal } from '@/lib/hooks/useScrollReveal'

const SectionFallback = () => <div style={{ minHeight: '18rem' }} aria-hidden="true" />

const Features = dynamic(() => import('@/components/sections/Features'), {
  loading: SectionFallback,
})

const Programs = dynamic(() => import('@/components/sections/Programs'), {
  loading: SectionFallback,
})

const Testimonials = dynamic(() => import('@/components/sections/Testimonials'), {
  loading: SectionFallback,
})

const FAQ = dynamic(() => import('@/components/sections/FAQ'), {
  loading: SectionFallback,
})

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  loading: () => null,
})

export default function WelcomePage() {
  const containerRef = useScrollReveal()

  return (
    <div className={`${styles.wrapper} ${styles.welcomeWrapper}`} ref={containerRef as React.RefObject<HTMLDivElement>}>
      <Navbar />
      <Hero />
      <Features />
      <Programs />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  )
}
