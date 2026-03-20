// ─── WordTile Component ───────────────────────────────────────────────────────
// A single draggable word tile with an upgraded metallic "factory-themed" design.

import { ASSETS } from '../utils/constants'

export default function WordTile({
  word,
  onDragStart,
  isDragging,
  isCorrect,
  isWrong,
  style,
}) {
  if (isCorrect) return null

  const handleMouseDown = (e) => {
    e.preventDefault()
    onDragStart(e, word)
  }

  // Design tokens for the "good design" upgrade
  const isSelected = isDragging
  
  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isSelected ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: isSelected ? 9999 : 10,
        transition: 'transform 0.1s ease',
        transform: isSelected ? 'scale(1.1) rotate(2deg)' : 'scale(1)',
        filter: isSelected
          ? 'drop-shadow(0 15px 30px rgba(0,0,0,0.6)) contrast(1.1)'
          : 'drop-shadow(0 5px 12px rgba(0,0,0,0.4))',
        ...style,
      }}
    >
      {/* ── Outer metallic frame ── */}
      <div style={{
        position: 'absolute',
        inset: -2,
        background: 'linear-gradient(135deg, #bbb 0%, #666 50%, #888 100%)',
        borderRadius: 12,
        zIndex: -1,
        border: '1px solid rgba(255,255,255,0.3)',
      }} />

      {/* ── Tile body ── */}
      <div style={{
        position: 'relative',
        width: 110,
        height: 44,
        background: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.05)',
      }}>
        {/* Subtle glass overlay highlight */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
          pointerEvents: 'none',
        }} />

        {/* The word text — sharpened with letter spacing and slight shadow */}
        <span style={{
          position: 'relative',
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          fontWeight: 800,
          fontSize: word.text.length > 9 ? 12 : 15,
          color: '#1e293b',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          pointerEvents: 'none',
          textShadow: '0 1px 0 rgba(255,255,255,1)',
        }}>
          {word.text}
        </span>
      </div>

      {/* ── Red flash border on wrong drop ── */}
      {isWrong && (
        <div style={{
          position: 'absolute',
          inset: -4,
          border: '4px solid #ef4444',
          borderRadius: 14,
          animation: 'flash-shake 0.5s ease',
          pointerEvents: 'none',
          zIndex: 20,
        }} />
      )}

      <style>{`
        @keyframes flash-shake {
          0%, 100% { transform: translateX(0); opacity: 1; }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
