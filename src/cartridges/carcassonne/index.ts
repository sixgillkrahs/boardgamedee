import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
  SeatDescriptor,
} from "@/cartridges/types";
import {
  ALL_TILE_TEMPLATES,
  BASE_TILE_TEMPLATES,
  getRotatedEdges,
  getTileFeatures,
  RIVER_TILE_TEMPLATES,
  rotateAnchor,
  rotateCorner,
  rotateEdge,
  type DeckTileCard,
  type FeatureKind,
  type TileFeatureDef,
} from "./tiles";

export * from "./tiles";

export type CarcassonneColor = "blue" | "red" | "yellow" | "green" | "black";

export const CARCASSONNE_COLORS: CarcassonneColor[] = [
  "blue",
  "red",
  "yellow",
  "green",
  "black",
];

export const CARCASSONNE_COLOR_META: Record<
  CarcassonneColor,
  { nameVi: string; fill: string; stroke: string; light: string }
> = {
  blue: {
    nameVi: "Xanh dương",
    fill: "#2563eb",
    stroke: "#bfdbfe",
    light: "#60a5fa",
  },
  red: {
    nameVi: "Đỏ",
    fill: "#dc2626",
    stroke: "#fecaca",
    light: "#f87171",
  },
  yellow: {
    nameVi: "Vàng",
    fill: "#eab308",
    stroke: "#fef08a",
    light: "#facc15",
  },
  green: {
    nameVi: "Xanh lá",
    fill: "#16a34a",
    stroke: "#bbf7d0",
    light: "#4ade80",
  },
  black: {
    nameVi: "Đen",
    fill: "#334155",
    stroke: "#e2e8f0",
    light: "#94a3b8",
  },
};

export interface CarcassonneConfig {
  /** Include The River mini-expansion (12 tiles, C3 2021 standard). */
  enableRiver: boolean;
  /** Include The Abbot & Flower Gardens mini-expansion (C3 2021 standard). */
  enableAbbot: boolean;
  /** Enable Farmers (Fields end-game scoring). */
  enableFarmers: boolean;
}

export type MeepleType = "standard" | "abbot";

export interface PlacedMeeple {
  seatNo: number;
  color: CarcassonneColor;
  meepleType: MeepleType;
  featureId: string;
  featureKind: FeatureKind;
}

export interface PlacedTile {
  x: number;
  y: number;
  templateCode: string;
  hasGarden: boolean;
  rotation: number; // 0..3 clockwise
  meeples: PlacedMeeple[];
}

export interface ScorePopupRecord {
  id: number;
  x: number;
  y: number;
  seatNo: number;
  color: CarcassonneColor;
  points: number;
  labelVi: string;
  kind?: "city" | "road" | "monastery" | "garden";
  tileCoords?: Array<{ x: number; y: number }>;
}

export interface CarcassonneSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  color: CarcassonneColor;
  score: number;
  /** Standard meeples in supply (starts at 7). */
  meeplesLeft: number;
  /** True if Abbot is in supply (starts true when enableAbbot is on). */
  abbotAvailable: boolean;
  /** Breakdown for end-game summary. */
  scoreBreakdown: {
    roads: number;
    cities: number;
    monasteries: number;
    gardens: number;
    farmers: number;
  };
}

export type CarcassonneStep =
  | "DrawTileStep"
  | "PlaceTileStep"
  | "PlaceMeepleStep"
  | "MatchOver";

export interface CarcassonneState {
  config: CarcassonneConfig;
  step: CarcassonneStep;
  turnNumber: number;
  activeSeatNo: number;
  seats: CarcassonneSeatState[];
  /** Placed tiles keyed by `${x},${y}`. */
  board: Record<string, PlacedTile>;
  /** Remaining tile stack (index 0 is next drawn). */
  deck: DeckTileCard[];
  /** Currently drawn tile awaiting placement in PlaceTileStep. */
  currentTile: DeckTileCard | null;
  /** Live unconfirmed tile preview synced to all players during PlaceTileStep. */
  draftPlacement: { x: number; y: number; rotation: number } | null;
  /** Coordinate of tile placed this turn (for PlaceMeepleStep). */
  lastPlacedCoord: { x: number; y: number } | null;
  /** Last direction the River flowed (for River no-U-turn check). */
  lastRiverDir: number | null;
  /** Recent score popups for Canvas FX. */
  scorePopups: ScorePopupRecord[];
  lastActionSummaryVi: string;
  actionSeq: number;
  rngState: number;
}

export type CarcassonneCommand =
  | { type: "DRAW_TILE" }
  | { type: "STAGE_TILE"; x: number; y: number; rotation: number }
  | { type: "CLEAR_DRAFT" }
  | { type: "PLACE_TILE"; x: number; y: number; rotation: number }
  | {
      type: "PLACE_MEEPLE";
      featureId: string;
      meepleType: MeepleType;
    }
  | { type: "RECALL_ABBOT" }
  | { type: "SKIP_MEEPLE" };

export interface ValidMeepleOption {
  featureId: string;
  featureKind: FeatureKind;
  meepleTypes: MeepleType[];
  anchor: [number, number];
  labelVi: string;
}

export interface CarcassonnePlayerView {
  config: CarcassonneConfig;
  step: CarcassonneStep;
  turnNumber: number;
  activeSeatNo: number;
  viewerSeatNo: number | null;
  seats: CarcassonneSeatState[];
  board: Record<string, PlacedTile>;
  lastRiverDir: number | null;
  tilesRemaining: number;
  currentTile: DeckTileCard | null;
  draftPlacement: { x: number; y: number; rotation: number } | null;
  lastPlacedCoord: { x: number; y: number } | null;
  validMeepleOptions: ValidMeepleOption[];
  canRecallAbbot: boolean;
  abbotRecallPoints: number;
  scorePopups: ScorePopupRecord[];
  lastActionSummaryVi: string;
  actionSeq: number;
  winnerSeatNos: number[];
}

const DIR_DX = [0, 1, 0, -1]; // N, E, S, W
const DIR_DY = [-1, 0, 1, 0];
const OPP_DIR = [2, 3, 0, 1];

