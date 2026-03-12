import { Jimp } from "jimp";

export type ImageToneSignals = {
  brightness: number;
  contrast: number;
  warmth: number;
  saturation: number;
};

export async function analyzeImageToneSignals(imageUrls: string[]) {
  const analyses = (
    await Promise.all(imageUrls.slice(0, 2).map((url) => analyzeSingleImage(url).catch(() => null)))
  ).filter((value): value is ImageToneSignals => Boolean(value));

  if (analyses.length === 0) {
    return null;
  }

  return {
    brightness: average(analyses.map((entry) => entry.brightness)),
    contrast: average(analyses.map((entry) => entry.contrast)),
    warmth: average(analyses.map((entry) => entry.warmth)),
    saturation: average(analyses.map((entry) => entry.saturation)),
  };
}

async function analyzeSingleImage(imageUrl: string): Promise<ImageToneSignals> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PinForge-Studio/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Image fetch failed (${response.status})`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const image = await Jimp.read(buffer);
    image.resize({ w: 32, h: 32 });

    let brightnessSum = 0;
    let saturationSum = 0;
    let warmthSum = 0;
    const luminances: number[] = [];
    const totalPixels = image.bitmap.width * image.bitmap.height;

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (_, __, idx) => {
      const red = image.bitmap.data[idx] / 255;
      const green = image.bitmap.data[idx + 1] / 255;
      const blue = image.bitmap.data[idx + 2] / 255;

      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const saturation = max === 0 ? 0 : (max - min) / max;
      const warmth = red - blue;

      luminances.push(luminance);
      brightnessSum += luminance;
      saturationSum += saturation;
      warmthSum += warmth;
    });

    const brightness = brightnessSum / totalPixels;
    const saturation = saturationSum / totalPixels;
    const warmth = warmthSum / totalPixels;
    const contrast = standardDeviation(luminances);

    return { brightness, contrast, warmth, saturation };
  } finally {
    clearTimeout(timeout);
  }
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function standardDeviation(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}
