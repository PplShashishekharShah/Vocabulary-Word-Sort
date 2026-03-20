// ─── ConveyorBelt Component ───────────────────────────────────────────────────
// Belt direction corrected to matching word flow (L-to-R).
// Added smooth edge-fading as wrenches approach the belt end.

import { ASSETS } from '../utils/constants'
import WordTile from './WordTile'

export default function ConveyorBelt({
  beltWords,
  allWords,
  wordPositions,
  sortedWords,
  wrongWords,
  dragging,
  onDragStart,
  isPaused,
}) {
  // Sync the limit with GameContainer logic
  const BELT_LIMIT = window.innerWidth -220
  const FADE_START = BELT_LIMIT - 100

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 220,
      overflow: 'visible',
    }}>
      {/* ── Main scrolling belt surface ── */}
      <div style={{
        position: 'absolute',
        top: 167,
        left: 170,
        right: 285,
        height: 150,
        backgroundImage: `url(${ASSETS.conveyorBelt})`,
        backgroundSize: '200px 100%',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: '0 0',
        animation: isPaused ? 'none' : 'belt-scroll-right 2.2s linear infinite',
        zIndex: 5,
      }} />

      {/* ── Word tiles — sitting inside the belt surface ── */}
      <div style={{ position: 'relative', zIndex: 15, height: '100%' }}>
        {beltWords.map(id => {
          const word = allWords.find(w => w.id === id)
          if (!word) return null
          const pos = wordPositions[id]
          const isDraggingThis = dragging?.word?.id === id
          
          // FADE LOGIC: Calculate opacity based on x-position
          const currentX = pos?.x ?? 170
          let opacity = 1
          if (currentX > FADE_START) {
            opacity = Math.max(0, 1 - (currentX - FADE_START) / 120)
          }

          return (
            <WordTile
              key={id}
              word={word}
              onDragStart={onDragStart}
              isDragging={isDraggingThis}
              isCorrect={!!sortedWords[id]}
              isWrong={wrongWords.has(id)}
              style={{
                position: 'absolute',
                left: currentX,
                top: 190,
                transform: 'translateY(-50%)',
                // Combined visibilty logic with the new edge-fade
                opacity: (isDraggingThis || sortedWords[id]) ? 0 : opacity,
                visibility: (isDraggingThis || sortedWords[id] || opacity <= 0) ? 'hidden' : 'visible',
                transition: 'opacity 0.1s linear', // Smooth transition for position updates
              }}
            />
          )
        })}
      </div>

      <style>{`
        @keyframes belt-scroll-right {
          from { background-position: 0 0; }
          to   { background-position: 200px 0; }
        }
      `}</style>
    </div>
  )
}
