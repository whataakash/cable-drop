---
name: Kinetic Silicon
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e6'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e3e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#cebdff'
  on-tertiary: '#381385'
  tertiary-container: '#9b7fed'
  on-tertiary-container: '#31057e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#e8ddff'
  tertiary-fixed-dim: '#cebdff'
  on-tertiary-fixed: '#21005e'
  on-tertiary-fixed-variant: '#4f319c'
  background: '#121316'
  on-background: '#e3e2e6'
  surface-variant: '#343538'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1rem
  margin-window: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system establishes a high-precision, utilitarian macOS desktop experience for direct device-to-device data transfer. Engineered for power users, developers, and media professionals moving payloads between macOS and Android via ADB, the visual voice prioritizes operational certitude, latency-free ergonomics, and distraction-free spatial composition.

The aesthetic fuses **Technical Precision Minimalism** with refined **macOS Native Chromatics**:
- **Utilitarian Discipline:** Dense, structured information density without visual clutter. Chrome dissolves into the background, leaving directory trees, transfer pipelines, and terminal indicators paramount.
- **Controlled Luminescence:** A dark substrate of deep charcoal tones elevated with sharp 1px structural delineations and a singular electric-violet energy point for connection status, selected items, and confirmed actions.
- **Physical Utility Sensibility:** Interactive targets provide tactile feedback through sharp state transitions, 1-frame micro-interactions, and clear drag-and-drop affordances that mirror native Finder and Terminal workflows.

## Colors

The chromatic architecture relies strictly on an ultra-dark value stack with an isolated electric-violet spectrum dedicated to active runtime states, execution triggers, and interactive focal points.

### Palette Architecture
- **Base Canvas (`#121316`):** The default root window background beneath native macOS vibrance/blur filters.
- **Surface Elevation 1 (`#18191E`):** Sidebar navigation, device pickers, and toolbars.
- **Surface Elevation 2 (`#1F2026`):** Data tables, pane containers, inspector panels, and secondary wells.
- **Surface Elevation 3 (`#282A33`):** Hovered row states, active chips, dialog overlays, and context menus.
- **Border Structural (`#2E313D`):** Primary 1px boundaries dividing toolbars, split views, and table headers.
- **Border Subtle (`rgba(255, 255, 255, 0.08)`): Inset borders, component boundaries, and card strokes.
- **Violet Core (`#8B5CF6`):** Primary interactive actions, batch transfer execution, active progress rings.
- **Violet Deep (`#7C3AED`):** Primary button pressed states, focused selection fills.
- **Violet Glow / Highlights (`#A78BFA`):** Keyboard navigation rings, active toggle pips, data stream indicators.
- **Typography Scale:**
  - `Text-Primary` (`#FFFFFF`): Primary titles, file names, active metrics.
  - `Text-Secondary` (`#E4E7ED`): Column headings, metadata, secondary breadcrumbs.
  - `Text-Muted` (`#949BA8`): File sizes, timestamps, system status legends, ADB paths.

## Typography

Typography adheres strictly to high-legibility desktop utility scales. It relies on the local macOS system sans-serif hierarchy (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, `SF Pro Display`, `Inter`), backed by `JetBrains Mono` for device logs, byte counts, ADB device IDs, and terminal inputs.

- **Numerics & Metadata:** Use tabular figures (`font-variant-numeric: tabular-nums`) across file sizes, transfer speeds (MB/s), and progress counts to avoid layout shifting during batch operations.
- **Hierarchy Rules:** Use `13px` as the core operational base for list items and table rows, matching macOS Human Interface Guidelines for dense list utilities.
- **Label Discipline:** Labels under `12px` (`label-sm`) must utilize uppercase tracking (`letter-spacing: 0.02em`) and semi-bold weights for category headers in sidebars and column titles.

## Layout & Spacing

Designed specifically for Electron targeting a fixed or fluid standard 1440x900 viewport. The layout leverages a persistent **Three-Pane Split Architecture**:
1. **Sidebar Navigation (220px fixed):** Device status, ADB device selector, storage breakdown meters, and root system shortcuts (`/sdcard/Download`, `/DCIM`, etc.).
2. **Dual-Pane Browser (Fluid Split, 1:1 ratio):**
   - Left: Host Mac filesystem browser.
   - Right: Target Android connected filesystem browser.
3. **Bottom Telemetry & Batch Queue (48px collapsed, 180px expanded):** Real-time ADB transport daemon readouts, transfer velocity graphs, and queued file tasks.

