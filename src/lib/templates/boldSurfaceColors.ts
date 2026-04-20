import { getRuntimeContrastRatio } from "@/lib/runtime-templates/contrast";
import type { TemplateVisualPreset, TemplateVisualPresetCategoryId } from "@/lib/templates/types";

export type BoldSurfaceColorRoles = {
  canvasBackground: string;
  glowA: string;
  glowB: string;
  glowC: string;
  primarySurface: string;
  primarySurfaceText: string;
  primarySurfaceBorder: string;
  secondarySurface: string;
  secondarySurfaceBorder: string;
  frameSurface: string;
  frameSurfaceAlt: string;
  kickerSurface: string;
  kickerText: string;
  kickerBorder: string;
  badgeSurface: string;
  badgeText: string;
  badgeBorder: string;
  pillSurface: string;
  pillText: string;
  pillBorder: string;
  accentLine: string;
  accentLineSecondary: string;
  shadowBase: string;
};

export function resolveBoldSurfaceColorRoles(
  category: TemplateVisualPresetCategoryId,
  preset: TemplateVisualPreset,
): BoldSurfaceColorRoles {
  const { palette } = preset;
  const accentCandidates = uniqueHex([
    palette.footer,
    ...(preset.supportingColors ?? []),
    palette.divider,
  ]);
  const primaryAccent = pickPreferredSurfaceAccent(accentCandidates, {
    preferred: palette.footer,
    targetLightness: category === "dark-drama" ? 0.3 : 0.42,
  });
  const secondaryAccent = pickSecondaryAccent(accentCandidates, primaryAccent) ?? palette.divider;

  const canvasBackground =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.canvas, palette.footer, 0.54), 0.04)
      : tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.22), 0.04);

  const primarySurfaceBase =
    category === "dark-drama"
      ? deepenHex(mixHex(primaryAccent, palette.footer, 0.34), 0.14)
      : deepenHex(mixHex(primaryAccent, palette.footer, 0.16), 0.06);
  const primarySurface = enforceFillSeparation(primarySurfaceBase, canvasBackground, 1.65);
  const primarySurfaceText = pickReadableColor(primarySurface, [
    "#ffffff",
    "#fffaf2",
    "#1a120d",
  ]);

  const secondarySurfaceBase =
    category === "dark-drama"
      ? deepenHex(mixHex(secondaryAccent, palette.footer, 0.28), 0.04)
      : tintTowardsWhite(mixHex(secondaryAccent, palette.band, 0.14), 0.06);
  const secondarySurface = enforceFillSeparation(secondarySurfaceBase, canvasBackground, 1.24);

  const badgeSurfaceBase = ensureLightSurface([
    palette.band,
    palette.number,
    palette.domain,
    tintTowardsWhite(mixHex(primaryAccent, "#ffffff", 0.78), 0.12),
  ]);
  const badgeSurface = enforceFillSeparation(badgeSurfaceBase, primarySurface, 1.5);
  const badgeText = pickReadableColor(badgeSurface, [
    deepenHex(primaryAccent, 0.42),
    deepenHex(secondaryAccent, 0.44),
    "#1d140f",
  ]);

  const pillSurfaceBase =
    category === "dark-drama"
      ? deepenHex(mixHex(primaryAccent, secondaryAccent, 0.24), 0.12)
      : deepenHex(mixHex(primaryAccent, palette.footer, 0.1), 0.02);
  const pillSurface = enforceFillSeparation(pillSurfaceBase, canvasBackground, 1.9);
  const pillText = pickReadableColor(pillSurface, [
    "#ffffff",
    "#fffaf2",
    "#1a120d",
  ]);

  const kickerSurfaceBase = ensureLightSurface([
    tintTowardsWhite(mixHex(primaryAccent, palette.band, 0.72), 0.08),
    palette.band,
    palette.domain,
  ]);
  const kickerSurface = enforceFillSeparation(kickerSurfaceBase, primarySurface, 1.28);
  const kickerText = pickReadableColor(kickerSurface, [
    deepenHex(primaryAccent, 0.38),
    deepenHex(secondaryAccent, 0.42),
    "#1d140f",
  ]);

  return {
    canvasBackground,
    glowA: tintTowardsWhite(mixHex(primaryAccent, palette.canvas, 0.18), 0.14),
    glowB: tintTowardsWhite(mixHex(secondaryAccent, palette.band, 0.24), 0.18),
    glowC: tintTowardsWhite(mixHex(primaryAccent, secondaryAccent, 0.36), 0.16),
    primarySurface,
    primarySurfaceText,
    primarySurfaceBorder: withAlpha(tintTowardsWhite(primarySurface, 0.08), 0.92),
    secondarySurface,
    secondarySurfaceBorder: withAlpha(tintTowardsWhite(secondarySurface, 0.08), 0.86),
    frameSurface: tintTowardsWhite(mixHex(palette.band, primaryAccent, 0.12), 0.08),
    frameSurfaceAlt: tintTowardsWhite(mixHex(palette.band, secondaryAccent, 0.18), 0.08),
    kickerSurface,
    kickerText,
    kickerBorder: withAlpha(tintTowardsWhite(kickerSurface, 0.1), 0.78),
    badgeSurface,
    badgeText,
    badgeBorder: withAlpha(tintTowardsWhite(badgeSurface, 0.08), 0.9),
    pillSurface,
    pillText,
    pillBorder: withAlpha(tintTowardsWhite(pillSurface, 0.08), 0.92),
    accentLine: tintTowardsWhite(mixHex(primaryAccent, palette.band, 0.26), 0.1),
    accentLineSecondary: tintTowardsWhite(mixHex(secondaryAccent, palette.band, 0.24), 0.14),
    shadowBase:
      category === "dark-drama"
        ? "#120a07"
        : deepenHex(mixHex(primaryAccent, palette.footer, 0.54), 0.42),
  };
}

