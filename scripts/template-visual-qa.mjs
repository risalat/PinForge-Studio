import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.PINFORGE_BASE_URL || "http://127.0.0.1:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts", "template-qa");
const TEMPLATE_IDS = [
  "split-vertical-title",
  "split-vertical-title-no-subtitle",
  "single-image-header-title-domain-cta",
  "single-image-title-footer",
  "four-image-grid-title-footer",
  "hero-text-triple-split-footer",
];
const RUNTIME_TEMPLATE_ENTRIES = parseRuntimeTemplateEntries(
  process.env.RUNTIME_TEMPLATE_IDS || "",
);

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

  for (const entry of RUNTIME_TEMPLATE_ENTRIES) {
    const search = entry.versionId ? `?versionId=${entry.versionId}` : "";
    const previewUrl = `${BASE_URL}/preview/runtime/${entry.templateId}${search}`;
    const renderUrl = `${BASE_URL}/render/${entry.templateId}${search}`;
    const fileStem = entry.versionId
      ? `runtime-${entry.templateId}-${entry.versionId}`
      : `runtime-${entry.templateId}`;

    await capture(page, previewUrl, path.join(OUTPUT_DIR, `${fileStem}-preview.png`));
    await capture(page, renderUrl, path.join(OUTPUT_DIR, `${fileStem}-render.png`));
  }

  await browser.close();

  console.log(`Saved template QA screenshots to ${OUTPUT_DIR}`);
  console.log("Review preview vs render pairs for font fidelity, spacing, title fit, footer balance, and badge placement.");
}

async function capture(page, url, filePath) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: filePath, fullPage: true });
}

function parseRuntimeTemplateEntries(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [templateId, versionId] = entry.split("@").map((part) => part.trim());
      return {
        templateId,
        versionId: versionId || null,
      };
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
