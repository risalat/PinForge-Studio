import { AutoFitText } from "@/components/AutoFitText";
import type { CSSProperties } from "react";

type AutoFitTitleProps = {
  text: string;
  className?: string;
  minFontSize: number;
  maxFontSize: number;
  lineHeight: number;
  maxLines: number;
  textColor?: string;
  fontFamily?: string;
  fontWeight?: CSSProperties["fontWeight"];
  letterSpacing?: string;
  textAlign?: CSSProperties["textAlign"];
  textTransform?: CSSProperties["textTransform"];
  fontStyle?: CSSProperties["fontStyle"];
};

export function AutoFitTitle({
  text,
  className,
  minFontSize,
  maxFontSize,
  lineHeight,
  maxLines,
  textColor,
  fontFamily,
  fontWeight,
  letterSpacing,
  textAlign,
  textTransform,
  fontStyle,
}: AutoFitTitleProps) {
  return (
    <AutoFitText
      as="h1"
      text={text}
      className={className}
      minFontSize={minFontSize}
      maxFontSize={maxFontSize}
      lineHeight={lineHeight}
      maxLines={maxLines}
      textColor={textColor}
      fontFamily={fontFamily}
      fontWeight={fontWeight}
      letterSpacing={letterSpacing}
      textAlign={textAlign}
      textTransform={textTransform}
      fontStyle={fontStyle}
    />
  );
}
