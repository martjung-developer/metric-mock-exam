// animations/auth/MoleculeBackground.tsx
'use client'
// ─────────────────────────────────────────────────────────────────────────────
// M.E.T.R.I.C. auth background — bright pearl-white + cerulean.
// Light, airy, educational feel. Auto-spawned ripples only — no mouse tracking.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const MAX_RIPPLES  = 18
const RIPPLE_DECAY = 0.975
const RIPPLE_SPEED = 0.013

const SIZE_SMALL  = 0.40
const SIZE_MEDIUM = 0.80
const SIZE_LARGE  = 1.30

const SPAWN_SCHEDULE: Array<{ delay: number; size: number }> = [
  { delay:    0, size: SIZE_SMALL  },
  { delay:  900, size: SIZE_LARGE  },
  { delay: 1800, size: SIZE_SMALL  },
  { delay: 2500, size: SIZE_MEDIUM },
  { delay: 3600, size: SIZE_LARGE  },
  { delay: 4400, size: SIZE_SMALL  },
  { delay: 5200, size: SIZE_MEDIUM },
  { delay: 6100, size: SIZE_SMALL  },
  { delay: 6900, size: SIZE_LARGE  },
  { delay: 7700, size: SIZE_MEDIUM },
  { delay: 8400, size: SIZE_SMALL  },
]
const SCHEDULE_DURATION = 9000

const SPAWN_ZONES = [
  { x: 0.30, y: 0.35 }, { x: 0.70, y: 0.60 }, { x: 0.50, y: 0.50 },
  { x: 0.20, y: 0.65 }, { x: 0.75, y: 0.30 }, { x: 0.55, y: 0.72 },
  { x: 0.38, y: 0.22 }, { x: 0.62, y: 0.45 }, { x: 0.45, y: 0.80 },
  { x: 0.82, y: 0.55 }, { x: 0.25, y: 0.48 },
]

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`

const fragmentShader = /* glsl */`
  precision mediump float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uRipplePos[${MAX_RIPPLES}];
  uniform float uRippleAge[${MAX_RIPPLES}];
  uniform float uRippleAmp[${MAX_RIPPLES}];
  uniform int   uRippleCount;

  varying vec2 vUv;

  // ── Bright pearl-white + cerulean palette ──────────────────────────────
  vec3 white      = vec3(0.970, 0.975, 0.992);  // #f7f8fd  near-white
  vec3 pearl      = vec3(0.888, 0.918, 0.965);  // #e3eaf6  cool pearl
  vec3 skyLight   = vec3(0.720, 0.840, 0.960);  // #b8d6f5  sky blue
  vec3 cerulean   = vec3(0.188, 0.522, 0.847);  // #3085d8  vivid cerulean
  vec3 ceruleanDk = vec3(0.110, 0.330, 0.640);  // #1c54a4  deeper blue
  vec3 rippleCol  = vec3(0.550, 0.800, 1.000);  // bright blue-white ripple

  float waveRing(float dist, float age, float amp, float sizeScale) {
    float radius = age * (0.35 + sizeScale * 0.25);
    float width  = 0.008 + age * 0.012 + sizeScale * 0.006;
    float t      = (dist - radius) / width;
    return exp(-t * t * 2.5) * amp * exp(-age * (1.2 - sizeScale * 0.3));
  }

  void main() {
    vec2  uv     = vUv;
    float aspect = uResolution.x / uResolution.y;

    // ── Base gradient: bright white top → cerulean bottom ─────────────────
    float topFade  = 1.0 - smoothstep(0.0, 0.55, uv.y);
    float botFade  = smoothstep(0.35, 1.0,  uv.y);
    float sideFade = smoothstep(0.0, 0.40, uv.x) * (1.0 - smoothstep(0.60, 1.0, uv.x));

    vec3 leftBlue  = mix(pearl, ceruleanDk, botFade * 0.70);
    vec3 rightBlue = mix(white, cerulean,   botFade * 0.55);
    vec3 bg        = mix(leftBlue, rightBlue, uv.x);

    bg = mix(bg, white, topFade * 0.60);

    // ── Subtle animated shimmer bands ─────────────────────────────────────
    float wA = sin(uv.x * 8.0  + uTime * 0.22) * 0.003;
    float wB = sin(uv.x * 14.0 - uTime * 0.16 + uv.y * 2.5) * 0.002;
    float wC = cos(uv.y * 10.0 + uTime * 0.12) * 0.002;
    bg += (wA + wB + wC);

    // ── Very soft edge darkening ───────────────────────────────────────────
    vec2  ctr      = uv - 0.5;
    float vignette = 1.0 - dot(ctr, ctr) * 0.22;
    bg *= mix(0.94, 1.0, clamp(vignette, 0.0, 1.0));

    // ── White radial glow — top centre (adds brightness / lift) ──────────
    vec2  topGlowCtr = uv - vec2(0.50, 0.08);
    topGlowCtr.x *= aspect;
    float topGlow   = exp(-dot(topGlowCtr, topGlowCtr) / (2.0 * 0.28 * 0.28));
    float breathe   = 0.93 + 0.07 * sin(uTime * 0.85);
    bg += white * topGlow * 0.22 * breathe;

    // ── Cerulean glow bottom-right accent ─────────────────────────────────
    vec2  brCtr = uv - vec2(0.88, 0.85);
    brCtr.x *= aspect;
    bg += cerulean * exp(-dot(brCtr, brCtr) / (2.0 * 0.20 * 0.20)) * 0.18;

    // ── Ripple rings ───────────────────────────────────────────────────────
    float totalWave = 0.0;
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      if (i >= uRippleCount) break;
      if (uRippleAmp[i] < 0.004) continue;
      float sizeScale = clamp((uRippleAmp[i] - 0.35) / 1.0, 0.0, 1.0);
      vec2  rd   = vec2((uv.x - uRipplePos[i].x) * aspect, uv.y - uRipplePos[i].y);
      totalWave += waveRing(length(rd), uRippleAge[i], uRippleAmp[i], sizeScale);
    }

    float wave = clamp(totalWave, 0.0, 1.0);
    bg += rippleCol * wave * 0.45;
    bg += vec3(1.0) * pow(wave, 3.5) * 0.28;

    gl_FragColor = vec4(clamp(bg, 0.0, 1.0), 1.0);
  }
