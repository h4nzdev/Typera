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
