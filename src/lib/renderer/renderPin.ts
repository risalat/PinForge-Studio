import { existsSync } from "node:fs";
import path from "node:path";
import serverlessChromium from "@sparticuz/chromium";
import { chromium as localChromium } from "playwright";
import { chromium as serverlessPlaywright } from "playwright-core";
import type { Page } from "playwright-core";
import { env } from "@/lib/env";
import { getStorageProvider } from "@/lib/storage";
import { getTemplateConfig } from "@/lib/templates/registry";

type RenderPinInput = {
  jobId: string;
  planId: string;
  templateId: string;
};

export async function renderPin({ jobId, planId, templateId }: RenderPinInput) {
  const storageProvider = getStorageProvider();
  const key = createRenderedPinStorageKey(jobId, planId, templateId);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const browser = await launchBrowser();

    try {
      const screenshot = await renderPinScreenshot(browser, { jobId, planId, templateId });

      return storageProvider.upload({
        key,
        body: screenshot,
        contentType: "image/png",
      });
    } catch (error) {
      if (attempt === 2 || !isRetryableRenderError(error)) {
        throw error;
      }
    } finally {
      await browser.close();
    }
  }

  throw new Error("Unable to render pin.");
}

async function renderPinScreenshot(
  browser: Awaited<ReturnType<typeof launchBrowser>>,
  { jobId, planId, templateId }: RenderPinInput,
) {
  const templateConfig = getTemplateConfig(templateId);
  const viewport = templateConfig?.canvas ?? { width: 1080, height: 1920 };

  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 1,
  });

  const url = `${env.appUrl}/render/${templateId}?jobId=${jobId}&planId=${planId}`;
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: isServerlessRuntime() ? 20_000 : 60_000,
  });
  await page.waitForLoadState("networkidle", {
    timeout: isServerlessRuntime() ? 10_000 : 30_000,
  }).catch(() => null);
  await page.waitForFunction(() => document.fonts?.status === "loaded", { timeout: 15_000 });
  await page.locator("[data-pin-canvas='true']").waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForFunction(() =>
    Array.from(
      document.querySelectorAll<HTMLImageElement>("[data-pin-canvas='true'] img"),
    ).every((img) => img.complete && img.naturalWidth > 0),
  );
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("[data-autofit='true']")).every(
      (node) => node.getAttribute("data-autofit-ready") === "true",
    ),
  );

  return capturePinCanvas(page);
}

async function capturePinCanvas(page: Page) {
  const canvas = page.locator("[data-pin-canvas='true']");
  const boundingBox = await canvas.boundingBox();

  if (!boundingBox) {
    throw new Error("Pin canvas bounds could not be resolved before screenshot.");
  }

  return page.screenshot({
    type: "png",
    clip: {
      x: Math.max(0, Math.floor(boundingBox.x)),
      y: Math.max(0, Math.floor(boundingBox.y)),
      width: Math.ceil(boundingBox.width),
      height: Math.ceil(boundingBox.height),
    },
  });
}

async function launchBrowser() {
  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH?.trim();

  if (executablePath) {
    return serverlessPlaywright.launch({
      executablePath,
      headless: true,
    });
  }

  if (isServerlessRuntime()) {
    const chromiumInputDir = resolveChromiumInputDir();
    return serverlessPlaywright.launch({
      args: serverlessChromium.args,
      executablePath: await serverlessChromium.executablePath(chromiumInputDir),
      headless: true,
    });
  }

  return localChromium.launch({ headless: true });
}

function isRetryableRenderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Target page, context or browser has been closed") ||
    message.includes("page.goto: Target page, context or browser has been closed") ||
    message.includes("locator.waitFor: Target page, context or browser has been closed")
  );
}

function createRenderedPinStorageKey(jobId: string, planId: string, templateId: string) {
  return `temp/jobs/${jobId}/${planId}-${templateId}-${Date.now()}.png`;
}

function isServerlessRuntime() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

function resolveChromiumInputDir() {
  const candidateDirs = [path.join(process.cwd(), "node_modules", "@sparticuz", "chromium", "bin")];

  for (const candidateDir of candidateDirs) {
    if (existsSync(candidateDir)) {
      return candidateDir;
    }
  }

  return undefined;
}
