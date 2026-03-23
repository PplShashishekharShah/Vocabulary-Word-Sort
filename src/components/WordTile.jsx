// ─── WordTile Component ───────────────────────────────────────────────────────
// Uses the Wrench asset as the background for words.
// Enlarged for better visibility.

import { ASSETS } from '../utils/constants'

export default function WordTile({
  word,
  onDragStart,
  onShowHint,
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

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: isDragging ? 9999 : 10,
        transition: 'transform 0.1s ease',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        filter: isDragging
          ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.6)) contrast(1.1)'
          : 'drop-shadow(0 8px 15px rgba(0,0,0,0.4))',
        ...style,
      }}
    >
      {/* ── Wrench background ── */}
      <img
        src={ASSETS.wrench}
        alt=""
        draggable={false}
        style={{ width: 200, height: 150, objectFit: 'cover' }}
      />

      {/* ── Word text — sitting on the wrench head/body ── */}
      <div style={{
        position: 'absolute',
        top: '54%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '88%',
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontWeight: 900,
          fontSize: word.text.length > 9 ? 14 : 18,
          color: '#0f172a',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          pointerEvents: 'none',
          textShadow: '0 2px 4px rgba(255,255,255,0.4), 0 0 2px rgba(255,255,255,0.8)',
        }}>
          {word.text}
        </span>
        
        {/* ── '?' Hint Button ── */}
        <div 
          onClick={(e) => { e.stopPropagation(); onShowHint(word); }}
          onMouseEnter={() => onShowHint(word)}
          style={{
            position: 'absolute',
            top: -15, right: -15,
            width: 28, height: 28,
            borderRadius: '50%',
            background: '#f59e0b',
            border: '2px solid #000',
            color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900,
            cursor: 'help',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            pointerEvents: 'auto', // Ensure it captures events despite parent
            zIndex: 100,
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ?
        </div>
      </div>

      {/* ── Red flash border on wrong drop ── */}
      {isWrong && (
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '5px solid #ef4444',
          borderRadius: 10,
          animation: 'flash-shake 0.5s ease',
          pointerEvents: 'none',
          zIndex: 20,
        }} />
      )}

      <style>{`
        @keyframes flash-shake {
          0%, 100% { transform: translateX(0); opacity: 1; }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
