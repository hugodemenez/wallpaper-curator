import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme";

/** FOUC-prevention — runs before interactive paint. */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=localStorage.getItem(k);if(p!=="light"&&p!=="dark"&&p!=="system")p="system";var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var t=d?"dark":"light";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}})();`;

  return (
    <Script id="wc-theme-init" strategy="beforeInteractive">
      {code}
    </Script>
  );
}
