import { chromium } from "playwright";
import { env } from "@/lib/env";
import { getStorageProvider } from "@/lib/storage";
import { getTemplateConfig } from "@/lib/templates/registry";

type RenderPinInput = {
  jobId: string;
  templateId: string;
  copyIndex?: number;
};

export async function renderPin({ jobId, templateId, copyIndex = 0 }: RenderPinInput) {
  const browser = await chromium.launch({ headless: true });

  try {
    const templateConfig = getTemplateConfig(templateId);
    const viewport = templateConfig?.canvas ?? { width: 1080, height: 1920 };

    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: 1,
    });

    const url = `${env.appUrl}/render/${templateId}?jobId=${jobId}&copyIndex=${copyIndex}`;
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
    const key = `temp/jobs/${jobId}/${templateId}-${copyIndex}.png`;

    return storageProvider.upload({
      key,
      body: screenshot,
      contentType: "image/png",
    });
  } finally {
    await browser.close();
  }
}
