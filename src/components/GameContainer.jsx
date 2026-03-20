// ─── GameContainer Component ───────────────────────────────────────────────────
// Implementation: Word re-spawning and level-completion animation.
// Words correctly wrap-around if missed and teleport back on incorrect drops.

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
const BELT_SPEED = 1.15

// ─── Particle Burst ───────────────────────────────────────────────────────────
function ParticleBurst({ x, y, color, onDone, count = 15 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i, angle: (i / count) * Math.PI * 2, dist: 50 + Math.random() * 70, size: 6 + Math.random() * 8,
  }))
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'fixed', left: x, top: y, pointerEvents: 'none', zIndex: 9999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', width: p.size, height: p.size, borderRadius: '50%', background: color,
          boxShadow: `0 0 10px ${color}`, transform: 'translate(-50%,-50%)',
          animation: 'particle-fly 1.2s ease-out forwards',
          '--dx': `${Math.cos(p.angle) * p.dist}px`, '--dy': `${Math.sin(p.angle) * p.dist}px`,
        }} />
      ))}
    </div>
  )
}

// ─── Drag Ghost (Matching WordTile Design) ──────────────────────────────────────
function DragGhost({ dragging }) {
  if (!dragging) return null
  return (
    <div style={{
      position: 'fixed',
      left:  dragging.x - (dragging.offsetX || 55),
      top:   dragging.y - (dragging.offsetY || 22),
      pointerEvents: 'none', zIndex: 9998,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transform: 'scale(1.1) rotate(3deg)', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.6))',
    }}>
      <div style={{
        position: 'absolute', inset: -2, background: 'linear-gradient(135deg, #bbb, #666, #888)',
        borderRadius: 12, zIndex: -1, border: '1px solid rgba(255,255,255,0.3)',
      }} />
      <div style={{ position: 'relative', width: 110, height: 44, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Segoe UI', sans-serif", fontWeight: 800, fontSize: 14, color: '#1e293b', textTransform: 'uppercase' }}>
          {dragging.word.text}
        </span>
      </div>
    </div>
  )
}

