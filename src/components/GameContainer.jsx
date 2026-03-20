// ─── GameContainer Component ───────────────────────────────────────────────────
// Added Mute Toggle and Enhanced Feedback.
// Integrated Voice Synthesis and Fun Visual FX.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

import questionsData    from '../data/questions.json'
import { sounds }       from '../utils/sounds'
import { ASSETS }       from '../utils/constants'
import { speak, stopSpeech } from '../utils/voice'

import ConveyorBelt     from './ConveyorBelt'
import CategoryBins     from './CategoryBins'
import ProgressBar      from './ProgressBar'
import EffectsLayer     from './EffectsLayer'
import CompletionScreen from './CompletionScreen'
import RobotGuide       from './RobotGuide'

const QUESTION   = questionsData.questions[0]
const CATEGORIES = QUESTION.categories
const ANSWERS    = QUESTION.correct_answer

// SYNC: Code-driven move exactly matching CSS 2.2s/200px (L-to-R)
const BELT_SPEED = 1.5151515
const SPAWN_DISTANCE_THRESHOLD = 400 

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

// ─── Drag Ghost ────────────────────────────────────────────────────────────────
function DragGhost({ dragging }) {
  if (!dragging) return null
  return (
    <div style={{
      position: 'fixed',
      left:  dragging.x - (dragging.offsetX || 105),
      top:   dragging.y - (dragging.offsetY || 75),
      pointerEvents: 'none', zIndex: 10001,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transform: 'rotate(12deg)', 
      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.65))',
    }}>
      <img src={ASSETS.wrench} alt="" style={{ width: 200, height: 120, objectFit: 'cover' }} />
      <span style={{
        position: 'absolute', top: '54%', left: '50%', transform: 'translate(-50%, -50%)',
        fontFamily: "'Segoe UI', sans-serif", fontWeight: 900, fontSize: 13,
        color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1.2,
      }}>{dragging.word.text}</span>
    </div>
  )
}

