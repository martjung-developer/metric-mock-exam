// components/auth/AuthBackground.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Canvas-based animated background for auth pages.
// Floating, mouse-reactive nodes connected by proximity lines.
// Fully cleans up on unmount (rAF + event listeners).
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useEffect, useRef } from 'react'

interface Node {
  x:     number
  y:     number
  vx:    number
  vy:    number
  r:     number
  phase: number
  speed: number
}

const NODE_COUNT   = 72
const CONNECT_DIST = 140
const MOUSE_RADIUS = 180

const PRIMARY   = { r: 13,  g: 37,  b: 64  } as const
const ACCENT    = { r: 99,  g: 102, b: 241 } as const
const HIGHLIGHT = { r: 139, g: 92,  b: 246 } as const

type RGB = { r: number; g: number; b: number }

function rgba(col: RGB, a: number): string {
  return `rgba(${col.r},${col.g},${col.b},${a})`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function AuthBackground(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) { return }

    const ctx = canvas.getContext('2d')
    if (!ctx) { return }

    let W = window.innerWidth
    let H = window.innerHeight

    function resize(): void {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W
      canvas.height = H
    }
    resize()
    window.addEventListener('resize', resize)

    const mouse = { x: W / 2, y: H / 2 }
    function onMouseMove(e: MouseEvent): void {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', onMouseMove)

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      r:     Math.random() * 2.5 + 1,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
    }))

    let raf: number
    let t   = 0

    function draw(): void {
      raf = requestAnimationFrame(draw)
      t  += 1

      const grad = ctx.createLinearGradient(0, 0, W, H)
      grad.addColorStop(0,   '#f8faff')
      grad.addColorStop(0.5, '#f0f4ff')
      grad.addColorStop(1,   '#eef2ff')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      for (const n of nodes) {
        n.x += n.vx + Math.sin(t * n.speed + n.phase) * 0.18
        n.y += n.vy + Math.cos(t * n.speed + n.phase) * 0.18

        const dx  = n.x - mouse.x
        const dy  = n.y - mouse.y
        const dst = Math.sqrt(dx * dx + dy * dy)
        if (dst < MOUSE_RADIUS && dst > 0) {
          const force = (MOUSE_RADIUS - dst) / MOUSE_RADIUS
          n.x = lerp(n.x, n.x + (dx / dst) * force * 3.5, 0.08)
          n.y = lerp(n.y, n.y + (dy / dst) * force * 3.5, 0.08)
        }

        if (n.x < -20)    { n.x = W + 20 }
        if (n.x > W + 20) { n.x = -20    }
        if (n.y < -20)    { n.y = H + 20 }
        if (n.y > H + 20) { n.y = -20    }
      }

      // Connections
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const a  = nodes[i]
          const b  = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d >= CONNECT_DIST) { continue }

          const alpha      = (1 - d / CONNECT_DIST) * 0.18
          const mda        = Math.hypot(a.x - mouse.x, a.y - mouse.y)
          const mdb        = Math.hypot(b.x - mouse.x, b.y - mouse.y)
          const isNearMouse = mda < MOUSE_RADIUS || mdb < MOUSE_RADIUS

          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = isNearMouse ? rgba(ACCENT, alpha * 2.2) : rgba(PRIMARY, alpha)
          ctx.lineWidth   = isNearMouse ? 1.2 : 0.7
          ctx.stroke()
        }
      }

      // Nodes
      for (const n of nodes) {
        const mdist  = Math.hypot(n.x - mouse.x, n.y - mouse.y)
        const isNear = mdist < MOUSE_RADIUS

        if (isNear) {
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 8)
          glow.addColorStop(0, rgba(HIGHLIGHT, 0.22))
          glow.addColorStop(1, rgba(HIGHLIGHT, 0))
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 8, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(n.x, n.y, isNear ? n.r * 1.6 : n.r, 0, Math.PI * 2)
        ctx.fillStyle = isNear ? rgba(ACCENT, 0.75) : rgba(PRIMARY, 0.22)
        ctx.fill()
      }

      // Ambient orbs
      const orbData = [
        { cx: W * 0.15, cy: H * 0.2,  size: 220, col: ACCENT    },
        { cx: W * 0.85, cy: H * 0.75, size: 180, col: HIGHLIGHT },
        { cx: W * 0.5,  cy: H * 0.88, size: 140, col: PRIMARY   },
      ] as const

      for (const o of orbData) {
        const ox  = o.cx + Math.sin(t * 0.004 + o.size) * 28
        const oy  = o.cy + Math.cos(t * 0.003 + o.size) * 18
        const orb = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.size)
        orb.addColorStop(0, rgba(o.col, 0.055))
        orb.addColorStop(1, rgba(o.col, 0))
        ctx.beginPath()
        ctx.arc(ox, oy, o.size, 0, Math.PI * 2)
        ctx.fillStyle = orb
        ctx.fill()
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
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
