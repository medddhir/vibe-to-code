---
name: "Vibe to Code"
description: "A premium code-inspection learning system that turns AI-generated software into a visible route from prompt to proof."
colors:
  porcelain: "#f2f4ef"
  work-surface: "#fbfcf7"
  soft-surface: "#e6eae3"
  graphite: "#111713"
  graphite-soft: "#29332c"
  muted-ink: "#59645d"
  rule: "#cfd6ce"
  rule-strong: "#aeb9b0"
  cobalt-route: "#2448e8"
  cobalt-deep: "#1738c7"
  cobalt-wash: "#e2e7ff"
  safety-lime: "#c8f04b"
  safety-lime-strong: "#a7d51f"
  signal-ink: "#131a11"
  workbench: "#121914"
  instrument-surface: "#18211b"
  editor-canvas: "#0c0e13"
  code-text: "#f4f7f2"
  code-muted: "#a8b4ac"
  success: "#177245"
  success-surface: "#e4f3e8"
  warning: "#66500e"
  warning-surface: "#fff6d8"
  danger: "#8e3426"
  danger-surface: "#ffebe7"
  dark-canvas: "#101411"
  dark-surface: "#171d18"
  dark-rule: "#313b33"
  dark-cobalt: "#8196ff"
typography:
  display:
    fontFamily: "Archivo Variable, Helvetica Neue, sans-serif"
    fontSize: "clamp(3.4rem, 6.5vw, 6rem)"
    fontWeight: 790
    lineHeight: 0.98
    letterSpacing: "-0.04em"
    fontVariation: "\"wdth\" 92"
  headline:
    fontFamily: "Archivo Variable, Helvetica Neue, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.8rem)"
    fontWeight: 730
    lineHeight: 1
    letterSpacing: "-0.036em"
  title:
    fontFamily: "Archivo Variable, Helvetica Neue, sans-serif"
    fontSize: "1.55rem"
    fontWeight: 730
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Archivo Variable, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  learning-body:
    fontFamily: "Archivo Variable, Helvetica Neue, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 400
    lineHeight: 1.72
    letterSpacing: "normal"
  control:
    fontFamily: "Archivo Variable, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 720
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  metadata:
    fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "0.67rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.06em"
rounded:
  small: "8px"
  control: "10px"
  medium: "12px"
  large: "16px"
  full: "999px"
spacing:
  micro: "4px"
  small: "8px"
  compact: "12px"
  control: "20px"
  panel: "28px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt-route}"
    textColor: "#ffffff"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "13px 20px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "13px 20px"
    height: "50px"
  site-navigation:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.graphite}"
    typography: "{typography.control}"
    padding: "0 28px"
    height: "70px"
    width: "100%"
  chip-pass:
    backgroundColor: "{colors.safety-lime}"
    textColor: "{colors.signal-ink}"
    typography: "{typography.metadata}"
    rounded: "{rounded.small}"
    padding: "5px 8px"
  practice-editor:
    backgroundColor: "{colors.editor-canvas}"
    textColor: "{colors.code-text}"
    typography: "{typography.metadata}"
    rounded: "{rounded.control}"
    padding: "14px 15px"
    height: "116px"
  course-card-featured:
    backgroundColor: "{colors.workbench}"
    textColor: "{colors.code-text}"
    rounded: "{rounded.medium}"
    padding: "28px"
  inspection-bench:
    backgroundColor: "{colors.workbench}"
    textColor: "{colors.code-text}"
    rounded: "{rounded.large}"
    padding: "0"
  completion-handoff:
    backgroundColor: "{colors.safety-lime}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.large}"
    padding: "clamp(28px, 5vw, 54px)"
---

# Design System: Vibe to Code

## Overview

**Creative North Star: "Code Inspection Bench"**

Vibe to Code feels like a premium technical workbench built for learning: porcelain and graphite work surfaces, cobalt route rails, safety-lime proof states, and compact inspection labels make an abstract curriculum feel inspectable. The system is futuristic through precision, contrast, and visible logic—not through spectacle.

Layouts are structured but intentionally asymmetrical. Large learning statements face instrument-like panels; dividers, route lines, numbered nodes, progress bars, and handoff cards continually answer “where am I?” and “what is verified next?” The voice is confident and serious while the generous learning text and plain controls protect beginner confidence.

