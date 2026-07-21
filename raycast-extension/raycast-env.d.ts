/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** API Base URL - Catalog API origin. Default is production; use http://localhost:3000 while developing the site. */
  "apiBaseUrl": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `browse-wallpapers` command */
  export type BrowseWallpapers = ExtensionPreferences & {}
  /** Preferences accessible in the `set-wallpaper` command */
  export type SetWallpaper = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `browse-wallpapers` command */
  export type BrowseWallpapers = {}
  /** Arguments passed to the `set-wallpaper` command */
  export type SetWallpaper = {
  /** Image URL */
  "url": string
}
}

