import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
  SeatDescriptor,
} from "@/cartridges/types";

export type SkyTeamRole = "pilot" | "copilot";

export type SkyTeamAirportId =
  | "montreal"
  | "tokyo"
  | "kuala_lumpur"
  | "toncontin"
  | "laguardia"
  | "dusseldorf"
  | "cdg_paris"
  | "toncontin_hard"
  | "haneda_hard"
  | "cdg_hard"
  | "kuala_lumpur_expert"
  | "laguardia_expert"
  | "dusseldorf_expert";

export interface SkyTeamAirportDef {
  id: SkyTeamAirportId;
  code: string;
  nameVi: string;
  difficultyVi: string;
  accentColor: string;
  /** Column index (0..12) inside /sprites/sky-team-airports.png */
  stripIndex: number;
  /** Number of planes on each approach space (index 0 = start clouds, last = Airport runway). */
  traffic: number[];
  /** Starting altitude in thousands of feet (6 = 6000 ft). */
  startAltitude: number;
  /** Altitudes (in thousands of feet) that grant a Reroll token when reached. */
  rerollAltitudes: number[];
  /** Starting axis tilt (-2..+2). */
  initialAxis: number;
  descriptionVi: string;
}

export const SKY_TEAM_AIRPORTS: Record<SkyTeamAirportId, SkyTeamAirportDef> = {
  montreal: {
    id: "montreal",
    code: "YUL",
    nameVi: "Montréal-Trudeau",
    difficultyVi: "Cơ bản • Xanh lá",
    accentColor: "#22c55e",
    stripIndex: 0,
    traffic: [0, 0, 1, 2, 1, 3, 2],
    startAltitude: 6,
    rerollAltitudes: [6, 2],
    initialAxis: 0,
    descriptionVi:
      "Đường bay chuẩn 7 ô, quang đãng — lý tưởng để làm quen nhịp độ hạ cánh.",
  },
  tokyo: {
    id: "tokyo",
    code: "HND",
    nameVi: "Tokyo Haneda",
    difficultyVi: "Cơ bản • Xanh lá",
    accentColor: "#22c55e",
    stripIndex: 1,
    traffic: [0, 1, 1, 2, 1, 0, 2, 1],
    startAltitude: 6,
    rerollAltitudes: [6, 2],
    initialAxis: 0,
    descriptionVi:
      "Đường tiếp cận 8 ô tại vịnh Tokyo — cần ít nhất 1 vòng tăng tốc 2 ô.",
  },
  kuala_lumpur: {
    id: "kuala_lumpur",
    code: "KUL",
    nameVi: "Kuala Lumpur",
    difficultyVi: "Trung bình • Vàng",
    accentColor: "#f59e0b",
    stripIndex: 2,
    traffic: [0, 1, 1, 1, 1, 1, 1, 1],
    startAltitude: 6,
    rerollAltitudes: [6, 2],
    initialAxis: 0,
    descriptionVi:
      "Đường bay dài 8 ô với mật độ không lưu trải đều khắp các chặng.",
  },
  toncontin: {
    id: "toncontin",
    code: "TGU",
    nameVi: "Toncontín",
    difficultyVi: "Trung bình • Vàng",
    accentColor: "#f59e0b",
    stripIndex: 5,
    traffic: [0, 1, 1, 1, 1],
    startAltitude: 6,
    rerollAltitudes: [6, 2],
    initialAxis: 0,
    descriptionVi:
      "Đường tiếp cận siêu ngắn chỉ 5 ô giữa thung lũng — rất dễ bay lố sân bay!",
  },
  laguardia: {
    id: "laguardia",
    code: "LGA",
    nameVi: "New York LaGuardia",
    difficultyVi: "Trung bình • Vàng",
    accentColor: "#f59e0b",
    stripIndex: 8,
    traffic: [0, 0, 1, 1, 2, 1, 1],
    startAltitude: 6,
    rerollAltitudes: [6, 2],
    initialAxis: 0,
    descriptionVi:
      "Không phận New York 7 ô đông đúc ở chặng tiếp cận cuối.",
  },
  dusseldorf: {
    id: "dusseldorf",
    code: "DUS",
    nameVi: "Düsseldorf",
    difficultyVi: "Trung bình • Vàng",
    accentColor: "#f59e0b",
    stripIndex: 10,
    traffic: [0, 1, 1, 2, 1, 1, 2, 1],
    startAltitude: 6,
    rerollAltitudes: [6, 2],
    initialAxis: 0,
    descriptionVi:
      "Đường bay 8 ô vùng sông Rhine với 9 máy bay cần phối hợp Radio nhịp nhàng.",
  },
  cdg_paris: {
    id: "cdg_paris",
    code: "CDG",
    nameVi: "Paris Charles de Gaulle",
    difficultyVi: "Trung bình • Vàng",
    accentColor: "#f59e0b",
    stripIndex: 12,
    traffic: [0, 1, 1, 2, 1, 2, 1, 1],
    startAltitude: 6,
    rerollAltitudes: [6, 2],
    initialAxis: 0,
    descriptionVi:
      "Sân bay quốc tế Paris 8 ô với lưu lượng bay dày đặc hai chặng giữa.",
  },
  toncontin_hard: {
    id: "toncontin_hard",
    code: "TGU",
    nameVi: "Toncontín (Khó)",
    difficultyVi: "Khó • Đỏ",
    accentColor: "#ef4444",
    stripIndex: 3,
    traffic: [0, 1, 2, 1, 2],
    startAltitude: 6,
    rerollAltitudes: [6],
    initialAxis: 1,
    descriptionVi:
      "5 ô ngắn + gió ngang nghiêng sẵn +1 và chỉ có 1 token Tung Lại.",
  },
  haneda_hard: {
    id: "haneda_hard",
    code: "HND",
    nameVi: "Tokyo Haneda (Khó)",
    difficultyVi: "Khó • Đỏ",
    accentColor: "#ef4444",
    stripIndex: 6,
    traffic: [0, 1, 1, 2, 2, 2, 2, 1],
    startAltitude: 6,
    rerollAltitudes: [6, 2],
    initialAxis: 0,
    descriptionVi:
      "8 ô với 11 máy bay cản đường — đòi hỏi Cơ phó dùng tối đa 2 ô Radio.",
  },
  cdg_hard: {
    id: "cdg_hard",
    code: "CDG",
    nameVi: "Paris CDG (Khó)",
    difficultyVi: "Khó • Đỏ",
    accentColor: "#ef4444",
    stripIndex: 11,
    traffic: [0, 1, 2, 2, 2, 2, 2, 1],
    startAltitude: 6,
    rerollAltitudes: [6],
    initialAxis: 0,
    descriptionVi:
      "8 ô không lưu dày đặc (12 máy bay) và chỉ 1 token Tung Lại.",
  },
  kuala_lumpur_expert: {
    id: "kuala_lumpur_expert",
    code: "KUL",
    nameVi: "Kuala Lumpur (Chuyên gia)",
    difficultyVi: "Chuyên gia • Đen",
    accentColor: "#a855f7",
    stripIndex: 4,
    traffic: [0, 1, 1, 2, 2, 2, 2, 2],
    startAltitude: 6,
    rerollAltitudes: [6],
    initialAxis: 1,
    descriptionVi:
      "Chế độ Chuyên gia 8 ô, 12 máy bay, gió ngang +1 và chỉ 1 lần Tung Lại.",
  },
  laguardia_expert: {
    id: "laguardia_expert",
    code: "LGA",
    nameVi: "LaGuardia (Chuyên gia)",
    difficultyVi: "Chuyên gia • Đen",
    accentColor: "#a855f7",
    stripIndex: 7,
    traffic: [0, 1, 1, 2, 2, 2, 2],
    startAltitude: 6,
    rerollAltitudes: [6],
    initialAxis: -1,
    descriptionVi:
      "Chế độ Chuyên gia 7 ô, gió ngang -1, 10 máy bay cản đường.",
  },
  dusseldorf_expert: {
    id: "dusseldorf_expert",
    code: "DUS",
    nameVi: "Düsseldorf (Chuyên gia)",
    difficultyVi: "Chuyên gia • Đen",
    accentColor: "#a855f7",
    stripIndex: 9,
    traffic: [0, 1, 2, 2, 2, 2, 2, 2],
    startAltitude: 6,
    rerollAltitudes: [6],
    initialAxis: 1,
    descriptionVi:
      "Thử thách tối thượng: 8 ô, 13 máy bay, gió ngang +1, 1 lần Tung Lại!",
  },
};

