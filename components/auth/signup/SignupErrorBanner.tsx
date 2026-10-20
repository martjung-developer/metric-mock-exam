// components/auth/signup/SignupErrorBanner.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle }             from 'lucide-react'
import styles from '@/app/(auth)/auth.module.css'

interface SignupErrorBannerProps {
  error: string | null
}

export function SignupErrorBanner({ error }: SignupErrorBannerProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className={styles.errorBanner}
          style={{ marginBottom: '0.75rem' }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  )
}