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
    if (webAudioCtx.state === 'suspended') webAudioCtx.resume().catch(() => {});
    return webAudioCtx;
  } catch { return null; }
}

/** Synthesize one bell strike using additive harmonics with exponential decay. */
function synthStrike(ctx: AudioContext, when: number, vol = 0.65): void {
  // Classic bell partial series: [freq ratio, relative amplitude, decay seconds]
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

/**
 * Ring a bell `count` times (web only — native callers use expo-av directly).
 * Fires synchronously and returns immediately; audio plays in the background.
 */
export function ringBell(count = 1): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const gap = 0.65;
  for (let i = 0; i < count; i++) {
    synthStrike(ctx, ctx.currentTime + i * gap);
  }
}

/** Warm up the Web Audio context after a user gesture so it's allowed to play. */
export function primeAudio(): void {
  if (Platform.OS !== 'web') return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  // Play a silent buffer to unlock autoplay policy
  const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
}

/**
 * Spoken coaching cues during a training session ("Trotar", "Descansar",
 * "10 segundos", "3", "2", "1"). Best-effort: silently no-ops if the platform
 * has no speech engine or the browser blocks it.
 *
 * We aim for a neutral Latin-American Spanish rather than Castilian ("es-ES").
 */

let enabled = true;
let chosenVoiceId: string | undefined;
let voicesLoaded = false;

// Neutral / Latin-American locales, most preferred first. "es-ES" is avoided.
const PREFERRED_LANGS = ['es-us', 'es-419', 'es-mx', 'es-ar', 'es-co', 'es-cl', 'es-la'];

const BASE_LANG = Platform.OS === 'ios' ? 'es-MX' : 'es-US';

function scoreVoice(lang: string, name: string): number {
  const l = (lang || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (l === 'es-es' || n.includes('españa') || n.includes('castil')) return -100;
  const idx = PREFERRED_LANGS.indexOf(l);
  if (idx >= 0) return 100 - idx;
  if (l.startsWith('es')) return 10;
  return -50;
}

async function loadVoices() {
  if (voicesLoaded) return;
  voicesLoaded = true;
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

export function setVoiceEnabled(on: boolean) {
  enabled = on;
  if (!on) {
    try {
      Speech.stop();
    } catch {}
  }
}

export function say(text: string) {
  if (!enabled) return;
  try {
    // Don't let a long utterance block the next short cue.
    Speech.stop();
    Speech.speak(text, {
      language: BASE_LANG,
      ...(chosenVoiceId ? { voice: chosenVoiceId } : {}),
      rate: 1.0,
      pitch: 1.0,
    });
  } catch {}
}

/** Warm up the speech engine and Web Audio context after a user gesture. */
export function primeVoice() {
  if (!enabled) return;
  loadVoices();
  if (Platform.OS !== 'web') return;
  try {
    const u = new (window as any).SpeechSynthesisUtterance('');
    u.volume = 0;
    (window as any).speechSynthesis?.speak(u);
  } catch {}
  primeAudio();
}
