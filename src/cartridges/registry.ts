import type { GameCartridge } from "@/cartridges/types";
import { werewolfCartridge } from "@/cartridges/werewolf";
import { coupCartridge } from "@/cartridges/coup";
import { splendorCartridge } from "@/cartridges/splendor";
import { splendorDuelCartridge } from "@/cartridges/splendor-duel";
import { deadMansDrawCartridge } from "@/cartridges/dead-mans-draw";
import { kingOfTokyoDuelCartridge } from "@/cartridges/king-of-tokyo-duel";
import { heatCartridge } from "@/cartridges/heat";
import { implodingKittensCartridge } from "@/cartridges/imploding-kittens";
import { skyTeamCartridge } from "@/cartridges/sky-team";
import { carcassonneCartridge } from "@/cartridges/carcassonne";
import { oneNightWerewolfCartridge } from "@/cartridges/one-night-werewolf";

export interface CatalogEntry {
  cartridgeId: string;
  title: string;
  genreVi: string;
  subtitle: string;
  description: string;
  minSeats: number;
  maxSeats: number;
  seatsLabelVi?: string;
  available: boolean;
  badgeVi: string;
  accentColor: string;
  coverImage?: string;
}

const CARTRIDGES = new Map<string, GameCartridge<any, any, any, any>>([
  [werewolfCartridge.cartridgeId, werewolfCartridge],
  [coupCartridge.cartridgeId, coupCartridge],
  [splendorCartridge.cartridgeId, splendorCartridge],
  [splendorDuelCartridge.cartridgeId, splendorDuelCartridge],
  [deadMansDrawCartridge.cartridgeId, deadMansDrawCartridge],
  [kingOfTokyoDuelCartridge.cartridgeId, kingOfTokyoDuelCartridge],
  [heatCartridge.cartridgeId, heatCartridge],
  [implodingKittensCartridge.cartridgeId, implodingKittensCartridge],
  [skyTeamCartridge.cartridgeId, skyTeamCartridge],
  [carcassonneCartridge.cartridgeId, carcassonneCartridge],
  [oneNightWerewolfCartridge.cartridgeId, oneNightWerewolfCartridge],
]);

export function getCartridge(
  cartridgeId: string
): GameCartridge<any, any, any, any> | null {
  return CARTRIDGES.get(cartridgeId) ?? null;
}

export function registerCartridge(
  cartridge: GameCartridge<any, any, any, any>
): void {
  CARTRIDGES.set(cartridge.cartridgeId, cartridge);
}

