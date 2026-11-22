import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { photoGuides } from "../src/data/guides.js";
import { workouts } from "../src/data/workouts.js";
import { APP_VERSION } from "../src/version.js";

const json = f => JSON.parse(readFileSync(f, "utf8"));
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);

test("app version matches package.json (used as Android versionName)", () => {
  assert.equal(APP_VERSION, json("package.json").version);
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
});

test("Android applicationId and WebView origin never change (data lives under that origin)", () => {
  const c = json("capacitor.config.json");
  assert.equal(c.appId, "com.ilias.sololevelingfitness");
  assert.equal(c.webDir, "www");
  assert.equal(c.server.androidScheme, "https");
  assert.equal(c.server.hostname, "localhost");
});

test("Capacitor packages are pinned to exact versions", () => {
  const p = json("package.json");
  for (const [name, v] of Object.entries({ ...p.dependencies, ...p.devDependencies })) {
    assert.match(v, /^\d+\.\d+\.\d+$/, name);
  }
});

test("service worker caches every module under src/", () => {
  const sw = readFileSync("sw.js", "utf8");
  for (const f of walk("src")) assert.ok(sw.includes('"./' + f.replace(/\\/g, "/") + '"'), f);
});

test("app code never clears all of localStorage", () => {
  for (const f of walk("src")) assert.ok(!readFileSync(f, "utf8").includes("localStorage.clear"), f);
});

test("no keystore or signing secret is committed", () => {
  const files = walk(".").filter(f => !/node_modules|\.git[\\/]|test-results|playwright-report/.test(f));
  assert.ok(!files.some(f => /\.(jks|keystore|p12)$/i.test(f)));
  const wf = readFileSync(".github/workflows/build-android-stable.yml", "utf8");
  assert.ok(!/storePassword\s+["']/.test(wf) && !/keyPassword\s+["']/.test(wf));
});


test("registered photos have credits, valid WebP files, and offline cache entries", () => {
  const sw = readFileSync("sw.js", "utf8");
  const cached = runInNewContext(sw + "\nASSETS", { self: { addEventListener() {} } });
  const names = new Set(Object.values(workouts).flatMap(workout => workout.items.map(exercise => exercise.name)));
  for (const [name, guide] of Object.entries(photoGuides)) {
    assert.ok(names.has(name), name);
    assert.ok(guide.author && guide.license, name);
    assert.equal(new URL(guide.source).protocol, "https:");
    assert.equal(new URL(guide.licenseUrl).protocol, "https:");
    for (const pose of ["start", "end"]) {
      const file = `assets/${guide.path}-${pose}.webp`;
      const image = readFileSync(file);
      assert.equal(image.toString("ascii", 0, 4), "RIFF", file);
      assert.equal(image.toString("ascii", 8, 12), "WEBP", file);
      assert.deepEqual(image, readFileSync(`www/${file}`), file);
      assert.ok(cached.includes(`./${file}`), file);
    }
  }
});
