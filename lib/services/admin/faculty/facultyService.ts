// lib/services/admin/faculty/facultyService.ts
//
// Thin service layer that wraps the faculty API routes.
// Follows the existing pattern: UI → hooks → services → API → Supabase.

import type {
  CreateFacultyPayload,
  CreateFacultyResponse,
  FacultyListResponse,
  FacultyRoleType,
} from '@/lib/types/admin/faculty'

const BASE = '/api/admin'

// ── Create a new faculty account ─────────────────────────────────────────────

export async function createFaculty(
  payload: CreateFacultyPayload,
): Promise<CreateFacultyResponse> {
  const res = await fetch(`${BASE}/create-faculty`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      fullName:   payload.fullName,
      email:      payload.email,
      facultyId:  payload.facultyId,
      password:   payload.password,
      programId:  payload.programId,
      roleType:   payload.roleType,
    }),
  })

  const data = (await res.json()) as CreateFacultyResponse
  return data
}

// ── Fetch faculty list ────────────────────────────────────────────────────────

export async function fetchFacultyList(): Promise<FacultyListResponse> {
  const res = await fetch(`${BASE}/faculty`, {
    method:  'GET',
    headers: { 'Content-Type': 'application/json' },
    // Include credentials so the session cookie is forwarded.
    credentials: 'include',
  })

  const data = (await res.json()) as FacultyListResponse
  return data
}

// ── Toggle faculty active status ─────────────────────────────────────────────

export async function toggleFacultyStatus(
  facultyId: string,
  isActive:  boolean,
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/faculty/${facultyId}/status`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ is_active: isActive }),
    credentials: 'include',
  })

  return (await res.json()) as { success: boolean; error?: string }
}

export async function updateFacultyById(
  facultyId: string,
  payload: { full_name: string; role_type: FacultyRoleType | null },
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/faculty/${facultyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  return (await res.json()) as { success: boolean; error?: string }
}

export async function deleteFacultyById(
  facultyId: string,
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/faculty/${facultyId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return (await res.json()) as { success: boolean; error?: string }
}