export function listCartridges(): CatalogEntry[] {
  return [
    {
      cartridgeId: werewolfCartridge.cartridgeId,
      title: werewolfCartridge.title,
      genreVi: "Suy luận xã hội • Ẩn vai trò",
      subtitle: werewolfCartridge.subtitle,
      description: werewolfCartridge.description,
      minSeats: werewolfCartridge.minSeats,
      maxSeats: werewolfCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Canvas 2D",
      accentColor: "#f59e0b",
      coverImage: "/covers/werewolf-cover.webp",
    },
    {
      cartridgeId: coupCartridge.cartridgeId,
      title: coupCartridge.title,
      genreVi: "Đấu trí • Thao túng",
      subtitle: coupCartridge.subtitle,
      description: coupCartridge.description,
      minSeats: coupCartridge.minSeats,
      maxSeats: coupCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Canvas 2D",
      accentColor: "#a855f7",
      coverImage: "/covers/coup-pixel.png",
    },
    {
      cartridgeId: splendorCartridge.cartridgeId,
      title: splendorCartridge.title,
      genreVi: "Chiến thuật • Thu thập đá quý",
      subtitle: splendorCartridge.subtitle,
      description: splendorCartridge.description,
      minSeats: splendorCartridge.minSeats,
      maxSeats: splendorCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Pixel 2D",
      accentColor: "#10b981",
      coverImage: "/covers/splendor-pixel.png",
    },
    {
      cartridgeId: splendorDuelCartridge.cartridgeId,
      title: splendorDuelCartridge.title,
      genreVi: "Đối kháng 1v1 • Đá quý 5×5",
      subtitle: splendorDuelCartridge.subtitle,
      description: splendorDuelCartridge.description,
      minSeats: splendorDuelCartridge.minSeats,
      maxSeats: splendorDuelCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Pixel 2D",
      accentColor: "#ec4899",
      coverImage: "/covers/splendor-duel-pixel.png",
    },
    {
      cartridgeId: deadMansDrawCartridge.cartridgeId,
      title: deadMansDrawCartridge.title,
      genreVi: "Cược may rủi • Hải tặc",
      subtitle: deadMansDrawCartridge.subtitle,
      description: deadMansDrawCartridge.description,
      minSeats: deadMansDrawCartridge.minSeats,
      maxSeats: deadMansDrawCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Pixel 2D",
      accentColor: "#f59e0b",
      coverImage: "/covers/dead-mans-draw-cover.webp",
    },
    {
      cartridgeId: kingOfTokyoDuelCartridge.cartridgeId,
      title: kingOfTokyoDuelCartridge.title,
      genreVi: "Đối kháng 1v1 • Kaiju Xúc Xắc",
      subtitle: kingOfTokyoDuelCartridge.subtitle,
      description: kingOfTokyoDuelCartridge.description,
      minSeats: kingOfTokyoDuelCartridge.minSeats,
      maxSeats: kingOfTokyoDuelCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Pixel 2D",
      accentColor: "#f97316",
      coverImage: "/covers/king-of-tokyo-duel-pixel.png",
    },
    {
      cartridgeId: heatCartridge.cartridgeId,
      title: heatCartridge.title,
      genreVi: "Đua xe F1 • Quản lý nhiệt & Núp gió",
      subtitle: heatCartridge.subtitle,
      description: heatCartridge.description,
      minSeats: heatCartridge.minSeats,
      maxSeats: heatCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Canvas 2D",
      accentColor: "#ef4444",
      coverImage: "/covers/heat-pixel.png",
    },
    {
      cartridgeId: implodingKittensCartridge.cartridgeId,
      title: implodingKittensCartridge.title,
      genreVi: "Rút bài sinh tồn • 5 Bản mở rộng Mèo Nổ",
      subtitle: implodingKittensCartridge.subtitle,
      description: implodingKittensCartridge.description,
      minSeats: implodingKittensCartridge.minSeats,
      maxSeats: implodingKittensCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Full 5 DLC",
      accentColor: "#a855f7",
      coverImage: "/covers/imploding-kittens-pixel.png",
    },
    {
      cartridgeId: skyTeamCartridge.cartridgeId,
      title: skyTeamCartridge.title,
      genreVi: "Hợp tác 2 người • Hạ cánh máy bay",
      subtitle: skyTeamCartridge.subtitle,
      description: skyTeamCartridge.description,
      minSeats: skyTeamCartridge.minSeats,
      maxSeats: skyTeamCartridge.maxSeats,
      seatsLabelVi: "2 người chơi (Hợp tác Co-op)",
      available: true,
      badgeVi: "Đang mở • Canvas 2D",
      accentColor: "#38bdf8",
      coverImage: "/covers/sky-team-cover.jpg",
    },
    {
      cartridgeId: carcassonneCartridge.cartridgeId,
      title: carcassonneCartridge.title,
      genreVi: "Xếp bản đồ • Chiến thuật trung cổ",
      subtitle: carcassonneCartridge.subtitle,
      description: carcassonneCartridge.description,
      minSeats: carcassonneCartridge.minSeats,
      maxSeats: carcassonneCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • Bản C3 (Sông & Tu viện trưởng)",
      accentColor: "#84cc16",
      coverImage: "/covers/carcassonne-cover.jpg",
    },
    {
      cartridgeId: oneNightWerewolfCartridge.cartridgeId,
      title: oneNightWerewolfCartridge.title,
      genreVi: "Suy luận tốc độ • Tráo vai 1 đêm",
      subtitle: oneNightWerewolfCartridge.subtitle,
      description: oneNightWerewolfCartridge.description,
      minSeats: oneNightWerewolfCartridge.minSeats,
      maxSeats: oneNightWerewolfCartridge.maxSeats,
      available: true,
      badgeVi: "Đang mở • 16 Vai Trò Gốc",
      accentColor: "#c084fc",
      coverImage: "/covers/one-night-werewolf-cover.jpg",
    },
  ];
}
