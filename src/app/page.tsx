import { LandingHero } from "@/components/LandingHero";
import { loadWallpapers } from "@/lib/load-wallpapers";

export default function HomePage() {
  const wallpapers = loadWallpapers();
  const hero =
    wallpapers.find((w) => w.id === "aivazovsky-in-the-roads-evening") ??
    wallpapers[0];

  const previewIds = [
    "pissarro-garden-full-sunlight",
    "friedrich-northern-landscape-spring",
    "munsterhjelm-morning-mood",
    "turner-dogana-salute-venice",
  ];
  const previews = previewIds
    .map((id) => wallpapers.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  return <LandingHero hero={hero} previews={previews} />;
}
