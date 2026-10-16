import test from "node:test";
import assert from "node:assert/strict";
import { loadRaw, saveState, backupBeforeImport, STATE_KEY, BACKUP_V0_KEY, CORRUPT_KEY, PRE_IMPORT_KEY } from "../src/storage/storage.js";
import { buildExport, parseImport } from "../src/backup/backup.js";
import { prepareState } from "../src/state/state.js";
import { workouts } from "../src/data/workouts.js";
import { legacy, memoryStorage, clone } from "./fixtures.js";

const TODAY = "2026-10-17";

test("pre-migration data is copied once to the v0 backup key, untouched", () => {
  const raw = JSON.stringify(legacy.v_current);
  const store = memoryStorage({ [STATE_KEY]: raw });
  const { data } = loadRaw(store);
  assert.equal(store.getItem(BACKUP_V0_KEY), raw);
  const state = prepareState(data, workouts, TODAY);
  assert.ok(saveState(store, state));
  assert.equal(store.getItem(BACKUP_V0_KEY), raw, "backup unchanged after save");
  loadRaw(store);
  assert.equal(store.getItem(BACKUP_V0_KEY), raw, "not overwritten on next load");
  assert.equal(JSON.parse(store.getItem(STATE_KEY)).schemaVersion, 1);
});

test("unparseable soloState is preserved in a separate key, never silently lost", () => {
  const store = memoryStorage({ [STATE_KEY]: '{"xp":12' });
  const r = loadRaw(store);
  assert.equal(r.corrupt, true);
  assert.equal(store.getItem(CORRUPT_KEY), '{"xp":12');
  store.setItem(STATE_KEY, "garbage-2");
  loadRaw(store);
  assert.equal(store.getItem(CORRUPT_KEY), '{"xp":12', "first corrupt copy kept");
  assert.ok(store.keys().some(k => k.startsWith(CORRUPT_KEY + ".")));
});

test("fresh install creates no backup keys", () => {
  const store = memoryStorage();
  const r = loadRaw(store);
  assert.deepEqual(r.data, {});
  assert.deepEqual(store.keys(), []);
});

test("storage write failure is reported instead of throwing", () => {
  const store = { getItem: () => null, setItem: () => { throw new Error("QuotaExceeded"); } };
  assert.equal(saveState(store, { xp: 1 }), false);
});

test("export -> import round trip restores identical state", () => {
  const state = prepareState(clone(legacy.v_current), workouts, TODAY);
  const r = parseImport(buildExport(state));
  assert.ok(r.ok);
  assert.deepEqual(r.state, state);
  assert.equal(r.summary.xp, 650);
  assert.equal(r.summary.level, 3);
  assert.equal(r.summary.lastWorkout, "2026-10-16");
});

test("import accepts raw soloState JSON and a JSON-encoded string of it", () => {
  const raw = JSON.stringify(legacy.v_hp_toggle);
  assert.ok(parseImport(raw).ok);
  assert.ok(parseImport(JSON.stringify(raw)).ok, "copy(localStorage.getItem(...)) style");
  assert.equal(parseImport(raw).summary.hp, 90);
});

test("import rejects invalid input", () => {
  assert.equal(parseImport("").ok, false);
  assert.equal(parseImport("hello").ok, false);
  assert.equal(parseImport("[1,2]").ok, false);
  assert.equal(parseImport('{"foo":1}').ok, false);
  assert.equal(parseImport('{"xp":"abc"}').ok, false);
});

test("current data is copied before an import replaces it", () => {
  const store = memoryStorage({ [STATE_KEY]: '{"xp":999}' });
  assert.ok(backupBeforeImport(store));
  assert.equal(store.getItem(PRE_IMPORT_KEY), '{"xp":999}');
});
