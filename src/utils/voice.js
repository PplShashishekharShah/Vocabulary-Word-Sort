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
  
  // Optional: Select a specific voice if available (e.g. Google US English)
  const voices = window.speechSynthesis.getVoices()
  const preferredVoice = voices.find(v => v.lang.includes('en-US')) || voices[0]
  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  window.speechSynthesis.speak(utterance)
}

export const stopSpeech = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
