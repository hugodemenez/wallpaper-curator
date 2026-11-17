import { LandingHero } from "@/components/LandingHero";
import { LANDING_COLLECTION_IDS, LANDING_WHEEL_IDS, pick } from "@/lib/featured";
import { loadWallpapers } from "@/lib/load-wallpapers";

export default function HomePage() {
  const wallpapers = loadWallpapers();
  return (
    <LandingHero
      wheel={pick(wallpapers, LANDING_WHEEL_IDS)}
      collection={pick(wallpapers, LANDING_COLLECTION_IDS)}
    />
  );
}