// Opposite perimeter corner across a shared cardinal edge:
// N_L(0) <-> S_R(5), N_R(1) <-> S_L(4)
// E_L(2) <-> W_R(7), E_R(3) <-> W_L(6)
const CORNER_TO_DIR = [0, 0, 1, 1, 2, 2, 3, 3];
const OPP_CORNER = [5, 4, 7, 6, 1, 0, 3, 2];

export function coordKey(x: number, y: number): string {
  return `${x},${y}`;
}

function nextRng(rngState: number): { value: number; nextState: number } {
  const nextState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
  return { value: nextState / 0x100000000, nextState };
}

function shuffleArray<T>(items: T[], rngState: number): { list: T[]; nextState: number } {
  const list = [...items];
  let st = rngState;
  for (let i = list.length - 1; i > 0; i--) {
    const r = nextRng(st);
    st = r.nextState;
    const j = Math.floor(r.value * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return { list, nextState: st };
}

export function buildCarcassonneDeck(
  config: CarcassonneConfig,
  rngState: number
): { startTile: DeckTileCard; deck: DeckTileCard[]; nextState: number } {
  const baseCards: DeckTileCard[] = [];
  let baseStart: DeckTileCard | null = null;

  for (const tpl of BASE_TILE_TEMPLATES) {
    let gardensLeft = config.enableAbbot ? tpl.gardenCount ?? 0 : 0;
    for (let i = 0; i < tpl.count; i++) {
      if (tpl.isBaseStart && !baseStart) {
        baseStart = { templateCode: tpl.code, hasGarden: false };
        continue;
      }
      const hasGarden = gardensLeft > 0;
      if (hasGarden) gardensLeft--;
      baseCards.push({ templateCode: tpl.code, hasGarden });
    }
  }

  const shuffledBase = shuffleArray(baseCards, rngState);
  let st = shuffledBase.nextState;

  if (!config.enableRiver) {
    return {
      startTile: baseStart ?? { templateCode: "D", hasGarden: false },
      deck: shuffledBase.list,
      nextState: st,
    };
  }

  // With The River: Spring is start tile, 10 middle river tiles shuffled, then Lake, then all 71+ base tiles (base start tile returned to box per official C3 rule)
  const riverMiddle: DeckTileCard[] = [];
  let springCard: DeckTileCard = { templateCode: "RV_SPRING", hasGarden: false };
  let lakeCard: DeckTileCard = { templateCode: "RV_LAKE", hasGarden: false };

  for (const tpl of RIVER_TILE_TEMPLATES) {
    let gardensLeft = config.enableAbbot ? tpl.gardenCount ?? 0 : 0;
    for (let i = 0; i < tpl.count; i++) {
      const hasGarden = gardensLeft > 0;
      if (hasGarden) gardensLeft--;
      const card: DeckTileCard = { templateCode: tpl.code, hasGarden };
      if (tpl.riverRole === "spring") springCard = card;
      else if (tpl.riverRole === "lake") lakeCard = card;
      else riverMiddle.push(card);
    }
  }

  const shuffledRiver = shuffleArray(riverMiddle, st);
  st = shuffledRiver.nextState;

  return {
    startTile: springCard,
    deck: [...shuffledRiver.list, lakeCard, ...shuffledBase.list],
    nextState: st,
  };
}

/**
 * Checks whether a tile card can be legally placed at (x, y) with rotation (0..3).
 */
export function canPlaceTileAt(
  board: Record<string, PlacedTile>,
  card: DeckTileCard,
  x: number,
  y: number,
  rotation: number,
  lastRiverDir: number | null = null
): boolean {
  if (board[coordKey(x, y)]) return false;
  const rot = rotation & 3;
  const edges = getRotatedEdges(card.templateCode, rot);
  const tpl = ALL_TILE_TEMPLATES[card.templateCode];
  const isRiverTile = Boolean(tpl?.riverRole);

  let hasNeighbor = false;
  let connectsRiver = false;
  let incomingRiverEdge = -1;
  let outgoingRiverEdge = -1;

  for (let dir = 0; dir < 4; dir++) {
    const nx = x + DIR_DX[dir];
    const ny = y + DIR_DY[dir];
    const neighbor = board[coordKey(nx, ny)];
    if (!neighbor) continue;

    hasNeighbor = true;
    const neighborEdges = getRotatedEdges(
      neighbor.templateCode,
      neighbor.rotation
    );
    const oppEdge = neighborEdges[OPP_DIR[dir]];
    if (edges[dir] !== oppEdge) return false;
    if (edges[dir] === "river") {
      connectsRiver = true;
      incomingRiverEdge = dir;
    }
  }

  if (!hasNeighbor) return false;

  if (isRiverTile) {
    // River tile MUST extend the open river end!
    if (!connectsRiver) return false;
    // Official no-immediate-U-turn rule on river curves
    for (let dir = 0; dir < 4; dir++) {
      if (edges[dir] === "river" && dir !== incomingRiverEdge) {
        outgoingRiverEdge = dir;
      }
    }
    if (
      lastRiverDir !== null &&
      outgoingRiverEdge !== -1 &&
      outgoingRiverEdge === OPP_DIR[lastRiverDir]
    ) {
      return false;
    }
  }

  return true;
}

export function getAllValidTilePlacements(
  board: Record<string, PlacedTile>,
  card: DeckTileCard,
  lastRiverDir: number | null = null
): Array<{ x: number; y: number; rotation: number }> {
  const candidates = new Set<string>();
  for (const tile of Object.values(board)) {
    for (let dir = 0; dir < 4; dir++) {
      const nx = tile.x + DIR_DX[dir];
      const ny = tile.y + DIR_DY[dir];
      const k = coordKey(nx, ny);
      if (!board[k]) candidates.add(k);
    }
  }

  const valid: Array<{ x: number; y: number; rotation: number }> = [];
  for (const k of candidates) {
    const [xs, ys] = k.split(",");
    const x = Number(xs);
    const y = Number(ys);
    for (let rot = 0; rot < 4; rot++) {
      if (canPlaceTileAt(board, card, x, y, rot, lastRiverDir)) {
        valid.push({ x, y, rotation: rot });
      }
    }
  }
  return valid;
}

interface ComponentAnalysis {
  kind: "city" | "road" | "field";
  tiles: Set<string>;
  openEnds: number;
  pennants: number;
  meeples: Array<{ seatNo: number; tileKey: string; featureId: string }>;
  /** For fields: set of unique city component keys (tileKey:featureId) touched. */
  adjacentCityNodes: Array<{ tileKey: string; featureId: string }>;
}

function getFeatureOnTile(tile: PlacedTile, featureId: string): TileFeatureDef | null {
  const feats = getTileFeatures({
    templateCode: tile.templateCode,
    hasGarden: tile.hasGarden,
  });
  return feats.find((f) => f.id === featureId) ?? null;
}

function findFeatureTouchingEdge(
  tile: PlacedTile,
  kind: "city" | "road",
  worldEdge: number
): TileFeatureDef | null {
  const feats = getTileFeatures({
    templateCode: tile.templateCode,
    hasGarden: tile.hasGarden,
  });
  for (const f of feats) {
    if (f.kind !== kind) continue;
    for (const localEdge of f.edges) {
      if (rotateEdge(localEdge, tile.rotation) === worldEdge) {
        return f;
      }
    }
  }
  return null;
}

function findFieldTouchingCorner(
  tile: PlacedTile,
  worldCorner: number
): TileFeatureDef | null {
  const feats = getTileFeatures({
    templateCode: tile.templateCode,
    hasGarden: tile.hasGarden,
  });
  for (const f of feats) {
    if (f.kind !== "field") continue;
    for (const localCorner of f.fieldCorners) {
      if (rotateCorner(localCorner, tile.rotation) === worldCorner) {
        return f;
      }
    }
  }
  return null;
}

/**
 * BFS analysis of a connected Road, City, or Field component starting at (startTileKey, startFeatureId).
 */
export function analyzeComponent(
  board: Record<string, PlacedTile>,
  startTileKey: string,
  startFeatureId: string
): ComponentAnalysis | null {
  const startTile = board[startTileKey];
  if (!startTile) return null;
  const startFeat = getFeatureOnTile(startTile, startFeatureId);
  if (
    !startFeat ||
    (startFeat.kind !== "city" &&
      startFeat.kind !== "road" &&
      startFeat.kind !== "field")
  ) {
    return null;
  }

  const kind = startFeat.kind;
  const visitedNodes = new Set<string>();
  const tiles = new Set<string>();
  const meeples: ComponentAnalysis["meeples"] = [];
  const adjacentCityNodes: ComponentAnalysis["adjacentCityNodes"] = [];
  let openEnds = 0;
  let pennants = 0;

  const queue: Array<{ tileKey: string; featureId: string }> = [
    { tileKey: startTileKey, featureId: startFeatureId },
  ];
  visitedNodes.add(`${startTileKey}|${startFeatureId}`);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const tile = board[cur.tileKey];
    if (!tile) continue;
    const feat = getFeatureOnTile(tile, cur.featureId);
    if (!feat) continue;

    tiles.add(cur.tileKey);
    if (feat.pennant) pennants += 1;

    for (const m of tile.meeples) {
      if (m.featureId === cur.featureId) {
        meeples.push({
          seatNo: m.seatNo,
          tileKey: cur.tileKey,
          featureId: cur.featureId,
        });
      }
    }

    if (kind === "city" || kind === "road") {
      for (const localEdge of feat.edges) {
        const wEdge = rotateEdge(localEdge, tile.rotation);
        const nx = tile.x + DIR_DX[wEdge];
        const ny = tile.y + DIR_DY[wEdge];
        const nKey = coordKey(nx, ny);
        const neighbor = board[nKey];
        if (!neighbor) {
          openEnds += 1;
          continue;
        }
        const nFeat = findFeatureTouchingEdge(neighbor, kind, OPP_DIR[wEdge]);
        if (nFeat) {
          const nodeKey = `${nKey}|${nFeat.id}`;
          if (!visitedNodes.has(nodeKey)) {
            visitedNodes.add(nodeKey);
            queue.push({ tileKey: nKey, featureId: nFeat.id });
          }
        }
      }
    } else if (kind === "field") {
      for (const adjCityId of feat.adjacentCityIds) {
        adjacentCityNodes.push({ tileKey: cur.tileKey, featureId: adjCityId });
      }
      for (const localCorner of feat.fieldCorners) {
        const wCorner = rotateCorner(localCorner, tile.rotation);
        const dir = CORNER_TO_DIR[wCorner];
        const nx = tile.x + DIR_DX[dir];
        const ny = tile.y + DIR_DY[dir];
        const nKey = coordKey(nx, ny);
        const neighbor = board[nKey];
        if (!neighbor) continue;
        const nFeat = findFieldTouchingCorner(neighbor, OPP_CORNER[wCorner]);
        if (nFeat) {
          const nodeKey = `${nKey}|${nFeat.id}`;
          if (!visitedNodes.has(nodeKey)) {
            visitedNodes.add(nodeKey);
            queue.push({ tileKey: nKey, featureId: nFeat.id });
          }
        }
      }
    }
  }

  return { kind, tiles, openEnds, pennants, meeples, adjacentCityNodes };
}

function countSurroundingTiles(
  board: Record<string, PlacedTile>,
  x: number,
  y: number
): number {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (board[coordKey(x + dx, y + dy)]) count++;
    }
  }
  return count;
}

