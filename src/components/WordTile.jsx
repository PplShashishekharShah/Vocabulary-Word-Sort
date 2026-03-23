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
        style={{ 
          width: 200, 
          height: 150, 
          objectFit: 'cover',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5)) hue-rotate(190deg) contrast(1.1) brightness(0.95)',
        }}
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
          textShadow: '0 0 1px rgba(255,255,255,0.8), 0 1px 2px rgba(255,255,255,1)',
        }}>
          {word.text}
        </span>
        
        {/* ── '?' Hint Button ── */}
        <div 
          onClick={(e) => { e.stopPropagation(); onShowHint(word); }}
          onMouseEnter={() => onShowHint(word)}
          className="glass"
          style={{
            position: 'absolute',
            top: -42, right: -22,
            width: 32, height: 32,
            borderRadius: '50%',
            color: 'var(--accent-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900,
            cursor: 'help',
            boxShadow: '0 0 15px var(--accent-cyan)',
            border: '2px solid var(--accent-cyan)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            pointerEvents: 'auto', // Ensure it captures events despite parent
            zIndex: 100,
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.25)'; e.currentTarget.style.boxShadow = '0 0 25px var(--accent-cyan)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 15px var(--accent-cyan)'; }}
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
