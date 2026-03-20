// ─── Sound utilities using Web Audio API ─────────────────────────────────────

/**
 * Generates a simple beep using the Web Audio API.
 */
function playBeep(freq = 880, type = 'sine', duration = 0.15, vol = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (_) {}
}

export const sounds = {
  /** Soft click on drag start */
  drag: () => playBeep(440, 'square', 0.05, 0.1),

  /** Double chime on correct drop */
  correct: () => {
    playBeep(660, 'sine', 0.12, 0.3)
    setTimeout(() => playBeep(880, 'sine', 0.2, 0.3), 120)
  },

  /** Low buzz on wrong drop */
  wrong: () => playBeep(150, 'sawtooth', 0.25, 0.4),
}
