import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { legacy } from "../tests/fixtures.js";

const at = d => new Date(d + "T10:00:00");

async function open(page, day = "2026-10-17", soloState) {
  await page.clock.setFixedTime(at(day));
  await page.goto("/");
  if (soloState !== undefined) {
    await page.evaluate(s => { localStorage.clear(); localStorage.setItem("soloState", s); }, JSON.stringify(soloState));
    await page.reload();
  }
  await expect(page.locator("#list .exercise")).toHaveCount(7);
}

const card = (page, i) => page.locator("#list .exercise").nth(i);
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem("soloState")));
const mode = (page, m) => page.click(`[data-mode="${m}"]`);

async function completeAll(page) {
  for (let i = 0; i < 7; i++) {
    const btn = card(page, i).locator("[data-check]");
    while (!(await btn.textContent()).startsWith("✓")) await btn.click();
  }
}

test("fresh install starts from zero, with full HP even weeks later", async ({ page }) => {
  await page.clock.setFixedTime(at("2026-10-23"));
  await page.goto("/");
  await expect(page.locator("#list .exercise")).toHaveCount(7);
  await expect(page.locator("#level")).toHaveText("1");
  await expect(page.locator("#xpText")).toHaveText("0");
  await expect(page.locator("#hpText")).toHaveText("100");
  await expect(page.locator("#streakText")).toHaveText("0");
  await expect(page.locator("#dayCount")).toHaveText("0/5");
  await page.clock.setFixedTime(at("2026-11-30"));
  await page.reload();
  await expect(page.locator("#hpText")).toHaveText("100");
});

test("existing data shows streak and DAYS of this week", async ({ page }) => {
  await open(page, "2026-10-17", legacy.v_initial);
  await expect(page.locator("#streakText")).toHaveText("3");
  await expect(page.locator("#dayCount")).toHaveText("3/5");
  await expect(page.locator(".day-dot.hit")).toHaveCount(3);
});

test("DAYS resets on Monday, streak breaks after a missed day", async ({ page }) => {
  await open(page, "2026-10-19", legacy.v_initial);
  await expect(page.locator("#dayCount")).toHaveText("0/5");
  await expect(page.locator("#streakText")).toHaveText("0");
});

test("old soloState from current main is migrated with every setting intact", async ({ page }) => {
  await open(page, "2026-10-17", legacy.v_current);
  await expect(page.locator("#level")).toHaveText("3");
  await expect(page.locator("#xpText")).toHaveText("50");
  await expect(page.locator('[data-mode="stretch"]')).toHaveClass(/active/);
  await expect(card(page, 0).locator("[data-input]")).toHaveValue("60");
  await expect(card(page, 0).locator("[data-check]")).toHaveText("SET 1/2");
  await mode(page, "kb");
  await expect(card(page, 0).locator("[data-check]")).toHaveText("✓ 3/3");
  await expect(card(page, 0).locator(".weight-chip.active")).toHaveText("16 KG");
  await expect(card(page, 2).locator("h3")).toHaveText("3. One-Arm Kettlebell Row");
  await expect(card(page, 6).locator("h3")).toHaveText("7. Kettlebell Deadlift");
  await expect(card(page, 6).locator(".weight-chip.active")).toHaveText("32 KG");
  await expect(card(page, 6).locator("[data-check]")).toHaveText("SET 2/3");
  const s = await stored(page);
  expect(s.schemaVersion).toBe(1);
  expect(s.xp).toBe(650);
  expect(s.questDays).toEqual(["2026-10-14", "2026-10-15", "2026-10-16"]);
  const backup = await page.evaluate(() => localStorage.getItem("soloState.backup.v0"));
  expect(JSON.parse(backup)).toEqual(legacy.v_current);
});

