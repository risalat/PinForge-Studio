"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type ResponsiveCanvasPreviewProps = {
  canvasWidth: number;
  canvasHeight: number;
  children: ReactNode;
  className?: string;
  maxViewportHeightRatio?: number;
};

export function ResponsiveCanvasPreview({
  canvasWidth,
  canvasHeight,
  children,
  className,
  maxViewportHeightRatio = 1,
}: ResponsiveCanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    let observer: ResizeObserver | null = null;

    const updateScale = () => {
      const nextWidth = Math.max(1, element.clientWidth);
      const widthScale = nextWidth / canvasWidth;
      const viewportHeight =
        typeof window !== "undefined" ? Math.max(1, window.innerHeight) : canvasHeight;
      const heightScale = (viewportHeight * maxViewportHeightRatio) / canvasHeight;
      setScale(Math.min(widthScale, heightScale));
    };

    updateScale();

    if (typeof ResizeObserver === "undefined") {
    } else {
      observer = new ResizeObserver(() => {
        updateScale();
      });
      observer.observe(element);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateScale);
    }

    return () => {
      observer?.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", updateScale);
      }
    };
  }, [canvasHeight, canvasWidth, maxViewportHeightRatio]);

  return (
    <div ref={containerRef} className={className}>
      <div
        style={{
          height: canvasHeight * scale,
        }}
      >
        <div
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
