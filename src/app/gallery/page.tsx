import type { Metadata } from "next";
import { GalleryClient } from "@/components/GalleryClient";
import { loadWallpapers } from "@/lib/load-wallpapers";

export const metadata: Metadata = {
  title: "The wheel",
  description:
    "Turn the painted wheel: public-domain masterpieces from open museum collections, ready to set as your wallpaper.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  const wallpapers = loadWallpapers();
  return <GalleryClient wallpapers={wallpapers} />;
}