export default function GameContainer() {
  const INITIAL_QUEUE = useMemo(() => [...QUESTION.words].sort(() => Math.random() - 0.5), [])

  const [sortedWords, setSortedWords] = useState({})
  const [wrongWords,  setWrongWords]  = useState(new Set())
  const [glowingBin,  setGlowingBin] = useState(null)
  const [shakingBin,  setShakingBin] = useState(null)
  const [particles,   setParticles]  = useState([])
  const [score,       setScore]      = useState(0)
  const [incorrect,   setIncorrect]  = useState(0)
  const [gameOver,    setGameOver]   = useState(false)
  const [isPaused,    setIsPaused]   = useState(false)
  const [isMuted,     setIsMuted]    = useState(false)
  const [flashType,   setFlashType]  = useState(null) 
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [robotFeedback, setRobotFeedback] = useState('')

  const [spawnQueue,   setSpawnQueue]   = useState(INITIAL_QUEUE.map(w => w.id))
  const [retryQueue,   setRetryQueue]   = useState([])
  const [beltWords,    setBeltWords]    = useState([])
  const [wordPositions, setWordPositions] = useState({})

  const [dragging, setDragging] = useState(null)
  const dragRef  = useRef(null)
  const binsRef  = useRef([])
  const isPausedRef = useRef(false)

  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  // Initial Question Voice
  useEffect(() => {
    if (isMuted) return
    const t = setTimeout(() => {
      speak(QUESTION.question_text)
    }, 1000)
    return () => clearTimeout(t)
  }, [isMuted])

  // Robot Voice Feedback
  useEffect(() => {
    if (robotFeedback && !isMuted) {
      speak(robotFeedback)
    }
  }, [robotFeedback, isMuted])

  // Stop speech if muted toggled to ON
  useEffect(() => {
    if (isMuted) stopSpeech()
  }, [isMuted])

  // Move existing words and check for wrap-around
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current || isCelebrating) return

      setWordPositions(prev => {
        const next = { ...prev }
        
        // Final belt limit (visible end) - SYNCED TO USER PREFERENCE
        const BELT_LIMIT = window.innerWidth - 250 

        Object.keys(next).forEach(id => {
          if (!sortedWords[id]) {
            let nextX = (next[id]?.x ?? 170) + BELT_SPEED
            
            // MISS HANDLE: If word reaches the belt end
            if (nextX >= BELT_LIMIT) {
              setRetryQueue(q => q.includes(id) ? q : [...q, id])
              delete next[id]
              setBeltWords(bw => bw.filter(bid => bid !== id))
              return
            }
            next[id] = { x: nextX }
          }
        })

        const activeWordsOnBelt = Object.keys(next).filter(id => !sortedWords[id])
        const minX = activeWordsOnBelt.length > 0 
          ? Math.min(...activeWordsOnBelt.map(id => next[id].x))
          : 9999

        if (minX > 170 + SPAWN_DISTANCE_THRESHOLD) {
          if (spawnQueue.length > 0) {
            const nextId = spawnQueue[0]
            setSpawnQueue(q => q.slice(1))
            setBeltWords(bw => [...bw, nextId])
            next[nextId] = { x: 170 }
          } else if (retryQueue.length > 0) {
            const nextId = retryQueue[0]
            setRetryQueue(q => q.slice(1))
            setBeltWords(bw => [...bw, nextId])
            next[nextId] = { x: 170 }
          }
        }

        return next
      })
    }, 16)
    return () => clearInterval(interval)
  }, [sortedWords, isCelebrating, spawnQueue, retryQueue])

  const handleDragStart = useCallback((e, word) => {
    if (isPausedRef.current || isCelebrating) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDragging({ word, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, x: e.clientX, y: e.clientY })
    dragRef.current = word
    setRobotFeedback('')
    if (!isMuted) sounds.drag()
  }, [isCelebrating, isMuted])

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
          if (!isMuted) sounds.correct()
          setSortedWords(p => ({ ...p, [word.id]: droppedCatId })); setScore(s => s + 1); setGlowingBin(droppedCatId)
          setFlashType('correct'); setRobotFeedback("Great job! That's correct! 🔧")
          setTimeout(() => setFlashType(null), 1000)
          setParticles(p => [...p, { id: Date.now(), x: e.clientX, y: e.clientY, color: CATEGORIES.find(c => c.id === droppedCatId).color }])
        } else {
          if (!isMuted) sounds.wrong()
          setIncorrect(i => i + 1); setWrongWords(p => new Set([...p, word.id])); setShakingBin(droppedCatId)
          setFlashType('wrong'); setRobotFeedback("Oops! Wrong bin! Try again! 🔧")
          setTimeout(() => { 
            setFlashType(null)
            setRetryQueue(q => q.includes(word.id) ? q : [...q, word.id])
            setWordPositions(p => { const next = {...p}; delete next[word.id]; return next })
            setBeltWords(bw => bw.filter(bid => bid !== word.id))
          }, 1000)
          setTimeout(() => { setWrongWords(p => { const n = new Set(p); n.delete(word.id); return n }); setShakingBin(null) }, 600)
        }
      }
      setDragging(null); dragRef.current = null
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, CATEGORIES, isMuted])

  useEffect(() => {
    if (Object.keys(sortedWords).length === QUESTION.words.length && QUESTION.words.length > 0) {
      setIsCelebrating(true); 
      setRobotFeedback("MISSION COMPLETE! You're a pro! 🏆")
      const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7']
      const int = setInterval(() => { setParticles(p => [...p, { id: Math.random(), x: Math.random() * window.innerWidth, y: Math.random() * (window.innerHeight / 2), color: colors[Math.floor(Math.random() * colors.length)], count: 25 }]) }, 400)
      setTimeout(() => { clearInterval(int); setGameOver(true) }, 4000)
    }
  }, [sortedWords])

  const restart = () => { 
    setSortedWords({}); setWrongWords(new Set()); setGlowingBin(null); setShakingBin(null); setParticles([]); setScore(0); setIncorrect(0)
    setGameOver(false); setIsPaused(false); setIsCelebrating(false); setRobotFeedback("Welcome back! Let's sort! 🏭")
    setSpawnQueue(INITIAL_QUEUE.map(w => w.id)); setRetryQueue([]); setBeltWords([]); setWordPositions({})
    if (!isMuted) speak("Level Restarted! Let's get to work!")
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'default', userSelect: 'none', animation: flashType === 'wrong' ? 'container-vibrate 0.4s ease' : 'none' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ASSETS.factoryBg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.65)', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.8) 100%)', zIndex: 1 }} />
      
      {/* FULL SCREEN FLASH FEEDBACK */}
      {flashType && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: flashType === 'correct' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
          zIndex: 5,
          pointerEvents: 'none',
          animation: 'flash-pulse 1s ease-out forwards',
        }} />
      )}

      {/* ADDITIONAL FUN ANIMATION ON CORRECT/WRONG */}
      {flashType && (
        <div style={{
          position: 'absolute',
          top: '20%', left: '50%', transform: 'translateX(-50%)',
          fontSize: 80,
          zIndex: 9000,
          animation: 'pop-up-status 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          pointerEvents: 'none',
        }}>
          {flashType === 'correct' ? '✨ GOOD! ✨' : '💥 OUCH! 💥'}
        </div>
      )}

      <EffectsLayer />

      {isCelebrating && (
        <div style={{ position: 'absolute', top: '35%', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 6000, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(0,0,0,0.92)', border: '6px solid #f59e0b', borderRadius: 40, padding: '30px 100px', animation: 'banner-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            <h2 style={{ color: '#f59e0b', fontSize: 60, margin: 0, letterSpacing: 8, fontWeight: 900 }}>STAGE CLEAR!</h2>
            <p style={{ color: '#fff', textAlign: 'center', fontSize: 20, margin: '10px 0 0 0', fontWeight: 600 }}>EXCELLENT SORTING!</p>
          </div>
        </div>
      )}

      {/* HUD ── TOP */}
      <div style={{ position: 'absolute', top: 15, left: 15, right: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000, gap: 15 }}>
        <div style={{ background: '#000', borderRadius: 12, padding: '12px 28px', border: '2px solid #f59e0b', color: '#f59e0b', fontWeight: 900, fontSize: 18 }}>🏭 WORD FACTORY</div>
        <div style={{ flex: 1 }}><ProgressBar sorted={Object.keys(sortedWords).length} total={QUESTION.words.length} score={score} incorrect={incorrect} /></div>
        <button onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? '#10b981' : '#111', border: '2px solid #f59e0b', borderRadius: 12, color: '#f59e0b', padding: '10px 24px', fontWeight: 900, cursor: 'pointer' }}>{isPaused ? '▶ RESUME' : '⏸ PAUSE'}</button>
      </div>

      {/* HUD ── BOTTOM LEFT (MUTE TOGGLE) */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000 }}>
        <button 
          onClick={() => setIsMuted(!isMuted)} 
          style={{ 
            background: 'rgba(0,0,0,0.85)', border: '2px solid #f59e0b', borderRadius: '50%', 
            width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, cursor: 'pointer', color: '#f59e0b',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <div style={{ position: 'absolute', top: 95, left: 0, right: 0, textAlign: 'center', zIndex: 100 }}>
        <div style={{ 
          display: 'inline-flex', justifyContent: 'center',
          background: '#000', borderRadius: 12, padding: '12px 25px', 
          border: '1px solid rgba(255,158,11,0.5)', color: '#fff', 
          fontSize: 14, fontWeight: 600, fontStyle: 'italic',
          boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
          maxWidth: '500px', lineHeight: '1.4', textAlign: 'center'
        }}>
          {QUESTION.question_text}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 270, zIndex: 50 }}>
        <ConveyorBelt beltWords={beltWords} allWords={QUESTION.words} wordPositions={wordPositions} sortedWords={sortedWords} wrongWords={wrongWords} dragging={dragging} onDragStart={handleDragStart} isPaused={isPaused} />
      </div>

      <CategoryBins categories={CATEGORIES} binCounts={Object.values(sortedWords).reduce((acc, catId) => ({...acc, [catId]: (acc[catId] || 0) + 1}), {})} glowingBin={glowingBin} shakingBin={shakingBin} dragging={dragging} binsRef={binsRef} />
      
      <div style={{ zIndex: 10000, position: 'absolute', right: -30, top: '45%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <RobotGuide isPaused={isPaused} externalMessage={robotFeedback} />
      </div>

      <DragGhost dragging={dragging} />
      {particles.map(p => <ParticleBurst key={p.id} x={p.x} y={p.y} color={p.color} count={p.count} onDone={() => setParticles(pr => pr.filter(x => x.id !== p.id))} />)}
      
      <style>{`
        @keyframes container-vibrate { 0%, 100% { transform: translate(0,0); } 10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 0); } 20%, 40%, 60%, 80% { transform: translate(4px, 0); } }
        @keyframes flash-pulse { from { opacity: 0; } 30% { opacity: 1; } to { opacity: 0; } }
        @keyframes pop-up-status { 
          from { transform: translateX(-50%) scale(0.4); opacity: 0; } 
          30% { transform: translateX(-50%) scale(1.1); opacity: 1; } 
          to { transform: translateX(-50%) scale(1) translateY(-20px); opacity: 0; } 
        }
        @keyframes banner-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}