function findAbbotLocation(
  board: Record<string, PlacedTile>,
  seatNo: number
): { tileKey: string; x: number; y: number; meeple: PlacedMeeple } | null {
  for (const [k, tile] of Object.entries(board)) {
    const m = tile.meeples.find(
      (mp) => mp.seatNo === seatNo && mp.meepleType === "abbot"
    );
    if (m) return { tileKey: k, x: tile.x, y: tile.y, meeple: m };
  }
  return null;
}

const FEATURE_LABEL_VI: Record<FeatureKind, string> = {
  city: "Thành (Hiệp sĩ)",
  road: "Đường (Cướp đường)",
  field: "Đồng cỏ (Nông dân)",
  monastery: "Tu viện (Tu sĩ)",
  garden: "Vườn hoa (Tu viện trưởng)",
};

export function getValidMeepleOptions(
  state: CarcassonneState,
  seatNo: number
): ValidMeepleOption[] {
  if (state.step !== "PlaceMeepleStep" || !state.lastPlacedCoord) return [];
  const seat = state.seats.find((s) => s.seatNo === seatNo);
  if (!seat) return [];

  const tileKey = coordKey(state.lastPlacedCoord.x, state.lastPlacedCoord.y);
  const tile = state.board[tileKey];
  if (!tile) return [];

  const features = getTileFeatures({
    templateCode: tile.templateCode,
    hasGarden: tile.hasGarden,
  });

  const options: ValidMeepleOption[] = [];

  for (const feat of features) {
    if (feat.kind === "field" && !state.config.enableFarmers) continue;
    if (feat.kind === "garden" && !state.config.enableAbbot) continue;

    const meepleTypes: MeepleType[] = [];
    if (feat.kind === "garden") {
      if (state.config.enableAbbot && seat.abbotAvailable) {
        meepleTypes.push("abbot");
      }
    } else if (feat.kind === "monastery") {
      if (seat.meeplesLeft > 0) meepleTypes.push("standard");
      if (state.config.enableAbbot && seat.abbotAvailable) {
        meepleTypes.push("abbot");
      }
    } else {
      if (seat.meeplesLeft > 0) meepleTypes.push("standard");
    }

    if (meepleTypes.length === 0) continue;

    // Check if connected feature already has ANY meeple!
    if (feat.kind === "city" || feat.kind === "road" || feat.kind === "field") {
      const comp = analyzeComponent(state.board, tileKey, feat.id);
      if (comp && comp.meeples.length > 0) continue;
    }

    options.push({
      featureId: feat.id,
      featureKind: feat.kind,
      meepleTypes,
      anchor: rotateAnchor(feat.anchor, tile.rotation),
      labelVi: FEATURE_LABEL_VI[feat.kind],
    });
  }

  return options;
}

