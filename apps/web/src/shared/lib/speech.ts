export function speakWord(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hr-HR';
  utterance.rate = 0.7;
  utterance.pitch = 1;
  utterance.voice = window.speechSynthesis.getVoices().find((v) => v.lang === 'hr-HR') || null;
  window.speechSynthesis.speak(utterance);
}
