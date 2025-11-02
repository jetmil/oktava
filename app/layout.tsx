import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ОКТАВА - Система Энергетических Каналов",
  description: "Интеграция Духовной Энергии в Материальный План. 108 энергетических каналов для трансформации сознания и управления реальностью.",
  keywords: ["ОКТАВА", "энергетические каналы", "духовное развитие", "трансформация", "эзотерика"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