function uniqueHex(colors: string[]) {
  return Array.from(
    new Set(colors.filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))),
  );
}

function pickPreferredSurfaceAccent(
  colors: string[],
  options: {
    preferred: string;
    targetLightness: number;
  },
) {
  const valid = uniqueHex([options.preferred, ...colors]);
  return valid.reduce((best, current) => {
    const bestScore = scoreAccentForSurface(best, options);
    const currentScore = scoreAccentForSurface(current, options);
    return currentScore > bestScore ? current : best;
  }, valid[0] ?? options.preferred);
}

function scoreAccentForSurface(
  hex: string,
  options: {
    preferred: string;
    targetLightness: number;
  },
) {
  const hsl = hexToHsl(hex);
  const preferredBonus = hex === options.preferred ? 0.18 : 0;
  const lightnessPenalty = Math.abs(hsl.l - options.targetLightness);
  return hsl.s * 1.2 - lightnessPenalty * 0.8 + preferredBonus;
}

function pickSecondaryAccent(colors: string[], primary: string) {
  const primaryHue = hexToHsl(primary).h;
  const candidates = uniqueHex(colors.filter((color) => color !== primary));
  return candidates.reduce<string | null>((best, current) => {
    const currentHsl = hexToHsl(current);
    const currentDistance = hueDistance(currentHsl.h, primaryHue);
    if (!best) {
      return current;
    }

    const bestHsl = hexToHsl(best);
    const bestDistance = hueDistance(bestHsl.h, primaryHue);
    return currentDistance > bestDistance ? current : best;
  }, null);
}

function hueDistance(left: number, right: number) {
  const raw = Math.abs(left - right);
  return Math.min(raw, 360 - raw);
}

function ensureLightSurface(candidates: string[]) {
  const valid = uniqueHex(candidates);
  return valid.reduce((best, current) => {
    const bestLightness = hexToHsl(best).l;
    const currentLightness = hexToHsl(current).l;
    return currentLightness > bestLightness ? current : best;
  }, valid[0] ?? "#f7f1ea");
}

function pickReadableColor(backgroundHex: string, candidates: string[]) {
  const valid = uniqueHex(candidates);
  if (valid.length === 0) {
    return "#ffffff";
  }

  return valid.reduce((best, candidate) =>
    contrastRatio(backgroundHex, candidate) > contrastRatio(backgroundHex, best) ? candidate : best,
  );
}

function contrastRatio(backgroundHex: string, foregroundHex: string) {
  return getRuntimeContrastRatio(foregroundHex, backgroundHex);
}

function enforceFillSeparation(foregroundHex: string, backgroundHex: string, minimumContrast: number) {
  let candidate = foregroundHex;
  let guard = 0;

  while (contrastRatio(candidate, backgroundHex) < minimumContrast && guard < 8) {
    const foregroundLuminance = getRelativeLuminance(candidate);
    const backgroundLuminance = getRelativeLuminance(backgroundHex);

    candidate =
      foregroundLuminance >= backgroundLuminance
        ? tintTowardsWhite(candidate, 0.14)
        : deepenHex(candidate, 0.14);
    guard += 1;
  }

  return candidate;
}

function mixHex(fromHex: string, toHex: string, amount: number) {
  const from = parseHex(fromHex);
  const to = parseHex(toHex);
  if (!from || !to) {
    return fromHex;
  }

  const safeAmount = Math.max(0, Math.min(1, amount));
  const mix = (left: number, right: number) => Math.round(left + (right - left) * safeAmount);

  return `#${[mix(from[0], to[0]), mix(from[1], to[1]), mix(from[2], to[2])]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
}

function withAlpha(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${alpha}`;
}

function parseHex(value: string) {
  const normalized = value.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function getRelativeLuminance(hex: string) {
  const normalized = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((index) => normalized.slice(index, index + 2))
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToHsl(hex: string) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = 60 * (((g - b) / delta) % 6);
        break;
      case g:
        h = 60 * ((b - r) / delta + 2);
        break;
      default:
        h = 60 * ((r - g) / delta + 4);
        break;
    }
  }

  return {
    h: h < 0 ? h + 360 : h,
    s,
    l,
  };
}
