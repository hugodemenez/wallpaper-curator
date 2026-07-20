import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wallpaper-curator.vercel.app"),
  title: {
    default: "Wallpaper Curator",
    template: "%s · Wallpaper Curator",
  },
  description:
    "A cozy gallery of curated public-domain paintings for your walls. Browse, download, set with Raycast.",
  applicationName: "Wallpaper Curator",
  authors: [{ name: "hugodemenez" }],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  openGraph: {
    title: "Wallpaper Curator",
    description:
      "Curated public-domain paintings in a quiet, home-like gallery.",
    type: "website",
    siteName: "Wallpaper Curator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallpaper Curator",
    description:
      "Curated public-domain paintings in a quiet, home-like gallery.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ddd7cc" },
    { media: "(prefers-color-scheme: dark)", color: "#2a221c" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${figtree.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeScript />
        <a className="skipLink" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
