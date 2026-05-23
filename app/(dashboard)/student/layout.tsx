// app/(dashboard)/student/layout.tsx
import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentSidebar   from '@/components/dashboard/student/StudentSidebar'
import StudentTopbar    from '@/components/dashboard/student/StudentTopbar'
import { AuthProvider } from '@/lib/context/AuthContext'
import type { Profile } from '@/lib/types/auth'
import { fetchProfileByUserId } from '@/lib/auth/profile'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Use getUser() — more secure than getSession() which only reads the cookie
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const authProfile = await fetchProfileByUserId(supabase, user.id)

  // Role mismatch → send to their actual dashboard, not /unauthorized (which doesn't exist)
  if (!authProfile) {
    redirect('/login')
  }
  if (authProfile.role !== 'student') {
    if (authProfile.role === 'admin' || authProfile.role === 'faculty') {
      redirect('/admin/dashboard')
    }
    redirect('/login')
  }

  const profile: Profile = {
    id:         authProfile.id,
    email:      authProfile.email,
    full_name:  authProfile.full_name ?? 'Student',
    role:       'student',
    avatar_url: authProfile.avatar_url ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    // AuthProvider wraps everything so any client component in this
    // subtree can call useUser() safely.
    <AuthProvider>
      <div style={{
        display:    'flex',
        minHeight:  '100vh',
        background: 'var(--dashboard-bg)',
        fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
      }}>
        <StudentSidebar profile={profile} />
        <div style={{
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          minWidth:      0,
          background:    'var(--dashboard-bg)',
        }}>
          <StudentTopbar profile={profile} userId={user.id} />
          <main style={{
            flex:      1,
            padding:   '1.5rem 2rem',
            overflowY: 'auto',
            minWidth:  0,
          }}>
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
