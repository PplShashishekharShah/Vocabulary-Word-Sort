// ─── CompletionScreen Component ───────────────────────────────────────────────
// Full-screen overlay shown when all words have been sorted.

/**
 * @param {object}   props
 * @param {number}   props.score      - number of correct drops
 * @param {number}   props.incorrect  - number of wrong drops
 * @param {number}   props.total      - total words
 * @param {function} props.onRestart  - callback to reset the game
 */
export default function CompletionScreen({ score, incorrect, total, onRestart }) {
  const accuracy = Math.round((score / (score + incorrect || 1)) * 100)

  const stats = [
    { label: 'Correct',  value: score,       color: '#10b981', emoji: '✅' },
    { label: 'Wrong',    value: incorrect,   color: '#ef4444', emoji: '❌' },
    { label: 'Accuracy', value: `${accuracy}%`, color: '#38bdf8', emoji: '🎯' },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(2, 6, 23, 0.95)',
      zIndex: 10000,
      animation: 'fade-in 0.5s ease',
    }}>
      <div className="glass" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '3px solid var(--accent-cyan)',
        borderRadius: 32,
        padding: '52px 68px',
        textAlign: 'center',
        boxShadow: '0 0 80px rgba(34, 211, 238, 0.25), 0 24px 64px rgba(0,0,0,0.7)',
        maxWidth: 500,
        animation: 'scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 76, marginBottom: 18 }}>🏭</div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: 40,
          color: 'var(--accent-cyan)',
          marginBottom: 10,
          textShadow: '0 0 25px rgba(34, 211, 238, 0.5)',
          fontWeight: 900,
        }}>
          Mission Complete!
        </h1>

        {/* Sub-title */}
        <p style={{
          color: 'rgba(255,255,255,0.65)',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: 16,
          marginBottom: 36,
        }}>
          All words have been sorted ✅
        </p>

        {/* Stats cards */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 40 }}>
          {stats.map(s => (
            <div key={s.label} className="glass" style={{
              borderRadius: 18,
              padding: '20px 28px',
              border: `1px solid ${s.color}66`,
              flex: 1,
              background: 'rgba(255,255,255,0.03)',
            }}>
              <div style={{ fontSize: 32 }}>{s.emoji}</div>
              <div style={{
                color: s.color,
                fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                fontWeight: 900,
                fontSize: 32,
                marginTop: 6,
                textShadow: `0 0 10px ${s.color}44`,
              }}>
                {s.value}
              </div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 13,
                marginTop: 8,
                letterSpacing: 1,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Restart button */}
        <button
          onClick={onRestart}
          className="btn-premium"
          style={{
            padding: '18px 52px',
            fontSize: 20,
            boxShadow: '0 0 30px rgba(37, 99, 235, 0.4)',
          }}
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  )
}
