We need the base core components that frame every editor screen: the top nav bar and the left sidebar shell. These will be reused and extended in every chapter that follows.

### Editor Navbar

Create `components/editor/editor-navbar.tsx`.

Requirements:

- Fixed-height top navbar.
- left, center, and right sections.
- Left section contains sidebar toggle button
- Use `PanelLeftOpen` / `panelLeftClose` icons based on sidebar state
- Right section stays empty for now.
- Dark background with a subtle bottom border.

### Project Sidebar

Create `components/editor/project-sidebar.tsx`.

Requirements:

- Sidebar should float above the editor canvas.
- Opening it should not push page content
- slides in from the left.
- Accept `isOpen` prop.
- Header with `Projects` Title + Close button.
- Shadcn `Tabs`:
    - My Projects
    - Shared
- Both tabs show empty placeholder state.
- Full-width `New Project`  button at the bottom with a `Plus` icon.

### Dialog Pattern

Use the existing color tokens from `globals.css` for dialog styling.

Support:

-title
-description
footer actions

Do not build actual dialogs yet.

### Check when done

- new components compile without TypeScript errors
- no lint errors
- dialog pattern is ready for future use