// components/auth/signup/SignupBackButton.tsx
import { ArrowLeft } from 'lucide-react'

interface SignupBackButtonProps {
  onClick: () => void
}

const STYLE: React.CSSProperties = {
  flex:         '0 0 auto',
  padding:      '0.65rem 0.85rem',
  background:   '#f1f5f9',
  border:       '1px solid #e2e8f0',
  borderRadius: 10,
  cursor:       'pointer',
  display:      'flex',
  alignItems:   'center',
}

export function SignupBackButton({ onClick }: SignupBackButtonProps) {
  return (
    <button type="button" onClick={onClick} style={STYLE} aria-label="Go back">
      <ArrowLeft size={15} color="#64748b" />
    </button>
  )
}