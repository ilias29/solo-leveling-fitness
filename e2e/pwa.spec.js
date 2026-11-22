import { test, expect } from "@playwright/test";

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
  await page.click('[data-mode="wall"]');
  await expect(page.locator("#list .exercise h3").first()).toHaveText("1. Wall Sit");
  await page.click('[data-mode="arnold"]');
  const images = page.locator(".arnold-guide img");
  await expect(images).toHaveCount(10);
  for (const photo of await images.all()) {
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate(img => img.naturalWidth)).toBeGreaterThan(200);
  }
  await context.setOffline(false);
});