function awardMajorityPoints(
  seats: CarcassonneSeatState[],
  meeples: Array<{ seatNo: number }>,
  points: number,
  category: keyof CarcassonneSeatState["scoreBreakdown"]
): number[] {
  if (meeples.length === 0 || points <= 0) return [];
  const counts = new Map<number, number>();
  for (const m of meeples) {
    counts.set(m.seatNo, (counts.get(m.seatNo) ?? 0) + 1);
  }
  let maxCount = 0;
  for (const c of counts.values()) {
    if (c > maxCount) maxCount = c;
  }
  const winners: number[] = [];
  for (const [seatNo, c] of counts.entries()) {
    if (c === maxCount) {
      winners.push(seatNo);
      const seat = seats.find((s) => s.seatNo === seatNo);
      if (seat) {
        seat.score += points;
        seat.scoreBreakdown[category] += points;
      }
    }
  }
  return winners;
}

function returnMeeplesFromNodes(
  board: Record<string, PlacedTile>,
  seats: CarcassonneSeatState[],
  nodes: Array<{ tileKey: string; featureId: string }>
): void {
  const nodeSet = new Set(nodes.map((n) => `${n.tileKey}|${n.featureId}`));
  for (const [tKey, tile] of Object.entries(board)) {
    if (tile.meeples.length === 0) continue;
    const kept: PlacedMeeple[] = [];
    for (const m of tile.meeples) {
      if (nodeSet.has(`${tKey}|${m.featureId}`)) {
        const seat = seats.find((s) => s.seatNo === m.seatNo);
        if (seat) {
          if (m.meepleType === "abbot") seat.abbotAvailable = true;
          else seat.meeplesLeft += 1;
        }
      } else {
        kept.push(m);
      }
    }
    if (kept.length !== tile.meeples.length) {
      board[tKey] = { ...tile, meeples: kept };
    }
  }
}

function scoreCompletedAroundLastTile(
  state: CarcassonneState
): CarcassonneState {
  if (!state.lastPlacedCoord) return state;
  const { x: lx, y: ly } = state.lastPlacedCoord;
  const lKey = coordKey(lx, ly);
  const placedTile = state.board[lKey];
  if (!placedTile) return state;

  const board = { ...state.board };
  const seats = state.seats.map((s) => ({
    ...s,
    scoreBreakdown: { ...s.scoreBreakdown },
  }));
  const popups: ScorePopupRecord[] = [];
  let popupSeq = state.actionSeq * 10;

  // 1. Check completed Roads & Cities touching the newly placed tile
  const scoredComponentKeys = new Set<string>();
  const tileFeatures = getTileFeatures({
    templateCode: placedTile.templateCode,
    hasGarden: placedTile.hasGarden,
  });

  for (const feat of tileFeatures) {
    if (feat.kind !== "road" && feat.kind !== "city") continue;
    const comp = analyzeComponent(board, lKey, feat.id);
    if (!comp || comp.openEnds > 0 || comp.meeples.length === 0) continue;

    // Deduplicate same component reached by two features on same tile
    const sig = `${comp.kind}:${Array.from(comp.tiles).sort().join(";")}:${comp.meeples
      .map((m) => `${m.tileKey}|${m.featureId}`)
      .sort()
      .join(",")}`;
    if (scoredComponentKeys.has(sig)) continue;
    scoredComponentKeys.add(sig);

    const pts =
      comp.kind === "road"
        ? comp.tiles.size
        : comp.tiles.size * 2 + comp.pennants * 2;
    const cat = comp.kind === "road" ? "roads" : "cities";
    const winners = awardMajorityPoints(seats, comp.meeples, pts, cat);

    returnMeeplesFromNodes(board, seats, comp.meeples);

    const label =
      comp.kind === "road"
        ? `Hoàn thành Đường (+${pts})`
        : `Hoàn thành Thành (+${pts})`;

    const compTileCoords = Array.from(comp.tiles).map((tk) => {
      const [xs, ys] = tk.split(",");
      return { x: Number(xs), y: Number(ys) };
    });

    for (const wn of winners) {
      const ws = seats.find((s) => s.seatNo === wn);
      if (ws) {
        popups.push({
          id: ++popupSeq,
          x: lx,
          y: ly,
          seatNo: wn,
          color: ws.color,
          points: pts,
          labelVi: label,
          kind: comp.kind === "city" ? "city" : "road",
          tileCoords: compTileCoords,
        });
      }
    }
  }

  // 2. Check Monasteries & Gardens in 3x3 neighborhood around (lx, ly)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const mx = lx + dx;
      const my = ly + dy;
      const mKey = coordKey(mx, my);
      const tile = board[mKey];
      if (!tile || tile.meeples.length === 0) continue;

      const cloisterMeeples = tile.meeples.filter(
        (m) => m.featureKind === "monastery" || m.featureKind === "garden"
      );
      if (cloisterMeeples.length === 0) continue;

      if (countSurroundingTiles(board, mx, my) === 9) {
        for (const m of cloisterMeeples) {
          const cat = m.featureKind === "monastery" ? "monasteries" : "gardens";
          awardMajorityPoints(seats, [m], 9, cat);
          returnMeeplesFromNodes(board, seats, [
            { tileKey: mKey, featureId: m.featureId },
          ]);
          const seat = seats.find((s) => s.seatNo === m.seatNo);
          if (seat) {
            const nameKind =
              m.featureKind === "monastery" ? "Tu viện" : "Vườn hoa";
            const cloisterCoords: Array<{ x: number; y: number }> = [];
            for (let cdx = -1; cdx <= 1; cdx++) {
              for (let cdy = -1; cdy <= 1; cdy++) {
                cloisterCoords.push({ x: mx + cdx, y: my + cdy });
              }
            }
            popups.push({
              id: ++popupSeq,
              x: mx,
              y: my,
              seatNo: seat.seatNo,
              color: seat.color,
              points: 9,
              labelVi: `${nameKind} 3×3 (+9)`,
              kind: m.featureKind === "monastery" ? "monastery" : "garden",
              tileCoords: cloisterCoords,
            });
          }
        }
      }
    }
  }

  return {
    ...state,
    board,
    seats,
    scorePopups: popups.length > 0 ? popups : state.scorePopups,
  };
}

