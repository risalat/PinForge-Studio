import { resolveRuntimeTemplateTokens } from "@/lib/runtime-templates/tokens";
import { getRuntimeContrastRatio } from "@/lib/runtime-templates/contrast";
import { templateVisualPresets, type TemplateVisualPresetId } from "@/lib/templates/types";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";

type AuditCheck = {
  label: string;
  foreground: string;
  background: string;
  minimum: number;
};

type AuditResult = AuditCheck & {
  ratio: number;
  passed: boolean;
};

function main() {
  const presetIds = [...templateVisualPresets] satisfies TemplateVisualPresetId[];
  const paletteFailures: Array<{ presetId: TemplateVisualPresetId; result: AuditResult }> = [];
  const runtimeFailures: Array<{ presetId: TemplateVisualPresetId; result: AuditResult }> = [];

  console.log("Preset contrast audit");
  console.log("=====================\n");

  for (const presetId of presetIds) {
    const preset = getSplitVerticalVisualPreset(presetId);
    const runtimeTokens = resolveRuntimeTemplateTokens(presetId);

    const paletteChecks = evaluateChecks([
      {
        label: "palette.title on palette.band",
        foreground: preset.palette.title,
        background: preset.palette.band,
        minimum: 4.5,
      },
      {
        label: "palette.subtitle on palette.band",
        foreground: preset.palette.subtitle,
        background: preset.palette.band,
        minimum: 4.3,
      },
      {
        label: "palette.domain on palette.footer",
        foreground: preset.palette.domain,
        background: preset.palette.footer,
        minimum: 4.3,
      },
      {
        label: "palette.number on palette.band",
        foreground: preset.palette.number,
        background: preset.palette.band,
        minimum: 4.0,
      },
    ]);

    const runtimeChecks = evaluateChecks([
      {
        label: "text.title on surface.primary",
        foreground: runtimeTokens.text["text.title"],
        background: runtimeTokens.fills["surface.primary"],
        minimum: 4.5,
      },
      {
        label: "text.subtitle on surface.primary",
        foreground: runtimeTokens.text["text.subtitle"],
        background: runtimeTokens.fills["surface.primary"],
        minimum: 4.3,
      },
      {
        label: "text.meta on surface.primary",
        foreground: runtimeTokens.text["text.meta"],
        background: runtimeTokens.fills["surface.primary"],
        minimum: 4.3,
      },
      {
        label: "text.number on surface.primary",
        foreground: runtimeTokens.text["text.number"],
        background: runtimeTokens.fills["surface.primary"],
        minimum: 4.0,
      },
      {
        label: "text.cta on surface.primary",
        foreground: runtimeTokens.text["text.cta"],
        background: runtimeTokens.fills["surface.primary"],
        minimum: 4.3,
      },
      {
        label: "text.inverse on surface.inverse",
        foreground: runtimeTokens.text["text.inverse"],
        background: runtimeTokens.fills["surface.inverse"],
        minimum: 4.5,
      },
    ]);

    for (const result of paletteChecks.filter((entry) => !entry.passed)) {
      paletteFailures.push({ presetId, result });
    }

    for (const result of runtimeChecks.filter((entry) => !entry.passed)) {
      runtimeFailures.push({ presetId, result });
    }

    const runtimeSummary = runtimeChecks.every((entry) => entry.passed) ? "PASS" : "FAIL";
    const paletteSummary = paletteChecks.every((entry) => entry.passed) ? "PASS" : "WARN";
    console.log(`${presetId.padEnd(20)} runtime=${runtimeSummary} palette=${paletteSummary}`);
  }

  console.log("\nRuntime token failures");
  console.log("----------------------");
  if (runtimeFailures.length === 0) {
    console.log("None");
  } else {
    for (const failure of runtimeFailures) {
      printFailure(failure.presetId, failure.result);
    }
  }

  console.log("\nRaw palette role warnings");
  console.log("-------------------------");
  if (paletteFailures.length === 0) {
    console.log("None");
  } else {
    for (const failure of paletteFailures) {
      printFailure(failure.presetId, failure.result);
    }
  }

  if (runtimeFailures.length > 0) {
    process.exitCode = 1;
  }
}

function evaluateChecks(checks: AuditCheck[]): AuditResult[] {
  return checks.map((check) => {
    const ratio = getRuntimeContrastRatio(check.foreground, check.background);
    return {
      ...check,
      ratio,
      passed: ratio >= check.minimum,
    };
  });
}

function printFailure(presetId: string, result: AuditResult) {
  console.log(
    `${presetId} :: ${result.label} :: ${result.ratio.toFixed(2)} < ${result.minimum.toFixed(1)} (${result.foreground} on ${result.background})`,
  );
}

main();
