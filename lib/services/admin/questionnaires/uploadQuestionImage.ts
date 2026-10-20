// lib/services/admin/questionnaires/uploadQuestionImage.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import { IMAGE_BUCKET } from '@/lib/constants/admin/questionnaires/questionnaires.constants'

export interface UploadedImage {
  filename:  string
  path:      string
  publicUrl: string
}

export interface UploadImagesResult {
  results: UploadedImage[]
  errors:  { filename: string; error: string }[]
}

/**
 * Uploads a batch of image Files to the public questionnaire-assets bucket
 * (see IMAGE_BUCKET), namespaced under the exam they're being imported for,
 * and returns the public URL for each successfully-uploaded file.
 */
export async function uploadQuestionImages(
  supabase: SupabaseClient,
  files: File[],
  examId: string,
): Promise<UploadImagesResult> {
  const results: UploadedImage[] = []
  const errors: { filename: string; error: string }[] = []

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `exams/${examId}/${Date.now()}-${safeName}`

    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      errors.push({ filename: file.name, error: error.message })
      continue
    }

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
    results.push({ filename: file.name, path, publicUrl: data.publicUrl })
  }

  return { results, errors }
}

export async function uploadImportedQuestionImages(
  supabase: SupabaseClient,
  files: File[],
  programCode: string,
): Promise<UploadImagesResult> {
  const results: UploadedImage[] = []
  const errors: { filename: string; error: string }[] = []
  const safeProgramCode = programCode.trim().replace(/[^a-zA-Z0-9._-]/g, '_')

  if (!safeProgramCode) {
    return { results, errors: files.map((file) => ({ filename: file.name, error: 'Program code is unavailable.' })) }
  }

  for (const file of files) {
    try {
      const suppliedExtension = file.name.split('.').pop()?.toLowerCase() ?? ''
      const mimeExtension = file.type.split('/')[1]?.replace('jpeg', 'jpg').split('+')[0] ?? ''
      const extension = /^[a-z0-9]{2,5}$/.test(suppliedExtension) ? suppliedExtension : mimeExtension || 'png'
      const path = `${safeProgramCode}/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })

      if (error) {
        errors.push({ filename: file.name, error: error.message })
        continue
      }

      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
      results.push({ filename: file.name, path, publicUrl: data.publicUrl })
    } catch (error) {
      errors.push({
        filename: file.name,
        error: error instanceof Error ? error.message : 'Unexpected image upload failure.',
      })
    }
  }

  return { results, errors }
}

/** True if a CSV `image` cell is already a usable absolute URL. */
export function isAbsoluteImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}
