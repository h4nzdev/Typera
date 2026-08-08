import { Howl } from 'howler';

// A tiny, synthesized base64 beep (to work immediately without needing external audio files)
const base64Beep = "data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA";

const sounds = {
  keyPress: new Howl({
    src: [base64Beep],
    volume: 0.3,
    rate: 1.2, // normal typing pitch
  }),
  error: new Howl({
    src: [base64Beep],
    volume: 0.5,
    rate: 0.4, // low pitched buzz for error
  }),
  combo: new Howl({
    src: [base64Beep],
    volume: 0.6,
    rate: 1.8, // high pitched chime
  }),
  start: new Howl({
    src: [base64Beep],
    volume: 0.7,
    rate: 0.8,
  }),
  hover: new Howl({
    src: [base64Beep],
    volume: 0.1,
    rate: 2.5, // tiny fast tick
  }),
  click: new Howl({
    src: [base64Beep],
    volume: 0.4,
    rate: 1.5, // satisfying confirmation click
  })
};

export const playSound = (soundName) => {
  if (sounds[soundName]) {
    sounds[soundName].play();
  }
};
