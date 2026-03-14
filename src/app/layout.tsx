import type { Metadata } from "next";
import {
  Alata,
  Antonio,
  Cormorant_Garamond,
  League_Spartan,
  Libre_Baskerville,
  Lora,
  Manrope,
  Satisfy,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const alata = Alata({
  variable: "--font-alata",
  subsets: ["latin"],
  weight: ["400"],
});

const antonio = Antonio({
  variable: "--font-antonio",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
});

const satisfy = Satisfy({
  variable: "--font-satisfy",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "PinForge Studio",
  description: "Pinterest pin rendering and scheduling scaffold for PinForge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${alata.variable} ${antonio.variable} ${cormorantGaramond.variable} ${libreBaskerville.variable} ${lora.variable} ${manrope.variable} ${leagueSpartan.variable} ${satisfy.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
