/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { AutoFitTitle } from "@/components/AutoFitTitle";
import { toTransparentRuntimeColor } from "@/lib/runtime-templates/colors";
import {
  resolveRuntimeImage,
  resolveRuntimeImageGrid,
  resolveRuntimeTextBinding,
} from "@/lib/runtime-templates/bindings";
import { getRuntimeTemplateGridLayoutRects } from "@/lib/runtime-templates/imageGridPresets";
import { getRuntimeTemplateEffectiveDocument } from "@/lib/runtime-templates/presetOverrides";
import type { RuntimeTemplateDocument, RuntimeTemplateElement } from "@/lib/runtime-templates/schema";
import {
  resolveRuntimeBorderColor,
  resolveRuntimeFillColor,
  resolveRuntimeTemplateTokens,
  resolveRuntimeTextColor,
} from "@/lib/runtime-templates/tokens";
import type { RuntimeTemplateOverlayGradient } from "@/lib/runtime-templates/types";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

type RuntimeTemplateCanvasProps = {
  document: RuntimeTemplateDocument;
  payload: TemplateRenderProps;
};

type TextElement = Extract<
  RuntimeTemplateElement,
  {
    type:
      | "titleText"
      | "subtitleText"
      | "domainText"
      | "numberText"
      | "ctaText"
      | "labelText";
  }
>;

