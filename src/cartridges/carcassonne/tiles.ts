export type EdgeType = "field" | "road" | "city" | "river";

export type FeatureKind = "city" | "road" | "field" | "monastery" | "garden";

export interface TileFeatureDef {
  /** Unique local ID within this tile template (e.g. "c0", "r0", "f0", "m0", "g0"). */
  id: string;
  kind: FeatureKind;
  /** Cardinal edges (0=N, 1=E, 2=S, 3=W) touched by this road/city/river. */
  edges: number[];
  /**
   * Perimeter sub-corners (0..7 clockwise: 0=N_L, 1=N_R, 2=E_L, 3=E_R, 4=S_L, 5=S_R, 6=W_L, 7=W_R)
   * touched by this field (used for exact Farmer connectivity).
   */
  fieldCorners: number[];
  /** Local IDs of city features on this tile bordering this field (for Farmer scoring). */
  adjacentCityIds: string[];
  /** True if this city feature has a Coat of Arms / Pennant (+2 pts complete, +1 incomplete). */
  pennant?: boolean;
  /** Unrotated visual anchor [0..1, 0..1] for drawing a Meeple / Abbot. */
  anchor: [number, number];
}

export interface TileTemplate {
  code: string;
  nameVi: string;
  /** Edges in [N, E, S, W] order (indices 0, 1, 2, 3). */
  edges: [EdgeType, EdgeType, EdgeType, EdgeType];
  features: TileFeatureDef[];
  /** Number of copies in the deck. */
  count: number;
  /** Number of copies that carry a C3 Flower Garden (for The Abbot). */
  gardenCount?: number;
  /** True if this is the standard base Start Tile (code D). */
  isBaseStart?: boolean;
  /** River mini-expansion role. */
  riverRole?: "spring" | "middle" | "lake";
}

function fCity(
  id: string,
  edges: number[],
  anchor: [number, number],
  pennant = false
): TileFeatureDef {
  return { id, kind: "city", edges, fieldCorners: [], adjacentCityIds: [], pennant, anchor };
}

function fRoad(
  id: string,
  edges: number[],
  anchor: [number, number]
): TileFeatureDef {
  return { id, kind: "road", edges, fieldCorners: [], adjacentCityIds: [], anchor };
}

function fField(
  id: string,
  fieldCorners: number[],
  adjacentCityIds: string[],
  anchor: [number, number]
): TileFeatureDef {
  return { id, kind: "field", edges: [], fieldCorners, adjacentCityIds, anchor };
}

function fMonastery(anchor: [number, number] = [0.5, 0.5]): TileFeatureDef {
  return { id: "m0", kind: "monastery", edges: [], fieldCorners: [], adjacentCityIds: [], anchor };
}

export function makeGardenFeature(
  anchor: [number, number] = [0.72, 0.72]
): TileFeatureDef {
  return { id: "g0", kind: "garden", edges: [], fieldCorners: [], adjacentCityIds: [], anchor };
}

/**
 * All 24 official Base Game tile types summing to EXACTLY 72 tiles (Carcassonne C3 / 2021).
 */
