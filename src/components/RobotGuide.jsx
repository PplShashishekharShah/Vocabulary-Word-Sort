// ─── RobotGuide Component ─────────────────────────────────────────────────────
// Feedback is now purely action-driven (no autonomous timers).
// Optimized Padding and Text alignment.

import { useState, useEffect } from 'react'

export default function RobotGuide({ isPaused, externalMessage }) {
  const [msg, setMsg] = useState("Welcome to the Factory! Let's sort! 🏭")
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (externalMessage) {
      setMsg(externalMessage)
      setVisible(true)
    }
  }, [externalMessage])

  useEffect(() => {
    if (isPaused) {
      setMsg("⏸️ Factory Paused. Take a break!")
      setVisible(true)
    }
  }, [isPaused])

  return (
    <div style={{
      position: 'relative',
      width: 440,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* ── Speech Bubble ── */}
      <div style={{
        position: 'relative',
        marginBottom: -15,
        width: '100%',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <img
          src="/assets/speech_bubble.png"
          alt=""
          style={{ width: '100%', filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.65))' }}
        />
        <div style={{
          position: 'absolute',
          top: '18%', left: '20%', right: '20%', bottom: '30%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          fontFamily: "'Georgia', serif",
          fontWeight: 900,
          fontSize: 15, 
          lineHeight: 1.2,
          color: '#000',
          paddingLeft: '35px',
          paddingRight: '15px',
        }}>
          {msg}
        </div>
      </div>

      {/* ── Robot ── */}
      <img
        src="/assets/robot3.png"
        alt="Robot Assistant"
        style={{
          width: 320,
          height: 'auto',
          filter: 'drop-shadow(0 25px 45px rgba(0,0,0,0.8))',
          animation: isPaused ? 'none' : 'robot-hover 3s ease-in-out infinite',
          transform: 'scaleX(-1)',
        }}
      />

      <style>{`
        @keyframes robot-hover {
          0%, 100% { transform: translateY(0) scaleX(-1); }
          50%       { transform: translateY(-20px) scaleX(-1); }
        }
      `}</style>
    </div>
  )
}
