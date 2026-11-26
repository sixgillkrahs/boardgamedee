let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

export type OnuwSfxType =
  | "card_flip"
  | "card_swap"
  | "night_start"
  | "dawn_chime"
  | "vote_click"
  | "fanfare";

export function playOnuwSfx(type: OnuwSfxType, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === "card_flip") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.09);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
    return;
  }

  if (type === "card_swap") {
    const freqs = [280, 420, 560];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.1, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.13);
    });
    return;
  }

  if (type === "night_start") {
    // Low atmospheric moonlit chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(146.8, now + 0.55);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.62);
    return;
  }

  if (type === "dawn_chime") {
    const notes = [392, 493.88, 587.33, 783.99];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.11, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
    return;
  }

  if (type === "vote_click") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.07);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
    return;
  }

  if (type === "fanfare") {
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.58);
    });
  }
}
