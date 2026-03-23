// ─── GameContainer Component ───────────────────────────────────────────────────
// Final high-fidelity educational word sorting game.
// Integrated Voice, Dynamic Feedback, Multi-Level Progression, and Monitor Hints.

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
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", fontWeight: 900, fontSize: 13,
        color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1.2,
      }}>{dragging.word.text}</span>
    </div>
  )
}

export default function GameContainer() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0)
  
  // Dynamic extraction of question data
  const QUESTION   = questionsData.questions[currentLevelIdx]
  const CATEGORIES = QUESTION.categories
  const ANSWERS    = QUESTION.correct_answer

  const INITIAL_QUEUE = useMemo(() => [...QUESTION.words].sort(() => Math.random() - 0.5), [currentLevelIdx])

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
  const [activeHint,    setActiveHint]    = useState(null) // { wordText, hintText }

  const [spawnQueue,   setSpawnQueue]   = useState(INITIAL_QUEUE.map(w => w.id))
  const [retryQueue,   setRetryQueue]   = useState([])
  const [beltWords,    setBeltWords]    = useState([])
  const [wordPositions, setWordPositions] = useState({})

  const [dragging, setDragging] = useState(null)
  const dragRef  = useRef(null)
  const binsRef  = useRef([])
  const isPausedRef = useRef(false)
  const hintTimeoutRef = useRef(null)

  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  // Reset states on level change
  useEffect(() => {
    setSortedWords({})
    setWrongWords(new Set())
    setGlowingBin(null)
    setShakingBin(null)
    setParticles([])
    setIsCelebrating(false)
    setRobotFeedback(`Level ${currentLevelIdx + 1}: ${QUESTION.theme}! 🏭`)
    setActiveHint(null)
    setSpawnQueue(INITIAL_QUEUE.map(w => w.id))
    setRetryQueue([])
    setBeltWords([])
    setWordPositions({})
    
    // Initial Question Voice on Level Start
    if (!isMuted) {
      const t = setTimeout(() => {
        speak(QUESTION.question_text)
      }, 1000)
      return () => clearTimeout(t)
    }
  }, [currentLevelIdx, isMuted])

  // Robot Voice Feedback (Correct/Wrong/Hints)
  useEffect(() => {
    if (robotFeedback && !isMuted && !robotFeedback.includes("Level")) {
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

  const handleShowHint = useCallback((word) => {
    if (isPausedRef.current || isCelebrating) return
    const hintText = QUESTION.hints?.[word.id] || "No hint available."
    setActiveHint({ wordText: word.text, hintText })
    
    if (!isMuted) {
      speak(`${word.text} means ${hintText}`)
    }

    // Auto-clear hint after 5 seconds
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current)
    hintTimeoutRef.current = setTimeout(() => {
      setActiveHint(null)
    }, 4000)
  }, [QUESTION, isMuted, isCelebrating])

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
        const hint = QUESTION.hints[word.id] || "keep trying!"
        if (ANSWERS[word.id] === droppedCatId) {
          if (!isMuted) sounds.correct()
          setSortedWords(p => ({ ...p, [word.id]: droppedCatId })); setScore(s => s + 1); setGlowingBin(droppedCatId)
          setFlashType('correct'); setRobotFeedback(`Great job! "${word.text}" means ${hint}`)
          setTimeout(() => setFlashType(null), 1000)
          setParticles(p => [...p, { id: Date.now(), x: e.clientX, y: e.clientY, color: CATEGORIES.find(c => c.id === droppedCatId).color }])
        } else {
          if (!isMuted) sounds.wrong()
          setIncorrect(i => i + 1); setWrongWords(p => new Set([...p, word.id])); setShakingBin(droppedCatId)
          setFlashType('wrong'); setRobotFeedback(`Oops! "${word.text}" means ${hint}. Try another bin!`)
          
          // Immediate vanish from belt so it can't be picked again
          setRetryQueue(q => q.includes(word.id) ? q : [...q, word.id])
          setWordPositions(p => { const next = {...p}; delete next[word.id]; return next })
          setBeltWords(bw => bw.filter(bid => bid !== word.id))

          setTimeout(() => { 
            setFlashType(null)
          }, 1500)
          setTimeout(() => { setWrongWords(p => { const n = new Set(p); n.delete(word.id); return n }); setShakingBin(null) }, 600)
        }
      }
      setDragging(null); dragRef.current = null
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, CATEGORIES, isMuted, currentLevelIdx])

  useEffect(() => {
    if (Object.keys(sortedWords).length === QUESTION.words.length && QUESTION.words.length > 0) {
      setIsCelebrating(true); 
      
      const isFinalLevel = currentLevelIdx === questionsData.questions.length - 1
      setRobotFeedback(isFinalLevel ? "MISSION COMPLETE! All levels finished! You're a word master! 🏅" : "LEVEL COMPLETE! Moving to the next challenge... 🏆")
      
      const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7']
      const int = setInterval(() => { setParticles(p => [...p, { id: Math.random(), x: Math.random() * window.innerWidth, y: Math.random() * (window.innerHeight / 2), color: colors[Math.floor(Math.random() * colors.length)], count: 25 }]) }, 400)
      
      setTimeout(() => { 
        clearInterval(int); 
        if (!isFinalLevel) {
          setCurrentLevelIdx(prev => prev + 1)
        } else {
          setGameOver(true) 
        }
      }, 4000)
    }
  }, [sortedWords])

  const restart = () => { 
    setCurrentLevelIdx(0)
    setSortedWords({}); setWrongWords(new Set()); setGlowingBin(null); setShakingBin(null); setParticles([]); setScore(0); setIncorrect(0)
    setGameOver(false); setIsPaused(false); setIsCelebrating(false); setRobotFeedback("Welcome back! Let's sort! 🏭")
    setSpawnQueue(INITIAL_QUEUE.map(w => w.id)); setRetryQueue([]); setBeltWords([]); setWordPositions({})
    if (!isMuted) speak("Game restarted! Let's go!")
  }

  // Calculate bin counts robustly
  const binCounts = Object.values(sortedWords).reduce((acc, catId) => {
    acc[catId] = (acc[catId] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'default', userSelect: 'none', animation: flashType === 'wrong' ? 'container-vibrate 0.4s ease' : 'none' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ASSETS.factoryBg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.55) saturate(1.2) hue-rotate(185deg)', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.7) 0%, rgba(2, 6, 23, 0.3) 45%, rgba(2, 6, 23, 0.9) 100%)', zIndex: 1 }} />
      
      {/* MONITOR SCREEN OVERLAY (DYNAMIC HINTS) */}
      <div style={{
        position: 'absolute',
        top: '29%', left: '42.2%', width: '15.2%', height: '15.2%',
        background: activeHint ? 'rgba(34, 211, 238, 0.12)' : 'transparent',
        border: activeHint ? '1px solid rgba(34, 211, 238, 0.3)' : 'none',
        boxShadow: activeHint ? '0 0 20px rgba(34, 211, 238, 0.2)' : 'none',
        zIndex: 2,
        borderRadius: 16,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 8, boxSizing: 'border-box',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: activeHint ? 'blur(4px)' : 'none',
      }}>
        {activeHint ? (
          <div style={{ animation: 'hint-flicker 0.2s infinite' }}>
            <h4 style={{ margin: '0 0 5px 0', color: 'var(--accent-cyan)', fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>{activeHint.wordText}</h4>
            <p style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{activeHint.hintText}</p>
          </div>
        ) : (
          <div style={{ opacity: 0.4, color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>SYSTEM READY</div>
        )}
      </div>

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
          <div className="glass" style={{ border: '4px solid var(--accent-cyan)', borderRadius: 40, padding: '30px 100px', animation: 'banner-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: 60, margin: 0, letterSpacing: 8, fontWeight: 900, textShadow: '0 0 20px var(--accent-cyan)' }}>LEVEL {currentLevelIdx + 1} CLEAR!</h2>
            <p style={{ color: '#fff', textAlign: 'center', fontSize: 20, margin: '10px 0 0 0', fontWeight: 600 }}>{QUESTION.theme} MASTERED!</p>
          </div>
        </div>
      )}

      {/* HUD ── TOP */}
      <div style={{ position: 'absolute', top: 15, left: 15, right: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000, gap: 15 }}>
        <div className="glass" style={{ borderRadius: 16, padding: '12px 28px', color: '#fff', fontWeight: 900, fontSize: 18, border: '1px solid var(--accent-cyan)' }}>LEVEL {currentLevelIdx + 1}</div>
        <div style={{ flex: 1 }}><ProgressBar sorted={Object.keys(sortedWords).length} total={QUESTION.words.length} score={score} incorrect={incorrect} /></div>
        <button className="btn-premium" onClick={() => setIsPaused(!isPaused)} style={{ padding: '12px 28px', fontSize: 14 }}>{isPaused ? '▶ RESUME' : '⏸ PAUSE'}</button>
      </div>

      {/* HUD ── BOTTOM Left (MUTE TOGGLE) */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000 }}>
        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className="glass"
          style={{ 
            borderRadius: '50%', 
            width: 65, height: 65, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, cursor: 'pointer', color: 'var(--accent-cyan)',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: '2px solid var(--accent-cyan)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 0 25px var(--accent-cyan)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'var(--glow-cyan)'; }}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <div style={{ position: 'absolute', top: 95, left: 0, right: 0, textAlign: 'center', zIndex: 100 }}>
        <div className="glass" style={{ 
          display: 'inline-flex', justifyContent: 'center',
          borderRadius: 16, padding: '14px 28px', 
          color: '#fff', 
          fontSize: 15, fontWeight: 600,
          maxWidth: '600px', lineHeight: '1.5', textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {QUESTION.question_text}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 270, zIndex: 50 }}>
        <ConveyorBelt 
          beltWords={beltWords} 
          allWords={QUESTION.words} 
          wordPositions={wordPositions} 
          sortedWords={sortedWords} 
          wrongWords={wrongWords} 
          dragging={dragging} 
          onDragStart={handleDragStart} 
          onShowHint={handleShowHint}
          isPaused={isPaused} 
        />
      </div>

      <CategoryBins categories={CATEGORIES} binCounts={binCounts} glowingBin={glowingBin} shakingBin={shakingBin} dragging={dragging} binsRef={binsRef} />
      
      <div style={{ zIndex: 10000, position: 'absolute', right: -30, top: '45%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <RobotGuide isPaused={isPaused} externalMessage={robotFeedback} />
      </div>

      <DragGhost dragging={dragging} />
      {particles.map(p => <ParticleBurst key={p.id} x={p.x} y={p.y} color={p.color} count={p.count} onDone={() => setParticles(pr => pr.filter(x => x.id !== p.id))} />)}
      
      {gameOver && (
        <CompletionScreen 
          score={score} 
          incorrect={incorrect} 
          total={questionsData.questions.reduce((sum, q) => sum + q.words.length, 0)} 
          onRestart={restart} 
        />
      )}

      <style>{`
        @keyframes container-vibrate { 0%, 100% { transform: translate(0,0); } 10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 0); } 20%, 40%, 60%, 80% { transform: translate(4px, 0); } }
        @keyframes flash-pulse { from { opacity: 0; } 30% { opacity: 1; } to { opacity: 0; } }
        @keyframes pop-up-status { 
          from { transform: translateX(-50%) scale(0.4); opacity: 0; } 
          30% { transform: translateX(-50%) scale(1.1); opacity: 1; } 
          to { transform: translateX(-50%) scale(1) translateY(-20px); opacity: 0; } 
        }
        @keyframes banner-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes hint-flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
      `}</style>
    </div>
  )
}
