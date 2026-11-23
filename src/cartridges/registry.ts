import type { GameCartridge } from "@/cartridges/types";
import { werewolfCartridge } from "@/cartridges/werewolf";
import { coupCartridge } from "@/cartridges/coup";
import { splendorCartridge } from "@/cartridges/splendor";
import { splendorDuelCartridge } from "@/cartridges/splendor-duel";

export interface CatalogEntry {
  cartridgeId: string;
  title: string;
  genreVi: string;
  subtitle: string;
  description: string;
  minSeats: number;
  maxSeats: number;
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
    },
    {
      cartridgeId: "avalon",
      title: "The Resistance: Avalon",
      genreVi: "Ẩn danh tính • Phe phái",
      subtitle: "Ẩn danh tính • Hiệp sĩ Bàn Tròn • 5–10 người chơi",
      description:
        "Cuộc chiến giữa các bề tôi trung thành của Vua Arthur và tay sai của Mordred xoay quanh các chuyến làm nhiệm vụ.",
      minSeats: 5,
      maxSeats: 10,
      available: false,
      badgeVi: "Sắp ra mắt",
      accentColor: "#38bdf8",
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
      cartridgeId: "secret-hitler",
      title: "Mật Vụ Quốc Hội",
      genreVi: "Suy luận phe phái • Chiến thuật",
      subtitle: "Ban hành đạo luật • Suy luận phe phái • 5–10 người chơi",
      description:
        "Phân tích từng lá phiếu bầu Thủ tướng và từng đạo luật được thông qua để ngăn chặn phe Phát xít.",
      minSeats: 5,
      maxSeats: 10,
      available: false,
      badgeVi: "Sắp ra mắt",
      accentColor: "#ef4444",
    },
  ];
}
