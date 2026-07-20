import type { Metadata } from "next";
import { GalleryClient } from "@/components/GalleryClient";
import { loadWallpapers } from "@/lib/load-wallpapers";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse curated public-domain wallpapers.",
};

export default function GalleryPage() {
  const wallpapers = loadWallpapers();
  return <GalleryClient wallpapers={wallpapers} />;
}
