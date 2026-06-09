# Design

## Theme

**Arc** is inspired by the Execute Program visual system: clean, professional, with a slight purple-blue character. The palette uses a three-layer elevation model (back / base / front) with entirely neutral tones — no brand accent colors on chrome. A single sans typeface (IBM Plex Sans) throughout. A subtle static dot-grid pattern sits behind the page background.

## Color

The palette follows Execute Program's tone system: `bg-back` (page background), `bg-base` (section/canvas), `bg-front` (elevated surface). Each tone defines its own text hierarchy.

Three color modes are available via `data-theme` attribute on `<html>` (light, dark, oled). Light is the default. Dark is a brightened version of a dark theme. OLED uses pure black for true black display savings.

### Light mode

| Token | Value | Usage |
|---|---|---|
| `--bg-back` | `oklch(0.91 0.015 285)` | Page background with dot-grid pattern |
| `--bg-base` | `oklch(0.965 0.01 285)` | Section / main canvas |
| `--bg-front` | `oklch(1 0 0)` | Cards, panels, elevated surfaces |
| `--text-strong` | `oklch(0.15 0.015 280)` | Primary content headings |
| `--text-base` | `oklch(0.25 0.02 280)` | Body text |
| `--text-muted` | `oklch(0.40 0.03 280)` | Secondary text, labels |
| `--text-dim` | `oklch(0.52 0.025 280)` | Placeholder, disabled |
| `--border-base` | `oklch(0.75 0.035 285)` | Subtle borders, dividers |
| `--border-strong` | `oklch(0.65 0.04 285)` | Emphasized borders (header, sidebar) |
| `--primary` | `oklch(0.42 0.18 260)` | Links, active states, primary buttons — darker blue |
| `--primary-hover` | `oklch(0.38 0.18 260)` | Primary hover |
| `--secondary` | `oklch(0.60 0.18 40)` | Secondary action buttons — warm amber |
| `--secondary-hover` | `oklch(0.56 0.18 40)` | Secondary hover |
| `--accent` | `oklch(0.50 0.16 250)` | Key highlights, badges |
| `--accent-hover` | `oklch(0.46 0.16 250)` | Accent hover |
| `--warm` | `oklch(0.62 0.14 30)` | Warm coral accent |
| `--focus-ring` | `oklch(0.42 0.18 260 / 0.35)` | Keyboard focus outlines |
| `--control-bg` | `oklch(0.42 0.18 260)` | Button/control filled background |
| `--control-text` | `oklch(0.95 0.01 280)` | Text on filled controls |

### Dark mode (brightened)

| Token | Value | Usage |
|---|---|---|
| `--bg-back` | `oklch(0.10 0.012 285)` | Page background |
| `--bg-base` | `oklch(0.14 0.015 285)` | Section / main canvas |
| `--bg-front` | `oklch(0.20 0.018 285)` | Cards, panels, elevated surfaces |
| `--text-strong` | `oklch(0.93 0.008 280)` | Primary content |
| `--text-base` | `oklch(0.82 0.012 280)` | Body text |
| `--text-muted` | `oklch(0.68 0.018 280)` | Secondary text |
| `--text-dim` | `oklch(0.55 0.018 280)` | Placeholder, disabled |
| `--border-base` | `oklch(0.32 0.025 285)` | Subtle borders, dividers |
| `--border-strong` | `oklch(0.42 0.03 285)` | Emphasized borders |
| `--primary` | `oklch(0.60 0.15 260)` | Links, active states, primary buttons |
| `--primary-hover` | `oklch(0.66 0.15 260)` | Primary hover |
| `--secondary` | `oklch(0.72 0.16 40)` | Secondary action buttons |
| `--secondary-hover` | `oklch(0.78 0.16 40)` | Secondary hover |

### OLED dark mode

| Token | Value | Usage |
|---|---|---|
| `--bg-back` | `oklch(0 0 0)` | Page background — pure black |
| `--bg-base` | `oklch(0.03 0.008 280)` | Section / main canvas |
| `--bg-front` | `oklch(0.06 0.01 280)` | Cards, panels, elevated surfaces |
| `--text-strong` | `oklch(0.95 0.008 280)` | Primary content |
| `--text-base` | `oklch(0.85 0.01 280)` | Body text |
| `--text-muted` | `oklch(0.70 0.015 280)` | Secondary text |
| `--text-dim` | `oklch(0.55 0.015 280)` | Placeholder, disabled |
| `--border-base` | `oklch(0.15 0.015 280)` | Subtle borders, dividers |
| `--border-strong` | `oklch(0.22 0.02 280)` | Emphasized borders |
| `--primary` | `oklch(0.62 0.16 260)` | Links, active states, primary buttons |
| `--primary-hover` | `oklch(0.68 0.16 260)` | Primary hover |
| `--secondary` | `oklch(0.74 0.16 40)` | Secondary action buttons |
| `--secondary-hover` | `oklch(0.80 0.16 40)` | Secondary hover |

