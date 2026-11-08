/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

/** Klavio's version ({year}.{month}.{sequence}, root package.json). */
declare const __APP_VERSION__: string;
/** true only in the release build of main: then «Next release» is not shown. */
declare const __APP_RELEASED__: boolean;