export const SKY_TEAM_AIRPORT_IDS: SkyTeamAirportId[] = [
  "montreal",
  "tokyo",
  "kuala_lumpur",
  "toncontin",
  "laguardia",
  "dusseldorf",
  "cdg_paris",
  "toncontin_hard",
  "haneda_hard",
  "cdg_hard",
  "kuala_lumpur_expert",
  "laguardia_expert",
  "dusseldorf_expert",
];

export type SkyTeamSlotId =
  | "axis_pilot"
  | "axis_copilot"
  | "engine_pilot"
  | "engine_copilot"
  | "radio_pilot"
  | "radio_copilot_1"
  | "radio_copilot_2"
  | "gear_12"
  | "gear_34"
  | "gear_56"
  | "flap_12"
  | "flap_23"
  | "flap_45"
  | "flap_56"
  | "brake_2"
  | "brake_4"
  | "brake_6"
  | "coffee_1"
  | "coffee_2"
  | "coffee_3"
  | "intern_pilot"
  | "intern_copilot"
  | "fuel_leak";

export interface SkyTeamSlotDef {
  id: SkyTeamSlotId;
  owner: SkyTeamRole | "any";
  category:
    | "axis"
    | "engine"
    | "radio"
    | "gear"
    | "flap"
    | "brake"
    | "coffee"
    | "intern"
    | "fuel";
  labelVi: string;
  allowedValues: number[];
  /** If true, persists across rounds once activated (switches). */
  persistentSwitch: boolean;
  /** Previous slot that must already be activated (for ordered switches). */
  requiresSlot?: SkyTeamSlotId;
}

