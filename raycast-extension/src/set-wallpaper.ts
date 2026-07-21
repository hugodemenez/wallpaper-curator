import { LaunchProps, showHUD } from "@raycast/api";
import { setWallpaperWithFeedback } from "./lib/set-wallpaper";

export default async function Command(
  props: LaunchProps<{ arguments: { url: string } }>,
) {
  const url = props.arguments.url?.trim();
  if (!url) {
    await showHUD("Missing image URL");
    return;
  }
  await setWallpaperWithFeedback(url);
}