test("kettlebell: reps, weight, sets, set progress and alternative persist after reload", async ({ page }) => {
  await open(page, "2026-10-17", {});
  const c = card(page, 0);
  await c.locator("[data-plus]").click();
  await c.locator("[data-plus]").click();
  await c.locator("[data-minus]").click();
  await expect(c.locator("[data-input]")).toHaveValue("13");
  await c.locator('[data-weight="0"][data-value="16"]').click();
  await c.locator('[data-sets="0"][data-value="3"]').click();
  await expect(c.locator("[data-check]")).toHaveText("SET 0/3");
  await c.locator("[data-check]").click();
  await expect(c.locator("[data-check]")).toHaveText("SET 1/3");
  await c.locator("[data-check]").click();
  await expect(c.locator("[data-check]")).toHaveText("SET 2/3");
  await expect(c).not.toHaveClass(/done/);
  await c.locator("[data-check]").click();
  await expect(c.locator("[data-check]")).toHaveText("✓ 3/3");
  await expect(c).toHaveClass(/done/);
  await expect(c.locator(".dose")).toHaveText("16 kg · 3 × 13");
  await card(page, 1).locator('[data-alt="1"][data-value="1"]').click();
  await expect(card(page, 1).locator("h3")).toHaveText("2. Suitcase March");

  await page.reload();
  await expect(c.locator("[data-input]")).toHaveValue("13");
  await expect(c.locator(".weight-chip.active")).toHaveText("16 KG");
  await expect(c.locator(".set-chip.active")).toHaveText("3");
  await expect(c.locator("[data-check]")).toHaveText("✓ 3/3");
  await expect(card(page, 1).locator("h3")).toHaveText("2. Suitcase March");
  await card(page, 1).locator('[data-alt="1"][data-value="0"]').click();
  await expect(card(page, 1).locator("h3")).toHaveText("2. Rotational Woodchop");
});

test("wall and stretching: time +/- in steps of 5, sets 1-4", async ({ page }) => {
  await open(page, "2026-10-17", {});
  await mode(page, "wall");
  const sit = card(page, 0);
  await expect(sit.locator("h3")).toHaveText("1. Wall Sit");
  await sit.locator("[data-plus]").click();
  await expect(sit.locator("[data-input]")).toHaveValue("35");
  await sit.locator("[data-minus]").click();
  await sit.locator("[data-minus]").click();
  await expect(sit.locator("[data-input]")).toHaveValue("25");
  for (const n of [1, 2, 3, 4]) {
    await sit.locator(`[data-sets="0"][data-value="${n}"]`).click();
    await expect(sit.locator(".set-progress-note")).toHaveText(`Ολοκλήρωση: 0 / ${n} σετ`);
  }
  await expect(card(page, 0).locator(".weight-picker")).toHaveCount(0);
  await mode(page, "stretch");
  const cc = card(page, 0);
  await expect(cc.locator("h3")).toHaveText("1. Cat-Cow");
  await cc.locator("[data-plus]").click();
  await expect(cc.locator("[data-input]")).toHaveValue("50");
  await page.reload();
  await expect(page.locator('[data-mode="stretch"]')).toHaveClass(/active/);
  await expect(card(page, 0).locator("[data-input]")).toHaveValue("50");
  await mode(page, "wall");
  await expect(card(page, 0).locator("[data-input]")).toHaveValue("25");
});

test("XP is granted once per day per mode", async ({ page }) => {
  await open(page, "2026-10-17", {});
  await page.click("#complete");
  await expect(page.locator("#notice")).toHaveText("QUEST INCOMPLETE");
  await completeAll(page);
  await page.click("#complete");
  await expect(page.locator("#notice")).toContainText("+50 XP");
  await expect(page.locator("#xpText")).toHaveText("50");
  await expect(page.locator("#streakText")).toHaveText("1");
  await expect(page.locator("#dayCount")).toHaveText("1/5");
  await expect(card(page, 0).locator("[data-check]")).toHaveText("SET 0/2");

  await completeAll(page);
  await page.click("#complete");
  await expect(page.locator("#notice")).toContainText("XP ΗΔΗ ΣΗΜΕΡΑ");
  await expect(page.locator("#xpText")).toHaveText("50");

  await mode(page, "wall");
  await completeAll(page);
  await page.click("#complete");
  await expect(page.locator("#xpText")).toHaveText("70");
  await mode(page, "stretch");
  await completeAll(page);
  await page.click("#complete");
  await expect(page.locator("#xpText")).toHaveText("85");
  await expect(page.locator("#dayCount")).toHaveText("1/5");

  await page.clock.setFixedTime(at("2026-10-18"));
  await page.reload();
  await mode(page, "kb");
  await completeAll(page);
  await page.click("#complete");
  await expect(page.locator("#xpText")).toHaveText("135");
  await expect(page.locator("#streakText")).toHaveText("2");
  await expect(page.locator("#dayCount")).toHaveText("2/5");
});

