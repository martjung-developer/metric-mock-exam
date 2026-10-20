// lib/services/admin/study-materials/storage.service.ts
//
// Handles all Supabase Storage interactions for study materials.
// Returns typed results — never throws silently.

import { createClient } from '@/lib/supabase/client'

const BUCKET = 'study-materials'
const UPLOAD_TIMEOUT_MS = 30 * 60 * 1000
const RESUMABLE_CHUNK_SIZE = 6 * 1024 * 1024

export interface UploadResult {
  url:  string
  path: string
}

export interface StorageError {
  message: string
}

export type UploadOutcome =
  | { ok: true;  data: UploadResult }
  | { ok: false; error: StorageError }

export type DeleteOutcome =
  | { ok: true }
  | { ok: false; error: StorageError }

export type UploadProgressHandler = (progress: number) => void

/**
 * Uploads a file to the `study-materials` bucket.
 * Returns the public URL on success.
 *
 * Path pattern: `{folderPrefix}/{timestamp}-{sanitized-filename}`
 */
export async function uploadMaterialFile(
  file: File,
  folderPrefix: string = 'uploads',
  onProgress?: UploadProgressHandler,
): Promise<UploadOutcome> {
  const supabase = createClient()

  const sanitized  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${folderPrefix}/${Date.now()}-${sanitized}`
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !sessionData.session?.access_token) {
    return { ok: false, error: { message: sessionError?.message ?? 'You must be signed in to upload files.' } }
  }

  const uploadError = await uploadResumable(
    storagePath,
    file,
    sessionData.session.access_token,
    onProgress,
  )

  if (uploadError) {
    return { ok: false, error: { message: uploadError } }
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  if (!urlData?.publicUrl) {
    return {
      ok:    false,
      error: { message: 'Uploaded file but could not retrieve public URL.' },
    }
  }

  return {
    ok:   true,
    data: { url: urlData.publicUrl, path: storagePath },
  }
}

/**
 * Deletes a file from the `study-materials` bucket by its storage path.
 * Extracts the path from a full public URL if needed.
 */
export async function deleteMaterialFile(
  pathOrUrl: string,
): Promise<DeleteOutcome> {
  const supabase   = createClient()
  const storagePath = extractStoragePath(pathOrUrl)

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath])

  if (error) {
    return { ok: false, error: { message: error.message } }
  }

  return { ok: true }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * If given a full Supabase public URL, strips the bucket prefix so only the
 * relative storage path remains.  If given a plain path, returns it as-is.
 *
 * Example:
 *   https://xxx.supabase.co/storage/v1/object/public/study-materials/uploads/123-file.pdf
 *   → uploads/123-file.pdf
 */
function extractStoragePath(pathOrUrl: string): string {
  const marker = `/object/public/${BUCKET}/`
  const idx    = pathOrUrl.indexOf(marker)
  if (idx !== -1) {
    return pathOrUrl.slice(idx + marker.length)
  }
  return pathOrUrl
}

function getDirectStorageUrl(projectUrl: string): string {
  const parsed = new URL(projectUrl)
  const projectRef = parsed.hostname.split('.')[0]
  return `${parsed.protocol}//${projectRef}.storage.supabase.co`
}

function encodeTusMetadata(value: string): string {
  return btoa(unescape(encodeURIComponent(value)))
}

function buildTusMetadata(storagePath: string, file: File): string {
  const metadata = {
    bucketName: BUCKET,
    objectName: storagePath,
    contentType: file.type || 'application/octet-stream',
    cacheControl: '3600',
  }

  return Object.entries(metadata)
    .map(([key, value]) => `${key} ${encodeTusMetadata(value)}`)
    .join(',')
}

function createResumableUpload(
  endpoint: string,
  storagePath: string,
  file: File,
  accessToken: string,
  anonKey: string,
): Promise<{ location: string } | { error: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)
    xhr.timeout = UPLOAD_TIMEOUT_MS
    xhr.setRequestHeader('apikey', anonKey)
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.setRequestHeader('Tus-Resumable', '1.0.0')
    xhr.setRequestHeader('Upload-Length', String(file.size))
    xhr.setRequestHeader('Upload-Metadata', buildTusMetadata(storagePath, file))
    xhr.setRequestHeader('x-upsert', 'false')

    xhr.onload = () => {
      if (xhr.status === 201) {
        const location = xhr.getResponseHeader('location')
        if (location) {
          resolve({ location })
          return
        }
        resolve({ error: 'Upload session was created without a resumable location.' })
        return
      }
      resolve({ error: parseStorageError(xhr) })
    }

    xhr.onerror = () => resolve({ error: 'Upload session could not be created because the network request failed.' })
    xhr.ontimeout = () => resolve({ error: 'Upload session creation timed out.' })
    xhr.onabort = () => resolve({ error: 'Upload session creation was cancelled.' })
    xhr.send()
  })
}

function uploadTusChunk(
  location: string,
  chunk: Blob,
  offset: number,
  accessToken: string,
  anonKey: string,
): Promise<null | string> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PATCH', location)
    xhr.timeout = UPLOAD_TIMEOUT_MS
    xhr.setRequestHeader('apikey', anonKey)
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.setRequestHeader('Tus-Resumable', '1.0.0')
    xhr.setRequestHeader('Upload-Offset', String(offset))
    xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream')

    xhr.onload = () => {
      resolve(xhr.status === 204 ? null : parseStorageError(xhr))
    }
    xhr.onerror = () => resolve('A file chunk failed to upload because the network request could not be completed.')
    xhr.ontimeout = () => resolve('A file chunk upload timed out. Check the connection and try again.')
    xhr.onabort = () => resolve('Upload was cancelled before it completed.')
    xhr.send(chunk)
  })
}

async function uploadResumable(
  storagePath: string,
  file: File,
  accessToken: string,
  onProgress?: UploadProgressHandler,
): Promise<string | null> {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!projectUrl || !anonKey) {
    return 'Missing Supabase environment variables.'
  }

  const endpoint = `${getDirectStorageUrl(projectUrl)}/storage/v1/upload/resumable`
  const session = await createResumableUpload(endpoint, storagePath, file, accessToken, anonKey)
  if ('error' in session) {
    return session.error
  }

  onProgress?.(0)
  for (let offset = 0; offset < file.size; offset += RESUMABLE_CHUNK_SIZE) {
    const chunk = file.slice(offset, Math.min(offset + RESUMABLE_CHUNK_SIZE, file.size))
    const error = await uploadTusChunk(session.location, chunk, offset, accessToken, anonKey)
    if (error) {
      return error
    }
    onProgress?.(Math.min(100, Math.round(((offset + chunk.size) / file.size) * 100)))
  }

  return null
}

function parseStorageError(xhr: XMLHttpRequest): string {
  let message = `Upload failed with status ${xhr.status}.`
  try {
    const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string }
    return parsed.message ?? parsed.error ?? message
  } catch {
    if (xhr.responseText) {
      message = xhr.responseText
    }
  }
  return message
}