### Syntax highlighting

Bluloco-inspired tokens for editor content:

| Role | Light | Dark |
|---|---|---|
| `--syntax-keyword` | `#0098dd` | `#10b1fe` |
| `--syntax-function` | `#23974a` | `#3fc56b` |
| `--syntax-string` | `#c5a332` | `#f9c859` |
| `--syntax-number` | `#ce33c0` | `#ff78f8` |
| `--syntax-constant` | `#823ff1` | `#9f7efe` |
| `--syntax-tag` | `#275fe4` | `#3691ff` |
| `--syntax-attribute` | `#df631c` | `#ff936a` |
| `--syntax-type` | `#d52753` | `#ff6480` |
| `--syntax-operator` | `#7a82da` | `#7a82da` |
| `--syntax-comment` | `#a0a1a7` | `#636d83` |

## Typography

### Font family

**Single sans — IBM Plex Sans throughout.**

IBM Plex Sans is a warm, humanist sans-serif with distinctive character (open apertures, balanced proportions). No monospace used anywhere — a single typeface keeps the interface clean, approachable, and consistent.

| Role | Family | Weight | Notes |
|---|---|---|---|---|
| **All UI** | `"IBM Plex Sans"` | 400 / 500 / 600 / 700 | Everything — body, headings, buttons, editor, labels. |

### Type scale (compact)

```
--text-xs:   0.75rem   (12px)  — captions, metadata
--text-sm:   0.8125rem (13px)  — UI labels, scene card text
--text-base: 0.9375rem (15px)  — body / scene editor content
--text-lg:   1.125rem  (18px)  — act headings, story title in sidebar
--text-xl:   1.375rem  (22px)  — page title (dashboard)
--text-2xl:  1.75rem   (28px)  — modal headings, splash
--text-3xl:  2.25rem   (36px)  — hero / welcome (rare)
```

### Type conventions

- Body line length capped at **65–75ch**.
- Headings use `text-wrap: balance`.
- No all-caps body text. Uppercase reserved for labels ≤4 words (`.font-mono-ui` utility class).
- Single sans typeface used for everything — editor, buttons, headings, labels.

## Grid background

A static dot-grid pattern sits behind the page at the `--bg-back` layer. Implemented as a CSS `background-image` using a small inline SVG data-URI:

- **Light mode:** Dots at `oklch(0.80 0.015 285)` on `--bg-back`
- **Dark mode:** Dots at `oklch(0.18 0.015 280)` on `--bg-back`
- **Spacing:** 24px between dots
- **Dot size:** 1px
- **Behavior:** Fixed position, no interaction, no animation

The grid is subtle — barely perceptible at a glance, providing texture without distraction.

## Layout & spacing

### Spacing scale

```
--space-1: 0.25rem    (4px)   — tiny gaps
--space-2: 0.375rem   (6px)   — tight padding (badges, tags)
--space-3: 0.5rem     (8px)   — tight gaps between elements
--space-4: 0.75rem    (12px)  — comfortable padding (cards, buttons)
--space-5: 1rem       (16px)  — section gaps, card internal
--space-6: 1.5rem     (24px)  — page margins, act separation
--space-8: 2.5rem     (40px)  — major section breaks
```

### Border radius

```
--radius-sm:   0.25rem    (4px)  — inputs, badges
--radius-md:   0.375rem   (6px)  — cards, panels
--radius-lg:   0.5rem     (8px)  — modals, dialogs
--radius-full: 9999px            — pills, toggles
```

### Shadows

Soft, tight.

```
--shadow-sm:   0 1px 2px oklch(0 0 0 / 0.06)
--shadow-md:   0 1px 4px oklch(0 0 0 / 0.08)
--shadow-lg:   0 2px 8px oklch(0 0 0 / 0.10)
--shadow-xl:   0 4px 16px oklch(0 0 0 / 0.12)
```

### Z-index scale

