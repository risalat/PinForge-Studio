import type {
  RuntimeTemplateBorderToken,
  RuntimeTemplateFillToken,
  RuntimeTemplateFontToken,
  RuntimeTemplateShadowToken,
  RuntimeTemplateTextToken,
} from "@/lib/runtime-templates/types";
import {
  isSupportedRuntimeColor,
  normalizeRuntimeColorInput,
  runtimeColorToHex,
} from "@/lib/runtime-templates/colors";
import { getSplitVerticalVisualPreset, getTemplateVisualPresetCategory } from "@/lib/templates/visualPresets";
import type {
  TemplateRenderProps,
  TemplateTextRoleStyle,
  TemplateVisualPreset,
} from "@/lib/templates/types";

type RuntimeResolvedTokens = {
  preset: TemplateVisualPreset;
  fills: Record<RuntimeTemplateFillToken, string>;
  text: Record<RuntimeTemplateTextToken, string>;
  borders: Record<RuntimeTemplateBorderToken, string>;
  shadows: Record<RuntimeTemplateShadowToken, string>;
  fonts: Record<RuntimeTemplateFontToken, TemplateTextRoleStyle>;
};

export { stripAlpha };

export function resolveRuntimeTemplateTokens(
  presetId?: TemplateRenderProps["visualPreset"] | TemplateRenderProps["colorPreset"],
): RuntimeResolvedTokens {
  const preset = getSplitVerticalVisualPreset(presetId);
  const category = presetId ? getTemplateVisualPresetCategory(presetId) : "editorial-soft";
  const inverseSurface = ensureContrastColor(
    preset.palette.canvas,
    deepenHex(mixHex(preset.palette.footer, preset.palette.title, 0.34), 0.18),
    ["#111111", deepenHex(preset.palette.title, 0.45)],
    7,
  );
  const primarySurface = tintTowardsWhite(
    mixHex(preset.palette.band, preset.palette.canvas, 0.28),
    category === "dark-drama" ? 0.1 : 0.18,
  );
  const secondarySurface = tintTowardsWhite(
    mixHex(preset.palette.footer, preset.palette.canvas, 0.52),
    category === "graphic-pop" || category === "fresh-vivid" ? 0.08 : 0.18,
  );
  const accentSurface = ensureContrastColor(
    primarySurface,
    mixHex(preset.palette.number, preset.palette.divider, 0.42),
    [preset.palette.number, preset.palette.divider, deepenHex(preset.palette.title, 0.14)],
    3.2,
  );
  const overlaySurface = withAlpha(
    ensureContrastColor(
      primarySurface,
      mixHex(preset.palette.footer, preset.palette.title, 0.4),
      [preset.palette.footer, preset.palette.title],
      1.2,
    ),
    0.72,
  );
  const badgeSurface = ensureContrastColor(
    primarySurface,
    tintTowardsWhite(mixHex(preset.palette.number, preset.palette.band, 0.32), 0.12),
    [preset.palette.number, preset.palette.band, preset.palette.divider],
    2.2,
  );
  const footerSurface = ensureContrastColor(
    preset.palette.canvas,
    deepenHex(mixHex(preset.palette.footer, preset.palette.domain, 0.38), 0.18),
    [preset.palette.footer, deepenHex(preset.palette.title, 0.22), "#151515"],
    5.5,
  );
  const inverseText = ensureContrastColor(
    inverseSurface,
    tintTowardsWhite(preset.palette.domain, 0.88),
    ["#ffffff", "#fff7ef", tintTowardsWhite(preset.palette.title, 0.8)],
    8,
  );

  return {
    preset,
    fills: {
      "surface.canvas": tintTowardsWhite(preset.palette.canvas, 0.04),
      "surface.primary": primarySurface,
      "surface.secondary": secondarySurface,
      "surface.accent": accentSurface,
      "surface.overlay": overlaySurface,
      "surface.badge": badgeSurface,
      "surface.footer": footerSurface,
      "surface.inverse": inverseSurface,
    },
    text: {
      "text.title": ensureContrastColor(
        primarySurface,
        preset.palette.title,
        [deepenHex(preset.palette.title, 0.16), deepenHex(preset.palette.footer, 0.22), "#1d1d1d"],
        5.6,
      ),
      "text.subtitle": ensureContrastColor(
        primarySurface,
        preset.palette.subtitle,
        [deepenHex(preset.palette.subtitle, 0.18), deepenHex(preset.palette.title, 0.12)],
        4.8,
      ),
      "text.meta": ensureContrastColor(
        primarySurface,
        preset.palette.domain,
        [deepenHex(preset.palette.domain, 0.12), deepenHex(preset.palette.title, 0.14)],
        4.8,
      ),
      "text.inverse": inverseText,
      "text.number": ensureContrastColor(
        primarySurface,
        preset.palette.number,
        [deepenHex(preset.palette.number, 0.16), deepenHex(preset.palette.title, 0.14)],
        5,
      ),
      "text.cta": ensureContrastColor(
        primarySurface,
        mixHex(preset.palette.domain, preset.palette.divider, 0.42),
        [preset.palette.domain, deepenHex(preset.palette.title, 0.18)],
        4.8,
      ),
    },
    borders: {
      "border.primary": withAlpha(
        ensureContrastColor(primarySurface, mixHex(preset.palette.divider, preset.palette.domain, 0.35), [
          preset.palette.divider,
          preset.palette.domain,
          deepenHex(preset.palette.title, 0.16),
        ], 1.6),
        0.34,
      ),
      "border.accent": ensureContrastColor(
        primarySurface,
        preset.palette.divider,
        [preset.palette.number, preset.palette.domain, deepenHex(preset.palette.title, 0.16)],
        2.4,
      ),
      "stroke.default": withAlpha(
        ensureContrastColor(primarySurface, mixHex(preset.palette.divider, preset.palette.domain, 0.35), [
          preset.palette.divider,
          preset.palette.domain,
          deepenHex(preset.palette.title, 0.16),
        ], 1.6),
        0.34,
      ),
      "stroke.accent": ensureContrastColor(
        primarySurface,
        preset.palette.divider,
        [preset.palette.number, preset.palette.domain, deepenHex(preset.palette.title, 0.16)],
        2.4,
      ),
    },
    shadows: {
      "shadow.none": "none",
      "shadow.soft": `0 16px 44px ${withAlpha(deepenHex(mixHex(preset.palette.footer, preset.palette.title, 0.42), 0.48), 0.16)}`,
      "shadow.strong": `0 26px 68px ${withAlpha(deepenHex(mixHex(preset.palette.footer, preset.palette.title, 0.5), 0.58), 0.24)}`,
    },
    fonts: {
      "font.title": preset.typography.title,
      "font.subtitle": preset.typography.subtitle,
      "font.meta": preset.typography.domain,
      "font.number": preset.typography.number,
      "font.cta": {
        ...preset.typography.domain,
        fontFamily: "var(--font-space-grotesk), var(--font-manrope), sans-serif",
        fontWeight: 600,
        letterSpacing: "0.04em",
        lineHeight: 1.04,
      },
    },
  };
}

