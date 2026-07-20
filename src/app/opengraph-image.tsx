import {
  ogAlt,
  ogContentType,
  ogSize,
  renderOgImage,
} from "@/lib/og-response";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;
export const runtime = "nodejs";
export const revalidate = 86400;

export default async function OpenGraphImage() {
  return renderOgImage();
}
