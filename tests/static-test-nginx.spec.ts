import { chromium, Browser, Page } from "playwright";
import { test } from "@playwright/test";
import { PlaywrightHar } from "playwright-har";

test("should reload page 100 times and generate HAR file", async () => {
  test.setTimeout(1200000000);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    recordHar: { path: "./hars/s3.har" },
  });
  const page = await context.newPage();

  const playwrightHar = new PlaywrightHar(page);
  await playwrightHar.start();

  await page.goto("https://s3-statictest.s3.eu-central-1.amazonaws.com/index.html");
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.every((img) => img.complete);
  });

  const reloads = Array.from({ length: 1000 });
  for await (const _ of reloads) {
    await page.reload();
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.every((img) => img.complete);
    });
    await page.waitForLoadState("networkidle");
  }

  await playwrightHar.stop("./hars/s3.har");
  await browser.close();
});
