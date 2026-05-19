// animations/auth/RoleSelectBackground.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Two-layer canvas animation for the role-selection page.
//
// Layer 1 — Dot grid: a precise coordinate-system grid of dots that pulses
//            in a slow ripple wave emanating from the canvas centre.
//
// Layer 2 — Arc lines: floating anchor points connected by fading bezier
//            arcs, evoking a network / institutional graph feel.
//
// Palette: matches auth.module.css — #f8fafc background, cerulean #3085d8 accent.
// Fully cleaned up on unmount via cancelAnimationFrame + removeEventListener.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Anchor {
  x:     number
  y:     number
  vx:    number
  vy:    number
  phase: number
}

interface Arc {
  a:     number   // index into anchors[]
  b:     number
  life:  number   // 0–1 opacity progress
  dir:   1 | -1   // +1 fading in, -1 fading out
  speed: number
  cp1x:  number   // bezier control points
  cp1y:  number
  cp2x:  number
  cp2y:  number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRID_GAP      = 38     // px between grid dots
const DOT_R         = 1.15   // base dot radius
const ANCHOR_COUNT  = 10
const ARC_COUNT     = 6
const ARC_MAX_A     = 0.12   // max arc opacity (subtle)
const DOT_BASE_A    = 0.13   // base dot opacity
const DOT_PEAK_A    = 0.38   // dot opacity at pulse peak

// ── Component ─────────────────────────────────────────────────────────────────

export function RoleSelectBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) { return }
    const ctx = canvas.getContext('2d')
    if (!ctx)  { return }

    // ── Sizing ───────────────────────────────────────────────────────────────
    let W = 0, H = 0

    function resize() {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W
      canvas.height = H
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Anchors (slow-floating points) ────────────────────────────────────────
    let anchors: Anchor[] = []

    function seedAnchors() {
      anchors = Array.from({ length: ANCHOR_COUNT }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        vx:    (Math.random() - 0.5) * 0.20,
        vy:    (Math.random() - 0.5) * 0.20,
        phase: Math.random() * Math.PI * 2,
      }))
    }
    seedAnchors()

    // ── Arc factory ───────────────────────────────────────────────────────────
    function makeArc(): Arc {
      const a = Math.floor(Math.random() * ANCHOR_COUNT)
      let   b = Math.floor(Math.random() * ANCHOR_COUNT)
      while (b === a) { b = Math.floor(Math.random() * ANCHOR_COUNT) }

      const mx   = (anchors[a].x + anchors[b].x) / 2
      const my   = (anchors[a].y + anchors[b].y) / 2
      const dx   = anchors[b].x - anchors[a].x
      const dy   = anchors[b].y - anchors[a].y
      const perp = { x: -dy, y: dx }
      const plen = Math.sqrt(perp.x ** 2 + perp.y ** 2) || 1
      const bow  = (Math.random() - 0.5) * 0.5
      const D    = Math.max(W, H)

      return {
        a, b,
        life:  Math.random(),
        dir:   1,
        speed: 0.003 + Math.random() * 0.004,
        cp1x:  mx + (perp.x / plen) * bow * D * 0.35,
        cp1y:  my + (perp.y / plen) * bow * D * 0.35,
        cp2x:  mx + (perp.x / plen) * bow * D * 0.18,
        cp2y:  my + (perp.y / plen) * bow * D * 0.18,
      }
    }

    const arcs: Arc[] = Array.from({ length: ARC_COUNT }, makeArc)

    // ── RAF loop ──────────────────────────────────────────────────────────────
    let raf: number
    let t = 0

    function draw() {
      raf = requestAnimationFrame(draw)
      t  += 1

      // ── Background ──────────────────────────────────────────────────────────
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, W, H)

      // ── Layer 1: Dot grid ──────────────────────────────────────────────────
      // Grid origin is centred so dots are always symmetrical
      const offX = (W % GRID_GAP) / 2
      const offY = (H % GRID_GAP) / 2
      const cx   = W / 2
      const cy   = H / 2
      // Ripple: a sine wave radiating from centre, period ~3s
      const rippleSpeed = t * 0.018
      const rippleWave  = 80   // px wavelength influence

      for (let gx = offX; gx < W; gx += GRID_GAP) {
        for (let gy = offY; gy < H; gy += GRID_GAP) {
          const dist   = Math.sqrt((gx - cx) ** 2 + (gy - cy) ** 2)
          const wave   = Math.sin(dist / rippleWave - rippleSpeed)
          const alpha  = DOT_BASE_A + (wave * 0.5 + 0.5) * (DOT_PEAK_A - DOT_BASE_A)
          const radius = DOT_R + (wave * 0.5 + 0.5) * 0.55

          ctx.beginPath()
          ctx.arc(gx, gy, radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(28, 84, 164, ${alpha})`
          ctx.fill()
        }
      }

      // ── Update anchors ──────────────────────────────────────────────────────
      for (const an of anchors) {
        an.x += an.vx + Math.sin(t * 0.005 + an.phase) * 0.15
        an.y += an.vy + Math.cos(t * 0.004 + an.phase) * 0.15
        // Wrap
        if (an.x < -60) { an.x = W + 60 }
        if (an.x > W + 60) { an.x = -60 }
        if (an.y < -60) { an.y = H + 60 }
        if (an.y > H + 60) { an.y = -60 }
      }

      // ── Layer 2: Arc lines ─────────────────────────────────────────────────
      for (const arc of arcs) {
        arc.life += arc.speed * arc.dir

        if (arc.life >= 1) {
          arc.life = 1
          arc.dir  = -1
        } else if (arc.life <= 0) {
          // Reset arc to a new random pair
          const fresh = makeArc()
          Object.assign(arc, fresh, { life: 0, dir: 1 as const })
        }

        const alpha = arc.life * ARC_MAX_A
        const an    = anchors[arc.a]
        const bn    = anchors[arc.b]

        ctx.beginPath()
        ctx.moveTo(an.x, an.y)
        ctx.bezierCurveTo(arc.cp1x, arc.cp1y, arc.cp2x, arc.cp2y, bn.x, bn.y)
        ctx.strokeStyle = `rgba(48, 133, 216, ${alpha})`
        ctx.lineWidth   = 1
        ctx.stroke()

        // Small dot at each anchor end
        for (const pt of [an, bn]) {
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(28, 84, 164, ${alpha * 1.8})`
          ctx.fill()
        }
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        zIndex:        0,
        pointerEvents: 'none',
        display:       'block',
      }}
      aria-hidden="true"
    />
  )
}