function performEndGameScoring(
  state: CarcassonneState
): CarcassonneState {
  const board = { ...state.board };
  const seats = state.seats.map((s) => ({
    ...s,
    scoreBreakdown: { ...s.scoreBreakdown },
  }));

  // 1. Score all remaining incomplete Roads & Cities
  const scoredNodes = new Set<string>();
  for (const [tKey, tile] of Object.entries(board)) {
    for (const m of tile.meeples) {
      if (m.featureKind !== "road" && m.featureKind !== "city") continue;
      const nodeId = `${tKey}|${m.featureId}`;
      if (scoredNodes.has(nodeId)) continue;

      const comp = analyzeComponent(board, tKey, m.featureId);
      if (!comp || comp.meeples.length === 0) continue;
      for (const cm of comp.meeples) {
        scoredNodes.add(`${cm.tileKey}|${cm.featureId}`);
      }

      const pts =
        comp.kind === "road"
          ? comp.tiles.size
          : comp.tiles.size + comp.pennants;
      awardMajorityPoints(
        seats,
        comp.meeples,
        pts,
        comp.kind === "road" ? "roads" : "cities"
      );
    }
  }

  // 2. Score all remaining incomplete Monasteries & Gardens
  for (const tile of Object.values(board)) {
    for (const m of tile.meeples) {
      if (m.featureKind !== "monastery" && m.featureKind !== "garden") continue;
      const pts = countSurroundingTiles(board, tile.x, tile.y);
      awardMajorityPoints(
        seats,
        [m],
        pts,
        m.featureKind === "monastery" ? "monasteries" : "gardens"
      );
    }
  }

  // 3. Score Farmers (Fields) — 3 pts per unique COMPLETED city bordering the field!
  if (state.config.enableFarmers) {
    const scoredFieldNodes = new Set<string>();
    for (const [tKey, tile] of Object.entries(board)) {
      for (const m of tile.meeples) {
        if (m.featureKind !== "field") continue;
        const nodeId = `${tKey}|${m.featureId}`;
        if (scoredFieldNodes.has(nodeId)) continue;

        const fieldComp = analyzeComponent(board, tKey, m.featureId);
        if (!fieldComp || fieldComp.meeples.length === 0) continue;
        for (const fm of fieldComp.meeples) {
          scoredFieldNodes.add(`${fm.tileKey}|${fm.featureId}`);
        }

        // Count distinct COMPLETED cities bordering this field
        const completedCitySigs = new Set<string>();
        for (const cNode of fieldComp.adjacentCityNodes) {
          const cityComp = analyzeComponent(
            board,
            cNode.tileKey,
            cNode.featureId
          );
          if (cityComp && cityComp.openEnds === 0) {
            const sig = Array.from(cityComp.tiles).sort().join(";");
            completedCitySigs.add(sig);
          }
        }

        const pts = completedCitySigs.size * 3;
        if (pts > 0) {
          awardMajorityPoints(seats, fieldComp.meeples, pts, "farmers");
        }
      }
    }
  }

  const maxScore = Math.max(...seats.map((s) => s.score));
  const winners = seats
    .filter((s) => s.score === maxScore)
    .map((s) => s.displayName)
    .join(" & ");

  const summary = `Kết thúc ván đấu! Tổng kết điểm cuối trận — Chiến thắng: ${winners} (${maxScore} điểm)!`;

  return {
    ...state,
    step: "MatchOver",
    board,
    seats,
    currentTile: null,
    draftPlacement: null,
    lastPlacedCoord: null,
    lastActionSummaryVi: summary,
    actionSeq: state.actionSeq + 1,
  };
}

function advanceToNextTurn(state: CarcassonneState): CarcassonneState {
  // First score anything completed by the tile just placed
  const scored = scoreCompletedAroundLastTile(state);

  if (scored.deck.length === 0) {
    return performEndGameScoring(scored);
  }

  const curIdx = scored.seats.findIndex(
    (s) => s.seatNo === scored.activeSeatNo
  );
  const nextSeat = scored.seats[(curIdx + 1) % scored.seats.length];

  return {
    ...scored,
    step: "DrawTileStep",
    turnNumber: scored.turnNumber + 1,
    activeSeatNo: nextSeat.seatNo,
    currentTile: null,
    draftPlacement: null,
    lastPlacedCoord: null,
    actionSeq: scored.actionSeq + 1,
  };
}

