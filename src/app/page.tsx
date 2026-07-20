import { LandingHero } from "@/components/LandingHero";
import { loadWallpapers } from "@/lib/load-wallpapers";
import { thumbUrl } from "@/lib/wallpapers";

export default function HomePage() {
  const wallpapers = loadWallpapers();
  const hero =
    wallpapers.find((w) => w.id === "aivazovsky-in-the-roads-evening") ??
    wallpapers[0];

  return (
    <LandingHero
      heroUrl={thumbUrl(hero.url, 1920)}
    />
  );
}