The system rejects childish gamification, ornamental neon, mascot-led interfaces, and generic SaaS card grids. Progress is evidence, not confetti; lime indicates a passed checkpoint or unlocked route, while cobalt carries attention and navigation.

**Key Characteristics:**

- Approved folded-ribbon cursor mark and structured monoline wordmark
- Porcelain learning surfaces paired with graphite inspection benches
- Cobalt rails and nodes that expose sequence, route, and active action
- Safety-lime reserved for pass, completion, unlock, and high-confidence next steps
- Variable-width Archivo headlines with dense, restrained mono metadata
- Asymmetrical editorial grids that collapse into one clear mobile sequence
- Borders and tonal layers before shadows; visible proof before decorative reward

### Identity

The folded-ribbon cursor is the primary symbol. Its sharp folds bridge AI-speed and deliberate technical craft without falling back to a generic code bracket or sparkle. The structured monoline wordmark is the primary naming asset in navigation and brand-led moments. Use the dark asset on porcelain, the light asset on graphite, and preserve the original proportions.

The ten-second identity film may appear as a supporting hero or campaign object with a poster and an explicit pause control. It must never delay navigation, cover the interface as a startup screen, or autoplay for people who request reduced motion.

**The Identity Restraint Rule.** Let the cursor and wordmark establish recognition once per region; do not repeat the symbol as ambient decoration or use it as a generic bullet.

## Colors

The palette combines quiet mineral neutrals with one routing accent and one proof signal, remaining legible in both porcelain-light and graphite-dark environments.

### Primary

- **Cobalt Route** (`#2448e8`): Carries primary actions, active rails, selected emphasis, brand geometry, and the emphasized phrase in major headings.
- **Cobalt Deep** (`#1738c7`): Provides the light-theme hover state and high-contrast blue text.
- **Cobalt Wash** (`#e2e7ff`): Supports selected or hovered secondary surfaces without turning the screen into a field of blue.

### Secondary

- **Safety Lime** (`#c8f04b`): Certifies passed paths, unlocked destinations, completion panels, and dark-theme primary actions.
- **Safety Lime Strong** (`#a7d51f`): Deepens the proof signal for light-theme hover and structural accents.
- **Signal Ink** (`#131a11`): Keeps text and icons crisp on safety-lime surfaces.

### Tertiary

- **Verified Green** (`#177245`) with its pale success surface: Marks correct or completed feedback below the stronger lime proof tier.
- **Diagnostic Ochre** (`#66500e`) with its warm warning surface: Holds recoverable guidance and “try again” states.
- **Error Rust** (`#8e3426`) with its pale danger surface: Marks errors without importing a bright alarm-red vocabulary.

### Neutral

- **Porcelain Canvas** (`#f2f4ef`): The light-theme page background and gridded learning field.
- **Work Surface** (`#fbfcf7`): The cleanest cards, headers, and content panels.
- **Soft Surface** (`#e6eae3`): Section alternation, low-emphasis controls, and quiet grouping.
- **Graphite Ink** (`#111713`) and **Graphite Soft** (`#29332c`): Primary and supporting reading text.
- **Muted Ink** (`#59645d`): Metadata and supporting copy that must remain readable, not faint.
- **Rules** (`#cfd6ce`, strong `#aeb9b0`): The visible wiring between surfaces and states.
- **Workbench** (`#121914`) and **Instrument Surface** (`#18211b`): Code windows, sidebars, progress maps, and dark editorial bands.
- **Code Text** (`#f4f7f2`) and **Code Muted** (`#a8b4ac`): High- and low-emphasis content inside graphite instruments.
- **Dark Canvas** (`#101411`) and **Dark Surface** (`#171d18`): The dark-theme base; rules shift to dark mineral gray and cobalt lightens to preserve contrast.

### Named Rules

**The Route and Proof Rule.** Cobalt shows where attention travels; safety-lime proves that a checkpoint passed or a route unlocked. Never use lime as ambient decoration.

**The Mineral Neutral Rule.** Use green-cast porcelain and graphite neutrals instead of pure white and blue-black so code instruments and learning surfaces feel like one physical system.

## Typography

**Display Font:** Archivo Variable (with Helvetica Neue and sans-serif fallbacks)

