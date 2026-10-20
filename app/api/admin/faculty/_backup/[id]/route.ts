import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { getProfile } from '@/lib/auth/helpers'
import type { FacultyRoleType } from '@/lib/types/admin/faculty'

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

async function ensureAdmin() {
  const supabaseSession = await createServerClient()
  const { data: { user }, error } = await supabaseSession.auth.getUser()
  if (error || !user) { return { ok: false as const, status: 401, message: 'Unauthorized.' } }
  const profile = await getProfile(user.id)
  if (!profile || profile.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'Forbidden: admin role required.' }
  }
  return { ok: true as const, userId: user.id }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin()
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.message }, { status: auth.status })
  }

  const { id } = await params
  const body = await req.json().catch(() => null) as {
    full_name?: string
    role_type?: FacultyRoleType | null
  } | null

  if (!body) {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const updatePayload: Database['public']['Tables']['faculty']['Update'] = {
    updated_at: new Date().toISOString(),
  }
  if (typeof body.full_name === 'string') {
    updatePayload.full_name = body.full_name.trim()
  }
  if (body.role_type === 'professional' || body.role_type === 'major' || body.role_type === 'minor' || body.role_type === null) {
    updatePayload.role_type = body.role_type
  }

  const client = getServiceRoleClient()
  const { error } = await client
    .from('faculty')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin()
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.message }, { status: auth.status })
  }

  const { id } = await params
  const client = getServiceRoleClient()
  const { error } = await client.from('faculty').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
