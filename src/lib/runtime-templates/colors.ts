type RuntimeColor = {
  r: number;
  g: number;
  b: number;
};

type RuntimeHslColor = {
  h: number;
  s: number;
  l: number;
};

export function isSupportedRuntimeColor(value: string) {
  return parseRuntimeColor(value) !== null;
}

export function normalizeRuntimeColorInput(value: string) {
  const parsed = parseRuntimeColor(value);
  if (!parsed) {
    return null;
  }

  return rgbToHex(parsed);
}

export function runtimeColorToHex(value: string) {
  const parsed = parseRuntimeColor(value);
  return parsed ? rgbToHex(parsed) : null;
}

export function runtimeColorToRgb(value: string) {
  return parseRuntimeColor(value);
}

export function runtimeColorToHsl(value: string) {
  const rgb = parseRuntimeColor(value);
  return rgb ? rgbToHsl(rgb) : null;
}

export function rgbFieldsToHex(input: {
  r: number;
  g: number;
  b: number;
}) {
  return rgbToHex({
    r: clampChannel(input.r),
    g: clampChannel(input.g),
    b: clampChannel(input.b),
  });
}

export function hslFieldsToHex(input: {
  h: number;
  s: number;
  l: number;
}) {
  return rgbToHex(
    hslToRgb({
      h: clampHue(input.h),
      s: clampPercent(input.s),
      l: clampPercent(input.l),
    }),
  );
}

export function toTransparentRuntimeColor(value: string) {
  const parsed = parseRuntimeColor(value);
  if (!parsed) {
    return value;
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, 0)`;
}

function parseRuntimeColor(value: string): RuntimeColor | null {
  const input = value.trim();
  if (!input) {
    return null;
  }

  const hexMatch = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const normalized =
      hexMatch[1].length === 3
        ? hexMatch[1]
            .split("")
            .map((channel) => channel + channel)
            .join("")
        : hexMatch[1];

    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  const rgbMatch = input.match(
    /^rgb\(\s*([+-]?\d{1,3})\s*,\s*([+-]?\d{1,3})\s*,\s*([+-]?\d{1,3})\s*\)$/i,
  );
  if (rgbMatch) {
    return {
      r: clampChannel(Number(rgbMatch[1])),
      g: clampChannel(Number(rgbMatch[2])),
      b: clampChannel(Number(rgbMatch[3])),
    };
  }

  const hslMatch = input.match(
    /^hsl\(\s*([+-]?\d{1,3}(?:\.\d+)?)\s*,\s*([+-]?\d{1,3}(?:\.\d+)?)%\s*,\s*([+-]?\d{1,3}(?:\.\d+)?)%\s*\)$/i,
  );
  if (hslMatch) {
    return hslToRgb({
      h: clampHue(Number(hslMatch[1])),
      s: clampPercent(Number(hslMatch[2])),
      l: clampPercent(Number(hslMatch[3])),
    });
  }

  return null;
}

function rgbToHex(color: RuntimeColor) {
  return `#${[color.r, color.g, color.b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl(color: RuntimeColor): RuntimeHslColor {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;

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

  return {
    h: clampHue(Math.round(h)),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(color: RuntimeHslColor): RuntimeColor {
  const h = clampHue(color.h);
  const s = clampPercent(color.s) / 100;
  const l = clampPercent(color.l) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h < 60) {
    rPrime = chroma;
    gPrime = x;
  } else if (h < 120) {
    rPrime = x;
    gPrime = chroma;
  } else if (h < 180) {
    gPrime = chroma;
    bPrime = x;
  } else if (h < 240) {
    gPrime = x;
    bPrime = chroma;
  } else if (h < 300) {
    rPrime = x;
    bPrime = chroma;
  } else {
    rPrime = chroma;
    bPrime = x;
  }

  return {
    r: clampChannel(Math.round((rPrime + m) * 255)),
    g: clampChannel(Math.round((gPrime + m) * 255)),
    b: clampChannel(Math.round((bPrime + m) * 255)),
  };
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function clampHue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}
