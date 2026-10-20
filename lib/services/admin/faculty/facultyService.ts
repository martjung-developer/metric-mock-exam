// lib/services/admin/faculty/facultyService.ts
import type {
  CreateFacultyPayload,
  CreateFacultyResponse,
  FacultyListResponse,
  FacultyRoleType,
} from '@/lib/types/admin/faculty'

const BASE = '/api/admin'

export async function createFaculty(payload: CreateFacultyPayload): Promise<CreateFacultyResponse> {
  const res = await fetch(`${BASE}/create-faculty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName:  payload.fullName,
      email:     payload.email,
      facultyId: payload.facultyId,
      password:  payload.password,
      roleTypes: payload.roleTypes,
      // NEW: array instead of single programId/isProgramHead
      programs: payload.programs.map((p) => ({
        programId: p.programId,
        isProgramHead: p.isProgramHead,
      })),
    }),
  })
  return (await res.json()) as CreateFacultyResponse
}

export async function fetchFacultyList(): Promise<FacultyListResponse> {
  const res = await fetch(`${BASE}/faculty`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  return (await res.json()) as FacultyListResponse
}

export async function toggleFacultyStatus(facultyId: string, isActive: boolean) {
  const res = await fetch(`${BASE}/faculty/${facultyId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive }),
    credentials: 'include',
  })
  return (await res.json()) as { success: boolean; error?: string }
}

export async function updateFacultyById(
  facultyId: string,
  payload: {
    full_name: string
    role_types: FacultyRoleType[]
    programs: { program_id: string; is_program_head: boolean }[]
    program_heads?: { program_id: string; is_program_head: boolean }[]
  },
) {
  const res = await fetch(`${BASE}/faculty/${facultyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  return (await res.json()) as { success: boolean; error?: string }
}

export async function deleteFacultyById(facultyId: string) {
  const res = await fetch(`${BASE}/faculty/${facultyId}`, { method: 'DELETE', credentials: 'include' })
  return (await res.json()) as { success: boolean; error?: string }
}