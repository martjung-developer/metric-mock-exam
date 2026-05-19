/**
 * components/dashboard/student/profile/Dropzone.tsx
 *
 * Accessible drag-and-drop image picker.
 * Accepts JPG / PNG / WebP.
 * Falls back to a hidden <input type="file"> for keyboard/click access.
 *
 * Props:
 *  onFilesAccepted — called with the selected File array
 *  disabled        — prevents interaction (used when upload is in-flight)
 */

'use client'

import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { UploadCloud } from 'lucide-react'
import styles from './css/Dropzone.module.css'

interface DropzoneProps {
  onFilesAccepted: (files: File[]) => void
  disabled?:       boolean
}

const ACCEPT = '.jpg,.jpeg,.png,.webp'

export function Dropzone({ onFilesAccepted, disabled }: DropzoneProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState(false)

  const open = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setActive(false)
    if (disabled) {return}
    const files = Array.from(e.dataTransfer.files)
    if (files.length) {onFilesAccepted(files)}
  }, [disabled, onFilesAccepted])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {setActive(true)}
  }, [disabled])

  const handleDragLeave = useCallback(() => setActive(false), [])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) {onFilesAccepted(files)}
    e.target.value = ''   // allow re-selecting the same file
  }, [onFilesAccepted])

  const handleKey = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {open()}
  }, [open])

  return (
    <div
      className={`${styles.zone} ${active ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={open}
      onKeyDown={handleKey}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload avatar image. Click or drag and drop."
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className={styles.hiddenInput}
        onChange={handleChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className={styles.iconWrap}>
        <UploadCloud size={28} strokeWidth={1.5} />
      </div>

      <p className={styles.headline}>
        {active ? 'Drop to select' : 'Drag & drop your photo here'}
      </p>
      <p className={styles.sub}>
        or <span className={styles.link}>browse files</span>
      </p>
      <p className={styles.hint}>JPG · PNG · WebP · max 5 MB</p>
    </div>
  )
}
