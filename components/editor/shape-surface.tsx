"use client";

import type { ReactNode } from "react";

import {
  CSS_SHAPE_RADIUS,
  SHAPE_RENDER_KIND,
  SHAPE_STROKE_WIDTH,
  SVG_LABEL_INSET,
  getCylinderCapHeight,
  getSvgShapeGeometry,
} from "@/components/editor/shape-geometry";
import type { CanvasNodeShape } from "@/types/canvas";

/** Border alpha at rest. Kept low so the canvas reads calm at a glance. */
const RESTING_BORDER_ALPHA = 0.55;

interface ShapeSurfaceProps {
  shape: CanvasNodeShape;
  /** Current node width in canvas units — SVG geometry scales off this. */
  width: number;
  height: number;
  /** Opaque node fill, a literal hex from `CanvasNodeData.color`. */
  color: string;
  /**
   * The fill's paired text colour, from `CanvasNodeData.textColor`. It draws
   * the outline as well as the label: the palette fills are all near-black, so
   * an outline in the fill colour would vanish against the canvas.
   */
  textColor: string;
  /** Brightens the outline. Selected nodes and drag ghosts both use this. */
  emphasized?: boolean;
  /** Rendered centered inside the shape, inset to fit the shape's interior. */
  children?: ReactNode;
}

/**
 * Draws one canvas shape at a given size. Shared by the node renderer and the
 * shape-panel drag ghost so a dragged preview matches what actually lands on
 * the canvas.
 */
export function ShapeSurface({
  shape,
  width,
  height,
  color,
  textColor,
  emphasized = false,
  children,
}: ShapeSurfaceProps) {
  const strokeOpacity = emphasized ? 1 : RESTING_BORDER_ALPHA;

  if (SHAPE_RENDER_KIND[shape] === "css") {
    // `css` covers exactly these three; the record's key type proves it.
    const radius = CSS_SHAPE_RADIUS[shape as keyof typeof CSS_SHAPE_RADIUS];

    return (
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden px-3 py-2"
        style={{
          borderRadius: radius,
          borderWidth: SHAPE_STROKE_WIDTH,
          borderStyle: "solid",
          // Border brightness is carried entirely by alpha on the border
          // colour, so the fill underneath stays constant between rest and
          // selection — matching how the SVG shapes use `strokeOpacity`.
          borderColor: withAlpha(textColor, strokeOpacity),
          backgroundColor: color,
        }}
      >
        {children}
      </div>
    );
  }

  const geometry = getSvgShapeGeometry(shape, width, height);

  if (!geometry) return null;

  const labelInset =
    SVG_LABEL_INSET[shape as keyof typeof SVG_LABEL_INSET] ?? "70%";

  return (
    <div className="relative h-full w-full">
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={geometry.outline}
          fill={color}
          stroke={textColor}
          strokeOpacity={strokeOpacity}
          strokeWidth={SHAPE_STROKE_WIDTH}
          strokeLinejoin="round"
        />
        {geometry.detail ? (
          <path
            d={geometry.detail}
            fill="none"
            stroke={textColor}
            strokeOpacity={strokeOpacity}
            strokeWidth={SHAPE_STROKE_WIDTH}
            strokeLinecap="round"
          />
        ) : null}
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={
          // A cylinder's label belongs in the body, not across the top cap, so
          // the text box is pushed down by one cap height.
          shape === "cylinder"
            ? { paddingTop: getCylinderCapHeight(height) }
            : undefined
        }
      >
        <div
          className="flex items-center justify-center text-center"
          style={{ maxWidth: labelInset, maxHeight: labelInset }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Applies an alpha channel to a stored node colour. Node colours are `#rrggbb`
 * literals from `NODE_COLORS`; anything else is passed through untouched
 * rather than guessed at.
 */
function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());

  if (!match) return color;

  const value = Number.parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
