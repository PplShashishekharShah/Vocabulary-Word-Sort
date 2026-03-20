// ─── EffectsLayer Component ───────────────────────────────────────────────────
// Houses ambient factory effects: floating dust particles and blinking lights.

import { useMemo } from 'react'

// ── Dust Particles ──────────────────────────────────────────────────────────
function DustParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left:     Math.random() * 100,
      delay:    Math.random() * 9,
      duration: 6 + Math.random() * 9,
      size:     2 + Math.random() * 3,
    })),
  [])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 2,
    }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: -10,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(255,200,100,0.55)',
            animation: `dust-float ${p.duration}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ── Factory Blinking Lights ─────────────────────────────────────────────────
const LIGHTS = [
  { top: '7%',  left: '4%',   color: '#10b981', delay: 0 },
  { top: '11%', right: '5%',  color: '#f59e0b', delay: 0.5 },
  { top: '5%',  left: '48%',  color: '#3b82f6', delay: 0.9 },
  { top: '14%', left: '22%',  color: '#ef4444', delay: 1.3 },
  { top: '9%',  right: '22%', color: '#a855f7', delay: 0.3 },
]

function FactoryLights() {
  return (
    <>
      {LIGHTS.map((l, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top:   l.top,
            left:  l.left,
            right: l.right,
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: l.color,
            boxShadow: `0 0 14px ${l.color}, 0 0 28px ${l.color}55`,
            animation: `blink ${1.1 + i * 0.35}s ${l.delay}s ease-in-out infinite`,
            zIndex: 3,
          }}
        />
      ))}
    </>
  )
}

// ── Main Export ─────────────────────────────────────────────────────────────
export default function EffectsLayer() {
  return (
    <>
      <DustParticles />
      <FactoryLights />
    </>
  )
}
