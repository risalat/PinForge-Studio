import process from "node:process";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { env } from "@/lib/env";
import { logStructuredEvent } from "@/lib/observability/operationContext";
import { getRuntimeTemplateForRender } from "@/lib/runtime-templates/db";
import { getStorageProvider } from "@/lib/storage";
import { getTemplateConfig } from "@/lib/templates/registry";

type RenderPinInput = {
  jobId: string;
  planId: string;
  templateId: string;
  templateVersionId?: string | null;
};

type BrowserLaunchMode = "native" | "custom_executable";

type SharedBrowserState = {
  browser: Browser | null;
  browserPromise: Promise<Browser> | null;
  launchMode: BrowserLaunchMode | null;
  renderCount: number;
  lastRestartReason: string | null;
};

const sharedBrowserState: SharedBrowserState = {
  browser: null,
  browserPromise: null,
  launchMode: null,
  renderCount: 0,
  lastRestartReason: null,
};

const MAX_RENDERS_PER_BROWSER = Number.parseInt(
  process.env.PLAYWRIGHT_BROWSER_MAX_RENDERS ?? "24",
  10,
);
const MAX_BROWSER_HEAP_MB = Number.parseInt(
  process.env.PLAYWRIGHT_BROWSER_MAX_HEAP_MB ?? "900",
  10,
);

export async function renderPin({ jobId, planId, templateId, templateVersionId }: RenderPinInput) {
  const storageProvider = getStorageProvider();
  const key = createRenderedPinStorageKey(jobId, planId, templateId);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const browser = await getSharedBrowser();

    try {
      const screenshot = await renderPinScreenshot(browser, {
        jobId,
        planId,
        templateId,
        templateVersionId,
      });
      sharedBrowserState.renderCount += 1;
      await recycleSharedBrowserIfNeeded("render_threshold");

      return storageProvider.upload({
        key,
        body: screenshot,
        contentType: "image/png",
      });
    } catch (error) {
      const retryable = isRetryableRenderError(error);

      if (retryable) {
        await resetSharedBrowser("retryable_render_error", error);
      }

      if (attempt === 3 || !retryable) {
        throw error;
      }

      await waitBeforeRetry(attempt);
    }
  }

  throw new Error("Unable to render pin.");
}

async function renderPinScreenshot(
  browser: Browser,
  { jobId, planId, templateId, templateVersionId }: RenderPinInput,
) {
  const viewport = await resolveRenderViewport(templateId, templateVersionId);

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    const versionQuery = templateVersionId?.trim()
      ? `&versionId=${encodeURIComponent(templateVersionId.trim())}`
      : "";
    const url = `${env.appUrl}/render/${templateId}?jobId=${jobId}&planId=${planId}${versionQuery}`;
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.locator("[data-pin-canvas='true']").waitFor({ state: "visible", timeout: 15_000 });
    await waitForStableCanvas(page);

    return await capturePinCanvas(page);
  } finally {
    await closeRenderContext(context);
  }
}

async function resolveRenderViewport(
  templateId: string,
  templateVersionId?: string | null,
) {
  const templateConfig = getTemplateConfig(templateId);
  if (templateConfig?.canvas) {
    return templateConfig.canvas;
  }

  const runtimeTemplate = await getRuntimeTemplateForRender({
    templateId,
    versionId: templateVersionId,
  });

  if (runtimeTemplate?.template.canvasWidth && runtimeTemplate?.template.canvasHeight) {
    return {
      width: runtimeTemplate.template.canvasWidth,
      height: runtimeTemplate.template.canvasHeight,
    };
  }

  return { width: 1080, height: 1920 };
}

async function waitForStableCanvas(page: Page) {
  await page
    .waitForLoadState("networkidle", {
      timeout: 20_000,
    })
    .catch(() => null);

  await waitForCondition(
    page,
    () => document.fonts?.status === "loaded",
    15_000,
  );
  await waitForCondition(
    page,
    () =>
      Array.from(
        document.querySelectorAll<HTMLImageElement>("[data-pin-canvas='true'] img"),
      ).every((img) => img.complete && img.naturalWidth > 0),
    15_000,
  );
  await waitForCondition(
    page,
    () =>
      Array.from(document.querySelectorAll("[data-autofit='true']")).every(
        (node) => node.getAttribute("data-autofit-ready") === "true",
      ),
    15_000,
  );

  await page.waitForTimeout(150);
}

async function waitForCondition(page: Page, predicate: () => boolean, timeout: number) {
  try {
    await page.waitForFunction(predicate, { timeout });
  } catch (error) {
    if (page.isClosed()) {
      throw error;
    }
  }
}

async function capturePinCanvas(page: Page) {
  const canvas = page.locator("[data-pin-canvas='true']");
  await canvas.scrollIntoViewIfNeeded().catch(() => null);

  try {
    return await canvas.screenshot({
      type: "png",
      animations: "disabled",
      caret: "hide",
    });
  } catch (error) {
    if (page.isClosed()) {
      throw error;
    }

    const boundingBox = await canvas.boundingBox();
    if (!boundingBox) {
      throw new Error("Pin canvas bounds could not be resolved before screenshot.");
    }

    return page.screenshot({
      type: "png",
      animations: "disabled",
      caret: "hide",
      clip: {
        x: Math.max(0, Math.floor(boundingBox.x)),
        y: Math.max(0, Math.floor(boundingBox.y)),
        width: Math.ceil(boundingBox.width),
        height: Math.ceil(boundingBox.height),
      },
    });
  }
}

