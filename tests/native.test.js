import test from "node:test";
import assert from "node:assert/strict";
import { restoreFromNative, mirrorToNative, shareText, isNative } from "../src/storage/native.js";
import { STATE_KEY } from "../src/storage/storage.js";
import { memoryStorage } from "./fixtures.js";

function fakeWin(prefs = {}, { hang = false, fail = false } = {}) {
  const calls = [];
  return {
    calls, prefs,
    Capacitor: {
      isNativePlatform: () => true,
      nativePromise: (plugin, method, opts) => {
        calls.push([plugin, method, opts]);
        if (hang) return new Promise(() => {});
        if (fail) return Promise.reject(new Error("not implemented"));
        if (plugin === "Preferences" && method === "get") return Promise.resolve({ value: prefs[opts.key] ?? null });
        if (plugin === "Preferences" && method === "set") { prefs[opts.key] = opts.value; return Promise.resolve(); }
        return Promise.resolve({});
      }
    }
  };
}

test("browser/PWA: native helpers are no-ops", async () => {
  const store = memoryStorage();
  assert.equal(isNative({}), false);
  assert.equal(await restoreFromNative(store, {}), false);
  mirrorToNative("{}", {});
  assert.equal(await shareText("t", "x", {}), false);
  assert.deepEqual(store.keys(), []);
});

test("Android: lost WebView storage is restored from the native copy", async () => {
  const win = fakeWin({ [STATE_KEY]: '{"xp":120}' });
  const store = memoryStorage();
  assert.equal(await restoreFromNative(store, win), true);
  assert.equal(store.getItem(STATE_KEY), '{"xp":120}');
});

test("Android: existing WebView data is never overwritten by the native copy", async () => {
  const win = fakeWin({ [STATE_KEY]: '{"xp":1}' });
  const store = memoryStorage({ [STATE_KEY]: '{"xp":500}' });
  assert.equal(await restoreFromNative(store, win), false);
  assert.equal(store.getItem(STATE_KEY), '{"xp":500}');
  assert.equal(win.calls.length, 0);
});

test("Android: every save is mirrored to native Preferences", () => {
  const win = fakeWin();
  mirrorToNative('{"xp":7}', win);
  assert.deepEqual(win.calls[0], ["Preferences", "set", { key: STATE_KEY, value: '{"xp":7}' }]);
});

test("Android: missing plugin or a hanging bridge does not block startup", async () => {
  const store = memoryStorage();
  assert.equal(await restoreFromNative(store, fakeWin({}, { fail: true })), false);
  const t = Date.now();
  assert.equal(await restoreFromNative(store, fakeWin({}, { hang: true })), false);
  assert.ok(Date.now() - t < 3000);
  assert.equal(store.getItem(STATE_KEY), null);
  assert.equal(await shareText("t", "x", fakeWin({}, { fail: true })), false);
});
