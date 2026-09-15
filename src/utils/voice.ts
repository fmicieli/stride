import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// ─── Web: HTML5 Audio bells (iOS-PWA reliable) ────────────────────────────────
// Expo web resolves require() to a URL string; native returns a module object.
const dingRaw = Platform.OS === 'web' ? require('../../assets/ding.wav') : null;
const dingUrl: string | null =
  dingRaw == null ? null
  : typeof dingRaw === 'string' ? dingRaw
  : (dingRaw as any)?.uri ?? null;

function makeAudio(src: string | null, playbackRate = 1, volume = 1): HTMLAudioElement | null {
  if (!src || typeof window === 'undefined') return null;
  try {
    const el = new Audio(src);
    el.preload = 'auto';
    el.playbackRate = playbackRate;
    el.volume = volume;
    return el;
  } catch { return null; }
}

// Two bell elements so back-to-back ringBell(2) can overlap
const webBell1 = makeAudio(dingUrl);
const webBell2 = makeAudio(dingUrl);
// Tick: same file at 2× speed → shorter, higher-pitched, distinct from the bell
const webTick  = makeAudio(dingUrl, 2.0, 0.75);

function playEl(el: HTMLAudioElement | null): void {
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {});
}

export function ringBell(count = 1): void {
  if (Platform.OS === 'web') {
    playEl(webBell1);
    if (count >= 2) setTimeout(() => playEl(webBell2), 650);
    return;
  }
}

export function ringTick(): void {
  if (Platform.OS === 'web') {
    playEl(webTick);
    return;
  }
}

// Called synchronously from a user-gesture handler to unlock HTML5 Audio on iOS PWA.
// Each element must receive a .play() call inside the gesture before it can be
// triggered programmatically later (iOS autoplay policy).
export function primeAudio(): void {
  if (Platform.OS !== 'web') return;
  const unlock = (el: HTMLAudioElement | null) => {
    if (!el) return;
    el.muted = true;
    el.play()
      .then(() => {
        el.pause();
        el.currentTime = 0;
        el.muted = false;
      })
      .catch(() => {});
  };
  unlock(webBell1);
  unlock(webBell2);
  unlock(webTick);
}

// ─── Voice / TTS ──────────────────────────────────────────────────────────────

let enabled = true;

// Neutral / Latin-American locales — avoid Castilian es-ES
const PREFERRED_LANGS = ['es-us', 'es-419', 'es-mx', 'es-ar', 'es-co', 'es-cl', 'es-la'];

function scoreVoice(lang: string, name: string): number {
  const l = (lang || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (l === 'es-es' || n.includes('españa') || n.includes('castil')) return -100;
  const idx = PREFERRED_LANGS.indexOf(l);
  if (idx >= 0) return 100 - idx;
  if (l.startsWith('es')) return 10;
  return -50;
}

// ── Web: use speechSynthesis directly for reliability ──────────────────────────
let webVoice: SpeechSynthesisVoice | null = null;
let webVoiceLoaded = false;

function pickWebVoice(): void {
  const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
  if (!synth) return;
  const voices = synth.getVoices();
  if (voices.length === 0) return;
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const score = scoreVoice(v.lang, v.name);
    if (score > bestScore) { bestScore = score; best = v; }
  }
  if (best) webVoice = best;
}

function initWebVoice(): void {
  if (webVoiceLoaded || Platform.OS !== 'web') return;
  webVoiceLoaded = true;
  pickWebVoice();
  (window as any).speechSynthesis?.addEventListener?.('voiceschanged', pickWebVoice);
}

function sayWeb(text: string): void {
  const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
  if (!synth) return;
  // Chrome bug: synthesis pauses itself after idle — always resume first
  if (synth.paused) synth.resume();
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-US';
  u.rate = 0.92;
  u.pitch = 1.0;
  if (webVoice) u.voice = webVoice;
  synth.speak(u);
}

// ── Native: expo-speech ────────────────────────────────────────────────────────
let chosenVoiceId: string | undefined;
let nativeVoicesLoaded = false;
const NATIVE_BASE_LANG = Platform.OS === 'ios' ? 'es-MX' : 'es-US';

async function loadNativeVoices(): Promise<void> {
  if (nativeVoicesLoaded) return;
  nativeVoicesLoaded = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    let best: { id: string; score: number } | null = null;
    for (const v of voices) {
      const score = scoreVoice((v as any).language, (v as any).name);
      if (score > 0 && (!best || score > best.score)) {
        best = { id: (v as any).identifier, score };
      }
    }
    if (best) chosenVoiceId = best.id;
  } catch {}
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) {
    try { Speech.stop(); } catch {}
    if (Platform.OS === 'web') {
      (window as any).speechSynthesis?.cancel?.();
    }
  }
}

export function say(text: string): void {
  if (!enabled) return;
  if (Platform.OS === 'web') {
    sayWeb(text);
  } else {
    try {
      Speech.stop();
      Speech.speak(text, {
        language: NATIVE_BASE_LANG,
        ...(chosenVoiceId ? { voice: chosenVoiceId } : {}),
        rate: 0.92,
        pitch: 1.0,
      });
    } catch {}
  }
}

export function primeVoice(): void {
  if (!enabled) return;
  if (Platform.OS === 'web') {
    initWebVoice();
    // Unlock speechSynthesis with a silent utterance
    const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
    if (synth) {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      synth.speak(u);
    }
    primeAudio();
  } else {
    loadNativeVoices();
  }
}