export function RuntimeTemplateCanvas({
  document,
  payload,
}: RuntimeTemplateCanvasProps) {
  const effectiveDocument = getRuntimeTemplateEffectiveDocument(
    document,
    payload.visualPreset ?? payload.colorPreset ?? null,
  );
  const tokens = resolveRuntimeTemplateTokens(payload.visualPreset ?? payload.colorPreset);
  const elements = [...effectiveDocument.elements].sort((left, right) => left.zIndex - right.zIndex);

  return (
    <div
      data-pin-canvas="true"
      className="relative overflow-hidden rounded-[24px]"
      style={{
        width: effectiveDocument.canvas.width,
        height: effectiveDocument.canvas.height,
        backgroundColor:
          resolveRuntimeFillColor(
            tokens,
            effectiveDocument.background.fillToken,
            effectiveDocument.background.customFill,
          ) ?? tokens.fills[effectiveDocument.background.fillToken],
      }}
    >
      {elements.map((element) => {
        if (!element.visible) {
          return null;
        }

        const baseStyle = {
          position: "absolute",
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          opacity: element.opacity,
          transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
          transformOrigin: "center center",
          zIndex: element.zIndex,
        } satisfies CSSProperties;

        switch (element.type) {
          case "imageFrame": {
            const src = resolveRuntimeImage({
              document,
              payload,
              slotIndex: element.slotIndex,
            });

            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  ...shapeClipStyle(element.shapeKind),
                  overflow: "hidden",
                  backgroundColor: resolveRuntimeFillColor(
                    tokens,
                    element.styleTokens.fillToken,
                    element.styleTokens.customFill,
                  ),
                  border: resolveRuntimeBorderColor(
                    tokens,
                    element.styleTokens.borderToken,
                    element.styleTokens.customBorderColor,
                  )
                    ? `1px solid ${resolveRuntimeBorderColor(
                        tokens,
                        element.styleTokens.borderToken,
                        element.styleTokens.customBorderColor,
                      )}`
                    : undefined,
                  borderRadius: shapeBorderRadius(
                    element.shapeKind,
                    element.styleTokens.borderRadius,
                  ),
                  boxShadow: tokens.shadows[element.styleTokens.shadowToken],
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt={payload.title}
                    className="h-full w-full"
                    style={{
                      objectFit: element.fitMode,
                      objectPosition: `${Math.round(element.focalPoint.x * 100)}% ${Math.round(
                        element.focalPoint.y * 100,
                      )}%`,
                    }}
                  />
                ) : null}
                {renderOverlayFill({
                  fill: element.styleTokens.overlayFillToken
                    ? resolveRuntimeFillColor(
                        tokens,
                        element.styleTokens.overlayFillToken,
                        element.styleTokens.overlayCustomFill,
                      )
                    : element.styleTokens.overlayCustomFill,
                  gradient: element.styleTokens.overlayGradient,
                  opacity: element.styleTokens.overlayOpacity,
                })}
              </div>
            );
                  }
          case "imageGrid": {
            const images = resolveRuntimeImageGrid({
              document,
              payload,
              element,
            });
            const cells = getRuntimeTemplateGridLayoutRects({
              layout: element.layoutPreset,
              width: element.width,
              height: element.height,
              gap: element.gap,
            });

            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  overflow: "hidden",
                  borderRadius: shapeBorderRadius("roundedRect", element.styleTokens.borderRadius),
                  backgroundColor: resolveRuntimeFillColor(
                    tokens,
                    element.styleTokens.fillToken,
                    element.styleTokens.customFill,
                  ),
                  boxShadow: tokens.shadows[element.styleTokens.shadowToken],
                }}
              >
                {cells.map((cell, index) => {
                  const src = images[index];
                  return (
                    <div
                      key={`${element.id}-cell-${index}`}
                      className="absolute overflow-hidden"
                      style={{
                        left: cell.x,
                        top: cell.y,
                        width: cell.width,
                        height: cell.height,
                        borderRadius: Math.min(
                          element.styleTokens.borderRadius,
                          Math.round(Math.min(cell.width, cell.height) / 2),
                        ),
                        border: element.styleTokens.borderToken
                          ? `1px solid ${
                              resolveRuntimeBorderColor(
                                tokens,
                                element.styleTokens.borderToken,
                                element.styleTokens.customBorderColor,
                              ) ?? tokens.borders[element.styleTokens.borderToken]
                            }`
                          : undefined,
                        backgroundColor: resolveRuntimeFillColor(
                          tokens,
                          element.styleTokens.fillToken,
                          element.styleTokens.customFill,
                        ),
                      }}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={`${payload.title} ${index + 1}`}
                          className="h-full w-full"
                          style={{ objectFit: element.fitMode }}
                        />
                      ) : null}
                      {renderOverlayFill({
                        fill: element.styleTokens.overlayFillToken
                          ? resolveRuntimeFillColor(
                              tokens,
                              element.styleTokens.overlayFillToken,
                              element.styleTokens.overlayCustomFill,
                            )
                          : element.styleTokens.overlayCustomFill,
                        gradient: element.styleTokens.overlayGradient,
                        opacity: element.styleTokens.overlayOpacity,
                      })}
                    </div>
                  );
                })}
              </div>
            );
          }
          case "shapeBlock":
            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  ...shapeClipStyle(element.shapeKind),
                  backgroundColor:
                    resolveRuntimeFillColor(
                      tokens,
                      element.styleTokens.fillToken,
                      element.styleTokens.customFill,
                    ) ?? tokens.fills[element.styleTokens.fillToken],
                  border: resolveRuntimeBorderColor(
                    tokens,
                    element.styleTokens.borderToken,
                    element.styleTokens.customBorderColor,
                  )
                    ? `1px solid ${
                        resolveRuntimeBorderColor(
                          tokens,
                          element.styleTokens.borderToken,
                          element.styleTokens.customBorderColor,
                        ) as string
                      }`
                    : undefined,
                  borderRadius: shapeBorderRadius(
                    element.shapeKind,
                    element.styleTokens.borderRadius,
                  ),
                  boxShadow: tokens.shadows[element.styleTokens.shadowToken],
                }}
              />
            );
          case "overlay":
            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  ...resolveOverlayStyle({
                    fill:
                      resolveRuntimeFillColor(
                        tokens,
                        element.styleTokens.fillToken,
                        element.styleTokens.customFill,
                      ) ?? tokens.fills["surface.overlay"],
                    gradient: element.styleTokens.gradient,
                    opacity: element.styleTokens.opacity,
                  }),
                }}
              />
            );
          case "divider":
            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  width: element.width,
                  height: element.strokeWidth,
                  top: element.y + element.height / 2 - element.strokeWidth / 2,
                  backgroundColor:
                    resolveRuntimeBorderColor(
                      tokens,
                      element.styleTokens.borderToken,
                      element.styleTokens.customBorderColor,
                    ) ?? tokens.borders[element.styleTokens.borderToken],
                  borderRadius: 999,
                }}
              />
            );
          case "titleText":
          case "subtitleText":
          case "domainText":
          case "numberText":
          case "ctaText":
          case "labelText":
            return renderTextElement({
              key: element.id,
              element,
              text: resolveRuntimeTextBinding({ payload, element }),
              baseStyle,
              tokens,
            });
          default:
            return null;
        }
      })}
    </div>
  );
}