### Window Metrics
- **macOS Titlebar Chrome:** 38px integrated top bar containing native traffic lights (`12px` diameter, `8px` spacing), drag region (`-webkit-app-region: drag`), path breadcrumb navigation, and global utility toggles.
- **Density Grid:** Strict 4px/8px incremental rhythm for component insets and compact table row heights (`32px` standard row, `24px` compact row).

## Elevation & Depth

Visual hierarchy is delivered via **Tonal Surfaces**, **Subtle Inset Translucency**, and **Micro-Outlines**, rejecting heavy, theatrical blur shadows in favor of engineering rigor:

- **Window Chrome:** Native Electron `vibrancy: "under-window"` or `"hud"` effect mapped to `#121316` at 85% opacity, allowing desktop wallpaper luminance to slightly calibrate the backdrop.
- **Panels & Wells:** Achieved entirely without drop-shadows. Depth is articulated by stacking `#121316` (base) beneath `#18191E` (sidebar/toolbars) and `#1F2026` (file views), bounded by `1px solid #2E313D`.
- **Modals & Flyouts:** Context menus, connection dialogs, and command palettes use `#282A33` with a crisp outer rim (`1px solid rgba(255, 255, 255, 0.12)`) and an ambient, low-spread drop shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.65)`.
- **Drop Targets:** When hovering dragged files over browser panes, activate a continuous internal glow border: `inset 0 0 0 1.5px #8B5CF6` combined with a soft violet background tint (`rgba(139, 92, 246, 0.05)`).

## Shapes

The design system enforces a disciplined, low-radius shape profile (`roundedness: 1`) to preserve the compact geometry of desktop utility tools:
- **Buttons, Inputs, Row Highlights:** `4px` (`0.25rem`) corner radius.
- **Cards, Panes, Modals:** `8px` (`0.5rem`) corner radius.
- **Status Pills, Progress Indicators:** `12px` (`0.75rem`) for rounded indicator caps.
- **Window Corners:** Standard macOS window perimeter masking (`10px`).

## Components

### Buttons
- **Primary:** Solid `#8B5CF6` background, `#FFFFFF` text, `1px solid rgba(255, 255, 255, 0.15)` top highlight border. Height `28px`, padding `0 12px`. Hover shifts to `#7C3AED`. Active scale `0.98`.
- **Secondary / Ghost:** Transparent background, `#E4E7ED` text, `1px solid #2E313D` border. Hover changes background to `#282A33` and border to `#949BA8`.
- **Icon Utility Buttons:** 24x24px square, `4px` radius, `#949BA8` icon fill. Hover reveals `#1F2026` background and `#FFFFFF` icon.

### Data Tables (File Browsers)
- **Header:** Height `26px`, `#18191E` background, `#949BA8` text (`11px`, bold, uppercase). Border bottom `1px solid #2E313D`.
- **Row:** Height `32px` standard, alternates `#1F2026` and `#1C1D23` (optional zebra striping off by default). Hover highlights with `#282A33`.
- **Selected Row:** Solid `#7C3AED` with `#FFFFFF` text when table is focused; `#282A33` with violet accent bar (`2px` left edge) when unfocused.
- **Columns:** Monoline file/folder Lucide icon (`14px`), Name, Date Modified, Type, Size (`tabular-nums`).

### Input Fields & Search Bars
- **Filter / Search Bar:** Height `26px`, `#121316` fill, `1px solid #2E313D`, text `#E4E7ED`. Lucide magnifying glass icon inset left. Focus state transitions border to `#8B5CF6` with `0 0 0 1px #8B5CF6` ring.

### Chips & Device Badges
- **Device Status Chip:** Height `20px`, pill-shaped, `#18191E` fill, `#2E313D` border. Houses an animated or static status dot:
  - Connected (Authorized): `#10B981` (Emerald).
  - Unauthorized / Waiting: `#F59E0B` (Amber).
  - Transfer Active: Pulsing `#8B5CF6` (Violet).

### Checkboxes & Selectors
- **Checkbox:** `14x14px`, `3px` radius, `1px solid #2E313D` unchecked. Checked switches to `#8B5CF6` with an inner white check glyph.

### Transfer Progress Bar
- **Progress Track:** Height `4px`, `#282A33` background, `2px` radius. Active fill `#8B5CF6`. Indeterminate states exhibit an angled linear gradient pulse moving rightwards.

### Traffic Lights & Window Chrome
- Left padding `14px`, vertical centering inside the 38px titlebar. Exact macOS native colors (`#FF5F56`, `#FFBD2E`, `#27C93F`) with subtle inner stroke (`rgba(0,0,0,0.12)`). Inactive window state desaturates lights to `#3A3D45`.