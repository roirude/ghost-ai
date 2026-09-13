"use client";

import { ShapeSurface } from "@/components/editor/shape-surface";
import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_SHAPE_SIZES,
  EDGE_REST_OPACITY,
  EDGE_STROKE_WIDTH,
} from "@/types/canvas";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

/** The bounding box of a template's nodes, in canvas units. */
interface TemplateBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Fixed preview viewport, in CSS pixels. Every card renders at this size. */
const PREVIEW_WIDTH = 288;
const PREVIEW_HEIGHT = 150;

/** Breathing room between the diagram's bounding box and the viewport edge. */
const PREVIEW_PADDING = 10;

/**
 * A preview never magnifies: a two-node template scaled up to fill the card
 * would read as a totally different diagram from the one that gets imported.
 */
const MAX_PREVIEW_SCALE = 1;

/**
 * Computes that box from the node boxes alone — edges are routed between node
 * centers, so they can never extend past the nodes they connect.
 */
function getTemplateBounds(template: CanvasTemplate): TemplateBounds {
  const boxes = template.nodes.map((templateNode) => {
    const fallback = DEFAULT_SHAPE_SIZES[templateNode.data.shape];

    return {
      x: templateNode.position.x,
      y: templateNode.position.y,
      width: templateNode.width ?? fallback.width,
      height: templateNode.height ?? fallback.height,
    };
  });

  return {
    minX: Math.min(...boxes.map((box) => box.x)),
    minY: Math.min(...boxes.map((box) => box.y)),
    maxX: Math.max(...boxes.map((box) => box.x + box.width)),
    maxY: Math.max(...boxes.map((box) => box.y + box.height)),
  };
}

/**
 * A static, scaled-down rendering of a template's diagram. Deliberately not a
 * React Flow instance: a card only has to *show* the shape of the diagram, and
 * mounting one flow per card would pay for panning, selection, and handle
 * hit-testing that a preview never uses.
 *
 * Nodes draw through the same `ShapeSurface` the canvas uses, so a preview is
 * an honest picture of what importing produces.
 */
export function StarterTemplatePreview({
  template,
}: {
  template: CanvasTemplate;
}) {
  if (template.nodes.length === 0) return null;

  const bounds = getTemplateBounds(template);
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  // Fit the whole diagram inside the viewport, matching `fitView`'s behaviour:
  // the tighter of the two axes wins so nothing is cropped.
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / Math.max(contentWidth, 1),
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / Math.max(contentHeight, 1),
    MAX_PREVIEW_SCALE,
  );

  // Centre the scaled diagram in the leftover space on each axis.
  const offsetX = (PREVIEW_WIDTH - contentWidth * scale) / 2;
  const offsetY = (PREVIEW_HEIGHT - contentHeight * scale) / 2;

  /** Maps a point in canvas units into preview pixels. */
  const toPreviewX = (x: number) => (x - bounds.minX) * scale + offsetX;
  const toPreviewY = (y: number) => (y - bounds.minY) * scale + offsetY;

  const centers = new Map(
    template.nodes.map((templateNode) => {
      const fallback = DEFAULT_SHAPE_SIZES[templateNode.data.shape];
      const width = templateNode.width ?? fallback.width;
      const height = templateNode.height ?? fallback.height;

      return [
        templateNode.id,
        {
          x: toPreviewX(templateNode.position.x + width / 2),
          y: toPreviewY(templateNode.position.y + height / 2),
        },
      ];
    }),
  );

  return (
    <div
      className="relative w-full max-w-full overflow-hidden rounded-xl bg-bg-base"
      style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
      aria-hidden
    >
      {/*
        Edges are drawn as plain straight lines between node centres rather
        than through the orthogonal `canvasEdge` router: at preview scale the
        corner routing is a few pixels wide and reads as noise, while a
        straight line still conveys what connects to what.
      */}
      <svg
        className="absolute inset-0"
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
      >
        {template.edges.map((templateEdge) => {
          const from = centers.get(templateEdge.source);
          const to = centers.get(templateEdge.target);

          if (!from || !to) return null;

          return (
            <line
              key={templateEdge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={DEFAULT_EDGE_COLOR}
              strokeOpacity={EDGE_REST_OPACITY}
              strokeWidth={EDGE_STROKE_WIDTH}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {template.nodes.map((templateNode) => {
        const fallback = DEFAULT_SHAPE_SIZES[templateNode.data.shape];
        const width = (templateNode.width ?? fallback.width) * scale;
        const height = (templateNode.height ?? fallback.height) * scale;

        return (
          <div
            key={templateNode.id}
            className="absolute"
            style={{
              left: toPreviewX(templateNode.position.x),
              top: toPreviewY(templateNode.position.y),
              width,
              height,
            }}
          >
            {/*
              Labels are omitted: at this scale the text would be sub-pixel and
              would only muddy the shapes. The card's name and description
              already say what the diagram is.
            */}
            <ShapeSurface
              shape={templateNode.data.shape}
              width={width}
              height={height}
              color={templateNode.data.color}
              textColor={templateNode.data.textColor}
            />
          </div>
        );
      })}
    </div>
  );
}
