// app/(exam)/layout.tsx
import type { ReactNode } from 'react'

export default function ExamLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}