test("streak and HP: workout restarts inactivity, -10 HP on the 7th day after", async ({ page }) => {
  await open(page, "2026-10-17", {});
  await completeAll(page);
  await page.click("#complete");
  await page.clock.setFixedTime(at("2026-10-23"));
  await page.reload();
  await expect(page.locator("#hpText")).toHaveText("100");
  await expect(page.locator("#streakText")).toHaveText("0");
  await page.clock.setFixedTime(at("2026-10-24"));
  await page.reload();
  await expect(page.locator("#hpText")).toHaveText("90");
  await expect(page.locator("#hpbar")).toHaveAttribute("style", /width: 90%/);
  await completeAll(page);
  await page.click("#complete");
  await page.clock.setFixedTime(at("2026-10-30"));
  await page.reload();
  await expect(page.locator("#hpText")).toHaveText("90");
});

test("every kettlebell exercise: alternative toggle and 8/16/32 kg", async ({ page }) => {
  await open(page, "2026-10-17", {});
  const alts = ["Kettlebell Sumo Squat", "Suitcase March", "One-Arm Kettlebell Row", "Kettlebell Floor Press", "Kettlebell Skull Crusher", "Kettlebell Around-the-World", "Kettlebell Deadlift"];
  for (let i = 0; i < 7; i++) {
    const c = card(page, i);
    const main = await c.locator("h3").textContent();
    await c.locator(`[data-alt="${i}"][data-value="1"]`).click();
    await expect(c.locator("h3")).toHaveText(`${i + 1}. ${alts[i]}`);
    await expect(c.locator(".alt-visual")).toHaveCount(1);
    for (const w of [8, 16, 32]) {
      await c.locator(`[data-weight="${i}"][data-value="${w}"]`).click();
      await expect(c.locator(".weight-chip.active")).toHaveText(`${w} KG`);
      await expect(c.locator(".dose")).toContainText(`${w} kg`);
    }
    await c.locator(`[data-alt="${i}"][data-value="0"]`).click();
    await expect(c.locator("h3")).toHaveText(main);
    await expect(c.locator(".weight-chip.active")).toHaveText("32 KG");
  }
  await page.reload();
  for (let i = 0; i < 7; i++) await expect(card(page, i).locator(".weight-chip.active")).toHaveText("32 KG");
});

test("wall and stretching have no alternatives or weights, every exercise completes with its own set count", async ({ page }) => {
  await open(page, "2026-10-17", {});
  for (const m of ["wall", "stretch"]) {
    await mode(page, m);
    await expect(page.locator(".alt-picker")).toHaveCount(0);
    await expect(page.locator(".weight-picker")).toHaveCount(0);
    for (let i = 0; i < 7; i++) {
      const n = (i % 4) + 1;
      await card(page, i).locator(`[data-sets="${i}"][data-value="${n}"]`).click();
      for (let k = 0; k < n; k++) await card(page, i).locator("[data-check]").click();
      await expect(card(page, i).locator("[data-check]")).toHaveText(`✓ ${n}/${n}`);
    }
    await expect(page.locator("#questProgress")).toHaveText("7/7 DONE");
  }
});

test("level up at 300 XP", async ({ page }) => {
  await open(page, "2026-10-17", { xp: 280 });
  await completeAll(page);
  await page.click("#complete");
  await expect(page.locator("#level")).toHaveText("2");
  await expect(page.locator("#xpText")).toHaveText("30");
});

test("resetting a completed exercise or all sets asks for confirmation", async ({ page }) => {
  await open(page, "2026-10-17", {});
  const c = card(page, 0);
  await c.locator('[data-sets="0"][data-value="1"]').click();
  await c.locator("[data-check]").click();
  await expect(c.locator("[data-check]")).toHaveText("✓ 1/1");

  page.once("dialog", d => d.dismiss());
  await c.locator("[data-check]").click();
  await expect(c.locator("[data-check]")).toHaveText("✓ 1/1");

  page.once("dialog", d => d.accept());
  await c.locator("[data-check]").click();
  await expect(c.locator("[data-check]")).toHaveText("SET 0/1");

  await c.locator("[data-check]").click();
  page.once("dialog", d => d.dismiss());
  await page.click("#reset");
  await expect(c.locator("[data-check]")).toHaveText("✓ 1/1");
  page.once("dialog", d => d.accept());
  await page.click("#reset");
  await expect(c.locator("[data-check]")).toHaveText("SET 0/1");
});