**Body Font:** Archivo Variable (with Helvetica Neue and sans-serif fallbacks)
**Label/Mono Font:** SFMono-Regular (with Consolas, Liberation Mono, and monospace fallbacks)

**Character:** Archivo supplies compact, confident headlines and open, readable learning text without changing personality between marketing and lessons. Monospace appears only where the interface is inspecting, measuring, naming a route, or showing code.

### Hierarchy

- **Display** (790, `clamp(3.4rem, 6.5vw, 6rem)`, 0.98): Major offer and course titles; use the narrower width axis and keep lines short.
- **Headline** (730, `clamp(2.5rem, 5vw, 4.8rem)`, 1): Section theses and completion statements, normally constrained to 11–17 characters per line.
- **Title** (730, `1.55rem`, 1.08): Card, route-stage, and panel headings.
- **Body** (400, `1rem`, 1.6): Interface and explanatory copy; lesson reading rises to `1.08rem` with 1.72 line-height and stays within roughly 72 characters.
- **Control** (720, `1rem`, 1.2): Buttons and decisive next actions.
- **Metadata** (700, `0.67rem`, `0.06em`): Uppercase inspection labels, filenames, route codes, and numeric states; use tabular numbers when values must align.

### Named Rules

**The Inspection Label Rule.** Monospace and uppercase metadata annotate the system; they do not carry paragraphs or attempt to make every surface look like a terminal.

**The Short Thesis Rule.** Balance display copy into compact blocks and cap headings near 22 characters; let prose stay wider and calmer.

## Layout

The default shell is capped at 1240px with 28px side gutters; guided lessons use a 1320px shell with a 310px sticky graphite sidebar and a fluid article column. Major sections breathe vertically with `clamp(84px, 9vw, 132px)`, while inspection panels and route lists use denser 8–28px internal intervals.

Desktop compositions favor weighted two-column grids rather than equal halves: a learning brief faces a larger inspection instrument, or a sticky explanation faces a longer route. Thin rails, full-width rules, and numbered nodes connect regions. Repeated content may use a three-column grid, but featured cards span columns or change material to establish a clear route hierarchy.

At 1060px, major hero, course, and method grids become single-column. At 820px, navigation condenses to the menu, the lesson sidebar becomes an in-flow summary, and the working shell uses 16px gutters. At 620px, actions, cards, proof strips, and route groups stack into one sequence; the inspection bench removes nonessential state text but preserves code order and pass status. Mobile section padding is 72px, and practical controls retain at least 44–50px height.

**The One Visible Route Rule.** Responsive reflow may remove columns and secondary metadata, but it must never change the order of the learning sequence or obscure the next action.

## Elevation & Depth

Depth is a hybrid of tonal layering, borders, and a small vocabulary of deliberate shadows. Most cards are flat at rest; graphite instruments, sticky navigation, featured completion states, and major cobalt surfaces may lift because they function as active work objects. Shadows remain broad and low-opacity, never glossy or neon.

### Shadow Vocabulary

- **Low Surface** (`0 12px 30px rgba(24, 34, 27, 0.08)`): Hovered cards and small floating surfaces.
- **Action Cobalt** (`0 8px 20px rgba(36, 72, 232, 0.2)`): Light-theme primary actions.
- **Workbench Lift** (`0 34px 80px rgba(18, 25, 20, 0.24)`): Large inspection benches only.
- **Completion Lift** (`0 24px 56px rgba(87, 115, 12, 0.18)`): Safety-lime completion handoffs.
- **Dark Surface** (`0 34px 100px rgba(0, 0, 0, 0.42)`): Maximum dark-theme depth.

### Named Rules

**The Flat Work Surface Rule.** Begin with a border or tonal change. Add elevation only when a surface is sticky, featured, interactive, or carries the decisive proof state.

## Shapes

The form language is compact and instrument-like: 8px corners for controls and symbols, 10–12px for buttons and working panels, and 16px for major benches and completion surfaces. Rules and progress bars often remain square to read as measured tracks. Circles belong to route nodes, indicators, and compact status markers; full pills are limited to genuinely small state labels.

Decorative geometry stays structural: one-pixel rails, cutaway outlines, offset lime underlays, and partial arcs can mark sequence or focus. Avoid soft balloon cards, excessive capsules, and unrelated blobs.

