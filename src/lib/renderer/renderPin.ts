import serverlessChromium from "@sparticuz/chromium";
import { chromium as localChromium } from "playwright";
import { chromium as serverlessPlaywright } from "playwright-core";
import { env } from "@/lib/env";
import { getStorageProvider } from "@/lib/storage";
import { getTemplateConfig } from "@/lib/templates/registry";

type RenderPinInput = {
  jobId: string;
  planId: string;
  templateId: string;
};

export async function renderPin({ jobId, planId, templateId }: RenderPinInput) {
  const browser = await launchBrowser();

  try {
    const templateConfig = getTemplateConfig(templateId);
    const viewport = templateConfig?.canvas ?? { width: 1080, height: 1920 };

    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: 1,
    });

    const url = `${env.appUrl}/render/${templateId}?jobId=${jobId}&planId=${planId}`;
    await page.goto(url, {
      waitUntil: "networkidle",
    });
    await page.waitForFunction(() => document.fonts?.status === "loaded");
    await page.locator("[data-pin-canvas='true']").waitFor();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("[data-autofit='true']")).every(
        (node) => node.getAttribute("data-autofit-ready") === "true",
      ),
    );

    const screenshot = await page.locator("[data-pin-canvas='true']").screenshot({
      type: "png",
    });

    const storageProvider = getStorageProvider();
    const key = `temp/jobs/${jobId}/${planId}-${templateId}.png`;

    return storageProvider.upload({
      key,
      body: screenshot,
      contentType: "image/png",
    });
  } finally {
    await browser.close();
  }
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
    return serverlessPlaywright.launch({
      args: serverlessChromium.args,
      executablePath: await serverlessChromium.executablePath(),
      headless: true,
    });
  }

  return localChromium.launch({ headless: true });
}

function isServerlessRuntime() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}