// ─── Main Game Component ────────────────────────────────────────────────────────
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
  const [flashType,   setFlashType]  = useState(null) 
  const [isCelebrating, setIsCelebrating] = useState(false)

  const [beltWords,     setBeltWords]     = useState([])
  const [spawnIndex,    setSpawnIndex]    = useState(0)
  const [wordPositions, setWordPositions] = useState({})

  const [dragging, setDragging] = useState(null)
  const dragRef  = useRef(null)
  const binsRef  = useRef([])
  const isPausedRef = useRef(false)

  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  // Spawning Words
  useEffect(() => {
    if (spawnIndex >= ALL_WORDS.length || isPaused) return
    const t = setTimeout(() => {
      const id = ALL_WORDS[spawnIndex].id
      setBeltWords(p => [...p, id])
      setWordPositions(p => ({ ...p, [id]: { x: 170 } }))
      setSpawnIndex(i => i + 1)
    }, spawnIndex === 0 ? 500 : 2800)
    return () => clearTimeout(t)
  }, [spawnIndex, isPaused])

  // Belt Motion & Missed Word Wrap-around Logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current || isCelebrating) return
      setWordPositions(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(id => {
          if (!sortedWords[id]) {
            let nextX = (next[id]?.x ?? 170) + BELT_SPEED
            // RE-SPAWN MISSED WORDS: If word passes the bins (approx x=innerWidth-300)
            if (nextX > window.innerWidth - 200) {
              nextX = 170
            }
            next[id] = { x: nextX }
          }
        })
        return next
      })
    }, 16)
    return () => clearInterval(interval)
  }, [sortedWords, isCelebrating])

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
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) droppedCatId = el.dataset.categoryId
      })

      if (droppedCatId) {
        if (ANSWERS[word.id] === droppedCatId) {
          sounds.correct(); 
          setSortedWords(p => ({ ...p, [word.id]: droppedCatId })); 
          setScore(s => s + 1); 
          setGlowingBin(droppedCatId)
          setFlashType('correct'); 
          setTimeout(() => setFlashType(null), 800)
          setParticles(p => [...p, { id: Date.now(), x: e.clientX, y: e.clientY, color: CATEGORIES.find(c => c.id === droppedCatId).color }])
          setTimeout(() => setGlowingBin(null), 900)
        } else {
          sounds.wrong(); 
          setIncorrect(i => i + 1); 
          setWrongWords(p => new Set([...p, word.id])); 
          setShakingBin(droppedCatId)
          setFlashType('wrong'); 
          setTimeout(() => {
             setFlashType(null)
             // RE-SPAWN INCORRECT WORDS: Start back on belt after flash
             setWordPositions(p => ({ ...p, [word.id]: { x: 170 }}))
          }, 800)
          setTimeout(() => { setWrongWords(p => { const n = new Set(p); n.delete(word.id); return n }); setShakingBin(null) }, 600)
        }
      }
      setDragging(null); dragRef.current = null
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  // Completion Check
  useEffect(() => {
    if (Object.keys(sortedWords).length === ALL_WORDS.length && ALL_WORDS.length > 0) {
      setIsCelebrating(true)
      // Multi-firework effect
      const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7']
      const interval = setInterval(() => {
        setParticles(p => [...p, {
          id: Math.random(),
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight / 2),
          color: colors[Math.floor(Math.random() * colors.length)],
          count: 25
        }])
      }, 400)
      
      setTimeout(() => {
        clearInterval(interval)
        setGameOver(true)
      }, 4000)
    }
  }, [sortedWords])

  const restart = () => {
    setSortedWords({}); setWrongWords(new Set()); setGlowingBin(null); setShakingBin(null); setParticles([]); setScore(0); setIncorrect(0)
    setGameOver(false); setIsPaused(false); setIsCelebrating(false); setBeltWords([]); setSpawnIndex(0); setWordPositions({})
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'default', userSelect: 'none', animation: flashType === 'wrong' ? 'container-vibrate 0.4s ease' : 'none' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ASSETS.factoryBg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.65)', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.8) 100%)', zIndex: 1 }} />
      <EffectsLayer />

      {/* FEEDBACK FLASH */}
      {flashType && <div style={{ position: 'absolute', inset: 0, zIndex: 5000, background: flashType === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', boxShadow: flashType === 'correct' ? 'inset 0 0 100px rgba(34,197,94,0.4)' : 'inset 0 0 100px rgba(239,68,68,0.4)', animation: 'fade-out-feedback 0.8s ease forwards', pointerEvents: 'none' }} />}

      {/* STAGE CLEAR BANNER */}
      {isCelebrating && (
        <div style={{ position: 'absolute', top: '35%', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 6000, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(0,0,0,0.9)', border: '6px solid #f59e0b', borderRadius: 40, padding: '30px 100px', transform: 'scale(1)', animation: 'banner-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            <h2 style={{ color: '#f59e0b', fontSize: 60, margin: 0, letterSpacing: 8, fontWeight: 900, textShadow: '0 0 20px #f59e0b' }}>STAGE CLEAR!</h2>
            <p style={{ color: '#fff', textAlign: 'center', fontSize: 20, margin: '10px 0 0 0', fontWeight: 600 }}>EXCELLENT SORTING!</p>
          </div>
        </div>
      )}

      {/* HUD */}
      <div style={{ position: 'absolute', top: 15, left: 15, right: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000, gap: 15 }}>
        <div style={{ background: '#000', borderRadius: 12, padding: '12px 28px', border: '2px solid #f59e0b', color: '#f59e0b', fontWeight: 900, fontSize: 18 }}>🏭 WORD FACTORY</div>
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
      
      <div style={{ zIndex: 40, position: 'absolute', left: 0, bottom: 0 }}>
        <RobotGuide isPaused={isPaused} />
      </div>

      <DragGhost dragging={dragging} />
      {particles.map(p => <ParticleBurst key={p.id} x={p.x} y={p.y} color={p.color} count={p.count} onDone={() => setParticles(pr => pr.filter(x => x.id !== p.id))} />)}
      
      {isPaused && !gameOver && !isCelebrating && (
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
        @keyframes banner-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}