export const SKY_TEAM_SLOTS: Record<SkyTeamSlotId, SkyTeamSlotDef> = {
  axis_pilot: {
    id: "axis_pilot",
    owner: "pilot",
    category: "axis",
    labelVi: "Trục Cánh (Cơ trưởng)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  axis_copilot: {
    id: "axis_copilot",
    owner: "copilot",
    category: "axis",
    labelVi: "Trục Cánh (Cơ phó)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  engine_pilot: {
    id: "engine_pilot",
    owner: "pilot",
    category: "engine",
    labelVi: "Động Cơ (Cơ trưởng)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  engine_copilot: {
    id: "engine_copilot",
    owner: "copilot",
    category: "engine",
    labelVi: "Động Cơ (Cơ phó)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  radio_pilot: {
    id: "radio_pilot",
    owner: "pilot",
    category: "radio",
    labelVi: "Radio (Cơ trưởng)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  radio_copilot_1: {
    id: "radio_copilot_1",
    owner: "copilot",
    category: "radio",
    labelVi: "Radio 1 (Cơ phó)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  radio_copilot_2: {
    id: "radio_copilot_2",
    owner: "copilot",
    category: "radio",
    labelVi: "Radio 2 (Cơ phó)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  gear_12: {
    id: "gear_12",
    owner: "pilot",
    category: "gear",
    labelVi: "Càng Hạ Cánh (1–2)",
    allowedValues: [1, 2],
    persistentSwitch: true,
  },
  gear_34: {
    id: "gear_34",
    owner: "pilot",
    category: "gear",
    labelVi: "Càng Hạ Cánh (3–4)",
    allowedValues: [3, 4],
    persistentSwitch: true,
  },
  gear_56: {
    id: "gear_56",
    owner: "pilot",
    category: "gear",
    labelVi: "Càng Hạ Cánh (5–6)",
    allowedValues: [5, 6],
    persistentSwitch: true,
  },
  flap_12: {
    id: "flap_12",
    owner: "copilot",
    category: "flap",
    labelVi: "Cánh Tà 1 (1–2)",
    allowedValues: [1, 2],
    persistentSwitch: true,
  },
  flap_23: {
    id: "flap_23",
    owner: "copilot",
    category: "flap",
    labelVi: "Cánh Tà 2 (2–3)",
    allowedValues: [2, 3],
    persistentSwitch: true,
    requiresSlot: "flap_12",
  },
  flap_45: {
    id: "flap_45",
    owner: "copilot",
    category: "flap",
    labelVi: "Cánh Tà 3 (4–5)",
    allowedValues: [4, 5],
    persistentSwitch: true,
    requiresSlot: "flap_23",
  },
  flap_56: {
    id: "flap_56",
    owner: "copilot",
    category: "flap",
    labelVi: "Cánh Tà 4 (5–6)",
    allowedValues: [5, 6],
    persistentSwitch: true,
    requiresSlot: "flap_45",
  },
  brake_2: {
    id: "brake_2",
    owner: "pilot",
    category: "brake",
    labelVi: "Phanh 1 (2)",
    allowedValues: [2],
    persistentSwitch: true,
  },
  brake_4: {
    id: "brake_4",
    owner: "pilot",
    category: "brake",
    labelVi: "Phanh 2 (4)",
    allowedValues: [4],
    persistentSwitch: true,
    requiresSlot: "brake_2",
  },
  brake_6: {
    id: "brake_6",
    owner: "pilot",
    category: "brake",
    labelVi: "Phanh 3 (6)",
    allowedValues: [6],
    persistentSwitch: true,
    requiresSlot: "brake_4",
  },
  coffee_1: {
    id: "coffee_1",
    owner: "any",
    category: "coffee",
    labelVi: "Cà Phê #1",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  coffee_2: {
    id: "coffee_2",
    owner: "any",
    category: "coffee",
    labelVi: "Cà Phê #2",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  coffee_3: {
    id: "coffee_3",
    owner: "any",
    category: "coffee",
    labelVi: "Cà Phê #3",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  intern_pilot: {
    id: "intern_pilot",
    owner: "pilot",
    category: "intern",
    labelVi: "Thực Tập Sinh (Cơ trưởng →)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  intern_copilot: {
    id: "intern_copilot",
    owner: "copilot",
    category: "intern",
    labelVi: "Thực Tập Sinh (← Cơ phó)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
  fuel_leak: {
    id: "fuel_leak",
    owner: "any",
    category: "fuel",
    labelVi: "Nhiên Liệu Kerosene (-6)",
    allowedValues: [1, 2, 3, 4, 5, 6],
    persistentSwitch: false,
  },
};

export const ALL_SKY_TEAM_SLOT_IDS: SkyTeamSlotId[] = Object.keys(
  SKY_TEAM_SLOTS
) as SkyTeamSlotId[];

/** Official 20-segment Wind Module ring (clockwise from 12 o'clock: +3 Tailwind to -3 Headwind). */
export const SKY_TEAM_WIND_RING: readonly number[] = [
  3, 3, 2, 2, 1, 0, -1, -2, -2, -3, -3, -3, -2, -2, -1, 0, 1, 2, 2, 3,
];

export interface SkyTeamConfig {
  airportId: SkyTeamAirportId;
  /** If true, seat 0 is Co-pilot and seat 1 is Pilot. */
  swapRoles: boolean;
  /** Optional Wind Module (adds +3..-3 speed modifier rotated by Axis tilt). */
  enableWindModule?: boolean;
  /** Optional Intern Module (6 training checkmarks must be completed before landing). */
  enableInternModule?: boolean;
  /** Optional Kerosene Fuel Module (starts at 20 fuel; burns die value or -6 each round). */
  enableFuelModule?: boolean;
}

export type SkyTeamStep = "BriefingStep" | "PlacementStep" | "MatchOver";

export interface PlacedDieRecord {
  seatNo: number;
  role: SkyTeamRole;
  value: number;
  originalValue: number;
  coffeeUsed: number;
}

export interface SkyTeamSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  role: SkyTeamRole;
  /** Unplaced dice values (1..6) for the current round. */
  dice: number[];
  /** Ready flag during BriefingStep. */
  readyForRoll: boolean;
}

export interface SkyTeamState {
  config: SkyTeamConfig;
  step: SkyTeamStep;
  roundNumber: number; // 1..7
  /** Remaining altitude in thousands of feet (6 = 6000 ft .. 0 = Landing). */
  altitude: number;
  /** Current position index along airport.traffic (0 .. traffic.length - 1). */
  approachPos: number;
  /** Remaining traffic planes per approach space. */
  traffic: number[];
  /** Plane roll/tilt angle: -2 (left) .. 0 (level) .. +2 (right). >=3 or <=-3 = crash. */
  axis: number;
  /** Blue aerodynamics threshold (starts at 4, +1 per Landing Gear switch -> max 7). */
  blueMarker: number;
  /** Orange aerodynamics threshold (starts at 8, +1 per Flap switch -> max 12). */
  orangeMarker: number;
  /** Red brake threshold (0, 2, 4, 6). */
  brakeLevel: number;
  /** Available Coffee tokens (0..3). */
  coffeeTokens: number;
  /** Available Reroll tokens. */
  rerollTokens: number;
  /** Whether the official Wind Module is active. */
  windEnabled: boolean;
  /** Current Wind ring index (0..19 into SKY_TEAM_WIND_RING). */
  windIndex: number;
  /** Whether the official Intern Module is active. */
  internEnabled: boolean;
  /** 6 Intern training checkmarks (left-to-right; Pilot trains from left, Co-pilot from right). */
  internTrained: boolean[];
  /** Whether the official Kerosene Fuel Module is active. */
  fuelEnabled: boolean;
  /** Remaining Kerosene fuel (starts at 20; < 0 = crash). */
  fuelLevel: number;
  /** Persistent switches activated across the whole flight. */
  switches: Record<
    | "gear_12"
    | "gear_34"
    | "gear_56"
    | "flap_12"
    | "flap_23"
    | "flap_45"
    | "flap_56"
    | "brake_2"
    | "brake_4"
    | "brake_6",
    boolean
  >;
  /** Dice placed on cockpit slots during the current round. */
  roundPlacements: Partial<Record<SkyTeamSlotId, PlacedDieRecord>>;
  /** Whether Axis was already resolved this round. */
  axisResolvedThisRound: boolean;
  /** Whether Engines were already resolved this round. */
  enginesResolvedThisRound: boolean;
  /** Active seatNo during PlacementStep. */
  activeSeatNo: number;
  /** Starting role for this round (alternates Pilot / Co-pilot). */
  roundStarterRole: SkyTeamRole;
  seats: SkyTeamSeatState[];
  outcome: "playing" | "victory" | "defeat";
  outcomeReasonVi: string | null;
  lastActionSummaryVi: string;
  actionSeq: number;
  rngState: number;
}

export type SkyTeamCommand =
  | { type: "READY_TO_ROLL" }
  | {
      type: "PLACE_DIE";
      dieIndex: number;
      slotId: SkyTeamSlotId;
      /** Coffee adjustment applied to this die (-3..+3). */
      coffeeDelta?: number;
    }
  | {
      type: "USE_REROLL";
      dieIndices: number[];
    };

export interface SkyTeamSeatView {
  seatNo: number;
  actorId: string;
  displayName: string;
  role: SkyTeamRole;
  /** Visible values for the viewer's own seat (or after MatchOver); null for partner's hidden dice. */
  dice: (number | null)[];
  diceCount: number;
  readyForRoll: boolean;
}

export interface SkyTeamPlayerView {
  airport: SkyTeamAirportDef;
  step: SkyTeamStep;
  roundNumber: number;
  altitude: number;
  approachPos: number;
  traffic: number[];
  axis: number;
  blueMarker: number;
  orangeMarker: number;
  brakeLevel: number;
  coffeeTokens: number;
  rerollTokens: number;
  windEnabled: boolean;
  windIndex: number;
  windModifier: number;
  internEnabled: boolean;
  internTrained: boolean[];
  fuelEnabled: boolean;
  fuelLevel: number;
  switches: SkyTeamState["switches"];
  roundPlacements: Partial<Record<SkyTeamSlotId, PlacedDieRecord>>;
  axisResolvedThisRound: boolean;
  enginesResolvedThisRound: boolean;
  activeSeatNo: number;
  roundStarterRole: SkyTeamRole;
  seats: SkyTeamSeatView[];
  viewerSeatNo: number | null;
  viewerRole: SkyTeamRole | null;
  outcome: "playing" | "victory" | "defeat";
  outcomeReasonVi: string | null;
  lastActionSummaryVi: string;
  actionSeq: number;
}

function nextRng(rngState: number): { value: number; nextState: number } {
  const nextState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
  return { value: nextState / 0x100000000, nextState };
}

function rollFourDice(rngState: number): { dice: number[]; nextState: number } {
  let st = rngState;
  const dice: number[] = [];
  for (let i = 0; i < 4; i++) {
    const r = nextRng(st);
    st = r.nextState;
    dice.push(Math.floor(r.value * 6) + 1);
  }
  dice.sort((a, b) => a - b);
  return { dice, nextState: st };
}

function getSeatByRole(
  state: SkyTeamState,
  role: SkyTeamRole
): SkyTeamSeatState {
  return state.seats.find((s) => s.role === role) ?? state.seats[0];
}

function getMissingMandatorySlots(
  state: SkyTeamState,
  role: SkyTeamRole
): SkyTeamSlotId[] {
  const missing: SkyTeamSlotId[] = [];
  const axisSlot: SkyTeamSlotId =
    role === "pilot" ? "axis_pilot" : "axis_copilot";
  const engineSlot: SkyTeamSlotId =
    role === "pilot" ? "engine_pilot" : "engine_copilot";
  if (!state.roundPlacements[axisSlot]) missing.push(axisSlot);
  if (!state.roundPlacements[engineSlot]) missing.push(engineSlot);
  return missing;
}

export function canPlaceDieOnSlot(input: {
  state: Pick<
    SkyTeamState,
    | "step"
    | "activeSeatNo"
    | "roundPlacements"
    | "switches"
    | "coffeeTokens"
    | "seats"
  > & {
    internEnabled?: boolean;
    internTrained?: boolean[];
    fuelEnabled?: boolean;
  };
  seatNo: number;
  dieIndex: number;
  slotId: SkyTeamSlotId;
  coffeeDelta?: number;
}): { valid: boolean; reasonVi?: string; effectiveValue?: number } {
  const { state, seatNo, dieIndex, slotId } = input;
  const coffeeDelta = input.coffeeDelta ?? 0;

  if (state.step !== "PlacementStep") {
    return { valid: false, reasonVi: "Hiện chưa ở pha đặt xúc xắc." };
  }
  if (state.activeSeatNo !== seatNo) {
    return { valid: false, reasonVi: "Chưa tới lượt của bạn." };
  }

  const seat = state.seats.find((s) => s.seatNo === seatNo);
  if (!seat) return { valid: false, reasonVi: "Không tìm thấy ghế." };

  const rawValue = seat.dice[dieIndex];
  if (rawValue === undefined) {
    return { valid: false, reasonVi: "Xúc xắc không hợp lệ." };
  }

  const slot = SKY_TEAM_SLOTS[slotId];
  if (!slot) return { valid: false, reasonVi: "Ô điều khiển không tồn tại." };

  if (slot.owner !== "any" && slot.owner !== seat.role) {
    return {
      valid: false,
      reasonVi:
        slot.owner === "pilot"
          ? "Ô này chỉ dành cho Cơ trưởng (Xanh)."
          : "Ô này chỉ dành cho Cơ phó (Cam).",
    };
  }

  if (state.roundPlacements[slotId]) {
    return { valid: false, reasonVi: "Ô này đã có xúc xắc trong vòng này." };
  }

  if (slot.category === "intern") {
    if (!state.internEnabled) {
      return { valid: false, reasonVi: "Module Thực Tập Sinh chưa được bật." };
    }
    if (state.internTrained && state.internTrained.every(Boolean)) {
      return { valid: false, reasonVi: "Thực Tập Sinh đã hoàn thành cả 6 bước huấn luyện!" };
    }
  }

  if (slot.category === "fuel" && !state.fuelEnabled) {
    return { valid: false, reasonVi: "Module Nhiên Liệu chưa được bật." };
  }

  if (slot.persistentSwitch) {
    const swKey = slotId as keyof SkyTeamState["switches"];
    if (state.switches[swKey]) {
      return { valid: false, reasonVi: "Công tắc này đã được bật trước đó." };
    }
    if (slot.requiresSlot) {
      const reqKey = slot.requiresSlot as keyof SkyTeamState["switches"];
      if (!state.switches[reqKey]) {
        return {
          valid: false,
          reasonVi: `Phải bật ${SKY_TEAM_SLOTS[slot.requiresSlot].labelVi} trước.`,
        };
      }
    }
  }

  // Mandatory slot check: if remaining dice count <= missing mandatory slots,
  // player MUST place in one of the missing mandatory slots.
  const missingMandatory = getMissingMandatorySlots(
    state as SkyTeamState,
    seat.role
  );
  if (
    seat.dice.length <= missingMandatory.length &&
    !missingMandatory.includes(slotId)
  ) {
    return {
      valid: false,
      reasonVi:
        "Bạn phải đặt xúc xắc vào ô bắt buộc (Trục Cánh & Động Cơ) trước khi hết xúc xắc!",
    };
  }

  const coffeeCost = Math.abs(coffeeDelta);
  if (!Number.isInteger(coffeeDelta) || coffeeCost > state.coffeeTokens) {
    return { valid: false, reasonVi: "Không đủ token Cà Phê để chỉnh số." };
  }

  const effectiveValue = rawValue + coffeeDelta;
  if (effectiveValue < 1 || effectiveValue > 6) {
    return {
      valid: false,
      reasonVi: "Giá trị xúc xắc sau khi chỉnh phải nằm trong 1–6.",
    };
  }

  if (!slot.allowedValues.includes(effectiveValue)) {
    return {
      valid: false,
      reasonVi: `Ô ${slot.labelVi} chỉ nhận giá trị ${slot.allowedValues.join(" hoặc ")}.`,
    };
  }

  return { valid: true, effectiveValue };
}

/**
 * Helper for UI: given a die value & available coffee, returns the minimum
 * coffeeDelta needed to fit a slot (or null if impossible).
 */
export function findBestCoffeeDeltaForSlot(
  rawValue: number,
  slotId: SkyTeamSlotId,
  coffeeTokens: number
): number | null {
  const slot = SKY_TEAM_SLOTS[slotId];
  if (!slot) return null;
  if (slot.allowedValues.includes(rawValue)) return 0;

  let bestDelta: number | null = null;
  for (const target of slot.allowedValues) {
    const delta = target - rawValue;
    if (Math.abs(delta) <= coffeeTokens) {
      if (bestDelta === null || Math.abs(delta) < Math.abs(bestDelta)) {
        bestDelta = delta;
      }
    }
  }
  return bestDelta;
}

function checkLandingVictory(state: SkyTeamState): {
  victory: boolean;
  reasonVi: string;
} {
  const airportIndex = state.traffic.length - 1;
  const failures: string[] = [];

  if (state.approachPos !== airportIndex) {
    failures.push("chưa tới đúng ô Sân bay");
  }
  if (state.traffic[airportIndex] > 0) {
    failures.push(`còn ${state.traffic[airportIndex]} máy bay cản đường băng`);
  }
  if (state.axis !== 0) {
    failures.push(`cánh máy bay chưa thăng bằng (đang nghiêng ${state.axis > 0 ? `+${state.axis}` : state.axis})`);
  }
  const allGears =
    state.switches.gear_12 && state.switches.gear_34 && state.switches.gear_56;
  if (!allGears) {
    failures.push("chưa hạ đủ 3 Càng Hạ Cánh");
  }
  const allFlaps =
    state.switches.flap_12 &&
    state.switches.flap_23 &&
    state.switches.flap_45 &&
    state.switches.flap_56;
  if (!allFlaps) {
    failures.push("chưa mở đủ 4 Cánh Tà");
  }

  const pEng = state.roundPlacements.engine_pilot?.value ?? 0;
  const cEng = state.roundPlacements.engine_copilot?.value ?? 0;
  const windMod = state.windEnabled ? SKY_TEAM_WIND_RING[state.windIndex] : 0;
  const engineSum = Math.max(0, pEng + cEng + windMod);
  if (state.brakeLevel === 0 || engineSum > state.brakeLevel) {
    failures.push(
      `tốc độ hạ cánh (${engineSum}${
        windMod !== 0 ? `, gồm gió ${windMod > 0 ? `+${windMod}` : windMod}` : ""
      }) vượt quá lực Phanh (${state.brakeLevel})`
    );
  }
  if (state.internEnabled && !state.internTrained.every(Boolean)) {
    const done = state.internTrained.filter(Boolean).length;
    failures.push(`chưa huấn luyện xong Thực Tập Sinh (${done}/6)`);
  }

  if (failures.length === 0) {
    return {
      victory: true,
      reasonVi: `Hạ cánh hoàn hảo tại ${SKY_TEAM_AIRPORTS[state.config.airportId].code}! Tốc độ ${engineSum} ≤ Phanh ${state.brakeLevel}, cánh cân bằng 0°, đường băng sạch sẽ.`,
    };
  }

  return {
    victory: false,
    reasonVi: `Hạ cánh thất bại: ${failures.join("; ")}.`,
  };
}

function startPlacementRound(
  state: SkyTeamState,
  events: MatchEventRecord[]
): SkyTeamState {
  const pilotRoll = rollFourDice(state.rngState);
  const copilotRoll = rollFourDice(pilotRoll.nextState);
  const starterRole: SkyTeamRole = state.roundNumber % 2 === 1 ? "pilot" : "copilot";
  const starterSeat = getSeatByRole(state, starterRole);

  const nextSeats = state.seats.map((s) => ({
    ...s,
    readyForRoll: false,
    dice: s.role === "pilot" ? pilotRoll.dice : copilotRoll.dice,
  }));

  const summary = `Vòng ${state.roundNumber} (${state.altitude * 1000} ft): Đã tung xúc xắc! ${
    starterRole === "pilot" ? "Cơ trưởng (Xanh)" : "Cơ phó (Cam)"
  } đặt trước. Giữ im lặng vô tuyến!`;

  events.push({
    eventType: "ROUND_ROLL",
    message: summary,
    visibleToSeatNos: "all",
  });

  return {
    ...state,
    step: "PlacementStep",
    roundPlacements: {},
    axisResolvedThisRound: false,
    enginesResolvedThisRound: false,
    roundStarterRole: starterRole,
    activeSeatNo: starterSeat.seatNo,
    seats: nextSeats,
    rngState: copilotRoll.nextState,
    lastActionSummaryVi: summary,
    actionSeq: state.actionSeq + 1,
  };
}

function createInitialState(input: {
  config: SkyTeamConfig;
  seats: SeatDescriptor[];
  nowMs: number;
  rng?: () => number;
}): CartridgeTransitionResult<SkyTeamState> {
  const airport =
    SKY_TEAM_AIRPORTS[input.config.airportId] ?? SKY_TEAM_AIRPORTS.montreal;
  const orderedSeats = [...input.seats].sort((a, b) => a.seatNo - b.seatNo);
  const seedBase = input.rng
    ? Math.floor(input.rng() * 0x7fffffff)
    : (input.nowMs >>> 0) ^ 0x51a7e41d;

  const pilotFirst = !input.config.swapRoles;
  const seatStates: SkyTeamSeatState[] = orderedSeats.slice(0, 2).map((s, i) => ({
    seatNo: s.seatNo,
    actorId: s.actorId,
    displayName: s.displayName,
    role: (i === 0) === pilotFirst ? "pilot" : "copilot",
    dice: [],
    readyForRoll: false,
  }));

  const pilotSeat =
    seatStates.find((s) => s.role === "pilot") ?? seatStates[0];
  const initialRerolls = airport.rerollAltitudes.includes(airport.startAltitude)
    ? 1
    : 0;

  const summary = `Chuyến bay tới ${airport.code} (${airport.nameVi}) bắt đầu ở độ cao ${
    airport.startAltitude * 1000
  } ft! Hãy trao đổi chiến thuật rồi bấm Sẵn sàng tung xúc xắc.`;

  const state: SkyTeamState = {
    config: {
      airportId: airport.id,
      swapRoles: Boolean(input.config.swapRoles),
      enableWindModule: Boolean(input.config.enableWindModule),
      enableInternModule: Boolean(input.config.enableInternModule),
      enableFuelModule: Boolean(input.config.enableFuelModule),
    },
    step: "BriefingStep",
    roundNumber: 1,
    altitude: airport.startAltitude,
    approachPos: 0,
    traffic: [...airport.traffic],
    axis: airport.initialAxis,
    blueMarker: 4,
    orangeMarker: 8,
    brakeLevel: 0,
    coffeeTokens: 0,
    rerollTokens: initialRerolls,
    windEnabled: Boolean(input.config.enableWindModule),
    windIndex: 0,
    internEnabled: Boolean(input.config.enableInternModule),
    internTrained: [false, false, false, false, false, false],
    fuelEnabled: Boolean(input.config.enableFuelModule),
    fuelLevel: 20,
    switches: {
      gear_12: false,
      gear_34: false,
      gear_56: false,
      flap_12: false,
      flap_23: false,
      flap_45: false,
      flap_56: false,
      brake_2: false,
      brake_4: false,
      brake_6: false,
    },
    roundPlacements: {},
    axisResolvedThisRound: false,
    enginesResolvedThisRound: false,
    activeSeatNo: pilotSeat.seatNo,
    roundStarterRole: "pilot",
    seats: seatStates,
    outcome: "playing",
    outcomeReasonVi: null,
    lastActionSummaryVi: summary,
    actionSeq: 1,
    rngState: seedBase || 1337,
  };

  return {
    state,
    events: [
      {
        eventType: "MATCH_STARTED",
        message: summary,
        visibleToSeatNos: "all",
      },
    ],
    phaseDeadlineMs: null,
  };
}

function reduce(input: {
  state: SkyTeamState;
  command: SkyTeamCommand;
  actorSeatNo: number;
  nowMs: number;
}): CartridgeTransitionResult<SkyTeamState> {
  const { state, command, actorSeatNo } = input;
  if (state.step === "MatchOver") {
    throw new Error("Chuyến bay đã kết thúc.");
  }

  const events: MatchEventRecord[] = [];
  const actorSeat = state.seats.find((s) => s.seatNo === actorSeatNo);
  if (!actorSeat) {
    throw new Error("Bạn không có ghế trong chuyến bay này.");
  }

  if (command.type === "READY_TO_ROLL") {
    if (state.step !== "BriefingStep") {
      throw new Error("Không thể bấm sẵn sàng ở pha hiện tại.");
    }
    const nextSeats = state.seats.map((s) =>
      s.seatNo === actorSeatNo ? { ...s, readyForRoll: true } : s
    );
    const updated: SkyTeamState = {
      ...state,
      seats: nextSeats,
      actionSeq: state.actionSeq + 1,
      lastActionSummaryVi: `${actorSeat.displayName} đã sẵn sàng tung xúc xắc.`,
    };
    const bothReady = nextSeats.every((s) => s.readyForRoll);
    if (bothReady) {
      return {
        state: startPlacementRound(updated, events),
        events,
        phaseDeadlineMs: null,
      };
    }
    events.push({
      eventType: "PLAYER_READY",
      message: updated.lastActionSummaryVi,
      visibleToSeatNos: "all",
    });
    return { state: updated, events, phaseDeadlineMs: null };
  }

  if (command.type === "USE_REROLL") {
    if (state.step !== "PlacementStep") {
      throw new Error("Chỉ dùng token Tung Lại trong pha đặt xúc xắc.");
    }
    if (state.activeSeatNo !== actorSeatNo) {
      throw new Error("Chỉ người đang tới lượt mới được dùng token Tung Lại.");
    }
    if (state.rerollTokens <= 0) {
      throw new Error("Không còn token Tung Lại.");
    }
    const uniqueIndices = Array.from(new Set(command.dieIndices)).filter(
      (idx) => Number.isInteger(idx) && idx >= 0 && idx < actorSeat.dice.length
    );
    if (uniqueIndices.length === 0) {
      throw new Error("Hãy chọn ít nhất 1 xúc xắc để tung lại.");
    }

    let rngSt = state.rngState;
    const newDice = [...actorSeat.dice];
    for (const idx of uniqueIndices) {
      const r = nextRng(rngSt);
      rngSt = r.nextState;
      newDice[idx] = Math.floor(r.value * 6) + 1;
    }
    newDice.sort((a, b) => a - b);

    const summary = `${actorSeat.displayName} dùng 1 token Tung Lại cho ${uniqueIndices.length} viên xúc xắc!`;
    events.push({
      eventType: "USE_REROLL",
      message: summary,
      visibleToSeatNos: "all",
    });

    return {
      state: {
        ...state,
        rerollTokens: state.rerollTokens - 1,
        rngState: rngSt,
        seats: state.seats.map((s) =>
          s.seatNo === actorSeatNo ? { ...s, dice: newDice } : s
        ),
        lastActionSummaryVi: summary,
        actionSeq: state.actionSeq + 1,
      },
      events,
      phaseDeadlineMs: null,
    };
  }

  if (command.type === "PLACE_DIE") {
    const coffeeDelta = command.coffeeDelta ?? 0;
    const check = canPlaceDieOnSlot({
      state,
      seatNo: actorSeatNo,
      dieIndex: command.dieIndex,
      slotId: command.slotId,
      coffeeDelta,
    });
    if (!check.valid || check.effectiveValue === undefined) {
      throw new Error(check.reasonVi ?? "Nước đi không hợp lệ.");
    }

    const rawValue = actorSeat.dice[command.dieIndex];
    const effectiveValue = check.effectiveValue;
    const coffeeCost = Math.abs(coffeeDelta);
    const slot = SKY_TEAM_SLOTS[command.slotId];

    // Remove die from player's unplaced dice
    const remainingDice = actorSeat.dice.filter(
      (_, idx) => idx !== command.dieIndex
    );
    const nextSeats = state.seats.map((s) =>
      s.seatNo === actorSeatNo ? { ...s, dice: remainingDice } : s
    );

    const nextPlacements: SkyTeamState["roundPlacements"] = {
      ...state.roundPlacements,
      [command.slotId]: {
        seatNo: actorSeatNo,
        role: actorSeat.role,
        value: effectiveValue,
        originalValue: rawValue,
        coffeeUsed: coffeeCost,
      },
    };

    let nextCoffee = state.coffeeTokens - coffeeCost;
    let nextBlue = state.blueMarker;
    let nextOrange = state.orangeMarker;
    let nextBrake = state.brakeLevel;
    let nextAxis = state.axis;
    let nextApproachPos = state.approachPos;
    const nextTraffic = [...state.traffic];
    const nextSwitches = { ...state.switches };
    const nextInternTrained = [...state.internTrained];
    let nextAxisResolved = state.axisResolvedThisRound;
    let nextEnginesResolved = state.enginesResolvedThisRound;

    const notes: string[] = [];
    const coffeeNote =
      coffeeCost > 0
        ? ` (dùng ${coffeeCost} ☕: ${rawValue}→${effectiveValue})`
        : "";
    notes.push(
      `${actorSeat.displayName} đặt [${effectiveValue}]${coffeeNote} vào ${slot.labelVi}`
    );

    // Immediate slot effects
    if (slot.category === "coffee") {
      if (nextCoffee < 3) {
        nextCoffee += 1;
        notes.push(`+1 ☕ (tổng ${nextCoffee}/3)`);
      } else {
        notes.push("kho Cà Phê đã đầy (3/3)");
      }
    } else if (slot.category === "radio") {
      const targetPos = nextApproachPos + (effectiveValue - 1);
      if (targetPos >= 0 && targetPos < nextTraffic.length) {
        if (nextTraffic[targetPos] > 0) {
          nextTraffic[targetPos] -= 1;
          notes.push(`dọn 1 máy bay ở ô #${targetPos + 1}`);
        } else {
          notes.push(`ô #${targetPos + 1} đã trống`);
        }
      } else {
        notes.push("tầm Radio vượt quá sân bay");
      }
    } else if (slot.category === "gear") {
      const key = command.slotId as keyof SkyTeamState["switches"];
      nextSwitches[key] = true;
      nextBlue += 1;
      notes.push(`ngưỡng tốc độ Xanh → ${nextBlue}`);
    } else if (slot.category === "flap") {
      const key = command.slotId as keyof SkyTeamState["switches"];
      nextSwitches[key] = true;
      nextOrange += 1;
      notes.push(`ngưỡng tốc độ Cam → ${nextOrange}`);
    } else if (slot.category === "brake") {
      const key = command.slotId as keyof SkyTeamState["switches"];
      nextSwitches[key] = true;
      nextBrake = effectiveValue;
      notes.push(`lực Phanh → ${nextBrake}`);
    } else if (slot.category === "intern") {
      const idx =
        command.slotId === "intern_pilot"
          ? nextInternTrained.findIndex((done) => !done)
          : nextInternTrained.lastIndexOf(false);
      if (idx >= 0) {
        nextInternTrained[idx] = true;
        const doneCount = nextInternTrained.filter(Boolean).length;
        notes.push(`huấn luyện Thực Tập Sinh #${idx + 1} (${doneCount}/6 ✓)`);
      }
    }

    let nextState: SkyTeamState = {
      ...state,
      seats: nextSeats,
      roundPlacements: nextPlacements,
      coffeeTokens: nextCoffee,
      blueMarker: nextBlue,
      orangeMarker: nextOrange,
      brakeLevel: nextBrake,
      axis: nextAxis,
      approachPos: nextApproachPos,
      traffic: nextTraffic,
      switches: nextSwitches,
      internTrained: nextInternTrained,
      axisResolvedThisRound: nextAxisResolved,
      enginesResolvedThisRound: nextEnginesResolved,
      actionSeq: state.actionSeq + 1,
      lastActionSummaryVi: notes.join(" • "),
    };

    // Check if BOTH Axis dice are now placed -> resolve Axis immediately!
    if (
      !nextAxisResolved &&
      nextPlacements.axis_pilot &&
      nextPlacements.axis_copilot
    ) {
      const delta =
        nextPlacements.axis_copilot.value - nextPlacements.axis_pilot.value;
      nextAxis = nextAxis + delta;
      nextAxisResolved = true;
      const nextWindIndex = state.windEnabled
        ? (((state.windIndex + delta) % 20) + 20) % 20
        : state.windIndex;
      nextState = {
        ...nextState,
        axis: nextAxis,
        axisResolvedThisRound: true,
        windIndex: nextWindIndex,
      };
      const windModNow = SKY_TEAM_WIND_RING[nextWindIndex];
      notes.push(
        `Trục Cánh: ${delta === 0 ? "cân bằng" : delta > 0 ? `nghiêng phải +${delta}` : `nghiêng trái ${delta}`} (tổng ${nextAxis > 0 ? `+${nextAxis}` : nextAxis})${
          state.windEnabled
            ? ` • Gió xoay → ${windModNow > 0 ? `+${windModNow}` : windModNow}`
            : ""
        }`
      );
      if (Math.abs(nextAxis) >= 3) {
        const failReason = `Máy bay mất thăng bằng (độ nghiêng ${nextAxis > 0 ? `+${nextAxis}` : nextAxis}) và bị lật cánh!`;
        nextState = {
          ...nextState,
          step: "MatchOver",
          outcome: "defeat",
          outcomeReasonVi: failReason,
          lastActionSummaryVi: failReason,
        };
        events.push({
          eventType: "CRASH_AXIS",
          message: failReason,
          visibleToSeatNos: "all",
        });
        return { state: nextState, events, phaseDeadlineMs: null };
      }
    }

    // Check if BOTH Engine dice are now placed -> resolve Speed & Movement (except on 0 ft landing round!)
    if (
      !nextEnginesResolved &&
      nextPlacements.engine_pilot &&
      nextPlacements.engine_copilot
    ) {
      const rawSpeed =
        nextPlacements.engine_pilot.value +
        nextPlacements.engine_copilot.value;
      const windMod = nextState.windEnabled
        ? SKY_TEAM_WIND_RING[nextState.windIndex]
        : 0;
      const speed = Math.max(0, rawSpeed + windMod);
      nextEnginesResolved = true;
      nextState = {
        ...nextState,
        enginesResolvedThisRound: true,
      };

      if (state.altitude > 0) {
        const steps =
          speed <= nextBlue ? 0 : speed <= nextOrange ? 1 : 2;
        notes.push(
          `Động cơ tổng ${rawSpeed}${
            windMod !== 0 ? ` (${windMod > 0 ? `+${windMod}` : windMod} gió = ${speed})` : ""
          } → tiến ${steps} ô`
        );

        // Move step by step checking collisions & overshoot
        for (let s = 0; s < steps; s++) {
          if (nextTraffic[nextApproachPos] > 0) {
            const failReason = `Va chạm với máy bay khác tại ô #${nextApproachPos + 1} khi đang tăng tốc tiến lên!`;
            nextState = {
              ...nextState,
              step: "MatchOver",
              outcome: "defeat",
              outcomeReasonVi: failReason,
              lastActionSummaryVi: failReason,
            };
            events.push({
              eventType: "CRASH_TRAFFIC",
              message: failReason,
              visibleToSeatNos: "all",
            });
            return { state: nextState, events, phaseDeadlineMs: null };
          }
          nextApproachPos += 1;
          if (nextApproachPos >= nextTraffic.length) {
            const failReason =
              "Máy bay đã bay vượt quá sân bay (Overshoot)!";
            nextState = {
              ...nextState,
              approachPos: nextTraffic.length - 1,
              step: "MatchOver",
              outcome: "defeat",
              outcomeReasonVi: failReason,
              lastActionSummaryVi: failReason,
            };
            events.push({
              eventType: "CRASH_OVERSHOOT",
              message: failReason,
              visibleToSeatNos: "all",
            });
            return { state: nextState, events, phaseDeadlineMs: null };
          }
        }
        nextState = {
          ...nextState,
          approachPos: nextApproachPos,
        };
      } else {
        notes.push(
          `Động cơ hạ cánh tổng ${speed} (so với Phanh ${nextBrake})`
        );
      }
    }

    nextState = {
      ...nextState,
      lastActionSummaryVi: notes.join(" • "),
    };

    events.push({
      eventType: "DIE_PLACED",
      message: nextState.lastActionSummaryVi,
      visibleToSeatNos: "all",
    });

    // Check if all 8 dice have been placed -> End of Round!
    const allDicePlaced = nextSeats.every((s) => s.dice.length === 0);
    if (allDicePlaced) {
      // Kerosene Fuel consumption at end of round (-dieValue if plugged, else -6)
      if (nextState.fuelEnabled) {
        const fuelBurn = nextState.roundPlacements.fuel_leak?.value ?? 6;
        const nextFuel = nextState.fuelLevel - fuelBurn;
        nextState = { ...nextState, fuelLevel: nextFuel };
        if (nextFuel < 0) {
          const failReason = `Máy bay cạn kiệt nhiên liệu Kerosene (tiêu thụ -${fuelBurn}, chạm vạch X đỏ)!`;
          nextState = {
            ...nextState,
            step: "MatchOver",
            outcome: "defeat",
            outcomeReasonVi: failReason,
            lastActionSummaryVi: failReason,
          };
          events.push({
            eventType: "CRASH_FUEL",
            message: failReason,
            visibleToSeatNos: "all",
          });
          return { state: nextState, events, phaseDeadlineMs: null };
        }
      }

      if (nextState.altitude === 0) {
        // Final landing check!
        const result = checkLandingVictory(nextState);
        nextState = {
          ...nextState,
          step: "MatchOver",
          outcome: result.victory ? "victory" : "defeat",
          outcomeReasonVi: result.reasonVi,
          lastActionSummaryVi: result.reasonVi,
        };
        events.push({
          eventType: result.victory ? "LANDING_VICTORY" : "LANDING_DEFEAT",
          message: result.reasonVi,
          visibleToSeatNos: "all",
        });
        return { state: nextState, events, phaseDeadlineMs: null };
      }

      // Descend 1000 ft
      const nextAlt = nextState.altitude - 1;
      const airport = SKY_TEAM_AIRPORTS[nextState.config.airportId];
      const airportIndex = nextState.traffic.length - 1;

      // If descending to 0 ft and NOT on the airport space -> crash short of runway!
      if (nextAlt === 0 && nextState.approachPos < airportIndex) {
        const failReason = `Độ cao đã hạ về 0 ft nhưng máy bay vẫn còn cách sân bay ${
          airportIndex - nextState.approachPos
        } ô!`;
        nextState = {
          ...nextState,
          altitude: 0,
          step: "MatchOver",
          outcome: "defeat",
          outcomeReasonVi: failReason,
          lastActionSummaryVi: failReason,
        };
        events.push({
          eventType: "CRASH_SHORT",
          message: failReason,
          visibleToSeatNos: "all",
        });
        return { state: nextState, events, phaseDeadlineMs: null };
      }

      const bonusReroll = airport.rerollAltitudes.includes(nextAlt) ? 1 : 0;
      const nextRound = nextState.roundNumber + 1;
      const nextStarterRole: SkyTeamRole =
        nextRound % 2 === 1 ? "pilot" : "copilot";
      const nextStarterSeat = getSeatByRole(nextState, nextStarterRole);

      const roundEndMsg =
        nextAlt === 0
          ? `Hạ độ cao xuống 0 ft — VÒNG HẠ CÁNH CUỐI CÙNG! Hãy giữ cánh 0°, dọn sạch đường băng, mở đủ Càng/Cánh tà và Phanh lớn hơn Động cơ.`
          : `Kết thúc Vòng ${nextState.roundNumber}! Hạ độ cao xuống ${
              nextAlt * 1000
            } ft.${bonusReroll ? " Nhận thêm +1 token Tung Lại!" : ""} Mở kênh thảo luận trước khi tung xúc xắc.`;

      events.push({
        eventType: "ROUND_DESCEND",
        message: roundEndMsg,
        visibleToSeatNos: "all",
      });

      nextState = {
        ...nextState,
        step: "BriefingStep",
        roundNumber: nextRound,
        altitude: nextAlt,
        rerollTokens: nextState.rerollTokens + bonusReroll,
        roundStarterRole: nextStarterRole,
        activeSeatNo: nextStarterSeat.seatNo,
        seats: nextState.seats.map((s) => ({ ...s, readyForRoll: false })),
        lastActionSummaryVi: roundEndMsg,
      };
      return { state: nextState, events, phaseDeadlineMs: null };
    }

    // Otherwise alternate turn to the other seat
    const otherSeat = nextSeats.find((s) => s.seatNo !== actorSeatNo);
    const nextActiveSeatNo =
      otherSeat && otherSeat.dice.length > 0 ? otherSeat.seatNo : actorSeatNo;

    return {
      state: {
        ...nextState,
        activeSeatNo: nextActiveSeatNo,
      },
      events,
      phaseDeadlineMs: null,
    };
  }

  throw new Error("Lệnh không được hỗ trợ.");
}

function chooseBotPlacement(
  state: SkyTeamState,
  botSeat: SkyTeamSeatState
): SkyTeamCommand {
  const role = botSeat.role;
  const missingMandatory = getMissingMandatorySlots(state, role);
  const mustDoMandatory = botSeat.dice.length <= missingMandatory.length;

  const candidates: Array<{
    dieIndex: number;
    slotId: SkyTeamSlotId;
    coffeeDelta: number;
    score: number;
  }> = [];

  const airportIndex = state.traffic.length - 1;
  const distToAirport = airportIndex - state.approachPos;
  const roundsToMove = Math.max(0, state.altitude); // rounds left before 0ft

  for (let dieIndex = 0; dieIndex < botSeat.dice.length; dieIndex++) {
    const rawVal = botSeat.dice[dieIndex];

    for (const slotId of ALL_SKY_TEAM_SLOT_IDS) {
      const slot = SKY_TEAM_SLOTS[slotId];
      if (slot.owner !== "any" && slot.owner !== role) continue;
      if (mustDoMandatory && !missingMandatory.includes(slotId)) continue;

      const delta = findBestCoffeeDeltaForSlot(
        rawVal,
        slotId,
        state.coffeeTokens
      );
      if (delta === null) continue;

      const check = canPlaceDieOnSlot({
        state,
        seatNo: botSeat.seatNo,
        dieIndex,
        slotId,
        coffeeDelta: delta,
      });
      if (!check.valid || check.effectiveValue === undefined) continue;

      const val = check.effectiveValue;
      let score = -Math.abs(delta) * 14;

      if (slot.category === "axis") {
        const partnerSlot: SkyTeamSlotId =
          role === "pilot" ? "axis_copilot" : "axis_pilot";
        const partnerVal = state.roundPlacements[partnerSlot]?.value;
        if (partnerVal !== undefined) {
          const newAxis =
            state.axis + (role === "copilot" ? val - partnerVal : partnerVal - val);
          if (Math.abs(newAxis) >= 3) {
            score -= 500;
          } else if (newAxis === 0) {
            score += 95;
          } else if (Math.abs(newAxis) === 1) {
            score += 40;
          } else {
            score -= 20;
          }
          if (state.altitude === 0 && newAxis !== 0) {
            score -= 250;
          }
        } else {
          // Partner hasn't placed axis yet: prefer middle values (3 or 4), biased to correct tilt
          const ideal =
            role === "pilot"
              ? Math.min(6, Math.max(1, 3 + state.axis))
              : Math.min(6, Math.max(1, 3 - state.axis));
          score += 50 - Math.abs(val - ideal) * 10;
        }
      } else if (slot.category === "engine") {
        const partnerSlot: SkyTeamSlotId =
          role === "pilot" ? "engine_copilot" : "engine_pilot";
        const partnerVal = state.roundPlacements[partnerSlot]?.value;

        if (state.altitude === 0) {
          // Final round: stay <= brakeLevel!
          if (partnerVal !== undefined) {
            const sum = partnerVal + val;
            if (state.brakeLevel > 0 && sum <= state.brakeLevel) {
              score += 110;
            } else {
              score -= 300;
            }
          } else {
            score += 60 - val * 12;
          }
        } else {
          // Normal round: desired steps
          const desiredSteps =
            state.traffic[state.approachPos] > 0
              ? 0
              : distToAirport === 0
                ? 0
                : distToAirport > roundsToMove
                  ? 2
                  : 1;

          if (partnerVal !== undefined) {
            const sum = partnerVal + val;
            const steps =
              sum <= state.blueMarker ? 0 : sum <= state.orangeMarker ? 1 : 2;
            if (steps > 0 && state.traffic[state.approachPos] > 0) {
              score -= 450; // avoid collision!
            } else if (state.approachPos + steps >= state.traffic.length) {
              score -= 450; // avoid overshoot!
            } else if (steps === desiredSteps) {
              score += 95;
            } else {
              score += 20;
            }
          } else {
            const ideal =
              desiredSteps === 0 ? 2 : desiredSteps === 1 ? 3 : 5;
            score += 45 - Math.abs(val - ideal) * 9;
          }
        }
      } else if (slot.category === "radio") {
        const targetPos = state.approachPos + (val - 1);
        if (targetPos < state.traffic.length && state.traffic[targetPos] > 0) {
          score += targetPos === state.approachPos ? 120 : 80 - (targetPos - state.approachPos) * 8;
        } else {
          score -= 35;
        }
      } else if (slot.category === "gear" || slot.category === "flap") {
        score += 85;
      } else if (slot.category === "brake") {
        score += state.altitude <= 2 ? 105 : 75;
      } else if (slot.category === "coffee") {
        score += state.coffeeTokens < 3 ? 42 : -15;
      } else if (slot.category === "intern") {
        const remaining = state.internTrained.filter((d) => !d).length;
        score += remaining > 0 ? 78 : -100;
      } else if (slot.category === "fuel") {
        // Low dice save lots of Kerosene (especially when fuel is below 14)
        const savings = 6 - val;
        score += savings * (state.fuelLevel <= 12 ? 22 : 12);
      }

      candidates.push({ dieIndex, slotId, coffeeDelta: delta, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (best) {
    return {
      type: "PLACE_DIE",
      dieIndex: best.dieIndex,
      slotId: best.slotId,
      coffeeDelta: best.coffeeDelta,
    };
  }

  // Fallback (should never happen since axis/engine/radio/coffee accept 1-6)
  const fallbackSlot: SkyTeamSlotId =
    missingMandatory[0] ?? "coffee_1";
  return {
    type: "PLACE_DIE",
    dieIndex: 0,
    slotId: fallbackSlot,
    coffeeDelta: 0,
  };
}

function autoActBots(input: {
  current: CartridgeTransitionResult<SkyTeamState>;
  botSeatNos: number[];
  nowMs: number;
}): CartridgeTransitionResult<SkyTeamState> {
  let state = input.current.state;
  const allEvents = [...input.current.events];
  const botSet = new Set(input.botSeatNos);

  let guard = 0;
  while (state.step !== "MatchOver" && guard < 24) {
    guard++;

    if (state.step === "BriefingStep") {
      const unreadyBot = state.seats.find(
        (s) => botSet.has(s.seatNo) && !s.readyForRoll
      );
      if (!unreadyBot) break;
      const res = reduce({
        state,
        command: { type: "READY_TO_ROLL" },
        actorSeatNo: unreadyBot.seatNo,
        nowMs: input.nowMs,
      });
      state = res.state;
      allEvents.push(...res.events);
      continue;
    }

    if (state.step === "PlacementStep") {
      if (!botSet.has(state.activeSeatNo)) break;
      const botSeat = state.seats.find((s) => s.seatNo === state.activeSeatNo);
      if (!botSeat || botSeat.dice.length === 0) break;

      const cmd = chooseBotPlacement(state, botSeat);
      const res = reduce({
        state,
        command: cmd,
        actorSeatNo: botSeat.seatNo,
        nowMs: input.nowMs,
      });
      state = res.state;
      allEvents.push(...res.events);
      continue;
    }

    break;
  }

  return {
    state,
    events: allEvents,
    phaseDeadlineMs: null,
  };
}

function projectView(input: {
  state: SkyTeamState;
  viewerSeatNo: number | null;
}): SkyTeamPlayerView {
  const { state, viewerSeatNo } = input;
  const airport =
    SKY_TEAM_AIRPORTS[state.config.airportId] ?? SKY_TEAM_AIRPORTS.montreal;
  const viewerSeat =
    viewerSeatNo !== null
      ? state.seats.find((s) => s.seatNo === viewerSeatNo) ?? null
      : null;

  const revealAll = state.step === "MatchOver";

  return {
    airport,
    step: state.step,
    roundNumber: state.roundNumber,
    altitude: state.altitude,
    approachPos: state.approachPos,
    traffic: [...state.traffic],
    axis: state.axis,
    blueMarker: state.blueMarker,
    orangeMarker: state.orangeMarker,
    brakeLevel: state.brakeLevel,
    coffeeTokens: state.coffeeTokens,
    rerollTokens: state.rerollTokens,
    windEnabled: state.windEnabled,
    windIndex: state.windIndex,
    windModifier: state.windEnabled ? SKY_TEAM_WIND_RING[state.windIndex] : 0,
    internEnabled: state.internEnabled,
    internTrained: [...state.internTrained],
    fuelEnabled: state.fuelEnabled,
    fuelLevel: state.fuelLevel,
    switches: { ...state.switches },
    roundPlacements: { ...state.roundPlacements },
    axisResolvedThisRound: state.axisResolvedThisRound,
    enginesResolvedThisRound: state.enginesResolvedThisRound,
    activeSeatNo: state.activeSeatNo,
    roundStarterRole: state.roundStarterRole,
    seats: state.seats.map((s) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      role: s.role,
      diceCount: s.dice.length,
      dice:
        revealAll || s.seatNo === viewerSeatNo
          ? [...s.dice]
          : s.dice.map(() => null),
      readyForRoll: s.readyForRoll,
    })),
    viewerSeatNo,
    viewerRole: viewerSeat?.role ?? null,
    outcome: state.outcome,
    outcomeReasonVi: state.outcomeReasonVi,
    lastActionSummaryVi: state.lastActionSummaryVi,
    actionSeq: state.actionSeq,
  };
}

function resolveChannels(input: {
  state: SkyTeamState;
  viewerSeatNo: number | null;
}): ChannelPermission[] {
  const { state, viewerSeatNo } = input;
  const isSeated =
    viewerSeatNo !== null &&
    state.seats.some((s) => s.seatNo === viewerSeatNo);
  // Radio silence during PlacementStep!
  const canSpeak = isSeated && state.step !== "PlacementStep";
  return [
    {
      channelId: "cockpit",
      label:
        state.step === "PlacementStep"
          ? "Buồng Lái (Im lặng vô tuyến)"
          : "Buồng Lái (Thảo luận)",
      canRead: true,
      canWrite: canSpeak,
    },
  ];
}

export const skyTeamCartridge: GameCartridge<
  SkyTeamConfig,
  SkyTeamState,
  SkyTeamCommand,
  SkyTeamPlayerView
> = {
  cartridgeId: "sky-team",
  title: "Sky Team",
  subtitle: "Hợp tác 2 người • Hạ cánh máy bay bằng xúc xắc",
  description:
    "Vào vai Cơ trưởng và Cơ phó phối hợp đặt xúc xắc bí mật trong im lặng để giữ thăng bằng cánh, điều chỉnh tốc độ, dọn không lưu và hạ cánh an toàn.",
  minSeats: 2,
  maxSeats: 2,
  available: true,

  defaultConfig(): SkyTeamConfig {
    return {
      airportId: "montreal",
      swapRoles: false,
      enableWindModule: false,
      enableInternModule: false,
      enableFuelModule: false,
    };
  },

  validateConfig(config, seatCount) {
    if (seatCount !== 2) {
      return {
        valid: false,
        error: "Sky Team yêu cầu đúng 2 người chơi (Cơ trưởng & Cơ phó).",
      };
    }
    if (!config || !SKY_TEAM_AIRPORTS[config.airportId]) {
      return { valid: false, error: "Sân bay không hợp lệ." };
    }
    return { valid: true };
  },

  createInitialState,
  reduce,

  onPhaseTimeout({ state }) {
    return { state, events: [], phaseDeadlineMs: null };
  },

  autoActBots,
  projectView,
  resolveChannels,

  isMatchOver(state) {
    return state.step === "MatchOver";
  },

  getWinningFaction(state) {
    if (state.step !== "MatchOver") return null;
    return state.outcome === "victory" ? "Phi Hành Đoàn (Thắng)" : "Thất Bại";
  },
};