`

// ── Fallback shown when WebGL is unavailable or context creation fails ──────
function StaticFallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 50% 8%, #f7f8fd 0%, #e3eaf6 35%, #b8d6f5 70%, #3085d8 100%)',
      }}
    />
  )
}

export function MoleculeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  // null = "haven't decided yet", true = WebGL available, false = use fallback
  const [webglOk, setWebglOk] = useState<boolean | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {return}

    // ── Detect WebGL support / context-creation failure up front ──────────
    // (covers: hardware accel disabled, too many live contexts from HMR,
    //  headless/CI environments, blocklisted drivers, etc.)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        // fail fast instead of silently falling back to software/Canvas2D,
        // so we can catch it and render our own CSS fallback
        failIfMajorPerformanceCaveat: false,
      })
    } catch (err) {
      console.warn('[MoleculeBackground] WebGL context creation failed, using static fallback:', err)
      // This effect detects an external browser capability and selects the CSS fallback.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWebglOk(false)
      return
    }

    setWebglOk(true)
    renderer.setPixelRatio(1)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    interface Ripple { x: number; y: number; age: number; amp: number }
    const ripples: Ripple[] = []

    function spawnRipple(nx: number, ny: number, amp: number) {
      ripples.push({ x: nx, y: 1.0 - ny, age: 0, amp })
      if (ripples.length > MAX_RIPPLES) {ripples.shift()}
    }

    const posArr = new Float32Array(MAX_RIPPLES * 2)
    const ageArr = new Float32Array(MAX_RIPPLES)
    const ampArr = new Float32Array(MAX_RIPPLES)

    const uniforms = {
      uTime:        { value: 0 },
      uResolution:  { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
      uRipplePos:   { value: posArr },
      uRippleAge:   { value: ageArr },
      uRippleAmp:   { value: ampArr },
      uRippleCount: { value: 0 },
    }

    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
    scene.add(new THREE.Mesh(geo, mat))

    const startTime = performance.now()
    let scheduleEpoch = 0
    let nextIdx = 0

    function tickScheduler(now: number) {
      const elapsed  = now - startTime
      const cyclePos = elapsed % SCHEDULE_DURATION
      const cycle    = Math.floor(elapsed / SCHEDULE_DURATION)
      if (cycle > scheduleEpoch) { scheduleEpoch = cycle; nextIdx = 0 }
      while (nextIdx < SPAWN_SCHEDULE.length && cyclePos >= SPAWN_SCHEDULE[nextIdx].delay) {
        const entry = SPAWN_SCHEDULE[nextIdx]
        const zone  = SPAWN_ZONES[nextIdx % SPAWN_ZONES.length]
        const jx    = zone.x + (Math.random() - 0.5) * 0.06
        const jy    = zone.y + (Math.random() - 0.5) * 0.06
        spawnRipple(Math.max(0.05, Math.min(0.95, jx)), Math.max(0.05, Math.min(0.95, jy)), entry.size)
        nextIdx++
      }
    }

    function onResize() {
      const w = mount.clientWidth, h = mount.clientHeight
      renderer.setSize(w, h)
      uniforms.uResolution.value.set(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── Handle context loss mid-session (GPU reset, tab backgrounding,
    //    too many contexts opened elsewhere on the page, etc.) ─────────────
    function onContextLost(e: Event) {
      e.preventDefault()
      cancelAnimationFrame(raf)
      console.warn('[MoleculeBackground] WebGL context lost, switching to static fallback')
      setWebglOk(false)
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)

    let raf: number, frame = 0
    function animate() {
      raf = requestAnimationFrame(animate)
      frame++
      tickScheduler(performance.now())
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].age += RIPPLE_SPEED
        ripples[i].amp *= RIPPLE_DECAY
        if (ripples[i].amp < 0.004) {ripples.splice(i, 1)}
      }
      const count = Math.min(ripples.length, MAX_RIPPLES)
      for (let i = 0; i < count; i++) {
        posArr[i * 2] = ripples[i].x;  posArr[i * 2 + 1] = ripples[i].y
        ageArr[i]     = ripples[i].age; ampArr[i]          = ripples[i].amp
      }
      uniforms.uRippleCount.value = count
      uniforms.uTime.value        = frame * 0.016
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.dispose(); mat.dispose(); geo.dispose()
      // forceContextLoss releases the GPU context immediately instead of
      // waiting for GC — this is what prevents "too many WebGL contexts"
      // errors from piling up across Next.js fast-refresh remounts in dev.
      renderer.forceContextLoss()
      if (mount.contains(renderer.domElement)) {mount.removeChild(renderer.domElement)}
    }
  }, [])

  if (webglOk === false) {
    return <StaticFallback />
  }

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
        background: '#e8f0fb', // bright pearl-blue fallback while mounting
      }}
    />
  )
}