function createInitialState(input: {
  config: CarcassonneConfig;
  seats: SeatDescriptor[];
  nowMs: number;
  rng?: () => number;
}): CartridgeTransitionResult<CarcassonneState> {
  const ordered = [...input.seats].sort((a, b) => a.seatNo - b.seatNo);
  const seedBase = input.rng
    ? Math.floor(input.rng() * 0x7fffffff)
    : (input.nowMs >>> 0) ^ 0xca4ca550;

  const cfg: CarcassonneConfig = {
    enableRiver: input.config?.enableRiver ?? true,
    enableAbbot: input.config?.enableAbbot ?? true,
    enableFarmers: input.config?.enableFarmers ?? true,
  };

  const { startTile, deck, nextState } = buildCarcassonneDeck(
    cfg,
    seedBase || 2021
  );

  const board: Record<string, PlacedTile> = {
    [coordKey(0, 0)]: {
      x: 0,
      y: 0,
      templateCode: startTile.templateCode,
      hasGarden: startTile.hasGarden,
      rotation: 0,
      meeples: [],
    },
  };

  const seatStates: CarcassonneSeatState[] = ordered.map((s, i) => ({
    seatNo: s.seatNo,
    actorId: s.actorId,
    displayName: s.displayName,
    color: CARCASSONNE_COLORS[i % CARCASSONNE_COLORS.length],
    score: 0,
    meeplesLeft: 7,
    abbotAvailable: cfg.enableAbbot,
    scoreBreakdown: {
      roads: 0,
      cities: 0,
      monasteries: 0,
      gardens: 0,
      farmers: 0,
    },
  }));

  const summary = `Ván Carcassonne bắt đầu (${
    cfg.enableRiver ? "Sông + 72 mảnh" : "72 mảnh chuẩn"
  }${cfg.enableAbbot ? " • Tu viện trưởng" : ""})! Lượt của ${
    seatStates[0].displayName
  } rút mảnh.`;

  const state: CarcassonneState = {
    config: cfg,
    step: deck.length > 0 ? "DrawTileStep" : "MatchOver",
    turnNumber: 1,
    activeSeatNo: seatStates[0].seatNo,
    seats: seatStates,
    board,
    deck,
    currentTile: null,
    draftPlacement: null,
    lastPlacedCoord: null,
    lastRiverDir: cfg.enableRiver ? 2 : null, // RV_SPRING flows South (dir 2)
    scorePopups: [],
    lastActionSummaryVi: summary,
    actionSeq: 1,
    rngState: nextState,
  };

  return {
    state,
    events: [],
    phaseDeadlineMs: null,
  };
}

