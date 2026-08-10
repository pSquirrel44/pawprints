// Web Audio API Synthesizer for Cat Sounds

let audioCtx: AudioContext | null = null;
let isAudioMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setAudioMuted(muted: boolean) {
  isAudioMuted = muted;
}

export function getAudioMuted(): boolean {
  return isAudioMuted;
}

/**
 * Play a synthesized cute "Meow!" sound
 */
export function playMeowSound(pitchMultiplier = 1.0) {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    
    // Pitch envelope for "Me-ow!"
    const startFreq = 400 * pitchMultiplier;
    const peakFreq = 750 * pitchMultiplier;
    const endFreq = 300 * pitchMultiplier;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.35);

    // Volume envelope
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Play a synthesized energetic "Woof! Bark!" sound
 */
export function playWoofSound(pitchMultiplier = 1.0) {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    
    // Pitch envelope for "Woof!"
    const startFreq = 220 * pitchMultiplier;
    const peakFreq = 380 * pitchMultiplier;
    const endFreq = 160 * pitchMultiplier;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.22);

    // Volume envelope (short snappy woof)
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Play a treat / fish icon crunch sound
 */
export function playTreatSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Quick pleasant double pop
    [0, 0.08].forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 523.25 : 659.25, now + delay); // C5 then E5
      osc.frequency.exponentialRampToValueAtTime(880, now + delay + 0.08);

      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    });
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Play a gentle purr vibration sound
 */
export function playPurrSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(32, now); // Low frequency rumble

    // LFO for purring pulse
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(22, now); // Purr rate ~22Hz
    lfoGain.gain.setValueAtTime(0.08, now);

    lfo.connect(gain.gain);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.2);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);

    lfo.stop(now + 0.85);
    osc.stop(now + 0.85);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}
