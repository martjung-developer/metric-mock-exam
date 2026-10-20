/**
 * lib/hooks/student/profile/useAvatarUpload.ts
 *
 * State machine for the student avatar upload flow:
 *
 *   idle ──► cropping ──► previewing ──► uploading ──► idle
 *    ▲                                                   │
 *    └──────────────── deleting ◄────────────────────────┘
 *
 * Now uses the shared uploadAvatarFromDataUrl / deleteAvatar helpers so the
 * logic is identical to the admin path.
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient }                   from '@/lib/supabase/client'
import {
  validateAvatarFile,
  uploadAvatar,
  deleteAvatar,
} from '@/lib/utils/student/profile/upload'

// ── Stage ─────────────────────────────────────────────────────────────────────

export type AvatarStage =
  | 'idle'
  | 'cropping'
  | 'previewing'
  | 'uploading'
  | 'deleting'

// ── Toast ─────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error'

export interface AvatarToast {
  id:      number
  message: string
  variant: ToastVariant
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseAvatarUploadReturn {
  stage:           AvatarStage
  selectedFile:    File | null
  croppedDataUrl:  string | null
  liveAvatarUrl:   string | null
  toasts:          AvatarToast[]
  dismissToast:    (id: number) => void
  onFilesAccepted: (files: File[]) => void
  onCropComplete:  (dataUrl: string) => void
  onCropCancel:    () => void
  onConfirmUpload: () => Promise<void>
  onCancelPreview: () => void
  onDeleteAvatar:  () => Promise<void>
}

const TOAST_DURATION_MS = 4_000

export function useAvatarUpload(
  userId:           string,
  initialAvatarUrl: string | null,
): UseAvatarUploadReturn {
  const supabase = useMemo(() => createClient(), [])

  const [stage,          setStage]          = useState<AvatarStage>('idle')
  const [selectedFile,   setSelectedFile]   = useState<File | null>(null)
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null)
  const [liveAvatarUrl,  setLiveAvatarUrl]  = useState<string | null>(initialAvatarUrl)
  const [toasts,         setToasts]         = useState<AvatarToast[]>([])

  // ── Toast helpers ─────────────────────────────────────────────────────────

  const pushToast = useCallback((message: string, variant: ToastVariant) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION_MS)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ── Dropzone ──────────────────────────────────────────────────────────────

  const onFilesAccepted = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (!file) {return}

      const validation = validateAvatarFile(file)
      if (!validation.ok) {
        pushToast(validation.reason ?? 'Invalid file.', 'error')
        return
      }

      setSelectedFile(file)
      setStage('cropping')
    },
    [pushToast],
  )

  // ── Cropper ───────────────────────────────────────────────────────────────

  const onCropComplete = useCallback((dataUrl: string) => {
    setCroppedDataUrl(dataUrl)
    setStage('previewing')
  }, [])

  const onCropCancel = useCallback(() => {
    setSelectedFile(null)
    setCroppedDataUrl(null)
    setStage('idle')
  }, [])

  // ── Preview / upload ──────────────────────────────────────────────────────

  const onConfirmUpload = useCallback(async () => {
    if (!croppedDataUrl) {return}
    setStage('uploading')

    // uploadAvatar here is uploadAvatarFromDataUrl (re-exported by the shim)
    const result = await uploadAvatar(supabase, userId, croppedDataUrl)

    if (result.error || !result.publicUrl) {
      pushToast(`Upload failed: ${result.error ?? 'Unknown error'}`, 'error')
      setStage('idle')
      return
    }

    setLiveAvatarUrl(result.publicUrl)
    setSelectedFile(null)
    setCroppedDataUrl(null)
    setStage('idle')
    pushToast('Avatar updated successfully!', 'success')
  }, [supabase, userId, croppedDataUrl, pushToast])

  const onCancelPreview = useCallback(() => {
    setStage('cropping')
  }, [])

  // ── Delete ────────────────────────────────────────────────────────────────

  const onDeleteAvatar = useCallback(async () => {
    setStage('deleting')

    const result = await deleteAvatar(supabase, userId)

    if (result.error) {
      pushToast(`Could not remove avatar: ${result.error}`, 'error')
      setStage('idle')
      return
    }

    setLiveAvatarUrl(null)
    setStage('idle')
    pushToast('Avatar removed.', 'success')
  }, [supabase, userId, pushToast])

  return {
    stage,
    selectedFile,
    croppedDataUrl,
    liveAvatarUrl,
    toasts,
    dismissToast,
    onFilesAccepted,
    onCropComplete,
    onCropCancel,
    onConfirmUpload,
    onCancelPreview,
    onDeleteAvatar,
  }
}