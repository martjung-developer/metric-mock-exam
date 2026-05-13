/**
 * components/dashboard/student/profile/image/AvatarUploader.tsx
 *
 * The single component consumed by profile/page.tsx.
 *
 * Renders:
 *  - Live avatar (or initials fallback) with camera-overlay button
 *  - "Remove" button when an avatar is present
 *  - Upload modal (Dropzone inside)
 *  - Cropper modal (AvatarCropper)
 *  - Preview modal (AvatarPreviewModal)
 *  - Toast stack
 *
 * All logic is owned by useAvatarUpload().
 * This component is presentational-first — it wires hooks to UI.
 */

'use client'

import Image     from 'next/image'
import { useState, useEffect } from 'react'   // ← add useEffect
import { Camera, Trash2, Loader2 } from 'lucide-react'

import { Modal }              from '../Modal'
import { Dropzone }           from '../Dropzone'
import { Toast }              from '../Toast'
import { AvatarCropper }      from './AvatarCropper'
import { AvatarPreviewModal } from './AvatarPreviewModal'
import { useAvatarUpload }    from '@/lib/hooks/student/profile/useAvatarUpload'

import styles from './../css/AvatarUploader.module.css'

interface AvatarUploaderProps {
  userId:            string
  initialAvatarUrl:  string | null
  initials:          string
  onAvatarChange?:   (url: string | null) => void
}

export function AvatarUploader({
  userId,
  initialAvatarUrl,
  initials,
  onAvatarChange,
}: AvatarUploaderProps) {
  const {
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
  } = useAvatarUpload(userId, initialAvatarUrl)

  useEffect(() => {
    onAvatarChange?.(liveAvatarUrl)
  }, [liveAvatarUrl, onAvatarChange])

  const [uploadOpen, setUploadOpen] = useState(false)

  const isBusy    = stage === 'uploading' || stage === 'deleting'
  const hasAvatar = !!liveAvatarUrl

  function handleFilesAccepted(files: File[]) {
    setUploadOpen(false)
    onFilesAccepted(files)
  }

  return (
    <>
      <div className={styles.root}>
        <div className={styles.avatarWrap}>
          {hasAvatar ? (
            <Image
              src={liveAvatarUrl ?? ''}
              alt="Your profile photo"
              width={80}
              height={80}
              className={styles.avatar}
              unoptimized
            />
          ) : (
            <div className={styles.fallback} aria-label={`Avatar: ${initials}`}>
              <span className={styles.fallbackText}>{initials}</span>
            </div>
          )}

          <span className={styles.dot} aria-hidden="true" />

          <button
            className={styles.cameraBtn}
            onClick={() => setUploadOpen(true)}
            disabled={isBusy}
            aria-label="Change profile photo"
            title="Change profile photo"
          >
            {isBusy
              ? <Loader2 size={12} className={styles.spinner} />
              : <Camera  size={12} />}
          </button>
        </div>

        {hasAvatar && !isBusy && (
          <button
            className={styles.removeBtn}
            onClick={onDeleteAvatar}
            aria-label="Remove profile photo"
            title="Remove photo"
          >
            <Trash2 size={11} /> Remove
          </button>
        )}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload profile photo"
        maxWidth={440}
      >
        <div className={styles.uploadPanel}>
          <div className={styles.uploadHeader}>
            <h2 className={styles.uploadTitle}>Upload a new photo</h2>
            <p className={styles.uploadHint}>
              You can crop and position it on the next step.
            </p>
          </div>
          <Dropzone onFilesAccepted={handleFilesAccepted} disabled={isBusy} />
        </div>
      </Modal>

      <Modal
        open={stage === 'cropping' && !!selectedFile}
        onClose={onCropCancel}
        title="Crop your photo"
        maxWidth={360}
      >
        {selectedFile && (
          <AvatarCropper
            file={selectedFile}
            onComplete={onCropComplete}
            onCancel={onCropCancel}
          />
        )}
      </Modal>

      <Modal
        open={(stage === 'previewing' || stage === 'uploading') && !!croppedDataUrl}
        onClose={onCancelPreview}
        title="Preview your photo"
        maxWidth={380}
      >
        {croppedDataUrl && (
          <AvatarPreviewModal
            dataUrl={croppedDataUrl}
            uploading={stage === 'uploading'}
            onConfirm={onConfirmUpload}
            onCancel={onCancelPreview}
          />
        )}
      </Modal>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
