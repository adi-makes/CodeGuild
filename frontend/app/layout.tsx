import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeGuild — Coding Quest Platform",
  description:
    "Take on coding quests, submit solutions, and get AI-powered evaluations in this retro pixel-art coding guild.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={pressStart2P.variable}>
      <body className="font-pixel bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
