// Web Audio API synthesized cockpit SFX for Sky Team (zero external audio files needed)

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

export type SkyTeamSfxType =
  | "dice_roll"
  | "place_die"
  | "switch_flip"
  | "radio_beep"
  | "coffee_sip"
  | "engine_hum"
  | "warning"
  | "victory"
  | "crash";

export function playSkyTeamSfx(type: SkyTeamSfxType, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  const tone = (
    freq: number,
    endFreq: number,
    dur: number,
    oscType: OscillatorType = "sine",
    gainPeak = 0.08,
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
    gain.gain.linearRampToValueAtTime(gainPeak, now + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + dur + 0.02);
  };

  switch (type) {
    case "dice_roll":
      tone(320, 480, 0.06, "triangle", 0.06, 0);
      tone(420, 260, 0.06, "triangle", 0.05, 0.055);
      tone(520, 390, 0.07, "triangle", 0.06, 0.11);
      break;
    case "place_die":
      tone(460, 320, 0.08, "triangle", 0.09, 0);
      tone(220, 180, 0.05, "sine", 0.06, 0.02);
      break;
    case "switch_flip":
      tone(740, 1080, 0.06, "square", 0.045, 0);
      tone(1180, 1480, 0.07, "sine", 0.05, 0.05);
      break;
    case "radio_beep":
      tone(1100, 1100, 0.06, "sine", 0.05, 0);
      tone(1420, 1420, 0.08, "sine", 0.05, 0.08);
      break;
    case "coffee_sip":
      tone(520, 760, 0.11, "sine", 0.06, 0);
      break;
    case "engine_hum":
      tone(120, 185, 0.24, "sawtooth", 0.045, 0);
      break;
    case "warning":
      tone(680, 680, 0.1, "sawtooth", 0.06, 0);
      tone(480, 480, 0.12, "sawtooth", 0.06, 0.12);
      break;
    case "victory":
      tone(523.25, 523.25, 0.14, "triangle", 0.08, 0);
      tone(659.25, 659.25, 0.14, "triangle", 0.08, 0.12);
      tone(783.99, 783.99, 0.18, "triangle", 0.08, 0.24);
      tone(1046.5, 1046.5, 0.36, "triangle", 0.09, 0.38);
      break;
    case "crash":
      tone(240, 65, 0.42, "sawtooth", 0.09, 0);
      tone(140, 45, 0.5, "square", 0.06, 0.06);
      break;
  }
}
