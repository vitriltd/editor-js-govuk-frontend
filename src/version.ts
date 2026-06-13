/**
 * Plugin version, injected at build time via Vite `define`.
 * Falls back to '0.0.0-dev' during tests / unbundled execution.
 */

declare const __PLUGIN_VERSION__: string | undefined;

export const PLUGIN_VERSION: string =
  typeof __PLUGIN_VERSION__ !== 'undefined' ? __PLUGIN_VERSION__ : '0.0.0-dev';
