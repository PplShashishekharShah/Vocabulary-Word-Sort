// ─── GameContainer Component ───────────────────────────────────────────────────
// Added visual feedback (green/red flash) on correct/incorrect drops.
// Words correctly spawn from the belt's left edge (x=170).

import { useState, useEffect, useRef, useCallback } from 'react'

import questionsData    from '../data/questions.json'
import { sounds }       from '../utils/sounds'
import { ASSETS }       from '../utils/constants'

import ConveyorBelt     from './ConveyorBelt'
import CategoryBins     from './CategoryBins'
import ProgressBar      from './ProgressBar'
import EffectsLayer     from './EffectsLayer'
import CompletionScreen from './CompletionScreen'
import RobotGuide       from './RobotGuide'

const QUESTION   = questionsData.questions[0]
const ALL_WORDS  = QUESTION.words
const CATEGORIES = QUESTION.categories
const ANSWERS    = QUESTION.correct_answer
const BELT_SPEED = 1.1

// ─── Particle Burst ───────────────────────────────────────────────────────────
function ParticleBurst({ x, y, color, onDone }) {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i, angle: (i / 15) * Math.PI * 2, dist: 45 + Math.random() * 55, size: 5 + Math.random() * 7,
  }))
  useEffect(() => { const t = setTimeout(onDone, 800); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'fixed', left: x, top: y, pointerEvents: 'none', zIndex: 9999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', width: p.size, height: p.size, borderRadius: '50%', background: color,
          boxShadow: `0 0 8px ${color}`, transform: 'translate(-50%,-50%)',
          animation: 'particle-fly 0.8s ease-out forwards',
          '--dx': `${Math.cos(p.angle) * p.dist}px`, '--dy': `${Math.sin(p.angle) * p.dist}px`,
        }} />
      ))}
    </div>
  )
}

// ─── Drag Ghost (Matching New Design) ──────────────────────────────────────────
function DragGhost({ dragging }) {
  if (!dragging) return null
  return (
    <div style={{
      position: 'fixed',
      left:  dragging.x - (dragging.offsetX || 61),
      top:   dragging.y - (dragging.offsetY || 29),
      pointerEvents: 'none', zIndex: 9998,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transform: 'scale(1.15) rotate(4deg)', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.65))',
    }}>
      {/* Outer frame */}
      <div style={{
        position: 'absolute', inset: -2, background: 'linear-gradient(135deg, #bbb 0%, #666 50%, #888 100%)',
        borderRadius: 12, zIndex: -1, border: '1px solid rgba(255,255,255,0.3)',
      }} />
      <div style={{
        position: 'relative', width: 122, height: 54, background: '#fff', borderRadius: 10, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }} />
        <span style={{ fontFamily: "'Segoe UI', sans-serif", fontWeight: 800, fontSize: dragging.word.text.length > 9 ? 12 : 15, color: '#1e293b', textTransform: 'uppercase' }}>
          {dragging.word.text}
        </span>
      </div>
    </div>
  )
}

