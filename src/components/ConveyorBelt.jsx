// ─── ConveyorBelt Component ───────────────────────────────────────────────────
// Belt direction corrected to matching word flow (L-to-R).
// Seamless looping with backgroundSize: 200px.

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
        // FIXED: backgroundSize set to 200px to match the 200px scroll distance exactly.
        backgroundSize: '200px 100%',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: '0 0',
        // Speed matched to code logic: 200px in 2.2s.
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
                left: pos?.x ?? 170,
                top: 190,
                transform: 'translateY(-50%)',
                opacity: (isDraggingThis || sortedWords[id]) ? 0 : 1,
                visibility: (isDraggingThis || sortedWords[id]) ? 'hidden' : 'visible',
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
