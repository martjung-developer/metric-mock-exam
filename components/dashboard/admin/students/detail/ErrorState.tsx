// components/dashboard/admin/students/detail/ErrorState.tsx
import { AlertCircle } from 'lucide-react'
import { useRouter }   from 'next/navigation'
import styles          from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

interface Props {
  message: string | null
}

export function ErrorState({ message }: Props) {
  const router = useRouter()
  return (
    <div className={styles.errorWrap}>
      <AlertCircle size={28} color="#dc2626" />
      <p style={{ color: '#991b1b' }}>{message ?? 'Student not found.'}</p>
      <button className={styles.btnBack} onClick={() => router.push('/admin/students')}>
        Back to Students
      </button>
    </div>
  )
}