export function resolveRuntimeFillColor(
  tokens: RuntimeResolvedTokens,
  token: RuntimeTemplateFillToken | undefined,
  customColor?: string,
) {
  return resolveCustomRuntimeColor(customColor) ?? (token ? tokens.fills[token] : undefined);
}

export function resolveRuntimeTextColor(
  tokens: RuntimeResolvedTokens,
  token: RuntimeTemplateTextToken,
  customColor?: string,
) {
  return resolveCustomRuntimeColor(customColor) ?? tokens.text[token];
}

export function resolveRuntimeBorderColor(
  tokens: RuntimeResolvedTokens,
  token: RuntimeTemplateBorderToken | undefined,
  customColor?: string,
) {
  return resolveCustomRuntimeColor(customColor) ?? (token ? tokens.borders[token] : undefined);
}

function resolveCustomRuntimeColor(customColor?: string) {
  if (!customColor || !isSupportedRuntimeColor(customColor)) {
    return undefined;
  }

  return normalizeRuntimeColorInput(customColor) ?? customColor;
}

function mixHex(fromHex: string, toHex: string, amount: number) {
  const from = parseHex(stripAlpha(fromHex));
  const to = parseHex(stripAlpha(toHex));
  if (!from || !to) {
    return stripAlpha(fromHex);
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
  const normalized = stripAlpha(hex).replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex;
  }

  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${normalized}${alpha}`;
}

function ensureContrastColor(
  backgroundHex: string,
  preferredHex: string,
  fallbacks: string[],
  minimumRatio: number,
) {
  const candidates = [preferredHex, ...fallbacks].filter(isHexColor);
  if (!isHexColor(stripAlpha(backgroundHex)) || candidates.length === 0) {
    return stripAlpha(preferredHex);
  }

  const preferredRatio = getContrastRatio(stripAlpha(preferredHex), stripAlpha(backgroundHex));
  if (preferredRatio >= minimumRatio) {
    return stripAlpha(preferredHex);
  }

  return candidates.reduce((best, candidate) =>
    getContrastRatio(stripAlpha(candidate), stripAlpha(backgroundHex)) >
    getContrastRatio(stripAlpha(best), stripAlpha(backgroundHex))
      ? stripAlpha(candidate)
      : stripAlpha(best),
  );
}

function getContrastRatio(foregroundHex: string, backgroundHex: string) {
  const foreground = getRelativeLuminance(foregroundHex);
  const background = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex: string) {
  const normalized = stripAlpha(hex).replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((index) => normalized.slice(index, index + 2))
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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

function stripAlpha(hex: string) {
  const normalized = runtimeColorToHex(hex);
  if (normalized) {
    return normalized;
  }

  return /^#[0-9a-fA-F]{8}$/.test(hex) ? `#${hex.slice(1, 7)}` : hex;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(stripAlpha(value));
}
