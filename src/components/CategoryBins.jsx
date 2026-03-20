// ─── CategoryBins Component ───────────────────────────────────────────────────
// Center-aligned labels over bins with minimal gaps.
// Sprites: 0=Yellow, 1=Red, 2=Blue (based on user visuals).

import { useRef, useEffect } from 'react'
import { ASSETS } from '../utils/constants'

// User's perfected horizontal positions (Left% edge)
const BIN_POSITIONS = [
  { left: '22%' },   // cat_1 – Positive (Yellow)
  { left: '45%' },   // cat_2 – Sad (Red)
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
      bottom: -15,          // Adjusted for floor alignment
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
        alignItems: 'center',       // Center everything horizontally
        justifyContent: 'flex-end',
        animation: isShaking ? 'shake 0.4s ease' : 'none',
        zIndex: 10,
        transition: 'transform 0.2s ease',
        transform: isGlowing ? 'scale(1.05)' : 'scale(1)',
        pointerEvents: 'auto',
      }}
    >
      {/* ── Focused Label Strip ── */}
      <div style={{
        background: 'rgba(0,0,0,0.9)',
        border: `2px solid ${category.color}`,
        borderRadius: 8,
        padding: '4px 12px',
        marginBottom: -12,          // Overlap bin clip slightly for tight look
        textAlign: 'center',
        boxShadow: isGlowing
          ? `0 0 25px ${category.glow}`
          : '0 4px 12px rgba(0,0,0,0.7)',
        width: 175,
        boxSizing: 'border-box',
        zIndex: 20,
      }}>
        <div style={{
          fontFamily: "'Georgia', serif",
          fontWeight: 900,
          fontSize: 9.5,
          color: category.color,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          lineHeight: 1.1,
        }}>
          {category.label}
        </div>
        {sortedCount > 0 && (
          <div style={{ fontSize: 9, color: '#10b981', marginTop: 2, fontWeight: 700 }}>
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
          ? `drop-shadow(0 0 15px ${category.color})`
          : 'drop-shadow(0 8px 20px rgba(0,0,0,0.8))',
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
          }}
        />
        {isGlowing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle, ${category.glow} 0%, transparent 80%)`,
            animation: 'bin-glow-pulse 0.5s ease',
          }} />
        )}
      </div>
    </div>
  )
}
