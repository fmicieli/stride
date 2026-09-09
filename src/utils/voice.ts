import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

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

/** Warm up the speech engine after a user gesture so later cues are allowed to play. */
export function primeVoice() {
  if (!enabled) return;
  loadVoices();
  if (Platform.OS !== 'web') return;
  try {
    const u = new (window as any).SpeechSynthesisUtterance('');
    u.volume = 0;
    (window as any).speechSynthesis?.speak(u);
  } catch {}
}
