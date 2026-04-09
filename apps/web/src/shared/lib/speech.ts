let pendingSpeak: ReturnType<typeof setTimeout> | null = null;

export function speakWord(text: string) {
  if (!window.speechSynthesis) return;

  // Clear any queued speak() that hasn't fired yet, then cancel any in-progress speech.
  // This prevents the race where an old setTimeout fires after a new cancel(), which
  // corrupts Chrome's speech synthesis queue globally.
  if (pendingSpeak !== null) {
    clearTimeout(pendingSpeak);
    pendingSpeak = null;
  }
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hr-HR';
  utterance.rate = 0.7;
  utterance.pitch = 1;
  utterance.voice = window.speechSynthesis.getVoices().find((v) => v.lang === 'hr-HR') ?? null;

  // Yield one frame so Chrome processes the cancel() before queuing the new utterance.
  pendingSpeak = setTimeout(() => {
    pendingSpeak = null;
    window.speechSynthesis.speak(utterance);
  }, 0);
}
