// app/unauthorized/page.tsx

export default function UnauthorizedPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Access Denied</h1>
      <p style={{ color: '#666' }}>You don&apos;t have permission to view this page.</p>
      <a href="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
        Back to login
      </a>
    </div>
  )
}