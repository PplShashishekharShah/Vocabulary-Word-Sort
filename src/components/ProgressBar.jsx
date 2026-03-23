// ─── ProgressBar Component ────────────────────────────────────────────────────
// Displays the top HUD: sorted count, animated fill bar, score, wrong count.

export default function ProgressBar({ sorted, total, score, incorrect }) {
  const pct = Math.round((sorted / total) * 100)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      background: 'rgba(0,0,0,0.65)',
      borderRadius: 14,
      padding: '8px 20px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {/* Word count */}
      <div style={{
        color: 'var(--accent-cyan)',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        fontWeight: 900,
        fontSize: 14,
        whiteSpace: 'nowrap',
        letterSpacing: 1,
        textShadow: '0 0 10px rgba(34, 211, 238, 0.3)',
      }}>
        ⚙️ {sorted} / {total}
      </div>

      {/* Animated progress bar */}
      <div style={{
        flex: 1,
        minWidth: 130,
        height: 11,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 999,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
          borderRadius: 999,
          transition: 'width 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)',
        }} />
      </div>

      {/* Correct count */}
      <div style={{
        color: '#10b981',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        fontWeight: 700,
        fontSize: 13,
      }}>
        ✅ {score}
      </div>

      {/* Wrong count — only shown if > 0 */}
      {incorrect > 0 && (
        <div style={{
          color: '#ef4444',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontWeight: 700,
          fontSize: 13,
        }}>
          ❌ {incorrect}
        </div>
      )}
    </div>
  )
}
