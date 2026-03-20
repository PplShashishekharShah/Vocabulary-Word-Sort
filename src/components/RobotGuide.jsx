// ─── RobotGuide Component ─────────────────────────────────────────────────────
// Robot character on the left side with a speech bubble for game guidance.

import { useState, useEffect } from 'react'

const MESSAGES = [
  "Sorting words helps expand your mind! 🧠",
  "😊 Joyful? That's definitely Positive!",
  "😤 Irritated? Put it in the Angry bin!",
  "😢 Sorrowful? Sad bin is waiting!",
  "Don't let too many words pass by! ⚡",
  "The factory is in full gear! 🏭",
  "Precision is key! No mistakes! ✅",
  "Factory status: Green! Keep going! 🚀",
]

const PAUSE_MESSAGE = "⏸️ Take a break! Press Resume to restart."

export default function RobotGuide({ isPaused }) {
  const [msg, setMsg] = useState(MESSAGES[0])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (isPaused) {
      setMsg(PAUSE_MESSAGE)
      setVisible(true)
      return
    }

    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsg(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
        setVisible(true)
      }, 400)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      bottom: 0,
      zIndex: 40,
      width: 250,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* ── Speech Bubble ── */}
      <div style={{
        position: 'relative',
        marginBottom: -10, // overlap robot slightly
        width: '100%',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <img
          src="/assets/speech_bubble.png"
          alt=""
          style={{ width: '120%', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}
        />
        <div style={{
          position: 'absolute',
          top: '15%', left: '12%', right: '12%', bottom: '28%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          fontFamily: "'Georgia', serif",
          fontWeight: 700,
          fontSize: 12,
          paddingLeft:"50px",
          lineHeight: 1.3,
          color: '#1a1a2e',
        }}>
          {msg}
        </div>
      </div>

      {/* ── Robot ── */}
      <img
        src="/assets/robot_character.webp"
        alt="Robot Assistant"
        style={{
          width: 130,
          height: 'auto',
          filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.6))',
          animation: isPaused ? 'none' : 'robot-hover 3s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes robot-hover {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