function reduce(input: {
  state: CarcassonneState;
  command: CarcassonneCommand;
  actorSeatNo: number;
  nowMs: number;
}): CartridgeTransitionResult<CarcassonneState> {
  const { state, command, actorSeatNo } = input;
  if (state.step === "MatchOver") {
    throw new Error("Ván đấu Carcassonne đã kết thúc.");
  }
  if (state.activeSeatNo !== actorSeatNo) {
    throw new Error("Chưa tới lượt của bạn.");
  }

  const actorSeat = state.seats.find((s) => s.seatNo === actorSeatNo);
  if (!actorSeat) throw new Error("Không tìm thấy người chơi.");

  const events: MatchEventRecord[] = [];

  if (command.type === "DRAW_TILE") {
    if (state.step !== "DrawTileStep") {
      throw new Error("Hiện không ở bước rút mảnh đất.");
    }
    const remainingDeck = [...state.deck];
    let nextTile: DeckTileCard | null = null;
    while (remainingDeck.length > 0) {
      const candidate = remainingDeck.shift()!;
      const validMoves = getAllValidTilePlacements(
        state.board,
        candidate,
        state.lastRiverDir
      );
      if (validMoves.length > 0) {
        nextTile = candidate;
        break;
      }
    }

    if (!nextTile) {
      return {
        state: performEndGameScoring({ ...state, deck: remainingDeck }),
        events,
        phaseDeadlineMs: null,
      };
    }

    return {
      state: {
        ...state,
        step: "PlaceTileStep",
        deck: remainingDeck,
        currentTile: nextTile,
        draftPlacement: null,
        scorePopups: [],
        actionSeq: state.actionSeq + 1,
      },
      events,
      phaseDeadlineMs: null,
    };
  }

  if (command.type === "STAGE_TILE") {
    if (state.step !== "PlaceTileStep" || !state.currentTile) {
      throw new Error("Hiện không ở bước đặt mảnh đất.");
    }
    const rot = command.rotation & 3;
    if (
      !canPlaceTileAt(
        state.board,
        state.currentTile,
        command.x,
        command.y,
        rot,
        state.lastRiverDir
      )
    ) {
      throw new Error("Vị trí hoặc góc xoay mảnh đất không khớp cạnh!");
    }
    return {
      state: {
        ...state,
        draftPlacement: { x: command.x, y: command.y, rotation: rot },
      },
      events,
      phaseDeadlineMs: null,
    };
  }

  if (command.type === "CLEAR_DRAFT") {
    if (state.step !== "PlaceTileStep") {
      return { state, events, phaseDeadlineMs: null };
    }
    return {
      state: {
        ...state,
        draftPlacement: null,
      },
      events,
      phaseDeadlineMs: null,
    };
  }

  if (command.type === "PLACE_TILE") {
    if (state.step !== "PlaceTileStep" || !state.currentTile) {
      throw new Error("Hiện không ở bước đặt mảnh đất.");
    }
    const rot = command.rotation & 3;
    if (
      !canPlaceTileAt(
        state.board,
        state.currentTile,
        command.x,
        command.y,
        rot,
        state.lastRiverDir
      )
    ) {
      throw new Error("Vị trí hoặc góc xoay mảnh đất không khớp cạnh!");
    }

    const placed: PlacedTile = {
      x: command.x,
      y: command.y,
      templateCode: state.currentTile.templateCode,
      hasGarden: state.currentTile.hasGarden,
      rotation: rot,
      meeples: [],
    };

    // Update lastRiverDir if this is a River tile
    let nextRiverDir = state.lastRiverDir;
    const tpl = ALL_TILE_TEMPLATES[state.currentTile.templateCode];
    if (tpl?.riverRole === "lake") {
      nextRiverDir = null;
    } else if (tpl?.riverRole === "middle") {
      const edges = getRotatedEdges(placed.templateCode, rot);
      for (let d = 0; d < 4; d++) {
        if (edges[d] === "river") {
          const neighbor = state.board[coordKey(command.x + DIR_DX[d], command.y + DIR_DY[d])];
          if (!neighbor) {
            nextRiverDir = d;
          }
        }
      }
    }

    const nextBoard = {
      ...state.board,
      [coordKey(command.x, command.y)]: placed,
    };

    const placedState: CarcassonneState = {
      ...state,
      step: "PlaceMeepleStep",
      board: nextBoard,
      currentTile: null,
      draftPlacement: null,
      lastPlacedCoord: { x: command.x, y: command.y },
      lastRiverDir: nextRiverDir,
      scorePopups: [],
      lastActionSummaryVi: `${actorSeat.displayName} đặt mảnh "${tpl.nameVi}" tại (${command.x}, ${command.y}).`,
      actionSeq: state.actionSeq + 1,
    };

    // If player has NO valid meeple options AND cannot recall Abbot -> auto-finish turn!
    const meepleOpts = getValidMeepleOptions(placedState, actorSeatNo);
    const canRecall =
      state.config.enableAbbot &&
      findAbbotLocation(placedState.board, actorSeatNo) !== null;
    if (meepleOpts.length === 0 && !canRecall) {
      return {
        state: advanceToNextTurn(placedState),
        events,
        phaseDeadlineMs: null,
      };
    }

    return { state: placedState, events, phaseDeadlineMs: null };
  }

  if (command.type === "PLACE_MEEPLE") {
    if (state.step !== "PlaceMeepleStep" || !state.lastPlacedCoord) {
      throw new Error("Hiện không ở bước đặt Meeple.");
    }
    const opts = getValidMeepleOptions(state, actorSeatNo);
    const chosen = opts.find(
      (o) =>
        o.featureId === command.featureId &&
        o.meepleTypes.includes(command.meepleType)
    );
    if (!chosen) {
      throw new Error("Không thể đặt Meeple vào khu vực này.");
    }

    const lKey = coordKey(state.lastPlacedCoord.x, state.lastPlacedCoord.y);
    const tile = state.board[lKey];
    const nextBoard: Record<string, PlacedTile> = {
      ...state.board,
      [lKey]: {
        ...tile,
        meeples: [
          ...tile.meeples,
          {
            seatNo: actorSeatNo,
            color: actorSeat.color,
            meepleType: command.meepleType,
            featureId: chosen.featureId,
            featureKind: chosen.featureKind,
          },
        ],
      },
    };

    const nextSeats = state.seats.map((s) => {
      if (s.seatNo !== actorSeatNo) return s;
      return command.meepleType === "abbot"
        ? { ...s, abbotAvailable: false }
        : { ...s, meeplesLeft: s.meeplesLeft - 1 };
    });

    const msg = `${actorSeat.displayName} đặt ${
      command.meepleType === "abbot" ? "Tu viện trưởng" : "Meeple"
    } vào ${chosen.labelVi}.`;

    const afterPlace: CarcassonneState = {
      ...state,
      board: nextBoard,
      seats: nextSeats,
      lastActionSummaryVi: msg,
    };

    return {
      state: advanceToNextTurn(afterPlace),
      events,
      phaseDeadlineMs: null,
    };
  }

  if (command.type === "RECALL_ABBOT") {
    if (state.step !== "PlaceMeepleStep") {
      throw new Error("Chỉ có thể thu hồi Tu viện trưởng ở bước đặt Meeple.");
    }
    if (!state.config.enableAbbot) {
      throw new Error("Chế độ Tu viện trưởng chưa được bật.");
    }
    const loc = findAbbotLocation(state.board, actorSeatNo);
    if (!loc) {
      throw new Error("Bạn chưa đặt Tu viện trưởng nào trên bản đồ.");
    }

    const pts = countSurroundingTiles(state.board, loc.x, loc.y);
    const nextBoard = { ...state.board };
    const nextSeats = state.seats.map((s) => ({
      ...s,
      scoreBreakdown: { ...s.scoreBreakdown },
    }));
    const cat =
      loc.meeple.featureKind === "monastery" ? "monasteries" : "gardens";
    awardMajorityPoints(nextSeats, [{ seatNo: actorSeatNo }], pts, cat);
    returnMeeplesFromNodes(nextBoard, nextSeats, [
      { tileKey: loc.tileKey, featureId: loc.meeple.featureId },
    ]);

    const msg = `${actorSeat.displayName} thu hồi Tu viện trưởng và ghi ngay +${pts} điểm!`;
    const popup: ScorePopupRecord = {
      id: state.actionSeq * 10 + 1,
      x: loc.x,
      y: loc.y,
      seatNo: actorSeatNo,
      color: actorSeat.color,
      points: pts,
      labelVi: `Thu hồi Tu viện trưởng (+${pts})`,
    };

    return {
      state: advanceToNextTurn({
        ...state,
        board: nextBoard,
        seats: nextSeats,
        scorePopups: [popup],
        lastActionSummaryVi: msg,
      }),
      events,
      phaseDeadlineMs: null,
    };
  }

  if (command.type === "SKIP_MEEPLE") {
    if (state.step !== "PlaceMeepleStep") {
      throw new Error("Hiện không ở bước đặt Meeple.");
    }
    const skipMsg = `${actorSeat.displayName} bỏ qua đặt Meeple.`;
    return {
      state: advanceToNextTurn({ ...state, lastActionSummaryVi: skipMsg }),
      events,
      phaseDeadlineMs: null,
    };
  }

  throw new Error("Lệnh Carcassonne không hợp lệ.");
}