async function getSharedBrowser() {
  if (sharedBrowserState.browser && sharedBrowserState.browser.isConnected()) {
    return sharedBrowserState.browser;
  }

  if (sharedBrowserState.browserPromise) {
    return sharedBrowserState.browserPromise;
  }

  sharedBrowserState.browserPromise = launchBrowser().then(({ browser, launchMode }) => {
    sharedBrowserState.browser = browser;
    sharedBrowserState.launchMode = launchMode;
    sharedBrowserState.browserPromise = null;

    browser.on("disconnected", () => {
      if (sharedBrowserState.browser === browser) {
        sharedBrowserState.browser = null;
        sharedBrowserState.browserPromise = null;
        sharedBrowserState.launchMode = null;
        sharedBrowserState.renderCount = 0;
        logStructuredEvent("warn", "renderer.browser.disconnected", {
          launchMode,
          lastRestartReason: sharedBrowserState.lastRestartReason,
        });
      }
    });

    logStructuredEvent("info", "renderer.browser.started", {
      launchMode,
      maxRendersPerBrowser: MAX_RENDERS_PER_BROWSER,
      maxHeapMb: MAX_BROWSER_HEAP_MB,
    });

    return browser;
  });

  try {
    return await sharedBrowserState.browserPromise;
  } catch (error) {
    sharedBrowserState.browserPromise = null;
    throw error;
  }
}

async function recycleSharedBrowserIfNeeded(reason: "render_threshold" | "memory_threshold") {
  if (!sharedBrowserState.browser) {
    return;
  }

  const shouldRecycleByCount =
    Number.isFinite(MAX_RENDERS_PER_BROWSER) &&
    MAX_RENDERS_PER_BROWSER > 0 &&
    sharedBrowserState.renderCount >= MAX_RENDERS_PER_BROWSER;
  const shouldRecycleByMemory =
    Number.isFinite(MAX_BROWSER_HEAP_MB) &&
    MAX_BROWSER_HEAP_MB > 0 &&
    getProcessHeapUsageMb() >= MAX_BROWSER_HEAP_MB;

  if (!shouldRecycleByCount && !shouldRecycleByMemory) {
    return;
  }

  await resetSharedBrowser(shouldRecycleByMemory ? "memory_threshold" : reason);
}

async function resetSharedBrowser(
  reason:
    | "render_threshold"
    | "memory_threshold"
    | "retryable_render_error"
    | "manual_reset",
  error?: unknown,
) {
  const browser = sharedBrowserState.browser;
  if (!browser) {
    sharedBrowserState.browserPromise = null;
    sharedBrowserState.launchMode = null;
    sharedBrowserState.renderCount = 0;
    sharedBrowserState.lastRestartReason = reason;
    return;
  }

  logStructuredEvent("warn", "renderer.browser.restart", {
    reason,
    launchMode: sharedBrowserState.launchMode,
    renderCount: sharedBrowserState.renderCount,
    heapMb: getProcessHeapUsageMb(),
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
          }
        : error
          ? String(error)
          : null,
  });

  sharedBrowserState.browser = null;
  sharedBrowserState.browserPromise = null;
  sharedBrowserState.launchMode = null;
  sharedBrowserState.renderCount = 0;
  sharedBrowserState.lastRestartReason = reason;

  await browser.close().catch(() => null);
}

async function closeRenderContext(context: BrowserContext) {
  await context.close().catch((error) => {
    if (isRetryableRenderError(error)) {
      return null;
    }

    throw error;
  });
}

async function launchBrowser(): Promise<{
  browser: Browser;
  launchMode: BrowserLaunchMode;
}> {
  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH?.trim();

  if (executablePath) {
    return {
      browser: await chromium.launch({
        executablePath,
        headless: true,
      }),
      launchMode: "custom_executable",
    };
  }

  return {
    browser: await chromium.launch({ headless: true }),
    launchMode: "native",
  };
}

function isRetryableRenderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Target page, context or browser has been closed") ||
    message.includes("page.goto: Target page, context or browser has been closed") ||
    message.includes("locator.waitFor: Target page, context or browser has been closed") ||
    message.includes("page.waitForFunction: Target page, context or browser has been closed") ||
    message.includes("Navigation failed because page crashed") ||
    message.includes("Page crashed") ||
    message.includes("Browser has been closed")
  );
}

function waitBeforeRetry(attempt: number) {
  const delay = 350 * attempt;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function createRenderedPinStorageKey(jobId: string, planId: string, templateId: string) {
  return `temp/jobs/${jobId}/${planId}-${templateId}-${Date.now()}.png`;
}

function getProcessHeapUsageMb() {
  return Math.round(process.memoryUsage().heapUsed / (1024 * 1024));
}
