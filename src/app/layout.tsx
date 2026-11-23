import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono, VT323 } from "next/font/google";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  variable: "--font-game-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const vt323Pixel = VT323({
  variable: "--font-game-pixel",
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-game-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BoardGame Arena VN • Ma Sói & Đa Board Game (Canvas 2D)",
  description:
    "Nền tảng chơi Ma Sói (Werewolf) và Đa Board Game thời gian thực trên HTML5 2D Canvas với Quản trò tự động.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${chakraPetch.variable} ${vt323Pixel.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
