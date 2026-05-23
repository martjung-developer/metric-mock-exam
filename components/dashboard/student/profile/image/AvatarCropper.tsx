/**
 * components/dashboard/student/profile/image/AvatarCropper.tsx
 *
 * Facebook-style circular 1:1 avatar crop powered by a plain HTMLCanvasElement.
 * No external crop library — zero extra bundle weight.
 *
 * Features:
 *  - Circular preview clip on the canvas
 *  - Drag to pan (mouse + touch)
 *  - Range slider to zoom (0.5× – 3×)
 *  - Exports a square PNG data-URL via onComplete
 */

'use client'

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type MouseEvent  as RMouseEvent,
  type TouchEvent  as RTouchEvent,
} from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import styles from './../css/AvatarCropper.module.css'

const OUTPUT_SIZE = 320   // output PNG side length in px

interface AvatarCropperProps {
  file:       File
  onComplete: (dataUrl: string) => void
  onCancel:   () => void
}

export function AvatarCropper({ file, onComplete, onCancel }: AvatarCropperProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const imageRef   = useRef<HTMLImageElement | null>(null)
  const dragging   = useRef(false)
  const lastPos    = useRef<{ x: number; y: number } | null>(null)
  const offset     = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const zoomRef = useRef(1)
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  // ── Draw ───────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img    = imageRef.current
    if (!canvas || !img) {return}

    const ctx = canvas.getContext('2d')
    if (!ctx) {return}

    const base  = (img as HTMLImageElement & { baseScale?: number }).baseScale ?? 1
    const scale = base * zoomRef.current
    const drawW = img.naturalWidth  * scale
    const drawH = img.naturalHeight * scale

    const x = (OUTPUT_SIZE - drawW) / 2 + offset.current.x
    const y = (OUTPUT_SIZE - drawH) / 2 + offset.current.y

    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    // Clip to circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()

    // Slight boost so uploaded portraits do not look dull in dark UI contexts.
    ctx.filter = 'saturate(1.15) brightness(1.06) contrast(1.03)'
    ctx.drawImage(img, x, y, drawW, drawH)
    ctx.filter = 'none'
    ctx.restore()
  }, [])

  // ── Load image ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      imageRef.current = img
      // baseScale makes zoom=1 fill the canvas exactly
      const baseScale = Math.max(
        OUTPUT_SIZE / img.naturalWidth,
        OUTPUT_SIZE / img.naturalHeight,
      )
      ;(img as HTMLImageElement & { baseScale: number }).baseScale = baseScale
      offset.current = { x: 0, y: 0 }
      setZoom(1)
      requestAnimationFrame(draw)
    }
    img.src = url

    return () => URL.revokeObjectURL(url)
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { draw() }, [zoom, draw])

  // ── Pointer helpers ────────────────────────────────────────────────────────
  function getXY(e: RMouseEvent | RTouchEvent): { x: number; y: number } {
    if ('touches' in e) {return { x: e.touches[0].clientX, y: e.touches[0].clientY }}
    return { x: e.clientX, y: e.clientY }
  }

  const onPointerDown = useCallback((e: RMouseEvent | RTouchEvent) => {
    dragging.current = true
    lastPos.current  = getXY(e)
    setIsDragging(true)
  }, [])

  const onPointerMove = useCallback((e: RMouseEvent | RTouchEvent) => {
    if (!dragging.current || !lastPos.current) {return}
    const { x, y } = getXY(e)
    offset.current.x += x - lastPos.current.x
    offset.current.y += y - lastPos.current.y
    lastPos.current = { x, y }
    draw()
  }, [draw])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    lastPos.current  = null
    setIsDragging(false)
  }, [])

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {return}
    onComplete(canvas.toDataURL('image/png', 0.92))
  }, [onComplete])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Crop your photo</h2>
        <p className={styles.hint}>Drag to reposition · use the slider to zoom</p>
      </div>

      {/* Canvas */}
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={OUTPUT_SIZE}
          height={OUTPUT_SIZE}
          className={styles.canvas}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />
        {/* Decorative outer ring */}
        <div className={styles.ring} aria-hidden="true" />
      </div>

      {/* Zoom controls */}
      <div className={styles.zoomRow}>
        <button
          className={styles.zoomBtn}
          aria-label="Zoom out"
          onClick={() =>
            setZoom(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(2))))
          }
        >
          <ZoomOut size={14} />
        </button>

        <input
          type="range"
          className={styles.slider}
          min={0.5}
          max={3}
          step={0.05}
          value={zoom}
          onChange={e => setZoom(parseFloat(e.target.value))}
          aria-label="Zoom level"
          aria-valuemin={0.5}
          aria-valuemax={3}
          aria-valuenow={zoom}
        />

        <button
          className={styles.zoomBtn}
          aria-label="Zoom in"
          onClick={() =>
            setZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(2))))
          }
        >
          <ZoomIn size={14} />
        </button>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.btnCancel} onClick={onCancel}>
          Cancel
        </button>
        <button className={styles.btnConfirm} onClick={handleConfirm}>
          Apply Crop
        </button>
      </div>
    </div>
  )
}
