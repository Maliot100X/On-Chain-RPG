import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onchain RPG on Base",
  description: "3D browser RPG with Farcaster and Base integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
