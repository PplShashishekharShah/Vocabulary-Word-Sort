// ─── CategoryBins Component ───────────────────────────────────────────────────
// Center-aligned labels over bins with perfect offset.

import { useRef, useEffect } from 'react'
import { ASSETS } from '../utils/constants'

// User's perfected horizontal positions (Left% edge)
const BIN_POSITIONS = [
  { left: '20%' },   // cat_1 – Positive (Yellow)
  { left: '44%' },   // cat_2 – Sad (Red)
  { left: '68%' },   // cat_3 – Angry (Blue)
]

export default function CategoryBins({
  categories,
  binCounts,
  glowingBin,
  shakingBin,
  dragging,
  binsRef,
}) {
  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0,
      bottom: -15, 
      height: 280,
      zIndex: 15,
      pointerEvents: 'none',
    }}>
      {categories.map((cat, i) => (
        <BinItem
          key={cat.id}
          category={cat}
          index={i}
          sortedCount={binCounts[cat.id] ?? 0}
          isGlowing={glowingBin === cat.id}
          isShaking={shakingBin === cat.id}
          binsRef={binsRef}
        />
      ))}
    </div>
  )
}

function BinItem({ category, index, sortedCount, isGlowing, isShaking, binsRef }) {
  const binRef = useRef(null)
  const pos    = BIN_POSITIONS[index]

  useEffect(() => {
    binsRef.current[index] = binRef.current
  })

  const SLOT_W = 210  
  const IMG_W  = SLOT_W * 3 

  return (
    <div
      ref={binRef}
      data-category-id={category.id}
      style={{
        position: 'absolute',
        ...pos,
        bottom: 0,
        width: SLOT_W,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        animation: isShaking ? 'shake 0.4s ease' : 'none',
        zIndex: 10,
        transition: 'transform 0.2s ease',
        transform: isGlowing ? 'scale(1.05)' : 'scale(1)',
        pointerEvents: 'auto',
      }}
    >
      {/* ── Focused Label Strip ── */}
      <div className="glass" style={{
        border: `2px solid ${category.color}`,
        borderRadius: 12,
        padding: '8px 18px',
        marginBottom: -10, // Move it closer to the bin
        position: 'relative',
        top: -5,
        textAlign: 'center',
        boxShadow: isGlowing
          ? `0 0 30px ${category.glow}`
          : `0 4px 15px rgba(0,0,0,0.4), inset 0 0 10px ${category.glow}33`,
        minWidth: 180,
        boxSizing: 'border-box',
        zIndex: 20,
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontWeight: 900,
          fontSize: 11,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          lineHeight: 1.2,
          textShadow: `0 0 8px ${category.glow}`,
        }}>
          {category.label}
        </div>
        {sortedCount > 0 && (
          <div style={{ fontSize: 10, color: 'var(--accent-cyan)', marginTop: 4, fontWeight: 800, letterSpacing: 0.5 }}>
            {sortedCount} SAVED
          </div>
        )}
      </div>

      {/* ── Bin Masked Image ── */}
      <div style={{
        width: SLOT_W,
        height: 180,
        overflow: 'hidden',
        position: 'relative',
        filter: isGlowing
          ? `drop-shadow(0 0 20px ${category.color}) brightness(1.2)`
          : 'drop-shadow(0 8px 25px rgba(0,0,0,0.6))',
        transition: 'filter 0.3s ease',
      }}>
        <img
          src={ASSETS.bins}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: 0,
            left: `-${index * SLOT_W}px`,
            width: IMG_W,
            height: '100%',
            objectFit: 'cover',
            filter: 'hue-rotate(-10deg) saturate(1.1)',
          }}
        />
        {isGlowing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle, ${category.glow} 0%, transparent 75%)`,
            animation: 'bin-glow-pulse 0.6s ease infinite alternate',
          }} />
        )}
      </div>
    </div>
  )
}
