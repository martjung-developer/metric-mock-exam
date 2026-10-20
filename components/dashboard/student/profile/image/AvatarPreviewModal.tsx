/**
 * components/dashboard/student/profile/image/AvatarPreviewModal.tsx
 *
 * Asks the user to confirm or go back before committing the upload.
 * Shows the cropped result in a large (120 px) and small (48 px) circle
 * so the student can see how it looks at both display sizes.
 */

'use client'

import Image      from 'next/image'
import { Loader2 } from 'lucide-react'
import styles from './../css/PreviewModal.module.css'

interface AvatarPreviewModalProps {
  /** Base64 data-URL produced by the canvas cropper */
  dataUrl:    string
  /** True while the upload request is in-flight */
  uploading:  boolean
  onConfirm:  () => void
  /** Returns to cropper rather than cancelling entirely */
  onCancel:   () => void
}

export function AvatarPreviewModal({
  dataUrl,
  uploading,
  onConfirm,
  onCancel,
}: AvatarPreviewModalProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Preview</h2>
        <p className={styles.subtitle}>
          Here is how your avatar will appear across the app.
        </p>
      </div>

      {/* Size previews */}
      <div className={styles.previews}>
        <div className={styles.previewItem}>
          <div className={styles.circleLg}>
            <Image
              src={dataUrl}
              alt="Avatar preview — large"
              width={120}
              height={120}
              className={styles.img}
              unoptimized
            />
          </div>
          <span className={styles.previewLabel}>Profile</span>
        </div>

        <div className={styles.previewItem}>
          <div className={styles.circleSm}>
            <Image
              src={dataUrl}
              alt="Avatar preview — small"
              width={48}
              height={48}
              className={styles.img}
              unoptimized
            />
          </div>
          <span className={styles.previewLabel}>Thumbnail</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.btnCancel}
          onClick={onCancel}
          disabled={uploading}
        >
          Back to crop
        </button>

        <button
          className={styles.btnConfirm}
          onClick={onConfirm}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className={styles.spinner} />
              Uploading…
            </>
          ) : (
            'Save Avatar'
          )}
        </button>
      </div>
    </div>
  )
}