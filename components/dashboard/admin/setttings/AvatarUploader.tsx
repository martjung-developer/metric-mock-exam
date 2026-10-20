// components/dashboard/admin/settings/AvatarUploader.tsx
//
// FIXED: Now uses the same crop → preview → confirm flow as the student side.
// Pure UI — all upload logic stays in useSettings via the onFileChange callback.
// The crop/preview is handled locally here since admin settings doesn't use
// the student's useAvatarUpload hook (it has its own simpler hook surface).
//
// Flow:
//   1. User clicks "Change photo" → hidden input opens
//   2. File selected → AvatarCropper modal opens
//   3. Crop confirmed → AvatarPreviewModal opens (shows before committing)
//   4. User clicks "Save Avatar" → onConfirmUpload(croppedDataUrl) fires
//   5. Parent (useSettings) uploads and updates avatarUrl in DB

'use client'

import { useRef, useState, useCallback } from 'react'
import Image      from 'next/image'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { motion }                  from 'framer-motion'
import { buttonVariants }          from '@/animations/admin/settings/settings'
import { validateAvatarFile }      from '@/lib/utils/shared/avatar/upload'
import type { AvatarUploadState }  from '@/lib/types/admin/settings/settings.types'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'

// We reuse the student's cropper and preview components — they have zero
// student-specific dependencies and are purely presentational.
import { AvatarCropper }      from '@/components/dashboard/student/profile/image/AvatarCropper'
import { AvatarPreviewModal } from '@/components/dashboard/student/profile/image/AvatarPreviewModal'

type CropStage = 'idle' | 'cropping' | 'previewing'

interface AvatarUploaderProps {
  avatarUrl:        string | null
  initials:         string
  upload:           AvatarUploadState
  /** Called with the cropped data-URL when the user confirms the preview */
  onConfirmUpload:  (dataUrl: string) => Promise<void>
  /** Called when the user wants to remove the current avatar */
  onDeleteAvatar?:  () => Promise<void>
}

export function AvatarUploader({
  avatarUrl,
  initials,
  upload,
  onConfirmUpload,
  onDeleteAvatar,
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cropStage,      setCropStage]      = useState<CropStage>('idle')
  const [selectedFile,   setSelectedFile]   = useState<File | null>(null)
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null)
  const [validationErr,  setValidationErr]  = useState<string | null>(null)

  const isBusy    = upload.uploading
  const hasAvatar = !!avatarUrl

  // ── File selected from input ──────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting same file
    if (!file) {return}

    const validation = validateAvatarFile(file)
    if (!validation.ok) {
      setValidationErr(validation.reason)
      return
    }

    setValidationErr(null)
    setSelectedFile(file)
    setCropStage('cropping')
  }, [])

  // ── Crop confirmed ────────────────────────────────────────────────────────
  const handleCropComplete = useCallback((dataUrl: string) => {
    setCroppedDataUrl(dataUrl)
    setCropStage('previewing')
  }, [])

  const handleCropCancel = useCallback(() => {
    setSelectedFile(null)
    setCroppedDataUrl(null)
    setCropStage('idle')
  }, [])

  // ── Preview: go back to cropper ───────────────────────────────────────────
  const handlePreviewCancel = useCallback(() => {
    setCropStage('cropping')
  }, [])

  // ── Preview: commit upload ────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!croppedDataUrl) {return}
    await onConfirmUpload(croppedDataUrl)
    setSelectedFile(null)
    setCroppedDataUrl(null)
    setCropStage('idle')
  }, [croppedDataUrl, onConfirmUpload])

  return (
    <>
      <div className={s.avatarUploadRow}>
        {/* ── Preview circle ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {hasAvatar ? (
            <Image
              src={avatarUrl}
              alt="Profile avatar"
              width={72}
              height={72}
              className={s.avatarLg}
              unoptimized
            />
          ) : (
            <div className={s.avatarFallbackLg}>{initials}</div>
          )}
        </div>

        {/* ── Controls ── */}
        <div className={s.avatarUploadInfo}>
          <p className={s.avatarUploadTitle}>Profile photo</p>
          <p className={s.avatarUploadHint}>JPG, PNG or WebP · Max 5 MB</p>

          {validationErr && (
            <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
              {validationErr}
            </p>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <motion.button
              className={s.buttonSecondary}
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy || cropStage !== 'idle'}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              initial="rest"
              animate="rest"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
            >
              {isBusy
                ? <><Loader2 size={13} className={s.spinner} style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading…</>
                : <><Camera size={13} /> Change photo</>
              }
            </motion.button>

            {hasAvatar && !isBusy && onDeleteAvatar && (
              <motion.button
                className={s.buttonSecondary}
                onClick={onDeleteAvatar}
                disabled={isBusy}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                initial="rest"
                animate="rest"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.85rem',
                  color: '#dc2626',
                  borderColor: '#fecaca',
                }}
              >
                <Trash2 size={13} /> Remove
              </motion.button>
            )}
          </div>

          {/* Upload progress bar */}
          {isBusy && upload.progress > 0 && (
            <div className={s.uploadProgress} style={{ marginTop: '0.5rem' }}>
              <div
                className={s.uploadProgressFill}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Cropper (inline modal-style overlay) ── */}
      {cropStage === 'cropping' && selectedFile && (
        <AdminCropModal>
          <AvatarCropper
            file={selectedFile}
            onComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        </AdminCropModal>
      )}

      {/* ── Preview + confirm ── */}
      {(cropStage === 'previewing' || isBusy) && croppedDataUrl && (
        <AdminCropModal>
          <AvatarPreviewModal
            dataUrl={croppedDataUrl}
            uploading={isBusy}
            onConfirm={handleConfirm}
            onCancel={handlePreviewCancel}
          />
        </AdminCropModal>
      )}
    </>
  )
}

// ── Lightweight modal shell for the admin settings page ──────────────────────
// Keeps the cropper/preview in a centered overlay without pulling in the
// student's Modal component (which may have different z-index/styles).

function AdminCropModal({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         300,
        padding:        '1rem',
      }}
    >
      <div
        style={{
          background:   'var(--surface, #ffffff)',
          borderRadius: '16px',
          boxShadow:    '0 24px 60px rgba(0,0,0,0.18)',
          width:        '100%',
          maxWidth:     '380px',
          overflow:     'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}