// ─── Main Game Orchestrator ───────────────────────────────────────────
export default function GameContainer() {
  const [sortedWords, setSortedWords] = useState({})
  const [wrongWords,  setWrongWords]  = useState(new Set())
  const [glowingBin,  setGlowingBin] = useState(null)
  const [shakingBin,  setShakingBin] = useState(null)
  const [particles,   setParticles]  = useState([])
  const [score,       setScore]      = useState(0)
  const [incorrect,   setIncorrect]  = useState(0)
  const [gameOver,    setGameOver]   = useState(false)
  const [isPaused,    setIsPaused]   = useState(false)

  // Feedback Flash States
  const [flashType, setFlashType] = useState(null) // 'correct' | 'wrong' | null

  const [beltWords,     setBeltWords]     = useState([])
  const [spawnIndex,    setSpawnIndex]    = useState(0)
  const [wordPositions, setWordPositions] = useState({})

  const [dragging, setDragging] = useState(null)
  const dragRef  = useRef(null)
  const binsRef  = useRef([])
  const isPausedRef = useRef(false)

  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  // Spawning: Always starts from LHS belt edge (x=170)
  useEffect(() => {
    if (spawnIndex >= ALL_WORDS.length || isPaused) return
    const t = setTimeout(() => {
      const id = ALL_WORDS[spawnIndex].id
      setBeltWords(p => [...p, id])
      setWordPositions(p => ({ ...p, [id]: { x: 170 } })) // Belt starts at left: 170
      setSpawnIndex(i => i + 1)
    }, spawnIndex === 0 ? 500 : 2800)
    return () => clearTimeout(t)
  }, [spawnIndex, isPaused])

  // Belt Motion
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) return
      setWordPositions(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(id => {
          if (!sortedWords[id]) next[id] = { x: (next[id]?.x ?? 170) + BELT_SPEED }
        })
        return next
      })
    }, 16)
    return () => clearInterval(interval)
  }, [sortedWords])

  // Drop Implementation
  const handleDragStart = useCallback((e, word) => {
    if (isPausedRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDragging({ word, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, x: e.clientX, y: e.clientY })
    dragRef.current = word
    sounds.drag()
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => setDragging(d => d ? { ...d, x: e.clientX, y: e.clientY } : null)
    const onUp = (e) => {
      const word = dragRef.current
      if (!word) return
      let droppedCatId = null
      binsRef.current.forEach(el => {
        if (!el) return
        const r = el.getBoundingClientRect()
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          droppedCatId = el.dataset.categoryId
        }
      })
      if (droppedCatId) {
        if (ANSWERS[word.id] === droppedCatId) {
          sounds.correct(); setSortedWords(p => ({ ...p, [word.id]: droppedCatId })); setScore(s => s + 1); setGlowingBin(droppedCatId)
          setFlashType('correct'); setTimeout(() => setFlashType(null), 1000)
          setParticles(p => [...p, { id: Date.now(), x: e.clientX, y: e.clientY, color: CATEGORIES.find(c => c.id === droppedCatId).color }])
          setTimeout(() => setGlowingBin(null), 900)
        } else {
          sounds.wrong(); setIncorrect(i => i + 1); setWrongWords(p => new Set([...p, word.id])); setShakingBin(droppedCatId)
          setFlashType('wrong'); setTimeout(() => setFlashType(null), 1000)
          setTimeout(() => { setWrongWords(p => { const n = new Set(p); n.delete(word.id); return n }); setShakingBin(null) }, 600)
        }
      }
      setDragging(null); dragRef.current = null
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  return (
    <div style={{ 
      position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'default', userSelect: 'none',
      animation: flashType === 'wrong' ? 'container-vibrate 0.4s ease' : 'none' 
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ASSETS.factoryBg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.65)', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.8) 100%)', zIndex: 1 }} />
      <EffectsLayer />

      {/* FEEDBACK FLASH OVERLAY */}
      {flashType && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5000,
          background: flashType === 'correct' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          boxShadow: flashType === 'correct' ? 'inset 0 0 100px rgba(34, 197, 94, 0.4)' : 'inset 0 0 100px rgba(239, 68, 68, 0.4)',
          animation: 'fade-out-feedback 1s ease forwards'
        }} />
      )}

      {/* TOP HUD */}
      <div style={{ position: 'absolute', top: 15, left: 15, right: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000, gap: 15 }}>
        <div style={{ background: '#000', borderRadius: 12, padding: '12px 28px', border: '2px solid #f59e0b', color: '#f59e0b', fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>🏭 WORD FACTORY</div>
        <div style={{ flex: 1 }}><ProgressBar sorted={Object.keys(sortedWords).length} total={ALL_WORDS.length} score={score} incorrect={incorrect} /></div>
        <button onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? '#10b981' : '#111', border: '2px solid #f59e0b', borderRadius: 12, color: '#f59e0b', padding: '10px 24px', fontWeight: 900, cursor: 'pointer' }}>{isPaused ? '▶ RESUME' : '⏸ PAUSE'}</button>
      </div>

      <div style={{ position: 'absolute', top: 95, left: 0, right: 0, textAlign: 'center', zIndex: 100 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: '10px 35px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontStyle: 'italic', fontSize: 13, backdropFilter: 'blur(10px)' }}>{QUESTION.question_text}</div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 270, zIndex: 50 }}>
        <ConveyorBelt beltWords={beltWords} allWords={ALL_WORDS} wordPositions={wordPositions} sortedWords={sortedWords} wrongWords={wrongWords} dragging={dragging} onDragStart={handleDragStart} isPaused={isPaused} />
      </div>

      <CategoryBins categories={CATEGORIES} binCounts={Object.values(sortedWords).reduce((acc, cat) => ({...acc, [cat]: (acc[cat] || 0) + 1}), {})} glowingBin={glowingBin} shakingBin={shakingBin} dragging={dragging} binsRef={binsRef} />
      
      <div style={{ zIndex: 200, position: 'absolute', left: 20, bottom: 10 }}>
        <RobotGuide isPaused={isPaused} />
      </div>

      <DragGhost dragging={dragging} />
      {particles.map(p => <ParticleBurst key={p.id} x={p.x} y={p.y} color={p.color} onDone={() => setParticles(pr => pr.filter(x => x.id !== p.id))} />)}
      
      {isPaused && !gameOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'rgba(0,0,0,0.9)', border: '4px solid #f59e0b', borderRadius: 40, padding: '25px 80px', animation: 'blink 1.2s infinite' }}>
            <h1 style={{ color: '#f59e0b', fontSize: 40, margin: 0, letterSpacing: 6 }}>PAUSED</h1>
          </div>
        </div>
      )}

      {gameOver && <CompletionScreen score={score} incorrect={incorrect} total={ALL_WORDS.length} onRestart={restart} />}
      
      <style>{`
        @keyframes container-vibrate {
          0%, 100% { transform: translate(0,0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 0); }
          20%, 40%, 60%, 80% { transform: translate(4px, 0); }
        }
        @keyframes fade-out-feedback { from { opacity: 1; } to { opacity: 0; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
