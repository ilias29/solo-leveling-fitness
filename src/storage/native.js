// Second copy of soloState in Android SharedPreferences (Capacitor Preferences plugin).
// Survives WebView data loss and is covered by Android auto-backup. No-op in the browser/PWA.
import { STATE_KEY } from "./storage.js";

function bridge(win) {
  const cap = win?.Capacitor;
  return cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform() && typeof cap.nativePromise === "function" ? cap : null;
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

export function isNative(win = globalThis.window) {
  return !!bridge(win);
}

// If the WebView lost soloState but the native copy exists, put it back before the app loads.
export async function restoreFromNative(storage, win = globalThis.window) {
  const cap = bridge(win);
  if (!cap || storage.getItem(STATE_KEY) !== null) return false;
  try {
    const { value } = await withTimeout(cap.nativePromise("Preferences", "get", { key: STATE_KEY }), 2000);
    if (typeof value !== "string" || !value) return false;
    storage.setItem(STATE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function mirrorToNative(json, win = globalThis.window) {
  const cap = bridge(win);
  if (!cap) return;
  cap.nativePromise("Preferences", "set", { key: STATE_KEY, value: json }).catch(() => {});
}

export async function shareText(title, text, win = globalThis.window) {
  const cap = bridge(win);
  if (!cap) return false;
  try {
    await cap.nativePromise("Share", "share", { title, text, dialogTitle: title });
    return true;
  } catch {
    return false;
  }
}
