import { test, expect } from "@playwright/test";
import { photoGuides } from "../src/data/guides.js";
import { workouts } from "../src/data/workouts.js";

test.use({ serviceWorkers: "allow" });

test("PWA: manifest valid, service worker caches app, works offline", async ({ page, context }) => {
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.length).toBeGreaterThan(0);

  await page.goto("/");
  await expect(page.locator("#list .exercise")).toHaveCount(7);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(() => localStorage.setItem("marker", "1"));

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#list .exercise")).toHaveCount(7);
  for (const [mode, workout] of Object.entries(workouts)) {
    if (mode === "arnoldOneBell") await page.click('[data-mode="arnold"]');
    await page.click(`[data-mode="${mode}"]`);
    const cards = page.locator("#list .exercise");
    await expect(cards).toHaveCount(workout.items.length);
    for (const [index, exercise] of workout.items.entries()) {
      const card = cards.nth(index);
      const photos = card.locator(".exercise-guide img");
      await expect(photos).toHaveCount(2);
      if (photoGuides[exercise.name]?.generated) {
        await expect(card.getByText("Εικόνες επίδειξης με τεχνητή νοημοσύνη")).toBeVisible();
      }
      for (const photo of await photos.all()) {
        await photo.scrollIntoViewIfNeeded();
        await expect.poll(() => photo.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
      }
    }
  }
  await context.setOffline(false);
});