function chooseBotCommand(state: CarcassonneState): CarcassonneCommand {
  if (state.step === "DrawTileStep") {
    return { type: "DRAW_TILE" };
  }
  if (state.step === "PlaceTileStep" && state.currentTile) {
    const moves = getAllValidTilePlacements(
      state.board,
      state.currentTile,
      state.lastRiverDir
    );
    // Score moves: prefer tiles that touch more existing neighbors (tighter map + completes monasteries/cities)
    let best = moves[0];
    let bestScore = -1e9;
    for (const mv of moves) {
      const neighbors = countSurroundingTiles(state.board, mv.x, mv.y);
      const distPenalty = (Math.abs(mv.x) + Math.abs(mv.y)) * 0.4;
      const sc = neighbors * 10 - distPenalty;
      if (sc > bestScore) {
        bestScore = sc;
        best = mv;
      }
    }
    return {
      type: "PLACE_TILE",
      x: best.x,
      y: best.y,
      rotation: best.rotation,
    };
  }

  // PlaceMeepleStep
  const opts = getValidMeepleOptions(state, state.activeSeatNo);
  const seat = state.seats.find((s) => s.seatNo === state.activeSeatNo);
  if (seat && opts.length > 0) {
    // Priority: monastery/garden > city > road > farmer (late-ish or if plenty meeples)
    const prio: Record<FeatureKind, number> = {
      monastery: 95,
      garden: 88,
      city: 78,
      road: 56,
      field: seat.meeplesLeft >= 5 ? 38 : 10,
    };
    const sorted = [...opts].sort(
      (a, b) => prio[b.featureKind] - prio[a.featureKind]
    );
    const top = sorted[0];
    if (prio[top.featureKind] >= 50 || seat.meeplesLeft >= 5) {
      const mType: MeepleType =
        top.featureKind === "garden" ||
        (top.featureKind === "monastery" && top.meepleTypes.includes("abbot"))
          ? "abbot"
          : top.meepleTypes[0];
      return {
        type: "PLACE_MEEPLE",
        featureId: top.featureId,
        meepleType: mType,
      };
    }
  }

  // Check if recalling Abbot is profitable (>= 5 pts)
  const abbotLoc = findAbbotLocation(state.board, state.activeSeatNo);
  if (abbotLoc && countSurroundingTiles(state.board, abbotLoc.x, abbotLoc.y) >= 5) {
    return { type: "RECALL_ABBOT" };
  }

  return { type: "SKIP_MEEPLE" };
}

function autoActBots(input: {
  current: CartridgeTransitionResult<CarcassonneState>;
  botSeatNos: number[];
  nowMs: number;
}): CartridgeTransitionResult<CarcassonneState> {
  let state = input.current.state;
  const allEvents = [...input.current.events];
  const botSet = new Set(input.botSeatNos);

  let guard = 0;
  while (
    state.step !== "MatchOver" &&
    botSet.has(state.activeSeatNo) &&
    guard < 24
  ) {
    guard++;
    const cmd = chooseBotCommand(state);
    const res = reduce({
      state,
      command: cmd,
      actorSeatNo: state.activeSeatNo,
      nowMs: input.nowMs,
    });
    state = res.state;
    allEvents.push(...res.events);
  }

  return { state, events: allEvents, phaseDeadlineMs: null };
}

function projectView(input: {
  state: CarcassonneState;
  viewerSeatNo: number | null;
}): CarcassonnePlayerView {
  const { state, viewerSeatNo } = input;
  const isViewerTurn =
    viewerSeatNo !== null && viewerSeatNo === state.activeSeatNo;
  const validMeepleOptions =
    isViewerTurn && state.step === "PlaceMeepleStep"
      ? getValidMeepleOptions(state, viewerSeatNo)
      : [];

  const abbotLoc =
    isViewerTurn && state.step === "PlaceMeepleStep" && state.config.enableAbbot
      ? findAbbotLocation(state.board, viewerSeatNo)
      : null;

  const maxScore = Math.max(...state.seats.map((s) => s.score));
  const winnerSeatNos =
    state.step === "MatchOver"
      ? state.seats.filter((s) => s.score === maxScore).map((s) => s.seatNo)
      : [];

  return {
    config: state.config,
    step: state.step,
    turnNumber: state.turnNumber,
    activeSeatNo: state.activeSeatNo,
    viewerSeatNo,
    seats: state.seats,
    board: state.board,
    lastRiverDir: state.lastRiverDir,
    tilesRemaining: state.deck.length + (state.currentTile ? 1 : 0),
    currentTile: state.currentTile,
    draftPlacement: state.draftPlacement,
    lastPlacedCoord: state.lastPlacedCoord,
    validMeepleOptions,
    canRecallAbbot: abbotLoc !== null,
    abbotRecallPoints: abbotLoc
      ? countSurroundingTiles(state.board, abbotLoc.x, abbotLoc.y)
      : 0,
    scorePopups: state.scorePopups,
    lastActionSummaryVi: state.lastActionSummaryVi,
    actionSeq: state.actionSeq,
    winnerSeatNos,
  };
}

function resolveChannels(input: {
  state: CarcassonneState;
  viewerSeatNo: number | null;
}): ChannelPermission[] {
  const isSeated =
    input.viewerSeatNo !== null &&
    input.state.seats.some((s) => s.seatNo === input.viewerSeatNo);
  return [
    {
      channelId: "table",
      label: "Bàn Chơi Carcassonne",
      canRead: true,
      canWrite: isSeated,
    },
  ];
}

export const carcassonneCartridge: GameCartridge<
  CarcassonneConfig,
  CarcassonneState,
  CarcassonneCommand,
  CarcassonnePlayerView
> = {
  cartridgeId: "carcassonne",
  title: "Carcassonne",
  subtitle: "Xếp bản đồ trung cổ • 2–5 người chơi • Bản C3 (Sông & Tu viện trưởng)",
  description:
    "Lần lượt rút và ghép 72 mảnh đất tạo nên thành quách, con đường, tu viện và cánh đồng miền Nam nước Pháp. Triển khai Meeple & Tu viện trưởng để chiếm điểm đa số!",
  minSeats: 2,
  maxSeats: 5,
  available: true,

  defaultConfig(): CarcassonneConfig {
    return {
      enableRiver: true,
      enableAbbot: true,
      enableFarmers: true,
    };
  },

  validateConfig(_config, seatCount) {
    if (seatCount < 2 || seatCount > 5) {
      return {
        valid: false,
        error: "Carcassonne hỗ trợ từ 2 đến 5 người chơi.",
      };
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
    const maxScore = Math.max(...state.seats.map((s) => s.score));
    return state.seats
      .filter((s) => s.score === maxScore)
      .map((s) => s.displayName)
      .join(" & ");
  },
};
