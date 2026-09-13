Add a bottom shape panel so users can drag shapes onto the canvas and create new nodes.

## Implementation

1. Add a floating pill-shaped toolbar at the bottom-center of the canvas.

2. Add draggable icon buttons for these shapes:
   - rectangle
   - diamond
   - circle
   - pill
   - cylinder
   - hexagon

3. When dragging a shape, include the shape name and default size in the drag payload.

   Use sensible default sizes:
   - rectangles should be wider than tall
   - circles should be square
   - diamonds should be slightly larger so labels have room

4. Add `dragover` and `drop` handling to the canvas wrapper.

5. On drop:
   - read the dragged shape payload
   - convert the screen position to canvas coordinates using React Flow
   - create a new node at that position
   - use an empty label
   - use the default node color
   - use the dragged shape value

6. Generate each node ID using the shape name, timestamp, and a counter.

7. Add a basic renderer for the custom canvas node type so new nodes are visible.

   For this unit, render every shape as a simple bordered rectangle with the label centered. Shape-specific visuals will be added later.

## Check When Done

- Shape drag payload includes the correct shape and size data.
- Drop logic creates new canvas nodes with the expected shape data.
- New nodes use the custom canvas node type.
- `npm run build` passes without type errors.

## Resolved Ambiguities

Recorded per `ai-workflow-rules.md` ("resolve it in the relevant context file before implementing").

1. **Shape set.** This unit's six shapes (`rectangle`, `diamond`, `circle`, `pill`, `cylinder`,
   `hexagon`) supersede the three-value `CanvasNodeShape` union
   (`"rectangle" | "ellipse" | "diamond"`) introduced in `11-base-canvas.md`. `CanvasNodeShape`
   widens to the six values above and `"ellipse"` is dropped — it was referenced nowhere but its
   own type definition, and no nodes or renderers existed yet, so removing it breaks nothing.
   `"circle"` is the intended successor name.

2. **Default node color.** Not previously defined. New nodes use the brand accent token value
   (`#00c8d4`, `--accent-primary`) as their `color`, exported as `DEFAULT_NODE_COLOR` from
   `types/canvas.ts`. `CanvasNodeData.color` is a stored per-node string (it will become
   user-editable), so it holds a literal value rather than a Tailwind class name; this is the one
   place a hex literal is correct despite `code-standards.md`'s no-hardcoded-hex styling rule,
   which governs CSS classes.