**The No Bubbles Rule.** Rounded corners soften the workbench; they do not turn every container into a pill or friendly toy.

## Components

Components feel precise, tactile, and serious. Their hierarchy comes from material, border, state color, and route position rather than ornamental illustration.

### Buttons

- **Shape:** Compact rounded rectangle (10px) with a 50px default height; small header actions use 8px corners and a 44px height.
- **Primary:** Cobalt with white text in light mode; safety-lime with signal ink in dark mode. Use 13px 20px padding and weight 720.
- **Hover / Focus:** Deepen the surface color over 180ms without translating the button. Focus uses a 2px color ring with 4px offset.
- **Secondary:** Transparent with a strong mineral border; hover adds cobalt wash and cobalt text.
- **Disabled:** Preserve geometry, lower opacity to 0.45–0.5, and remove hover movement.

### Chips

- **Style:** Small uppercase or mono labels with 5–9px internal padding. Pass-path chips use safety-lime and signal ink; ordinary availability states use the quieter semantic surfaces.
- **State:** Use chips to name a compact state, never as a substitute for the next-action button or route explanation.

### Cards / Containers

- **Corner Style:** 12px for recurring cards; 14–16px for featured instruments and handoffs.
- **Background:** Work surfaces for reading cards, graphite for code and progress instruments, cobalt for contribution/preparation features, and lime only for verified completion.
- **Shadow Strategy:** Flat by default; use the elevation vocabulary for featured, sticky, or interactive objects.
- **Border:** One-pixel mineral rules expose grouping and route continuity.
- **Internal Padding:** Typically 28px; feature panels scale from 28px to 64px.

### Inputs / Fields

- **Style:** Learning editors sit inside graphite console frames; the editor canvas is near-black with code text, mono type, a 10–12px corner, and a visible rule. Choice fields use a 54px minimum row with a square 29px option marker.
- **Focus:** Shift the editor border to cobalt and add a restrained three-pixel translucent ring. Hidden radio inputs transfer their focus ring to the entire labeled row.
- **Error / Disabled:** Use the paired warning, danger, and success surfaces. Read-only code uses muted code text and disabled actions retain their shape at reduced opacity.

### Navigation

- **Style:** A 70–72px sticky translucent header with a one-pixel rule. The approved cursor and wordmark anchor the left; links are compact gray controls that gain a soft mineral surface on hover; the theme toggle and start action remain explicit.
- **Mobile:** Hide the desktop link row and header-sized start action at 820px, then place `Start Level 0` as the first high-contrast item inside the 44px menu control.

### Inspection Bench

The signature inspection bench is a 16px graphite instrument with an instrument-surface header and footer, mono route data, a vertical prompt-to-proof axis, numbered code rows, and a safety-lime passed row. Its offset lime backing and broad workbench shadow make it the clearest expression of the system.

### Progress & Completion

Progress panels use graphite, square four- or five-pixel tracks, tabular numbers, and lime for the completed extent. Completion handoffs invert the pattern: a full safety-lime panel carries a short proof statement, one unlocked destination, and a graphite primary button.

**The Next Action Rule.** Every route panel ends with one visually dominant, explicitly named action; completed work hands off to the next lesson or level without making the learner infer what unlocked.

## Do's and Don'ts

### Do:

- **Do** use cobalt for routes and active actions, then reserve safety-lime for passed, completed, or unlocked states.
- **Do** pair a large plain-language thesis with a visible instrument, route, example, or proof surface.
- **Do** preserve 16–18px learning text, 44–50px controls, clear keyboard focus, and the original learning order on mobile.
- **Do** use borders, progress tracks, numbered nodes, and handoff labels to make system state legible.
- **Do** let dark graphite surfaces concentrate technical work while porcelain surfaces support reading and orientation.

### Don't:

- **Don't** turn lime into a general brand fill, ambient glow, or decorative neon.
- **Don't** scatter equal, interchangeable cards into a generic SaaS grid when route priority can be expressed through span, material, or sequence.
- **Don't** use childish rewards, confetti, cartoon ornament, or game-like points to communicate progress.
- **Don't** overuse terminal styling, monospace text, pills, glass effects, or shadows; each has a narrow functional role.
- **Don't** hide the next verified action after a checkpoint, lesson, or level transition.