export const BASE_TILE_TEMPLATES: TileTemplate[] = [
  // A (x2): Monastery + road S
  {
    code: "A",
    nameVi: "Tu viện & Đường Nam",
    edges: ["field", "field", "road", "field"],
    count: 2,
    features: [
      fMonastery([0.5, 0.44]),
      fRoad("r0", [2], [0.5, 0.82]),
      fField("f0", [0, 1, 2, 3, 4, 5, 6, 7], [], [0.22, 0.25]),
    ],
  },
  // B (x4): Monastery in open field
  {
    code: "B",
    nameVi: "Tu viện giữa đồng",
    edges: ["field", "field", "field", "field"],
    count: 4,
    features: [
      fMonastery([0.5, 0.5]),
      fField("f0", [0, 1, 2, 3, 4, 5, 6, 7], [], [0.2, 0.22]),
    ],
  },
  // C (x1): Full 4-side City + Pennant
  {
    code: "C",
    nameVi: "Đại Thành 4 mặt (Khiên)",
    edges: ["city", "city", "city", "city"],
    count: 1,
    features: [fCity("c0", [0, 1, 2, 3], [0.5, 0.5], true)],
  },
  // D (x4, 1 is Base Start Tile): City N + straight road E-W
  {
    code: "D",
    nameVi: "Thành Bắc & Đường thẳng Đông-Tây",
    edges: ["city", "road", "field", "road"],
    count: 4,
    isBaseStart: true,
    features: [
      fCity("c0", [0], [0.5, 0.17]),
      fRoad("r0", [1, 3], [0.5, 0.52]),
      fField("f0", [2, 7], ["c0"], [0.22, 0.38]),
      fField("f1", [3, 4, 5, 6], [], [0.5, 0.8]),
    ],
  },
  // E (x5, 1 Garden): City N only
  {
    code: "E",
    nameVi: "Thành Bắc",
    edges: ["city", "field", "field", "field"],
    count: 5,
    gardenCount: 1,
    features: [
      fCity("c0", [0], [0.5, 0.18]),
      fField("f0", [2, 3, 4, 5, 6, 7], ["c0"], [0.45, 0.68]),
    ],
  },
  // F (x2): City W-E connected + Pennant
  {
    code: "F",
    nameVi: "Thành cầu Đông-Tây (Khiên)",
    edges: ["field", "city", "field", "city"],
    count: 2,
    features: [
      fCity("c0", [1, 3], [0.5, 0.5], true),
      fField("f0", [0, 1], ["c0"], [0.5, 0.16]),
      fField("f1", [4, 5], ["c0"], [0.5, 0.84]),
    ],
  },
  // G (x1): City W-E connected
  {
    code: "G",
    nameVi: "Thành cầu Đông-Tây",
    edges: ["field", "city", "field", "city"],
    count: 1,
    features: [
      fCity("c0", [1, 3], [0.5, 0.5], false),
      fField("f0", [0, 1], ["c0"], [0.5, 0.16]),
      fField("f1", [4, 5], ["c0"], [0.5, 0.84]),
    ],
  },
  // H (x3, 1 Garden): Two separate cities W and E
  {
    code: "H",
    nameVi: "Hai thành tách biệt Đông & Tây",
    edges: ["field", "city", "field", "city"],
    count: 3,
    gardenCount: 1,
    features: [
      fCity("c0", [3], [0.16, 0.5]),
      fCity("c1", [1], [0.84, 0.5]),
      fField("f0", [0, 1, 4, 5], ["c0", "c1"], [0.5, 0.5]),
    ],
  },
  // I (x2, 1 Garden): Two separate cities N and E
  {
    code: "I",
    nameVi: "Hai thành tách biệt Bắc & Đông",
    edges: ["city", "city", "field", "field"],
    count: 2,
    gardenCount: 1,
    features: [
      fCity("c0", [0], [0.5, 0.16]),
      fCity("c1", [1], [0.84, 0.5]),
      fField("f0", [4, 5, 6, 7], ["c0", "c1"], [0.34, 0.68]),
    ],
  },
  // J (x3): City N + curved road E-S
  {
    code: "J",
    nameVi: "Thành Bắc & Đường cong Đông-Nam",
    edges: ["city", "road", "road", "field"],
    count: 3,
    features: [
      fCity("c0", [0], [0.5, 0.17]),
      fRoad("r0", [1, 2], [0.68, 0.68]),
      fField("f0", [2, 5, 6, 7], ["c0"], [0.28, 0.58]),
      fField("f1", [3, 4], [], [0.84, 0.84]),
    ],
  },
  // K (x3): City N + curved road S-W
  {
    code: "K",
    nameVi: "Thành Bắc & Đường cong Nam-Tây",
    edges: ["city", "field", "road", "road"],
    count: 3,
    features: [
      fCity("c0", [0], [0.5, 0.17]),
      fRoad("r0", [2, 3], [0.32, 0.68]),
      fField("f0", [2, 3, 4, 7], ["c0"], [0.72, 0.58]),
      fField("f1", [5, 6], [], [0.16, 0.84]),
    ],
  },
  // L (x3): City N + 3-way road junction E, S, W
  {
    code: "L",
    nameVi: "Thành Bắc & Ngã ba đường",
    edges: ["city", "road", "road", "road"],
    count: 3,
    features: [
      fCity("c0", [0], [0.5, 0.17]),
      fRoad("r0", [1], [0.82, 0.52]),
      fRoad("r1", [2], [0.5, 0.82]),
      fRoad("r2", [3], [0.18, 0.52]),
      fField("f0", [2, 7], ["c0"], [0.24, 0.36]),
      fField("f1", [3, 4], [], [0.82, 0.82]),
      fField("f2", [5, 6], [], [0.18, 0.82]),
    ],
  },
  // M (x2): City N-W connected + Pennant
  {
    code: "M",
    nameVi: "Thành góc Bắc-Tây (Khiên)",
    edges: ["city", "field", "field", "city"],
    count: 2,
    features: [
      fCity("c0", [0, 3], [0.3, 0.3], true),
      fField("f0", [2, 3, 4, 5], ["c0"], [0.72, 0.72]),
    ],
  },
  // N (x3, 1 Garden): City N-W connected
  {
    code: "N",
    nameVi: "Thành góc Bắc-Tây",
    edges: ["city", "field", "field", "city"],
    count: 3,
    gardenCount: 1,
    features: [
      fCity("c0", [0, 3], [0.3, 0.3], false),
      fField("f0", [2, 3, 4, 5], ["c0"], [0.72, 0.72]),
    ],
  },
  // O (x2): City N-W connected + curved road E-S + Pennant
  {
    code: "O",
    nameVi: "Thành góc & Đường cong (Khiên)",
    edges: ["city", "road", "road", "city"],
    count: 2,
    features: [
      fCity("c0", [0, 3], [0.3, 0.3], true),
      fRoad("r0", [1, 2], [0.68, 0.68]),
      fField("f0", [2, 5], ["c0"], [0.56, 0.56]),
      fField("f1", [3, 4], [], [0.86, 0.86]),
    ],
  },
  // P (x3): City N-W connected + curved road E-S
  {
    code: "P",
    nameVi: "Thành góc & Đường cong",
    edges: ["city", "road", "road", "city"],
    count: 3,
    features: [
      fCity("c0", [0, 3], [0.3, 0.3], false),
      fRoad("r0", [1, 2], [0.68, 0.68]),
      fField("f0", [2, 5], ["c0"], [0.56, 0.56]),
      fField("f1", [3, 4], [], [0.86, 0.86]),
    ],
  },
  // Q (x1): 3-side City W-N-E + Pennant
  {
    code: "Q",
    nameVi: "Thành 3 mặt (Khiên)",
    edges: ["city", "city", "field", "city"],
    count: 1,
    features: [
      fCity("c0", [0, 1, 3], [0.5, 0.36], true),
      fField("f0", [4, 5], ["c0"], [0.5, 0.84]),
    ],
  },
  // R (x3, 1 Garden): 3-side City W-N-E
  {
    code: "R",
    nameVi: "Thành 3 mặt",
    edges: ["city", "city", "field", "city"],
    count: 3,
    gardenCount: 1,
    features: [
      fCity("c0", [0, 1, 3], [0.5, 0.36], false),
      fField("f0", [4, 5], ["c0"], [0.5, 0.84]),
    ],
  },
  // S (x2): 3-side City W-N-E + road S + Pennant
  {
    code: "S",
    nameVi: "Thành 3 mặt & Cổng đường (Khiên)",
    edges: ["city", "city", "road", "city"],
    count: 2,
    features: [
      fCity("c0", [0, 1, 3], [0.5, 0.34], true),
      fRoad("r0", [2], [0.5, 0.82]),
      fField("f0", [4], ["c0"], [0.82, 0.84]),
      fField("f1", [5], ["c0"], [0.18, 0.84]),
    ],
  },
  // T (x1): 3-side City W-N-E + road S
  {
    code: "T",
    nameVi: "Thành 3 mặt & Cổng đường",
    edges: ["city", "city", "road", "city"],
    count: 1,
    features: [
      fCity("c0", [0, 1, 3], [0.5, 0.34], false),
      fRoad("r0", [2], [0.5, 0.82]),
      fField("f0", [4], ["c0"], [0.82, 0.84]),
      fField("f1", [5], ["c0"], [0.18, 0.84]),
    ],
  },
  // U (x8, 1 Garden): Straight road N-S
  {
    code: "U",
    nameVi: "Đường thẳng Bắc-Nam",
    edges: ["road", "field", "road", "field"],
    count: 8,
    gardenCount: 1,
    features: [
      fRoad("r0", [0, 2], [0.5, 0.5]),
      fField("f0", [1, 2, 3, 4], [], [0.8, 0.5]),
      fField("f1", [0, 5, 6, 7], [], [0.2, 0.5]),
    ],
  },
  // V (x9, 1 Garden): Curved road S-W
  {
    code: "V",
    nameVi: "Đường cong Nam-Tây",
    edges: ["field", "field", "road", "road"],
    count: 9,
    gardenCount: 1,
    features: [
      fRoad("r0", [2, 3], [0.35, 0.65]),
      fField("f0", [0, 1, 2, 3, 4, 7], [], [0.7, 0.32]),
      fField("f1", [5, 6], [], [0.16, 0.84]),
    ],
  },
  // W (x4): 3-way road junction E, S, W
  {
    code: "W",
    nameVi: "Ngã ba đường",
    edges: ["field", "road", "road", "road"],
    count: 4,
    features: [
      fRoad("r0", [1], [0.82, 0.52]),
      fRoad("r1", [2], [0.5, 0.82]),
      fRoad("r2", [3], [0.18, 0.52]),
      fField("f0", [0, 1, 2, 7], [], [0.5, 0.22]),
      fField("f1", [3, 4], [], [0.82, 0.82]),
      fField("f2", [5, 6], [], [0.18, 0.82]),
    ],
  },
  // X (x1): 4-way road junction N, E, S, W
  {
    code: "X",
    nameVi: "Ngã tư đường",
    edges: ["road", "road", "road", "road"],
    count: 1,
    features: [
      fRoad("r0", [0], [0.5, 0.18]),
      fRoad("r1", [1], [0.82, 0.5]),
      fRoad("r2", [2], [0.5, 0.82]),
      fRoad("r3", [3], [0.18, 0.5]),
      fField("f0", [1, 2], [], [0.8, 0.2]),
      fField("f1", [3, 4], [], [0.8, 0.8]),
      fField("f2", [5, 6], [], [0.2, 0.8]),
      fField("f3", [0, 7], [], [0.2, 0.2]),
    ],
  },
];

