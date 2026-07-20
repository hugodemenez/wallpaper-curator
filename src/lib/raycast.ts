/** Must match raycast-extension/package.json author + name + command. */
export const RAYCAST_AUTHOR = "hugodemenez";
export const RAYCAST_EXT = "wallpaper-curator";
export const RAYCAST_CMD = "set-wallpaper";

export function wallpaperDeeplink(imageUrl: string): string {
  const args = encodeURIComponent(JSON.stringify({ url: imageUrl }));
  return (
    `raycast://extensions/${RAYCAST_AUTHOR}/${RAYCAST_EXT}/${RAYCAST_CMD}` +
    `?arguments=${args}&launchType=background`
  );
}
