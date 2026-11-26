// Synthesized medieval tabletop SFX for Carcassonne via Web Audio API

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
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type CarcassonneSfx =
  | "tile_draw"
  | "tile_place"
  | "tile_rotate"
  | "meeple_place"
  | "score_chime"
  | "complete_city"
  | "fanfare";

export function playCarcassonneSfx(type: CarcassonneSfx, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const tone = (
    freq: number,
    endFreq: number,
    dur: number,
    oscType: OscillatorType = "triangle",
    peak = 0.08,
    delay = 0
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = oscType;
    osc.frequency.setValueAtTime(freq, now + delay);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFreq),
        now + delay + dur
      );
    }
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.linearRampToValueAtTime(peak, now + delay + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + dur + 0.02);
  };

  switch (type) {
    case "tile_draw":
      // Tactile cardboard slide & flip swoosh
      tone(210, 480, 0.09, "sine", 0.06, 0);
      tone(380, 560, 0.07, "triangle", 0.055, 0.07);
      break;
    case "tile_place":
      // Crisp wooden tile clack
      tone(240, 110, 0.075, "triangle", 0.11, 0);
      tone(420, 290, 0.045, "sine", 0.05, 0.015);
      break;
    case "tile_rotate":
      tone(520, 660, 0.045, "sine", 0.045, 0);
      break;
    case "meeple_place":
      tone(340, 520, 0.08, "triangle", 0.08, 0);
      break;
    case "score_chime":
      tone(587.33, 587.33, 0.12, "triangle", 0.08, 0);
      tone(783.99, 783.99, 0.16, "triangle", 0.085, 0.09);
      tone(1046.5, 1046.5, 0.24, "sine", 0.075, 0.18);
      break;
    case "complete_city":
      // Triumphant medieval castle completion chord
      tone(523.25, 523.25, 0.14, "triangle", 0.085, 0);
      tone(659.25, 659.25, 0.16, "triangle", 0.085, 0.08);
      tone(783.99, 783.99, 0.18, "triangle", 0.09, 0.16);
      tone(1046.5, 1046.5, 0.34, "sine", 0.095, 0.25);
      tone(1318.5, 1318.5, 0.28, "sine", 0.06, 0.3);
      break;
    case "fanfare":
      tone(523.25, 523.25, 0.14, "triangle", 0.08, 0);
      tone(659.25, 659.25, 0.14, "triangle", 0.08, 0.12);
      tone(783.99, 783.99, 0.16, "triangle", 0.085, 0.24);
      tone(1046.5, 1046.5, 0.36, "triangle", 0.095, 0.38);
      break;
  }
}