function renderTextElement(input: {
  key: string;
  element: TextElement;
  text: string;
  baseStyle: CSSProperties;
  tokens: ReturnType<typeof resolveRuntimeTemplateTokens>;
}) {
  const { key, element, text, baseStyle, tokens } = input;
  const trimmed = text.trim();
  const shouldHide = trimmed === "" && element.hideWhenEmpty;

  if (shouldHide || trimmed === "") {
    return null;
  }

  const font = tokens.fonts[element.styleTokens.fontToken];
  const commonProps = {
    text: trimmed,
    minFontSize: element.styleTokens.minFontSize,
    maxFontSize: element.styleTokens.maxFontSize,
    maxLines: element.styleTokens.maxLines,
    lineHeight: element.styleTokens.lineHeight,
    className: "h-full w-full",
    textColor: resolveRuntimeTextColor(
      tokens,
      element.styleTokens.textToken,
      element.styleTokens.customTextColor,
    ),
    fontFamily: font.fontFamily,
    fontWeight: font.fontWeight,
    letterSpacing: normalizeLetterSpacing(
      element.styleTokens.letterSpacing,
      font.letterSpacing,
    ),
    textAlign: element.styleTokens.textAlign,
    textTransform: element.styleTokens.textTransform,
    fontStyle: font.fontStyle,
  } as const;

  return (
    <div
      key={key}
      style={baseStyle}
      className="flex items-center justify-center overflow-hidden"
    >
      {!element.styleTokens.autoFit ? (
        <div
          className="h-full w-full"
          style={{
            color: resolveRuntimeTextColor(
              tokens,
              element.styleTokens.textToken,
              element.styleTokens.customTextColor,
            ),
            fontFamily: font.fontFamily,
            fontSize: element.styleTokens.maxFontSize,
            fontStyle: font.fontStyle,
            fontWeight: font.fontWeight,
            letterSpacing: normalizeLetterSpacing(
              element.styleTokens.letterSpacing,
              font.letterSpacing,
            ),
            lineHeight: element.styleTokens.lineHeight,
            textAlign: element.styleTokens.textAlign,
            textTransform: element.styleTokens.textTransform,
            overflow: "hidden",
          }}
        >
          {trimmed}
        </div>
      ) : element.type === "titleText" ? (
        <AutoFitTitle {...commonProps} />
      ) : (
        <AutoFitText
          as={element.type === "numberText" ? "p" : "span"}
          {...commonProps}
        />
      )}
    </div>
  );
}

function renderOverlayFill(input: {
  fill?: string;
  gradient: RuntimeTemplateOverlayGradient;
  opacity: number;
}) {
  if (!input.fill || input.gradient === "none" || input.opacity <= 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0"
      style={resolveOverlayStyle({
        fill: input.fill,
        gradient: input.gradient,
        opacity: input.opacity,
      })}
    />
  );
}

function resolveOverlayStyle(input: {
  fill: string;
  gradient: RuntimeTemplateOverlayGradient;
  opacity: number;
}) {
  const { fill, gradient, opacity } = input;
  const transparent = toTransparent(fill);

  const background =
    gradient === "none" || gradient === "solid"
      ? fill
      : gradient === "topFade"
        ? `linear-gradient(180deg, ${fill} 0%, ${transparent} 100%)`
        : gradient === "bottomFade"
          ? `linear-gradient(0deg, ${fill} 0%, ${transparent} 100%)`
          : gradient === "leftFade"
            ? `linear-gradient(90deg, ${fill} 0%, ${transparent} 100%)`
            : gradient === "rightFade"
              ? `linear-gradient(270deg, ${fill} 0%, ${transparent} 100%)`
              : `radial-gradient(circle at center, ${fill} 0%, ${transparent} 72%)`;

  return {
    background,
    opacity,
    pointerEvents: "none",
  } satisfies CSSProperties;
}

function normalizeLetterSpacing(overrideValue: number, fallbackValue: string) {
  return overrideValue === 0 ? fallbackValue : `${overrideValue}em`;
}

function shapeBorderRadius(
  shapeKind: Extract<RuntimeTemplateElement, { type: "imageFrame" | "shapeBlock" }>["shapeKind"] | "roundedRect",
  borderRadius: number,
) {
  if (shapeKind === "circle" || shapeKind === "pill") {
    return 999;
  }

  if (shapeKind === "arch") {
    return 0;
  }

  return borderRadius;
}

function shapeClipStyle(
  shapeKind: Extract<RuntimeTemplateElement, { type: "imageFrame" | "shapeBlock" }>["shapeKind"],
) {
  switch (shapeKind) {
    case "circle":
      return {
        borderRadius: "999px",
      } satisfies CSSProperties;
    case "pill":
      return {
        borderRadius: "999px",
      } satisfies CSSProperties;
    case "arch":
      return {
        borderTopLeftRadius: "999px",
        borderTopRightRadius: "999px",
      } satisfies CSSProperties;
    case "slantedCard":
      return {
        clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)",
      } satisfies CSSProperties;
    default:
      return {};
  }
}

function toTransparent(value: string) {
  return toTransparentRuntimeColor(value);
}
