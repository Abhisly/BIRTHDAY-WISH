import { Howl, Howler } from "howler";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  return audioCtx;
}

export function unlockAudioContext() {
  if (typeof window !== "undefined") {
    try {
      if (Howler.ctx && Howler.ctx.state === "suspended") {
        Howler.ctx.resume().catch(() => {});
      }
    } catch {}
  }
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// Procedural double thump heartbeat synth
export function playHeartbeatSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    const triggerThump = (time: number, vol: number) => {
      const osc = ctx.createOscillator();
      const oscMobile = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(100, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.25);

      oscMobile.type = "triangle";
      oscMobile.frequency.setValueAtTime(250, time);
      oscMobile.frequency.exponentialRampToValueAtTime(80, time + 0.25);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250, time);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.connect(filter);
      oscMobile.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      oscMobile.start(time);
      osc.stop(time + 0.25);
      oscMobile.stop(time + 0.25);
    };

    triggerThump(now, 0.85);
    triggerThump(now + 0.16, 0.55);
  } catch (e) {
    console.warn("Audio Context playback error:", e);
  }
}

// Countdown beep generator
export function playCountdownBeep(freq = 440) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {}
}

class SoundManager {
  private cdMusic: Howl | null = null;
  private birthdayMusic: Howl | null = null;
  private memorySkyPiano: Howl | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;

  private cdUrl = "/DISK/Athadu Movie Love BGM.mp3";
  private cdUrlAlt = "/DISK/Athadu%20Movie%20Love%20BGM.mp3";
  private birthdayUrl = "/DISK/Happy Birthday Marble Music.mp3";
  private birthdayUrlAlt = "/DISK/Happy%20Birthday%20Marble%20Music.mp3";
  private pianoUrl = "https://upload.wikimedia.org/wikipedia/commons/e/e0/Nocturne_in_E_flat_major%2C_Op._9_no._2.mp3";

  constructor() {
    if (typeof window !== "undefined") {
      this.initTracks();
    }
  }

  private initTracks() {
    try {
      this.cdMusic = new Howl({
        src: [this.cdUrl, this.cdUrlAlt],
        html5: false,
        loop: true,
        volume: 0.85,
        preload: true,
      });
      this.birthdayMusic = new Howl({
        src: [this.birthdayUrl, this.birthdayUrlAlt],
        html5: false,
        loop: true,
        volume: 0.85,
        preload: true,
      });
      this.memorySkyPiano = new Howl({
        src: [this.pianoUrl],
        html5: true,
        loop: true,
        volume: 0.65,
        preload: true,
      });
    } catch (e) {
      console.warn("SoundManager init warning:", e);
    }
  }

  playMusic() {
    this.playCdMusic();
  }

  playCdMusic() {
    unlockAudioContext();
    if (this.birthdayMusic && this.birthdayMusic.playing()) this.birthdayMusic.stop();
    if (this.memorySkyPiano && this.memorySkyPiano.playing()) this.memorySkyPiano.stop();

    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio = null;
    }

