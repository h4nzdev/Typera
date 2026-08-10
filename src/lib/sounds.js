// Native Web Audio API Synthesizer for Retro Arcade Sounds & Background Music
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
const voiceUrls = {
  'you-win':  new URL('../assets/voice/you-win.mp3',  import.meta.url).href,
  'you-lose': new URL('../assets/voice/you-lose.mp3', import.meta.url).href,
  'steal':    new URL('../assets/voice/steal.mp3',    import.meta.url).href,
  'glitch':   new URL('../assets/voice/glitch.mp3',   import.meta.url).href,
  'blind':    new URL('../assets/voice/blind.mp3',    import.meta.url).href,
  'type':     new URL('../assets/voice/type.mp3',     import.meta.url).href,
  'powerup':  new URL('../assets/powerup.mp3',        import.meta.url).href,
  'combo':    new URL('../assets/voice/combo.mp3',    import.meta.url).href,
  'freeze':   new URL('../assets/voice/freeze.mp3',   import.meta.url).href,
};

export const playVoice = (name) => {
  try {
    const url = voiceUrls[name];
    if (!url) return;
    const sound = new Audio(url);
    sound.volume = 0.9;
    sound.play().catch((err) => {
      console.warn(`Voice sound [${name}] playback failed:`, err);
    });
  } catch (err) {
    // Non-fatal
  }
};

// ─── Background Music (BGM) System ──────────────────────────────────────────
let currentBgm = null;
let currentType = null;
let bgmVolume = 0.35;
let isMuted = false;

const bgmSingleAudio = new Audio(new URL('../assets/music/bg-music.mp3', import.meta.url).href);
bgmSingleAudio.loop = true;
bgmSingleAudio.volume = bgmVolume;

const bgmAssets = {
  menu:   bgmSingleAudio,
  battle: bgmSingleAudio,
};

export const playBgm = (type) => {
  try {
    if (isMuted) return;
    if (currentType === type && currentBgm && !currentBgm.paused) return;

    const target = bgmAssets[type];
    if (!target) return;

    if (currentBgm && currentBgm !== target) {
      currentBgm.pause();
      currentBgm.currentTime = 0;
    }

    currentBgm = target;
    currentType = type;
    currentBgm.volume = bgmVolume;

    const promise = currentBgm.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Autoplay blocked by browser policy — attach interaction listener
        const handleInteraction = () => {
          if (currentBgm && !isMuted) {
            currentBgm.play().catch(() => {});
          }
          window.removeEventListener('click', handleInteraction);
          window.removeEventListener('keydown', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
      });
    }
  } catch (err) {
    // Non-fatal
  }
};

export const stopBgm = () => {
  if (currentBgm) {
    currentBgm.pause();
    currentBgm.currentTime = 0;
    currentBgm = null;
    currentType = null;
  }
};

export const toggleMuteBgm = () => {
  isMuted = !isMuted;
  if (isMuted && currentBgm) {
    currentBgm.pause();
  } else if (!isMuted && currentBgm) {
    currentBgm.play().catch(() => {});
  }
  return isMuted;
};

export const playSound = (soundName) => {
  try {
    initAudio();
    
    switch (soundName) {
      case 'keyPress':
        playSynth('triangle', 800, 600, 0.05, 0.05);
        break;
      case 'error':
        playSynth('sawtooth', 150, 100, 0.3, 0.15);
        break;
      case 'combo':
        playSynth('sine', 1200, null, 0.3, 0.1);
        setTimeout(() => playSynth('sine', 1600, null, 0.4, 0.1), 100);
        break;
      case 'start':
        playSynth('square', 400, 1200, 0.5, 0.08);
        break;
      case 'hover':
        playSynth('sine', 800, null, 0.03, 0.02);
        break;
      case 'click':
        playSynth('square', 600, 300, 0.1, 0.05);
        break;
      default:
        break;
    }
  } catch (err) {
    console.warn("Audio playback failed:", err);
  }
};
