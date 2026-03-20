// ─── ConveyorBelt Component ───────────────────────────────────────────────────
// Fixed belt layout: Removed shadows as requested, adjusted rail and surface positioning.
// Surface middle of the side rails.

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
      height: 150,          // Contain the full vertical span of the assembly
      overflow: 'visible',
    }}>
      
     
     

      {/* ── Main scrolling belt surface (middle) ── */}
      {/* Sitting directly between the rails (y=56 to y=104) */}
      <div style={{
        position: 'absolute',
        top: 95,
        left: 170,
        right: 285,
        height: 130,
        backgroundImage: `url(${ASSETS.conveyorBelt})`,
        backgroundSize: 'auto 100%',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: '0 0',
        animation: isPaused ? 'none' : 'belt-scroll-reverse 2.2s linear infinite',
        zIndex: 5,
        // inset shadows removed as requested
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
                left: pos?.x ?? 170, // Default to start of belt
                // Center vertically in the 104px belt area (56 + 52)
                top: 125,
                transform: 'translateY(-50%)',
                opacity: (sortedWords[id] || (pos?.x > window.innerWidth - 300)) ? 0 : 1,
                transition: sortedWords[id] ? 'opacity 0.3s ease' : 'none',
              }}
            />
          )
        })}
      </div>

      <style>{`
        @keyframes belt-scroll-reverse {
          from { background-position: 0 0; }
          to   { background-position: -200px 0; }
        }
      `}</style>
    </div>
  )
}
