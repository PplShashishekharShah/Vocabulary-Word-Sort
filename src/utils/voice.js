// ─── Voice Utility ────────────────────────────────────────────────────────────
// Wrapper for Web Speech API to provide educational feedback.
// Optimized to only read text, skipping emojis and decorative symbols.

export const speak = (text, cancelCurrent = true) => {
  if (!window.speechSynthesis) return

  if (cancelCurrent) {
    window.speechSynthesis.cancel()
  }

  // EMOJI & SYMBOL CLEANUP: Remove extended pictographics and decorative symbols
  // so the voice doesn't read out "wrench" or "smiling face with sunglasses".
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F093}\u{1F004}\u{1F191}-\u{1F251}\u{1FAD0}-\u{1FAF8}]/gu, '')
    .trim()

  if (!cleanText) return

  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.rate = 1.0
  utterance.pitch = 1.0

  const doSpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    // Prioritize natural sounding English voices
    const preferredVoice = 
      voices.find(v => v.name.includes('Google US English')) ||
      voices.find(v => v.lang.includes('en-US')) ||
      voices.find(v => v.lang.includes('en-GB')) ||
      voices[0]

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    window.speechSynthesis.speak(utterance)
  }

  // If voices aren't loaded yet, wait for them
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      doSpeak()
      window.speechSynthesis.onvoiceschanged = null // prevent multiple triggers
    }
  } else {
    doSpeak()
  }
}

export const stopSpeech = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
