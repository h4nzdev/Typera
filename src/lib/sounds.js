// Native Web Audio API Synthesizer for Retro Arcade Sounds
let audioCtx;

const initAudio = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playSynth = (type, freq1, freq2, duration, vol = 0.1) => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq1, audioCtx.currentTime);
  
  if (freq2) {
    osc.frequency.exponentialRampToValueAtTime(freq2, audioCtx.currentTime + duration);
  }

  // Smooth fade out to prevent clicking
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

// ─── Voice / MP3 asset pool ──────────────────────────────────────────────────
// Pre-load each audio asset once and reuse the same element.
// Using a Map so we can look up by name and reset playback on each call.

const voiceAssets = {
  'you-win':  new Audio(new URL('../assets/voice/you-win.mp3',  import.meta.url).href),
  'you-lose': new Audio(new URL('../assets/voice/you-lose.mp3', import.meta.url).href),
  'steal':    new Audio(new URL('../assets/voice/steal.mp3',    import.meta.url).href),
  'glitch':   new Audio(new URL('../assets/voice/glitch.mp3',   import.meta.url).href),
  'blind':    new Audio(new URL('../assets/voice/blind.mp3',    import.meta.url).href),
};

// Set volume for voice lines
Object.values(voiceAssets).forEach(a => { a.volume = 0.9; });

/**
 * Play a voice/MP3 asset by name.
 * Resets the element to the start if it was already playing.
 */
export const playVoice = (name) => {
  try {
    const audio = voiceAssets[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {}); // ignore autoplay policy errors silently
  } catch (err) {
    // Non-fatal
  }
};

export const playSound = (soundName) => {
  try {
    initAudio();
    
    switch (soundName) {
      case 'keyPress':
        // Short mechanical typewriter tick
        playSynth('triangle', 800, 600, 0.05, 0.05);
        break;
      case 'error':
        // Low harsh buzz
        playSynth('sawtooth', 150, 100, 0.3, 0.15);
        break;
      case 'combo':
        // Bright victory chime
        playSynth('sine', 1200, null, 0.3, 0.1);
        setTimeout(() => playSynth('sine', 1600, null, 0.4, 0.1), 100);
        break;
      case 'start':
        // Upward sweeping laser sound
        playSynth('square', 400, 1200, 0.5, 0.08);
        break;
      case 'hover':
        // Very soft blip
        playSynth('sine', 800, null, 0.03, 0.02);
        break;
      case 'click':
        // Solid confirm blip
        playSynth('square', 600, 300, 0.1, 0.05);
        break;
      default:
        break;
    }
  } catch (err) {
    console.warn("Audio playback failed:", err);
  }
};
