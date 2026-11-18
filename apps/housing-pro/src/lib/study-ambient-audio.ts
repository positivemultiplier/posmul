"use client";

export type AmbientSoundTrack = "none" | "white" | "rain" | "fire" | "lofi";

export interface AmbientTrackSpec {
  id: Exclude<AmbientSoundTrack, "none">;
  label: string;
  category: "noise" | "music";
  desc: string;
}

export const AMBIENT_TRACKS: AmbientTrackSpec[] = [
  { id: "white", label: "독서실 백색소음", category: "noise", desc: "집중력 유지용 부드러운 핑크 노이즈" },
  { id: "rain", label: "창밖 빗소리", category: "noise", desc: "잡념을 가리는 차분한 빗방울 소리" },
  { id: "fire", label: "모닥불 타닥임", category: "noise", desc: "따뜻한 저주파 백색소음" },
  { id: "lofi", label: "심야 로파이 패드", category: "music", desc: "가사 없는 잔잔한 앰비언트 화음" },
];

/**
 * 외부 음원 파일 의존 없이 브라우저 Web Audio API로 집중 백색소음·음악을 합성하는 경량 엔진
 */
export class StudyAmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSource: AudioNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private chordTimer: number | null = null;
  private currentTrack: AmbientSoundTrack = "none";

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.25;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(volume01: number): void {
    const clamped = Math.max(0, Math.min(1, volume01));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(clamped * 0.45, this.ctx.currentTime, 0.08);
    }
  }

  public stop(): void {
    if (this.chordTimer !== null && typeof window !== "undefined") {
      window.clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore stopped oscillator
      }
    }
    this.activeOscillators = [];

    if (this.activeSource) {
      try {
        if ("stop" in this.activeSource && typeof (this.activeSource as AudioBufferSourceNode).stop === "function") {
          (this.activeSource as AudioBufferSourceNode).stop();
        }
        this.activeSource.disconnect();
      } catch {
        // ignore
      }
      this.activeSource = null;
    }
    this.currentTrack = "none";
  }

  public play(track: AmbientSoundTrack, volume01 = 0.55): void {
    if (track === "none") {
      this.stop();
      return;
    }
    if (this.currentTrack === track) return;
    this.stop();

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.setVolume(volume01);
    this.currentTrack = track;

    if (track === "lofi") {
      this.startAmbientPad(ctx);
      return;
    }

    // 3초 순환 노이즈 버퍼 생성 (Pink-like smoothed noise)
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      const pink = (b0 + b1 + b2 + white * 0.1848) * 0.12;
      if (track === "fire" && Math.random() < 0.0012) {
        data[i] = pink + (Math.random() - 0.5) * 0.35;
      } else {
        data[i] = pink;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    if (track === "white") {
      filter.type = "lowpass";
      filter.frequency.value = 1100;
    } else if (track === "rain") {
      filter.type = "bandpass";
      filter.frequency.value = 1500;
      filter.Q.value = 0.45;
    } else {
      filter.type = "lowpass";
      filter.frequency.value = 520;
    }

    noise.connect(filter);
    filter.connect(this.masterGain);
    noise.start();
    this.activeSource = noise;
  }

  private startAmbientPad(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 392.0], // G6
    ];
    let chordIdx = 0;

    const padGain = ctx.createGain();
    padGain.gain.value = 0.16;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 680;

    padGain.connect(lowpass);
    lowpass.connect(this.masterGain);

    const oscs: OscillatorNode[] = chords[0].map((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(padGain);
      osc.start();
      return osc;
    });
    this.activeOscillators = oscs;
    this.activeSource = padGain;

    if (typeof window !== "undefined") {
      this.chordTimer = window.setInterval(() => {
        if (!this.ctx) return;
        chordIdx = (chordIdx + 1) % chords.length;
        const freqs = chords[chordIdx];
        const now = this.ctx.currentTime;
        this.activeOscillators.forEach((osc, i) => {
          osc.frequency.setTargetAtTime(freqs[i] || freqs[0], now, 0.7);
        });
      }, 4500);
    }
  }
}
