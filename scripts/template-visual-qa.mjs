import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.PINFORGE_BASE_URL || "http://127.0.0.1:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts", "template-qa");
const TEMPLATE_IDS = [
  "split-vertical-title",
  "split-vertical-title-no-subtitle",
  "single-image-header-title-domain-cta",
];

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 2200,
    },
  });

  for (const templateId of TEMPLATE_IDS) {
    const previewUrl = `${BASE_URL}/preview/${templateId}`;
    const renderUrl = `${BASE_URL}/render/${templateId}`;

    await capture(page, previewUrl, path.join(OUTPUT_DIR, `${templateId}-preview.png`));
    await capture(page, renderUrl, path.join(OUTPUT_DIR, `${templateId}-render.png`));
  }

  await browser.close();

  console.log(`Saved template QA screenshots to ${OUTPUT_DIR}`);
  console.log("Review preview vs render pairs for font fidelity, spacing, title fit, footer balance, and badge placement.");
}

async function capture(page, url, filePath) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: filePath, fullPage: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