/**
 * The River mini-expansion (12 tiles: Spring, 10 river tiles, Lake).
 */
export const RIVER_TILE_TEMPLATES: TileTemplate[] = [
  {
    code: "RV_SPRING",
    nameVi: "Đầu Nguồn Sông",
    edges: ["field", "field", "river", "field"],
    count: 1,
    riverRole: "spring",
    features: [fField("f0", [0, 1, 2, 3, 4, 5, 6, 7], [], [0.5, 0.22])],
  },
  {
    code: "RV_STR",
    nameVi: "Sông thẳng",
    edges: ["river", "field", "river", "field"],
    count: 1,
    riverRole: "middle",
    features: [
      fField("f0", [1, 2, 3, 4], [], [0.8, 0.5]),
      fField("f1", [0, 5, 6, 7], [], [0.2, 0.5]),
    ],
  },
  {
    code: "RV_STR_BEND",
    nameVi: "Sông uốn lượn",
    edges: ["river", "field", "river", "field"],
    count: 1,
    riverRole: "middle",
    features: [
      fField("f0", [1, 2, 3, 4], [], [0.8, 0.5]),
      fField("f1", [0, 5, 6, 7], [], [0.2, 0.5]),
    ],
  },
  {
    code: "RV_CURVE",
    nameVi: "Sông cong",
    edges: ["river", "river", "field", "field"],
    count: 2,
    gardenCount: 1,
    riverRole: "middle",
    features: [
      fField("f0", [1, 2], [], [0.84, 0.16]),
      fField("f1", [0, 3, 4, 5, 6, 7], [], [0.3, 0.7]),
    ],
  },
  {
    code: "RV_BRIDGE",
    nameVi: "Cầu vượt Sông",
    edges: ["river", "road", "river", "road"],
    count: 1,
    riverRole: "middle",
    features: [
      fRoad("r0", [1, 3], [0.5, 0.5]),
      fField("f0", [1, 2], [], [0.8, 0.2]),
      fField("f1", [3, 4], [], [0.8, 0.8]),
      fField("f2", [5, 6], [], [0.2, 0.8]),
      fField("f3", [0, 7], [], [0.2, 0.2]),
    ],
  },
  {
    code: "RV_TWO_CITIES",
    nameVi: "Hai thành đối diện qua Sông",
    edges: ["city", "river", "city", "river"],
    count: 1,
    riverRole: "middle",
    features: [
      fCity("c0", [0], [0.5, 0.16]),
      fCity("c1", [2], [0.5, 0.84]),
      fField("f0", [2, 7], ["c0"], [0.22, 0.34]),
      fField("f1", [3, 6], ["c1"], [0.22, 0.66]),
    ],
  },
  {
    code: "RV_CITY_BRIDGE",
    nameVi: "Thành Bắc & Cầu Sông",
    edges: ["city", "river", "road", "river"],
    count: 1,
    riverRole: "middle",
    features: [
      fCity("c0", [0], [0.5, 0.16]),
      fRoad("r0", [2], [0.5, 0.82]),
      fField("f0", [2, 7], ["c0"], [0.22, 0.34]),
      fField("f1", [3, 4], [], [0.8, 0.82]),
      fField("f2", [5, 6], [], [0.2, 0.82]),
    ],
  },
  {
    code: "RV_MONASTERY",
    nameVi: "Tu viện ven Sông",
    edges: ["field", "river", "road", "river"],
    count: 1,
    riverRole: "middle",
    features: [
      fMonastery([0.5, 0.24]),
      fRoad("r0", [2], [0.5, 0.82]),
      fField("f0", [0, 1, 2, 7], [], [0.2, 0.2]),
      fField("f1", [3, 4], [], [0.8, 0.82]),
      fField("f2", [5, 6], [], [0.2, 0.82]),
    ],
  },
  {
    code: "RV_CITY_CORNER",
    nameVi: "Thành 2 mặt & Sông cong",
    edges: ["city", "city", "river", "river"],
    count: 1,
    riverRole: "middle",
    features: [
      fCity("c0", [0, 1], [0.7, 0.3]),
      fField("f0", [4, 7], ["c0"], [0.46, 0.56]),
      fField("f1", [5, 6], [], [0.16, 0.84]),
    ],
  },
  {
    code: "RV_CURVE_ROAD",
    nameVi: "Sông cong & Đường cong",
    edges: ["river", "road", "road", "river"],
    count: 1,
    riverRole: "middle",
    features: [
      fRoad("r0", [1, 2], [0.72, 0.72]),
      fField("f0", [0, 7], [], [0.16, 0.16]),
      fField("f1", [1, 2, 5, 6], [], [0.48, 0.52]),
      fField("f2", [3, 4], [], [0.86, 0.86]),
    ],
  },
  {
    code: "RV_LAKE",
    nameVi: "Hồ Cuối Sông",
    edges: ["river", "field", "field", "field"],
    count: 1,
    riverRole: "lake",
    features: [fField("f0", [0, 1, 2, 3, 4, 5, 6, 7], [], [0.5, 0.78])],
  },
];

