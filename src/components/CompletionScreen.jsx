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
    { label: 'Accuracy', value: `${accuracy}%`, color: '#f59e0b', emoji: '🎯' },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.88)',
      zIndex: 10000,
      animation: 'fade-in 0.5s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: '2px solid #f59e0b',
        borderRadius: 28,
        padding: '52px 68px',
        textAlign: 'center',
        boxShadow: '0 0 70px rgba(245,158,11,0.35), 0 24px 64px rgba(0,0,0,0.6)',
        maxWidth: 500,
        animation: 'scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 76, marginBottom: 18 }}>🏭</div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: 38,
          color: '#f59e0b',
          marginBottom: 10,
          textShadow: '0 0 24px rgba(245,158,11,0.55)',
        }}>
          Factory Complete!
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
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 36 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 14,
              padding: '18px 26px',
              border: `1px solid ${s.color}44`,
            }}>
              <div style={{ fontSize: 30 }}>{s.emoji}</div>
              <div style={{
                color: s.color,
                fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                fontWeight: 700,
                fontSize: 30,
                marginTop: 4,
              }}>
                {s.value}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 12,
                marginTop: 6,
                letterSpacing: 0.5,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Restart button */}
        <button
          onClick={onRestart}
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none',
            borderRadius: 14,
            padding: '15px 44px',
            color: '#1a1a2e',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: 19,
            cursor: 'pointer',
            boxShadow: '0 4px 22px rgba(245,158,11,0.45)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.07)'
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(245,158,11,0.6)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 22px rgba(245,158,11,0.45)'
          }}
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  )
}