test("new calendar day clears set progress but keeps settings and history", async ({ page }) => {
  await open(page, "2026-10-17", { xp: 10, questDays: ["2026-10-16"], schemaVersion: 1 });
  const c = card(page, 0);
  await c.locator("[data-plus]").click();
  await c.locator('[data-sets="0"][data-value="3"]').click();
  await c.locator("[data-check]").click();
  await expect(c.locator("[data-check]")).toHaveText("SET 1/3");
  await page.clock.setFixedTime(at("2026-10-18"));
  await page.reload();
  await expect(c.locator("[data-check]")).toHaveText("SET 0/3");
  await expect(c.locator("[data-input]")).toHaveValue("13");
  const s = await stored(page);
  expect(s.questDays).toContain("2026-10-16");
  expect(s.sessionDate).toBe("2026-10-18");
});

test("HP: -10 on the 7th inactive day, not before", async ({ page }) => {
  const base = { xp: 0, hp: 100, questDays: ["2026-10-16"] };
  await open(page, "2026-10-22", base);
  await expect(page.locator("#hpText")).toHaveText("100");
  await page.clock.setFixedTime(at("2026-10-23"));
  await page.reload();
  await expect(page.locator("#hpText")).toHaveText("90");
  await page.reload();
  await expect(page.locator("#hpText")).toHaveText("90");
  await page.clock.setFixedTime(at("2026-10-30"));
  await page.reload();
  await expect(page.locator("#hpText")).toHaveText("80");
});

test("export, then import restores data and keeps a pre-import copy", async ({ page }) => {
  await open(page, "2026-10-17", legacy.v_current);
  await page.click("#backup summary");
  await page.click("#exportBtn");
  const exported = await page.locator("#backupText").inputValue();
  expect(JSON.parse(exported).soloState.xp).toBe(650);
  await expect(page.locator("#backupStatus")).toContainText("XP 650");

  await page.locator("#backupText").fill(JSON.stringify(legacy.v_hp_toggle));
  await expect(page.locator("#importBtn")).toBeDisabled();
  await page.click("#checkBtn");
  await expect(page.locator("#backupStatus")).toContainText("XP 420");
  page.once("dialog", d => d.dismiss());
  await page.click("#importBtn");
  await expect(page.locator("#xpText")).toHaveText("50");

  page.once("dialog", d => d.accept());
  await page.click("#importBtn");
  await expect(page.locator("#level")).toHaveText("2");
  await expect(page.locator("#xpText")).toHaveText("120");
  await expect(page.locator("#hpText")).toHaveText("90");
  const pre = await page.evaluate(() => JSON.parse(localStorage.getItem("soloState.backup.preImport")));
  expect(pre.xp).toBe(650);

  await page.reload();
  await expect(page.locator("#xpText")).toHaveText("120");

  await page.click("#backup summary");
  await page.locator("#backupText").fill(exported);
  await page.click("#checkBtn");
  page.once("dialog", d => d.accept());
  await page.click("#importBtn");
  await expect(page.locator("#xpText")).toHaveText("50");
  await expect(page.locator("#level")).toHaveText("3");
});

test("settings button opens Backup & Restore and shows the version", async ({ page }) => {
  await open(page, "2026-10-17", {});
  await expect(page.locator("#backup")).not.toHaveAttribute("open", "");
  await page.click("#settingsBtn");
  await expect(page.locator("#backup")).toHaveAttribute("open", "");
  await expect(page.locator("#exportBtn")).toBeVisible();
  await expect(page.locator("#appVersion")).toHaveText(/^Έκδοση \d+\.\d+\.\d+$/);
});

test("export file download, then restore from that file", async ({ page }) => {
  await open(page, "2026-10-17", legacy.v_current);
  await page.click("#settingsBtn");
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("#downloadBtn")]);
  expect(download.suggestedFilename()).toBe("solo-leveling-backup-2026-10-17.json");
  expect(await download.failure()).toBeNull();
  // Windows antivirus may briefly lock freshly downloaded files.
  const src = await download.path();
  let fileText;
  await expect.poll(() => { try { fileText = readFileSync(src, "utf8"); return true; } catch { return false; } }, { timeout: 10000 }).toBe(true);
  expect(JSON.parse(fileText).soloState.xp).toBe(650);

  await page.evaluate(() => { localStorage.removeItem("soloState"); });
  await page.reload();
  await expect(page.locator("#xpText")).toHaveText("0");

  await page.click("#settingsBtn");
  await page.setInputFiles("#importFile", { name: "backup.json", mimeType: "application/json", buffer: Buffer.from(fileText) });
  await expect(page.locator("#backupStatus")).toContainText("XP 650");
  page.once("dialog", d => d.accept());
  await page.click("#importBtn");
  await expect(page.locator("#level")).toHaveText("3");
  await expect(page.locator("#xpText")).toHaveText("50");
  await page.reload();
  await expect(page.locator("#xpText")).toHaveText("50");
  await expect(page.locator('[data-mode="stretch"]')).toHaveClass(/active/);
});