export const ALL_TILE_TEMPLATES: Record<string, TileTemplate> = Object.fromEntries(
  [...BASE_TILE_TEMPLATES, ...RIVER_TILE_TEMPLATES].map((t) => [t.code, t])
);

export interface DeckTileCard {
  templateCode: string;
  hasGarden: boolean;
}

export function rotateEdge(edge: number, rot: number): number {
  return (edge + rot) & 3;
}

export function rotateCorner(corner: number, rot: number): number {
  return (corner + rot * 2) & 7;
}

export function rotateAnchor(
  anchor: [number, number],
  rot: number
): [number, number] {
  const [x, y] = anchor;
  switch (rot & 3) {
    case 1:
      return [1 - y, x];
    case 2:
      return [1 - x, 1 - y];
    case 3:
      return [y, 1 - x];
    default:
      return [x, y];
  }
}

export function getRotatedEdges(
  templateCode: string,
  rot: number
): [EdgeType, EdgeType, EdgeType, EdgeType] {
  const tpl = ALL_TILE_TEMPLATES[templateCode];
  const r = rot & 3;
  return [
    tpl.edges[(4 - r) & 3],
    tpl.edges[(5 - r) & 3],
    tpl.edges[(6 - r) & 3],
    tpl.edges[(7 - r) & 3],
  ];
}

export function getTileFeatures(card: DeckTileCard): TileFeatureDef[] {
  const tpl = ALL_TILE_TEMPLATES[card.templateCode];
  if (!card.hasGarden) return tpl.features;
  return [...tpl.features, makeGardenFeature([0.74, 0.72])];
}
