import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Spoken coaching cues during a training session ("Trotar", "Descansar",
 * "10 segundos", "3", "2", "1"). Best-effort: silently no-ops if the platform
 * has no speech engine or the browser blocks it.
 */

let enabled = true;

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
      language: Platform.OS === 'ios' ? 'es-MX' : 'es-ES',
      rate: 1.0,
      pitch: 1.0,
    });
  } catch {}
}

/** Warm up the web speech engine after a user gesture so later cues are allowed to play. */
export function primeVoice() {
  if (Platform.OS !== 'web' || !enabled) return;
  try {
    const u = new (window as any).SpeechSynthesisUtterance('');
    u.volume = 0;
    (window as any).speechSynthesis?.speak(u);
  } catch {}
}
