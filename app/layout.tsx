import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Shabbat Gossip Protocol",
  description:
    "A distributed network of Friday-night gatherings for founders, builders, investors, and friends around the world.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
