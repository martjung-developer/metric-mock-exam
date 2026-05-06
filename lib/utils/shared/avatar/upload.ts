/**
 * lib/utils/shared/avatar/upload.ts
 *
 * UNIFIED avatar upload/delete helpers — used by both Admin and Student flows.
 * Zero React. Zero UI. Pure Supabase I/O.
 *
 * Storage layout:
 *   bucket : avatars
 *   path   : {userId}/avatar.png   (always upserted — one file per user)
 *
 * Cache-bust is appended to the public URL so browsers always fetch the latest.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type AppClient = SupabaseClient<Database, 'public'>
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

const BUCKET    = 'avatars'
const MAX_BYTES = 5 * 1024 * 1024 
const ALLOWED   = ['image/jpeg', 'image/png', 'image/webp'] as const

// ── Validation ────────────────────────────────────────────────────────────────

export interface FileValidation {
  ok:     boolean
  reason: string | null
}

export function validateAvatarFile(file: File): FileValidation {
  if (!(ALLOWED as readonly string[]).includes(file.type)) {
    return { ok: false, reason: 'Only JPG, PNG, and WebP images are supported.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, reason: 'Image must be smaller than 5 MB.' }
  }
  return { ok: true, reason: null }
}

// ── Upload (from base64 data-URL — produced by canvas cropper) ────────────────

export interface UploadAvatarResult {
  publicUrl: string | null
  error:     string | null
}

/**
 * Converts a base64 data-URL to a Blob, upserts it to Supabase Storage,
 * then persists the public URL to `profiles.avatar_url`.
 *
 * Works for both Admin (settings page) and Student (profile page) because
 * both write to the same `profiles` table.
 */
export async function uploadAvatarFromDataUrl(
  client:  AppClient,
  userId:  string,
  dataUrl: string,
): Promise<UploadAvatarResult> {
  const blob = dataUrlToBlob(dataUrl)
  if (!blob) {return { publicUrl: null, error: 'Failed to process the cropped image.' }}

  // Use a timestamp suffix in the filename to bust CDN caches while keeping
  // one predictable folder per user.
  const filename = `avatar_${Date.now()}.png`
  const path     = `${userId}/${filename}`

  const { error: storageError } = await client
    .storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType:  'image/png',
      upsert:       true,
      cacheControl: '0',
    })

  if (storageError) {return { publicUrl: null, error: storageError.message }}

  const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(path)
  const raw = urlData?.publicUrl ?? null

  if (!raw) {return { publicUrl: null, error: 'Could not retrieve public URL.' }}

  const publicUrl = `${raw}?t=${Date.now()}`

  const { error: dbError } = await client
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() } as ProfileUpdate)
    .eq('id', userId)

  if (dbError) {return { publicUrl: null, error: dbError.message }}

  return { publicUrl, error: null }
}

/**
 * Upload directly from a File object (used by Admin settings — no crop step).
 * Simulates progress via a polling interval since Supabase JS v2 doesn't expose
 * upload progress natively.
 */
export async function uploadAvatarFromFile(
  client:      AppClient,
  userId:      string,
  file:        File,
  onProgress?: (pct: number) => void,
): Promise<UploadAvatarResult> {
  const filename = `avatar_${Date.now()}.${file.name.split('.').pop() ?? 'jpg'}`
  const path     = `${userId}/${filename}`

  let pct = 10
  onProgress?.(pct)

  const ticker = setInterval(() => {
    pct = Math.min(pct + 15, 85)
    onProgress?.(pct)
  }, 200)

  const { error: storageError } = await client
    .storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '0' })

  clearInterval(ticker)

  if (storageError) {
    onProgress?.(0)
    return { publicUrl: null, error: storageError.message }
  }

  const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(path)
  const raw = urlData?.publicUrl ?? null

  if (!raw) {return { publicUrl: null, error: 'Could not retrieve public URL.' }}

  const publicUrl = `${raw}?t=${Date.now()}`
  onProgress?.(100)

  const { error: dbError } = await client
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() } as ProfileUpdate)
    .eq('id', userId)

  if (dbError) {return { publicUrl: null, error: dbError.message }}

  return { publicUrl, error: null }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export interface DeleteAvatarResult {
  error: string | null
}

/**
 * Removes all files under `{userId}/` in the avatars bucket (best-effort)
 * and nulls out `profiles.avatar_url`.
 */
export async function deleteAvatar(
  client: AppClient,
  userId: string,
): Promise<DeleteAvatarResult> {
  // List all files for this user so we can remove whatever name was used.
  const { data: files } = await client.storage.from(BUCKET).list(userId)
  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`)
    await client.storage.from(BUCKET).remove(paths)
  }

  const { error } = await client
    .from('profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() } as ProfileUpdate)
    .eq('id', userId)

  return { error: error?.message ?? null }
}

// ── Internal ──────────────────────────────────────────────────────────────────

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, b64] = dataUrl.split(',')
    if (!header || !b64) {return null}
    const mime   = header.match(/:(.*?);/)?.[1] ?? 'image/png'
    const binary = atob(b64)
    const bytes  = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {bytes[i] = binary.charCodeAt(i)}
    return new Blob([bytes], { type: mime })
  } catch {
    return null
  }
}