test("defective backup files are rejected and data stays untouched", async ({ page }) => {
  await open(page, "2026-10-17", legacy.v_current);
  await page.click("#settingsBtn");
  const files = {
    "truncated.json": '{"format":"solo-leveling-fitness-backup","version":1,"soloState":{"xp":9',
    "photo.jpg": "\u00ff\u00d8\u00ff\u00e0 binary",
    "other.json": '{"hello":"world"}',
    "empty.json": ""
  };
  for (const [name, content] of Object.entries(files)) {
    await page.setInputFiles("#importFile", { name, mimeType: "application/json", buffer: Buffer.from(content) });
    await expect(page.locator("#backupStatus")).toContainText("✗");
    await expect(page.locator("#importBtn")).toBeDisabled();
  }
  expect((await stored(page)).xp).toBe(650);
  await page.reload();
  await expect(page.locator("#xpText")).toHaveText("50");
});

test("Android: WebView storage loss is recovered from the native Preferences copy", async ({ page }) => {
  await page.addInitScript(() => {
    const prefs = JSON.parse(sessionStorage.getItem("fakePrefs") || "{}");
    window.Capacitor = {
      isNativePlatform: () => true,
      nativePromise: (plugin, method, o) => {
        if (plugin === "Preferences" && method === "get") return Promise.resolve({ value: prefs[o.key] ?? null });
        if (plugin === "Preferences" && method === "set") { prefs[o.key] = o.value; sessionStorage.setItem("fakePrefs", JSON.stringify(prefs)); return Promise.resolve(); }
        return Promise.reject(new Error("not implemented"));
      }
    };
  });
  await page.clock.setFixedTime(at("2026-10-17"));
  await page.goto("/");
  await completeAll(page);
  await page.click("#complete");
  await expect(page.locator("#xpText")).toHaveText("50");
  await expect(page.locator("#appVersion")).toContainText("Android");
  await expect(page.locator("#downloadBtn")).toHaveText("ΑΠΟΣΤΟΛΗ / ΑΠΟΘΗΚΕΥΣΗ");

  await page.evaluate(() => localStorage.removeItem("soloState"));
  await page.reload();
  await expect(page.locator("#xpText")).toHaveText("50");
  await expect(page.locator("#notice")).toContainText("ΕΠΑΝΑΦΕΡΘΗΚΑΝ");
});

test("invalid import is rejected without touching data", async ({ page }) => {
  await open(page, "2026-10-17", legacy.v_current);
  await page.click("#backup summary");
  await page.locator("#backupText").fill("not json");
  await page.click("#checkBtn");
  await expect(page.locator("#backupStatus")).toContainText("✗");
  await expect(page.locator("#importBtn")).toBeDisabled();
  expect((await stored(page)).xp).toBe(650);
});

test("corrupt soloState is preserved and the app still opens", async ({ page }) => {
  await page.clock.setFixedTime(at("2026-10-17"));
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("soloState", '{"xp":12'); });
  await page.reload();
  await expect(page.locator("#list .exercise")).toHaveCount(7);
  await expect(page.locator("#notice")).toContainText("soloState.corrupt");
  expect(await page.evaluate(() => localStorage.getItem("soloState.corrupt"))).toBe('{"xp":12');
});

test("no horizontal overflow in any mode", async ({ page }) => {
  await open(page, "2026-10-17", {});
  for (const m of ["kb", "wall", "stretch"]) {
    await mode(page, m);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, m).toBeLessThanOrEqual(0);
  }
});

test("no console errors on load", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await open(page, "2026-10-17", legacy.v_current);
  for (const m of ["kb", "wall", "stretch"]) await mode(page, m);
  expect(errors).toEqual([]);
});
