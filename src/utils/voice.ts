import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// ─── Web Audio bell synthesizer ───────────────────────────────────────────────
let webAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (!webAudioCtx || webAudioCtx.state === 'closed') {
      webAudioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = webAudioCtx as AudioContext;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

function synthStrike(ctx: AudioContext, when: number, vol = 0.65): void {
  const partials: [number, number, number][] = [
    [1.000, 1.00, 3.2],
    [2.756, 0.50, 2.2],
    [5.404, 0.25, 1.5],
    [8.933, 0.12, 0.9],
  ];
  const base = 880;
  for (const [ratio, amp, decay] of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = base * ratio;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol * amp, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    osc.start(when);
    osc.stop(when + decay + 0.05);
  }
}

export function ringBell(count = 1): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const gap = 0.65;
  for (let i = 0; i < count; i++) {
    synthStrike(ctx, ctx.currentTime + i * gap);
  }
}

export function primeAudio(): void {
  if (Platform.OS !== 'web') return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
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