```
--z-dropdown:    100
--z-sticky:      200
--z-sidebar:     300
--z-modal-bg:    400
--z-modal:       500
--z-toast:       600
--z-tooltip:     700
```

### Theme system

The app uses a `data-theme` attribute on `<html>` with three values: `light`, `dark` (brightened), and `oled` (pure black). All CSS custom properties derive from the current theme via `:root`, `[data-theme="dark"]`, and `[data-theme="oled"]` selectors. The `dark` Tailwind variant was removed; every color comes from custom properties.

The store in `src/lib/stores/app.ts` exposes `theme: Writable<'light' | 'dark' | 'oled'>` and a `cycleTheme()` function that iterates light → dark → oled → light.

### Sidebar buttons

Scene list items use `.sidebar-scene-btn`: transparent background (matching `--bg-base` of the sidebar), transparent border by default. On hover, `--border-base` border and a subtle hover tint appear. When selected, the button gets `--bg-front` background and `--border-base` border. No filled colors.

Action buttons (Add Scene, Add Act) use `.sidebar-action-btn`: similar ghost style but with `--text-muted` color and `--border-strong` on hover. Active state scales to 0.97.

### App layout

**Dashboard:**
```
┌──────────────────────────────────────────────────────────┐
│  header (transparent, border-b, 48px)                    │
│  Logo                    Courses  Why  FAQ  Blog  [Log]  │
├──────────────────────────────────────────────────────────┤
│  main (centered, max-w-4xl)                              │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  My Stories                              [New Story] ││
│  │                                                      ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           ││
│  │  │ Card     │  │ Card     │  │ Card     │           ││
│  │  │          │  │          │  │          │           ││
│  │  └──────────┘  └──────────┘  └──────────┘           ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

**Story editor:**
```
┌──────────────────────────────────────────────────────────┐
│  header (transparent, border-b)                          │
│  Logo    ← Back    story title  [☰] [scene title] [👁]  │
├──────────────────────────────────────────────────────────┤
│  sidebar (bg-base) │  main area (bg-base)                │
│                     │                                    │
│  ▶ Act I           │  ┌────────────────┬──────────────┐ │
│    Scene 1         │  │ Editor (left)  │ Preview      │ │
│    Scene 2         │  │                │ (right)      │ │
│  ▶ Act II          │  │ [toolbar]      │              │ │
│    Scene 3         │  └────────────────┴──────────────┘ │
│  [+ Add] (warm)   │   ⇐ Preview toggle collapses right  │
│                     │                                    │
│  stats              │                                    │
└──────────────────────────────────────────────────────────┘
```

## Motion

### Duration & easing

All motion uses `ease-out` curves. No spring, no bounce, no elastic.

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-out-fast` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--duration-instant` | `0ms` |
| `--duration-fast` | `100ms` |
| `--duration-normal` | `200ms` |
| `--duration-slow` | `300ms` |

### Animation map

| Element | Property | Duration | Easing |
|---|---|---|---|---|
| Scene card mount | opacity + translateY(8px) | 200ms | ease-out |
| Act collapse/expand | opacity + max-height | 250ms | ease-out |
| Drag handle lift | scale 1.02 + shadow | 100ms | ease-out |
| Theme cycle | rotate + icon swap | 300ms | ease-out |
| Sidebar toggle | translateX | 200ms | ease-out |
| Button hover | translateY(-1px) + shadow | 120ms | ease-out-fast |
| Button press | scale 0.97 | 80ms | ease-out-fast |
| Focus ring | box-shadow | 150ms | ease-out |

### Reduced motion

Every animated element checks `prefers-reduced-motion: reduce` and transitions instantly (`transition-duration: 0ms`). No content is gated on animation completion.

Hover-dash on buttons also respects reduced motion — instead of the rotating conic-gradient, a static dashed border is shown. All transform/scale effects are disabled.

## Component design

### Header (shared)

```
┌─────────────────────────────────────────────────────┐
│  ⛰ Arc                                [theme]      │
└─────────────────────────────────────────────────────┘
```

- Transparent background, `--border-base` bottom border
- Fixed height 48px (3rem)
- Logo (pen icon + "Scribe") left, theme toggle right

### Story card (dashboard)

```
┌──────────────────────────────────┐
│  The Long Goodbye                │  --text-lg, --weight-semibold
│  A detective walks into a bar...  │  --text-sm, --text-muted, 1-line clamp
│  ─────────────────────────────── │  --border-base
│  3 acts · 8 scenes · 3,400 words │  --text-xs, --text-dim
└──────────────────────────────────┘
```

- Card: `--bg-front`, `--radius-md`, `--border-base` outline
- Hover: `--shadow-sm` lift
- No nested cards

### Button styles

All button types use **neutral colors only** — no brand accent tones.

**Primary** (`.btn-primary`): `--bg-front` background, `--border-strong` border, `--text-base` text. Used for "Add Scene" and "Add Act" in the sidebar. Hover lifts 1px with shadow. Active scales to 0.97.

**Secondary** (`.btn-secondary`): Same neutral appearance as primary (differentiated only for semantic pairing with other actions). Used on dashboard "New Story".

**Ghost** (`.btn-ghost`): Transparent background, `--text-muted` text, transparent border. Hover adds subtle theme-aware background tint via `--ghost-hover`. Active scales to 0.97.

**Sidebar action** (`.sidebar-action-btn`): Ghost-like with `--border-strong` on hover. Used for "New Story" on dashboard, "Add Scene", and "Add Act". No hover lift — matches the sidebar's neutral `--bg-base`.

**Sidebar scene** (`.sidebar-scene-btn`): Transparent border by default, `--border-base` border + `--scene-btn-hover` background on hover, `--bg-front` background + border when selected.

**Button motion:** Primary and secondary animate via `transform`, `box-shadow`, `background`, and `border-color` with `0.12s ease-out-fast` and `0.15s ease-out` curves. Sidebar action/scene buttons have simpler transitions without lift.

### Color philosophy

The palette is entirely **neutral/monochromatic**. No branded accent colors are used on buttons, links, or chrome. The `--primary` and `--secondary` variables exist in each theme's color set but are **not used** for UI — all buttons, borders, text, and surfaces derive from the `--bg-*`, `--text-*`, and `--border-*` neutral token families. This keeps the interface clean and lets the user's content be the focus.

### Animated dashed border on hover

Primary and secondary buttons automatically show an animated dashed border on hover. The ring is rendered via a `conic-gradient` with `mask-composite: exclude`, animated using `@property --dash-angle`. The dash color matches `--text-muted`. Respects `prefers-reduced-motion`.

### Logo

The header shows a mountain/arc icon (three peaks representing rising action → climax → resolution of a three-act story) followed by "Arc" in bold `--text-strong`. No animation, no hover effects — clean and static.

### Sidebar buttons

Scene list items use `.sidebar-scene-btn` — transparent by default, gains `--border-base` on hover and `--bg-front` background when selected. Action buttons (Add Scene, Add Act) use `.sidebar-action-btn` — transparent with `--text-muted` color, `--border-strong` on hover. Both match the sidebar's `--bg-base` background. No filled colors in the sidebar.

### Scene editor (WYSIWYG)

The scene editor is built on **TipTap** with a minimal toolbar at the top:
- Bold, Italic, Underline
- Heading 1/2/3
- Bullet list, ordered list

Each toolbar button tracks its own active state via TipTap's `isActive()` on every selection change. Content is persisted as HTML back into the scene's `content` field, which updates IndexedDB via a 400ms debounce.

Each scene now has a **summary** field (visible as a subtitle input below the scene title). This summary appears in the sidebar beneath each scene name for quick scanning.

### Editor layout

Side-by-side at ≥1024px. Stacks vertically below.

```
┌─────────────────┬─────────────────────┐
│  Editor         │  Live Preview        │
│  (bg-front)     │  (bg-front)          │
│                 │                      │
│  [B] [I] [H1]   │  INT. HOUSE - DAY    │
│                 │                      │
│  INT. HOUSE     │  John paces the      │
│  - DAY          │  room. The phone     │
│                 │  RINGS.              │
│  John paces     │                      │
│  the room. The  │  CHIEF (O.S.)       │
│  phone RINGS.   │  Pick it up.        │
└─────────────────┴─────────────────────┘
```

- Both panels: `--bg-front` background, `--radius-md`, 1.5px `--border-base` inside
- Content is stored as HTML (from TipTap) and persisted to IndexedDB via 400ms debounce.
- The right panel (toggled via the eye button, disabled by default) shows a **story outline** — all acts and scenes with their summaries, formatted as a clean hierarchy. This replaces the earlier Fountain preview plan.
- Each scene has a `summary` string field shown as a subtitle input in the editor header and as a preview line in the sidebar.
- Separator: hover-draggable divider
