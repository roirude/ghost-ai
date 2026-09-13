import type { CanvasNodeShape } from "@/types/canvas";

/**
 * How a shape is drawn. CSS shapes are plain bordered boxes that a border
 * radius is enough to describe; SVG shapes need a polygon or path that has to
 * be recomputed whenever the node is resized.
 */
export type ShapeRenderKind = "css" | "svg";

export const SHAPE_RENDER_KIND: Record<CanvasNodeShape, ShapeRenderKind> = {
  rectangle: "css",
  pill: "css",
  circle: "css",
  diamond: "svg",
  hexagon: "svg",
  cylinder: "svg",
};

/**
 * Border radius for the CSS-drawn shapes, as a raw CSS length. A pill's radius
 * is half its height and a circle's is a full round, so neither can be a fixed
 * token from the `rounded-xl`/`2xl`/`3xl` scale — that scale governs UI chrome,
 * not canvas geometry.
 */
export const CSS_SHAPE_RADIUS: Record<"rectangle" | "pill" | "circle", string> =
  {
    rectangle: "var(--radius-xl)",
    pill: "9999px",
    circle: "50%",
  };

/** Stroke width used for every SVG shape outline, in canvas units. */
export const SHAPE_STROKE_WIDTH = 2;

/**
 * How far the cylinder's elliptical cap dips, as a fraction of node height.
 * Small enough that a short cylinder still reads as a cylinder rather than as
 * two stacked ellipses.
 */
const CYLINDER_CAP_RATIO = 0.18;

/** Horizontal inset of a hexagon's angled corners, as a fraction of width. */
const HEXAGON_CORNER_RATIO = 0.25;

/**
 * Cap height for a cylinder at a given box height, shared by the outline and
 * by the label offset so a label never rides over the top cap's seam.
 */
export function getCylinderCapHeight(height: number): number {
  const inner = Math.max(height - SHAPE_STROKE_WIDTH, 0);

  // Ratio-based, but clamped to a third of the box so a very short cylinder
  // cannot end up with caps taller than its body.
  return Math.min(inner * CYLINDER_CAP_RATIO, inner / 3);
}

/**
 * Geometry for one SVG shape, expressed in the node's own pixel box so the
 * shape scales with node size: the `viewBox` always matches the current
 * width/height, and every coordinate below is derived from them.
 */
export interface SvgShapeGeometry {
  /** Outline drawn as a single path, used for diamond and hexagon. */
  outline: string;
  /** Extra stroked-only path, used for the cylinder's front cap seam. */
  detail?: string;
}

/**
 * Builds the outline for an SVG shape at a given size. Coordinates are inset by
 * half the stroke width on every side so the stroke stays inside the node box
 * instead of being clipped by the `viewBox` edge.
 */
export function getSvgShapeGeometry(
  shape: CanvasNodeShape,
  width: number,
  height: number,
): SvgShapeGeometry | null {
  const inset = SHAPE_STROKE_WIDTH / 2;
  const left = inset;
  const top = inset;
  const right = Math.max(width - inset, inset);
  const bottom = Math.max(height - inset, inset);
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  switch (shape) {
    case "diamond":
      return {
        outline: `M ${centerX} ${top} L ${right} ${centerY} L ${centerX} ${bottom} L ${left} ${centerY} Z`,
      };

    case "hexagon": {
      const corner = (right - left) * HEXAGON_CORNER_RATIO;

      return {
        outline: `M ${left + corner} ${top} L ${right - corner} ${top} L ${right} ${centerY} L ${right - corner} ${bottom} L ${left + corner} ${bottom} L ${left} ${centerY} Z`,
      };
    }

    case "cylinder": {
      const capHeight = getCylinderCapHeight(height);
      const radiusX = (right - left) / 2;
      const capTop = top + capHeight;
      const capBottom = bottom - capHeight;

      return {
        // Top ellipse, then both sides down to the bottom ellipse's front arc.
        outline: `M ${left} ${capTop} A ${radiusX} ${capHeight} 0 0 1 ${right} ${capTop} L ${right} ${capBottom} A ${radiusX} ${capHeight} 0 0 1 ${left} ${capBottom} Z`,
        // The back half of the top ellipse, drawn as a seam so the shape reads
        // as a 3D cylinder rather than a flat rounded rectangle.
        detail: `M ${left} ${capTop} A ${radiusX} ${capHeight} 0 0 0 ${right} ${capTop}`,
      };
    }

    default:
      return null;
  }
}

/**
 * Fraction of the node box a label is allowed to occupy for each SVG shape.
 * Diamonds and hexagons narrow toward their corners, so text has to be kept
 * clear of the edges; a cylinder only loses room to its caps.
 */
export const SVG_LABEL_INSET: Record<"diamond" | "hexagon" | "cylinder", string> =
  {
    diamond: "50%",
    hexagon: "70%",
    cylinder: "72%",
  };