    if (this.cdMusic) {
      if (!this.cdMusic.playing()) {
        const id = this.cdMusic.play();
        if (id === undefined || id === null) {
          // Trigger fallback standard HTML5 Audio
          this.triggerFallback(this.cdUrl);
        } else {
          this.cdMusic.fade(0, 0.85, 800, id);
        }
      } else {
        this.cdMusic.volume(0.85);
      }
    } else {
      this.triggerFallback(this.cdUrl);
    }
  }

  private triggerFallback(url: string) {
    if (typeof window === "undefined") return;
    try {
      this.fallbackAudio = new Audio(url);
      this.fallbackAudio.loop = true;
      this.fallbackAudio.volume = 0.85;
      this.fallbackAudio.play().catch(() => {
        // Retry with encoded path if unencoded failed
        const alt = new Audio(encodeURI(url));
        alt.loop = true;
        alt.volume = 0.85;
        alt.play().catch(() => {});
        this.fallbackAudio = alt;
      });
    } catch {}
  }

  stopCdMusic(duration = 1000) {
    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio = null;
    }
    if (!this.cdMusic) return;
    if (this.cdMusic.playing()) {
      this.cdMusic.fade(this.cdMusic.volume(), 0, duration);
      setTimeout(() => {
        this.cdMusic?.stop();
      }, duration + 50);
    }
  }

  playBirthdayMusic() {
    unlockAudioContext();
    this.stopCdMusic(800);
    if (this.memorySkyPiano && this.memorySkyPiano.playing()) this.memorySkyPiano.stop();
    if (!this.birthdayMusic) {
      this.triggerFallback(this.birthdayUrl);
      return;
    }
    if (!this.birthdayMusic.playing()) {
      const id = this.birthdayMusic.play();
      if (id === undefined || id === null) {
        this.triggerFallback(this.birthdayUrl);
      } else {
        this.birthdayMusic.fade(0, 0.85, 1200, id);
      }
    } else {
      this.birthdayMusic.volume(0.85);
    }
  }

  pauseMusic() {
    this.fadeOutAndStop(1000);
  }

  setVolume(vol: number) {
    if (this.cdMusic) this.cdMusic.volume(vol);
    if (this.birthdayMusic) this.birthdayMusic.volume(vol);
    if (this.fallbackAudio) this.fallbackAudio.volume = vol;
  }

  fadeOutAndStop(duration = 1500) {
    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio = null;
    }
    if (this.cdMusic && this.cdMusic.playing()) {
      this.cdMusic.fade(this.cdMusic.volume(), 0, duration);
      setTimeout(() => {
        this.cdMusic?.stop();
      }, duration);
    }
    if (this.birthdayMusic && this.birthdayMusic.playing()) {
      this.birthdayMusic.fade(this.birthdayMusic.volume(), 0, duration);
      setTimeout(() => {
        this.birthdayMusic?.stop();
      }, duration);
    }
  }

  playMemorySkyMusic() {
    this.fadeOutAndStop(1500);
    if (!this.memorySkyPiano) return;
    if (!this.memorySkyPiano.playing()) {
      this.memorySkyPiano.play();
      this.memorySkyPiano.fade(0, 0.65, 2500);
    }
  }

  pauseMemorySkyMusic(duration = 1200) {
    if (!this.memorySkyPiano) return;
    this.memorySkyPiano.fade(this.memorySkyPiano.volume(), 0, duration);
    setTimeout(() => {
      this.memorySkyPiano?.pause();
    }, duration + 50);
  }
}

export const musicManager = new SoundManager();

// Procedural wind sound synthesis
let windLfo: OscillatorNode | null = null;
let windNoise: AudioBufferSourceNode | null = null;
let windFilter: BiquadFilterNode | null = null;
let windGain: GainNode | null = null;

export function startWindSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    
    const bufferSize = ctx.sampleRate * 2.0; 
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    windNoise = ctx.createBufferSource();
    windNoise.buffer = buffer;
    windNoise.loop = true;

    windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.setValueAtTime(300, now);
    windFilter.Q.setValueAtTime(3.0, now);

    windLfo = ctx.createOscillator();
    windLfo.type = "sine";
    windLfo.frequency.setValueAtTime(0.15, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(150, now);
    windLfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);

    windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0, now);
    windGain.gain.linearRampToValueAtTime(0.08, now + 3);

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(ctx.destination);

    windNoise.start(now);
    windLfo.start(now);
  } catch (e) {
    console.warn("Error starting wind sound:", e);
  }
}

export function stopWindSound() {
  const ctx = getAudioContext();
  if (!ctx || !windGain) return;
  try {
    const now = ctx.currentTime;
    windGain.gain.linearRampToValueAtTime(0, now + 1.5);
    setTimeout(() => {
      try {
        windNoise?.stop();
        windLfo?.stop();
        windNoise?.disconnect();
        windLfo?.disconnect();
        windFilter?.disconnect();
        windGain?.disconnect();
      } catch {}
      windNoise = null;
      windLfo = null;
      windFilter = null;
      windGain = null;
    }, 1600);
  } catch {}
}

export function playWhooshSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {}
}

export function playSparkleSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    [1200, 1600, 2400].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.06, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.2);
    });
  } catch {}
}

export function playTypewriterSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(600 + Math.random() * 200, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {}
}

export function playChimeSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  } catch {}
}

