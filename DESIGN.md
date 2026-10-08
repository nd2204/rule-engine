---
name: bre console
description: Railway interlocking control table for authoring and publishing Decision Tables, in seven themes: the console's own Signal Night, five editor schemes, and the light drawing sheet.
colors:
  sheet: "#181818"
  paper: "#181818"
  panel: "#282828"
  panel-2: "#32302f"
  rule: "#32302f"
  rule-strong: "#665c54"
  ink: "#ebdbb2"
  ink-2: "#d5c4a1"
  ink-3: "#a89984"
  rail: "#151515"
  rail-deep: "#181818"
  rail-line: "#32302f"
  rail-ink: "#ebdbb2"
  rail-ink-2: "#a89984"
  clear: "#b8bb26"
  clear-ink: "#b8bb26"
  clear-tint: "#282819"
  stop: "#fb4934"
  stop-ink: "#fc6a58"
  stop-tint: "#381f1c"
  caution: "#fabd2f"
  caution-ink: "#fabd2f"
  caution-tint: "#332c1b"
  accent: "#8aa98a"
  accent-hover: "#a3bea3"
  accent-tint: "#272b27"
  lit: "#262926"
  lit-strong: "#313831"
  primary: "#b8bb26"
  primary-hover: "#c6c938"
  on-primary: "#282828"
  on-signal: "#181818"
  on-caution: "#181818"
  row-hover: "#20201e"
  toast-bg: "#3c3836"
  lever-lock: "#504945"
  stop-fill: "#fb4934"
  on-stop: "#181818"
  on-lever-lock: "#ffffff"
  toast-ink: "#ffffff"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.005em"
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "Barlow Semi Condensed, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
  title:
    fontFamily: "Barlow Semi Condensed, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  figure:
    fontFamily: "Barlow Semi Condensed, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "Barlow Semi Condensed, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.07em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum' 1"
  body-sm:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.35
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  sm: "2px"
  md: "3px"
  lamp: "50%"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "34px"
  button-secondary-hover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "34px"
  button-ghost-hover:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent}"
  button-disabled:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-3}"
  mode-toggle-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  tag:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "18px"
    padding: "0 6px"
  tag-clear:
    backgroundColor: "{colors.clear-tint}"
    textColor: "{colors.clear-ink}"
  tag-stop:
    backgroundColor: "{colors.stop-tint}"
    textColor: "{colors.stop-ink}"
  tag-caution:
    backgroundColor: "{colors.caution-tint}"
    textColor: "{colors.caution-ink}"
  lamp-clear:
    backgroundColor: "{colors.clear}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.lamp}"
    size: "22px"
  lamp-stop:
    backgroundColor: "{colors.stop}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.lamp}"
    size: "22px"
  lamp-caution:
    backgroundColor: "{colors.caution}"
    textColor: "{colors.on-caution}"
    rounded: "{rounded.lamp}"
    size: "22px"
  lamp-idle:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.lamp}"
    size: "22px"
  lamp-sm:
    size: "16px"
  titleblock-cell:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    padding: "7px 12px 9px"
  rules-head:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    padding: "4px 10px 3px"
  rules-cell:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    padding: "10px 10px 8px"
    height: "40px"
  rules-cell-editing:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.ink}"
    padding: "4px"
  rules-cell-changed:
    backgroundColor: "{colors.caution-tint}"
  rule-row-lit:
    backgroundColor: "{colors.lit}"
  rule-row-winner:
    backgroundColor: "{colors.lit-strong}"
  rule-row-conflict:
    backgroundColor: "{colors.stop-tint}"
  rule-row-added:
    backgroundColor: "{colors.clear-tint}"
  rule-index:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-2}"
    typography: "{typography.figure}"
    rounded: "{rounded.sm}"
    height: "22px"
    width: "24px"
  rule-index-winner:
    backgroundColor: "{colors.clear}"
    textColor: "{colors.on-signal}"
  rule-index-conflict:
    backgroundColor: "{colors.stop-fill}"
    textColor: "{colors.on-stop}"
  lock-stop:
    backgroundColor: "{colors.stop-tint}"
    textColor: "{colors.ink}"
    padding: "10px 14px"
  lock-caution:
    backgroundColor: "{colors.caution-tint}"
    textColor: "{colors.ink}"
    padding: "10px 14px"
  lever-locked:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.md}"
    height: "44px"
  lever-free:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: "44px"
  lever-free-hover:
    backgroundColor: "{colors.primary-hover}"
  lever-lock-plate:
    backgroundColor: "{colors.lever-lock}"
    textColor: "{colors.on-lever-lock}"
    width: "44px"
  lever-lock-plate-free:
    backgroundColor: "{colors.clear}"
    textColor: "{colors.on-signal}"
  toast:
    backgroundColor: "{colors.toast-bg}"
    textColor: "{colors.toast-ink}"
    rounded: "{rounded.md}"
    padding: "10px 8px 10px 14px"
  rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-ink}"
    width: "264px"
  rail-item-active:
    backgroundColor: "{colors.rail-deep}"
    textColor: "{colors.rail-ink}"
  rail-latest-marker:
    backgroundColor: "{colors.rail-ink}"
    textColor: "{colors.rail}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 5px"
  theme-select:
    backgroundColor: "{colors.rail-deep}"
    textColor: "{colors.rail-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: "34px"
  banner-caution:
    backgroundColor: "{colors.caution-tint}"
    textColor: "{colors.caution-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: bre console

## Overview

**Creative North Star: "The Interlocking Control Table"**

The console is a signal box's control table drawn on a drafting sheet. One Rule per row, terse conditions per cell, a ruled title block at the head of the drawing, and at the foot an interlock row of lamps ending at the Publish lever. The lever only releases when every lamp shows clear. The system exists to make the reason Publish is blocked, or free, readable at a glance, and to refuse the neutral SaaS grid whose lone Publish button is always clickable and explains nothing.

The world is dense and ruled, not carded. Depth comes from drawn lines, all one weight: a 1px `rule-strong` frame around the title block and the other sheet objects, and inside the table a single soft line (`--line`, `rule-strong` mixed 40% into `rule`) for the frame, the heads and the input | output seam. Inputs and outputs are told apart by a quiet tonal band behind the outputs, not by a heavier stroke. Lettering has three hands: a condensed technical letter for everything a draughtsman would letter (identifiers, column and group heads, lamps, counts), a humanist sans for UI prose, and a monospace only for condition expressions and ids.

The world is no longer one palette. After the direction contract was approved, the user asked to keep a theme switcher as a product feature, so the same semantic tokens are mapped onto seven themes: Signal Night (the console's own dark, see below), Gruvbox Material Mix (the default, mapped from the owner's VS Code theme `nd2204/vscode-gruvbox` `gruvbox_material_mix.json`), Catppuccin Mocha, Tokyo Night, Nord, Dracula, and "Bản vẽ (sáng)", the original light drawing-office sheet. "Bản vẽ" is the base token set; the six dark themes override it.

**Signal Night** is the one dark theme drawn for this product rather than borrowed from an editor: a signal box after dark. Depth comes from three stacked blue-black surfaces, paper `#07090c` under sheet `#0c0f13` under panel `#13171d`, with a near-black rail `#040507`. The drawing blue of Bản vẽ is brightened into the accent `#5b9cff` (lit rows `#0e1b2e` / `#14284a`). The primary is the theme's own green `#2fd87e`, the clear lamp's LED green, with near-black text. Lamps are saturated LED colours: clear `#2fd87e`, stop `#ff4f45`, caution `#ffb21f`, dark text on each. Every text pair is measured at 4.5:1 or better. The frontmatter on this file records the default Gruvbox values. Per-theme values live in `console/src/styles/tokens.css` (base) and `console/src/styles/themes.css` (overrides) and are mirrored in the sidecar.

**Key Characteristics:**
- Ruled drafting-sheet surfaces. Flat panels separated by hairlines of one weight, not by cards or shadows.
- Signal lamps (clear / stop / caution / pending / idle) are the only carriers of state colour, and every lamp has a glyph and a label.
- Identifier as headline (`decisionId@draft`) over a ruled title block of six cells.
- The interlock row and Publish lever are the signature, with one authored release moment.
- Every screen fills the same five slots of the Decision Workspace: shell nav, context head with tabs, primary, inspector, commit bar.
- Seven themes are mapped onto one semantic token set. Each theme's red, yellow and green come from its own editor scheme.
- Vietnamese prose, with English domain terms (Rule, Draft, Test Case, Hit Policy, Publish) kept as written in CONTEXT.md.

## Colors

The palette is a semantic token map, not a single swatch set. Each theme supplies a sheet, panel and ink ladder, a shell rail, one accent and its lit tints, a primary, and its own red, amber and green for the signal lamps.

### Primary
- **Lever Green** (`primary`): the fill of the Publish lever once it is free, and of the primary button. Every theme uses its own scheme's canonical green, the same green as its `clear` lamp, by the owner's choice: Bản vẽ `#13804b` (white text, hover darker `#046d3d`), Gruvbox `#b8bb26` (the VS Code button, `#282828` text, hover `#c6c938`), Catppuccin `#a6e3a1`, Tokyo Night `#9ece6a`, Nord `#a3be8c`, Dracula `#50fa7b`, Signal Night `#2fd87e`. On the dark themes `on-primary` is the scheme's darkest ground and `primary-hover` steps one notch lighter, so the label only gains contrast (6.1:1 or better). The lever is a rectangle carrying a word; a clear lamp is a disc with a glyph. Shape and label keep them apart.

### Secondary
- **Aqua Selection** (`accent`, `accent-hover`, `accent-tint`): focus outlines, caret, links, the draft qualifier after `@`, ghost buttons, cell hover and the editing cell. `lit` and `lit-strong` are its row tints. `lit` marks Rules matched by the selected Test Case, and `lit-strong` marks the winning Rule and text selection.

### Tertiary (signals)
- **Signal Green** (`clear`, `clear-ink`, `clear-tint`): a lock that is clear, a passing Test Case, a hit cell, the winner's route number, an added row in compare mode, and the free lever's lock plate.
- **Signal Red** (`stop`, `stop-ink`, `stop-tint`): a blocking lock, a failing Test Case, a missed cell, a conflict row, a removed row (hatched), cell errors and the danger hover on delete. `stop-fill` and `on-stop` are the pair for a red fill that carries text, such as the conflict row's route number. By default they equal `stop` and `on-signal`; a theme overrides them when its canonical red cannot hold text (Nord darkens the fill and sets white text).
- **Signal Amber** (`caution`, `caution-ink`, `caution-tint`): a lock that needs acknowledgement, a changed cell, Stale and Breaking Change warnings, and the caution banner.
- `on-signal` and `on-caution` are the glyph and number colours on a lit lamp. `-ink` is the variant for text and `-tint` is the variant for fills.

### Neutral
- **Sheet / Paper** (`sheet`, `paper`): the drawing surface and the page under it. They are identical in the dark themes. In Bản vẽ, paper is a hair off white under a white sheet.
- **Panel** (`panel`, `panel-2`): table heads, the lever bay, hover fills, disabled controls and the idle lamp.
- **Rule** (`rule`, `rule-strong`): row hairlines, and the stronger lines that divide cells and column groups.
- **Ink ladder** (`ink`, `ink-2`, `ink-3`): primary text, secondary text, and muted text (placeholders, `context` rows, the "any" dash).
- **Shell Rail** (`rail`, `rail-deep`, `rail-line`, `rail-ink`, `rail-ink-2`): the left navigation rail. In the dark themes it is one step darker than the sheet. In Bản vẽ it is a committed drawing blue. It also sets the browser's `theme-color`. Everything in the rail is drawn from these tokens: the two-pip brand mark (a filled `rail-ink` pip over a `rail-ink` ring) and the LATEST marker (`rail-ink` ground, `rail` text) are neutral.
- **Utility** (`row-hover`, `toast-bg` / `toast-ink`, `lever-lock` / `on-lever-lock`): the row hover fill, the single toast surface and its text, and the locked lever's lock plate and padlock glyph.

### Themes
| Theme id | Label | Source |
|---|---|---|
| `signal-night` | Signal Night | themes.css (the console's own dark) |
| `gruvbox` (default) | Gruvbox Material Mix | themes.css, mapped from the owner's VS Code theme |
| `catppuccin` | Catppuccin Mocha | themes.css |
| `tokyonight` | Tokyo Night | themes.css |
| `nord` | Nord | themes.css |
| `dracula` | Dracula | themes.css |
| `drawing` | Bản vẽ (sáng) | tokens.css base, no `data-theme` attribute |

Each theme's selector swatch is its background beside its accent, never a signal colour. Resolution order: the `?theme=` URL parameter, then the viewer's stored choice (localStorage `bre-console-theme`), then `gruvbox`. The theme is applied to `<html data-theme>` before React's first render, and `theme-color` is set from the resolved `--rail`. An explicit choice in the selector is saved and strips `?theme=` from the URL. The dark themes set `color-scheme: dark` and a deeper `--shadow-pop`.

### Named Rules
**The Signal Reservation Rule.** Red, amber and green are reserved for state, in every theme. Shell, accent, brand marks, theme swatches and markers such as the Latest Pointer never reuse them. The one exception is `primary`, which is the theme's own green by the owner's choice. It always carries a text label and is a rectangle, never a disc, so it does not read as a lamp. Each theme uses its own scheme's red, yellow and green for the lamps.

**The Lamp, Glyph and Word Rule.** State is never carried by colour alone. Every lamp has its glyph (check, cross, warning triangle, spinner, dash), and the caller always places a text label beside it.

**The One Map Rule.** A theme overrides semantic tokens and nothing else. Components reference tokens, never a theme's hex. Text clears 4.5:1 and lamp glyphs clear 3:1 against their ground in every theme. When a scheme's canonical colour misses that bar, it is lifted (or, for a fill that carries text, darkened) and marked `derived` in themes.css; the canonical hue stays wherever it does not carry text.

## Typography

**Display / Technical Font:** Barlow Semi Condensed (500, 600, 700), with Be Vietnam Pro and system-ui as fallbacks
**Body Font:** Be Vietnam Pro (400, 500, 600), with system-ui as fallback
**Mono Font:** JetBrains Mono (400, 500), with ui-monospace as fallback

**Character:** The condensed letter is the draughtsman's lettering on the drawing. It is tight, upright and often tracked uppercase. Be Vietnam Pro carries Vietnamese prose with full diacritic support. JetBrains Mono appears only where the text is code.

### Hierarchy
- **Display** (600, 1.75rem, 1.1): the identifier headline `decisionId@draft` and the Test Case pass count. It drops to 1.25rem below 600px.
- **Headline** (600 to 700, 1.25rem, 1): the rail wordmark and the titles of screen states.
- **Title** (600, 1rem, tracked 0.04em, uppercase): strip heads such as TEST CASE.
- **Figure** (600, 0.875rem, tabular): route numbers, hit counts and numeric outputs.
- **Body** (400 to 500, 0.875rem, 1.45): UI text, values and buttons. Table cells use 0.8125rem.
- **Body small** (400, 0.75rem): notes, lock details, descriptions, banners and the theme select.
- **Label** (600, 0.6875rem, tracked 0.07em, uppercase): title-block field names, column-group and column heads, tags, rail section labels and lock labels (lock labels use 0.75rem and 0.04em tracking).
- **Code** (400 to 500, 0.8125rem): condition expressions, Rule ids, Decision ids and input field names.

Scale: a fixed rem scale with a ratio of about 1.2 (0.6875, 0.75, 0.8125, 0.875, 1, 1.25, 1.75rem). There is no fluid type.

### Named Rules
**The Three Hands Rule.** Technical lettering is for the drawing's labels and identifiers. UI sans is for prose. Mono is only for expressions and ids, never for labels or sentences.

**The Tabular Rule.** Tabular numerals are on everywhere: the body sets `tnum` and the table sets `tabular-nums`. Numeric columns are right-aligned.

## Layout

**The Decision Workspace.** Every screen is built from the same five slots, and a new screen only fills them; it never invents its own frame. The layout was chosen on 2026-10-10 from three wireframed candidates (fixed drawing frame, Decision workspace, focus canvas) and replaced the earlier 248–264px Decision rail and Test Case strip frame. `components/Workspace.tsx` draws the four slots inside `main`; `components/ShellNav.tsx` is the shell nav.

| Slot | Class | Holds | Never holds |
|---|---|---|---|
| Shell nav | `.shell` | Global destinations: Decisions, the theme select (Import/Export joins when built) | Draft or Decision state |
| Context head | `.screen__head` | The title block (identifier headline, Decision/version picker, actions, ruled cells) and the tab row | Content that scrolls |
| Primary | `.screen__primary` | The one object being worked on: the Rules Table, Simulation results, the version history, the schema | A second object of equal weight |
| Inspector | `.screen__inspector` | What explains the primary: Test Cases, Evaluation Trace, the open Rule, a version diff | Navigation or commit actions |
| Commit bar | `.screen__commit` | The one irreversible action of the scope: the interlock and Publish lever on a Draft, Rollback on a Published version | Anything else |

Desktop grid (1200px and wider):

```
┌────┬────────────────────────────────────────────┐
│    │ context-head · title block                 │
│ 56 ├────────────────────────────────────────────┤
│    │ tabs: Rules · Test Case · … · Schema       │
│ s  ├─────────────────────────────┬──────────────┤
│ h  │ primary                     │ inspector    │
│ e  │                             │ 340 / 300    │
│ l  ├─────────────────────────────┴──────────────┤
│ l  │ commit-bar · interlock → Publish lever     │
└────┴────────────────────────────────────────────┘
```

- **Shell nav** is a 56px icon rail on `rail`, full height, ruled like the sheet: the two-pip brand mark (home), then Decisions, then at the foot a palette button that opens a popover on `rail` holding the theme select and the mock-API footnote. Each icon has an `aria-label` and a tooltip; the current destination fills `rail-deep` with a 2px inset `rail-ink` edge. The Decision list lives on the Decisions screen (home) and the Drafts and versions of the open Decision in the scope picker.
- **Tabs** are scoped to one Decision and keep one order on every Decision: Rules, Test Case, Simulation, Version, Schema. Rules, Version and Schema are built; Test Case and Simulation take their places in that order when their screens exist. The tab is part of the route (`#/d/:id/draft/:draft/versions`, Rules has no suffix), and switching tabs keeps the Draft's state. Labels are the domain terms as written in CONTEXT.md, in technical uppercase, with a 2px `accent` underline on the current tab.
- **Inspector** is 340px from 1600px and 300px below, with a `rule-strong` left rule. Its content follows the tab: Rules → the Test Case strip, with the Rule panel floating over it; Version → what the open Draft or version would change if it replaced Latest (Thêm / Sửa / Bỏ counts and the touched Rule ids); Schema → a real Fact from the first Test Case, as JSON.
- **Commit bar** belongs to the Draft or version, not to a tab, so it stays put when the tab changes: the author always sees why Publish is blocked. The Decisions screen, which has no Decision in scope, has no tabs, no inspector and no commit bar: a plain title block over one ledger of Decisions (id, title, Hit Policy, Latest Pointer, Drafts with their stale tag).

One page gutter (`--gutter`: 32px from 1600px, 24px below, 16px below 960px) is used by the context head and the primary column on both sides; the inspector keeps a 20px inner padding (14px below 960px). The title block's ruled cells run edge to edge from the shell nav's edge to the page edge as a six-column grid in which wide cells span two columns.

**One scroller per region.** At 1200px and wider, on screens at least 720px tall, the screen is a fixed 100dvh shell: the context head, then a body row where the primary and the inspector each scroll on their own, then the commit bar in flow. Shorter or narrower screens fall back to page scroll, with the table frame capped at the viewport height.

The table scrolls inside its frame, with a sticky head and thin themed scrollbars; sideways overscroll is contained so a trackpad swipe never navigates back. The output group and the Match column are always pinned on the right, in every Decision and at every width that shows the table, so the result of a Rule never scrolls away. The route number column (64px) is always pinned on the left; the identity plate joins it only while at least 200px is left for conditions, otherwise it scrolls with the conditions. Only conditions ever travel sideways. Pinned edges cast a soft side shadow while the table overflows.

Responsive steps. Each step makes one structural change, so the same screen reads the same way at every size:
- **Below 1600px:** the inspector narrows to 300px and the gutter to 24px.
- **Below 1200px:** the inspector leaves the grid and becomes a drawer over the right edge of the primary (up to 340px, `--shadow-pop`, no backdrop, Escape closes and returns focus). It opens when a Rule or Test Case is selected, or from a toggle at the end of the tab row that carries the inspector's summary (on Rules, the pass-count lamp and "8/9 pass"), so the Test Case result stays visible while the drawer is shut. The title block becomes three columns, and the interlock drops its title and shows its locks in a 2×2 grid.
- **Below 960px:** the gutter is 16px and the tab row scrolls sideways inside itself. The 56px shell nav stays.
- **Below 600px:** the shell nav becomes a 48px top bar (brand left, icons right, the popover drops below). The tab row moves to a fixed bottom tab bar (56px plus `safe-area-inset-bottom`, the current tab marked by a 2px top edge) with the inspector toggle as its last cell, the commit bar sits sticky directly above it in one condensed line (the lock lamps, whose labels stay for assistive tech, then the lever and its reason), and the inspector becomes a bottom sheet up to 75dvh. Phone is read-only: the mode toggle hides and the Rules Table becomes the phone RuleList.

Wireframes of all three candidates, on the Decision Table, Simulation and Version screens at every size, are kept at https://claude.ai/artifact/Vhwac8RYcPnuz7xNPFQBV8 (private to the owner).

**Ledgers.** Screens that list records (Decisions, Version, Schema) use one ledger grammar: a technical uppercase section title with a muted count, a 1px `--line` frame on `sheet`, label heads, `rule` row hairlines, mono accent ids that link, the current row on `lit`, and right-aligned tabular dates.

Spacing follows a 4px rhythm (4, 8, 12, 16, 24, 32, 48px) written as literal values in the CSS; there is no spacing token scale. Density is high: cells are at least 40px tall, buttons are 34px, and the lever is 44px.

### Named Rules
**The Five Slots Rule.** A screen is shell nav, context head, primary, inspector and commit bar, in that order in the DOM and in focus order, at every size. A new screen fills the slots; it does not add a sixth region or move one.

**The Commit Bar Follows the Draft Rule.** The interlock and Publish lever belong to the Draft, not to the Rules tab. Switching tabs never hides why Publish is blocked.

**The Pinned Result Rule.** A Rule's route number and its outputs never scroll out of view, the same way in every Decision. The identity plate pins only when conditions keep at least 200px.

## Elevation & Depth

The system is flat and ruled. Depth is drawn with hairlines and tonal panels: sheet, then panel, then panel-2. Shadows appear only where something floats over or is pinned above scrolling content.

### Shadow Vocabulary
- **Pop** (`--shadow-pop`: `0 6px 18px -6px rgb(22 24 29 / 0.28), 0 2px 4px -1px rgb(22 24 29 / 0.12)`, deepened to black 0.6 / 0.4 in the dark themes): toasts only.
- **Pinned edge** (`±10px 0 10px -10px rgb(0 0 0 / 0.22)`): sticky identity and output columns while the table overflows. Black-based so it still reads on dark themes.
- **Interlock lift** (`0 -10px 16px -12px rgb(0 0 0 / 0.35)`): the interlock row's top edge.
- **Drag** (`0 8px 14px -10px rgb(22 24 29 / 0.45)`): a Rule row while it is being dragged.
- **Lamp bezel** (`inset 0 -2px 0 rgb(0 0 0 / 0.18)`): lit lamps only. Idle and pending lamps are flat.

### Named Rules
**The Drawn Line Rule.** Structure is ruled, not lifted, and every line is 1px. Use `rule-strong` for the frames of the sheet's main objects and the interlock top edge, `--line` inside the table (frame, heads, the inputs | outputs seam), and `rule` hairlines for rows. Never draw a line in `ink`: on dark themes it reads as a glare, not a rule. Major divisions are made by tone (the output band), not by stroke weight.

## Shapes

Corners are nearly square: 2px for tags, route numbers, cell inputs and small plates, and 3px (`--radius`) for buttons, banners, toasts, the mode toggle, the lever and the select. Lamps are the only round shapes. A removed Rule in compare mode is hatched with 45° stripes of `stop-tint` on `sheet`, the drawing-office mark for deletion. Condition trees too large for one cell sit in a dashed-border plate.

## Components

### Buttons
- **Shape:** near-square (3px), 34px tall, label in 500-weight UI sans, with an optional 16px line icon before it.
- **Primary:** `primary` fill with `on-primary` text.
- **Secondary:** `sheet` fill with a `rule-strong` border. Hover moves to `panel`.
- **Ghost:** transparent with `accent` text. Hover fills `accent-tint`.
- **Disabled:** `panel-2` fill with `ink-3` text and a not-allowed cursor.
- **Icon button:** a 28px square in `ink-3`. Hover fills `panel`. The danger variant hovers to `stop-tint` / `stop-ink`.
- **Mode toggle:** a segmented control framed in 1px `rule-strong`. The pressed segment inverts to an `ink` fill with `sheet` text.
- **Transitions:** background, border and colour over 150ms with `--ease-out`. Focus is a 2px `accent` outline offset by 2px.

### Tags
- **Style:** an 18px plate with 2px corners and a 1px `rule-strong` border, labelled in technical uppercase. Signal variants use `-tint` fills, `-ink` text and a border of 45 to 55% of the signal colour.
- **Use:** Hit Policy, LATEST, VÀO OUTPUT, KHÁC LATEST and similar flags.

### Lamps
- **Sizes:** 22px (md, 13px glyph) and 16px (sm, 10px glyph).
- **States:** clear (check), stop (cross), caution (warning triangle, `on-caution` glyph), pending (spinner on `panel-2`, rotating every 900ms), and idle (dash on `panel-2`).
- **Behaviour:** the fill changes over 200ms. Lamps are `aria-hidden`, and their label is always adjacent text.

### Title Block
The head of the drawing: the identifier headline with its accent `@draft` qualifier, a subtitle line, and actions on the right. Beneath them sits a six-cell ruled grid that runs full width, flush to the rail edge and the page edge: the head's bottom rule is the grid's top edge, it closes with a bottom rule, and the cells are stations on one route: a 2px `rule-strong` track runs through every cell at a stop row under the labels, each cell marks its stop with a 12px ring (the Draft's ring is filled `accent`, where the route starts), a cell with a lamp puts the lamp on the track in place of its ring, and short `rule` joins start below the labels so the track reads as continuous. An `accent` pulse travels the track in a loop: 3.2s of travel, then a 1.8s rest (hidden under reduced motion). Cells that open a row carry the page gutter, so their text lines up with the identifier while every rule runs edge to edge. The screen body sits flush under the title block, so the Test Case strip's left rule meets the grid's bottom rule; the table column keeps the page gutter as its top inset too, and page banners (narrow, compare, published) live inside the table column rather than between the title block and the body. Each cell has an uppercase label, its stop, a value, and an optional muted note.

### Rules Table (signature)
- **Frame:** a 1px `--line` border on `sheet`. The head rows sit on `sheet`: quiet group heads in `ink-3` (RULE / ĐIỀU KIỆN · INPUT / KẾT QUẢ · OUTPUT) above field heads that lead, with the field name in 600-weight mono, the type in small text, and a red required mark.
- **Columns:** pinned order (and identity, when there is room) on the left, condition cells, then the output group and the Match column on the output band (`--zone`, `panel` mixed 50% into `sheet`), each behind a 1px `--line` seam. Match is its own group (TEST CASE) with a header in the same two-line grammar as a field (name "Match", meta "số TC khớp") and its count set like a numeric output value (technical figure, 600 weight, `ink-2`; `ink-3` when zero). Row states (hover, lit, winner, conflict) still tint output cells. Rule ids are 600 weight.
- **Cell states:** *miss* (expression in `ink-3` with a red cross), *hit* (green check), *changed* (`caution-tint` fill, with the previous value struck through below), *editing* (`accent-tint` cell with a 32px mono input in an `accent` border, which turns `stop` with an error line below).
- **Row states:** *lit* (`lit`, with the route number outlined in accent), *winner* (`lit-strong`, with the route number filled `clear`), *context* (text recedes to `ink-3`), *conflict* (`stop-tint`, with the route number filled `stop-fill` in `on-stop`), *added* (`clear-tint`), *removed* (hatched, with text struck through). Inside lit and winner rows, secondary text (the "any" dash, dimmed miss expressions, struck previous values) steps up from `ink-3` to `ink-2` to hold 4.5:1 on the lit fills.
- **Ordering:** a drag handle reorders Rules for FIRST and COLLECT. The dragged row lifts with an accent top and bottom rule. Opening a Rule marks its row with an accent bottom rule and accent id, keeps that row in view inside the frame, and opens the Rule panel: a non-modal panel (`role="dialog"`, no backdrop) that floats over the inspector at the inspector's width, with a `rule-strong` left edge and a soft left shadow. The table never shrinks and stays live beside it. Its head on `panel` carries the route number, the mono id, previous/next Rule and close; below it the sentence reading, the description and the list-condition editors stack in one column and scroll on their own. Focus moves to the panel title on open. Escape inside a text area only leaves the editor (unapplied JSON is kept); Escape elsewhere closes the panel and returns focus to the row's toggle. Without the fixed shell (narrower than 1200px or shorter than 720px) the panel pins to the viewport's right edge as a floating sheet with the pop shadow.
- **Transitions:** cell background and colour change over 200ms.

### Test Case Strip
The Rules tab's inspector content. Its head is an uppercase technical title over a pass count (a 1.75rem figure in `clear-ink` or `stop-ink`, next to the word "pass"). Each Test Case row shows a lamp, a mono id, a name, and a status in technical uppercase. The active case expands to show facts, expected outputs, actual outputs and the matched Rules. Beside the table (1200px and wider) the strip can fold, from a panel icon in its head, into a 56px lamp column: the vertical title, the pass count, and one lamp plus short id per Test Case. Each lamp still selects its case and lights the table. While a Rule panel is open the folded strip widens back to the inspector width under the panel, so the panel never covers the table. The fold is a per-viewer preference kept in local storage. The strip is the Rules tab's inspector content; below 1200px it lives in the inspector drawer and does not fold, and the tab-row toggle carries its verdict (lamp plus "4/6 pass").

### Interlock Row and Publish Lever (signature)
- **Row:** the last row of the screen with a 1px `rule-strong` top edge and the interlock lift. A readout bay comes first, then four locks (Test Case present, all pass, Stale acknowledged, Breaking Change confirmed), then the lever bay on `panel`.
- **Readout:** the row's one large figure, the count of clear locks over the total ("1/4", technical 700 at 2.375rem, tabular; the count in `stop-ink` while any lock blocks and `clear-ink` once free, the "/4" in `ink-3`), over a KHOÁ ĐÃ GIẢI label. It hides below 960px, where the lever's reason line carries the count.
- **Scope:** the row is the commit bar of a Draft and stays in place on every tab. On a Published version the same bar (`.commit`) holds a LATEST POINTER title bay, a line saying where the pointer is with a small lamp, and on a `panel` bay the Rollback and "Tạo Draft" buttons, which no longer sit in the title block. Below 600px it condenses to one line above the bottom tab bar.
- **Lock:** a lamp, an uppercase label, a two-line detail and an optional action, set quiet: 500-weight `ink-2` with a 40% underline that turns `accent` on hover. Locks carry no fill; the label takes the state colour (`stop-ink`, `caution-ink`), and a clear lock recedes to `ink-3` so the blocking ones lead.
- **Lever, locked:** a 50px plate, labelled in technical uppercase at 1rem, on `panel-2` in `ink-3`, with a not-allowed cursor. The padlock plate on the left is a step of the lever's own fill (`panel-2` mixed 45% toward `sheet`, glyph `ink-2`), never a second colour. A reason line below says how many locks remain.
- **Lever, free:** the `primary` fill wipes in from the left, the text turns `on-primary`, the padlock plate darkens with it (`primary` mixed 20% toward `on-primary`, glyph `on-primary`), and the reason line turns `clear-ink`. The lever's fill is the theme's green, the same value as the clear lamp; the reason line keeps `clear-ink`. The `lever-lock` / `on-lever-lock` tokens are no longer read.
- **Release (the one authored motion):** when the last lock clears, the lamps settle in sequence (460ms each, staggered 90ms). The lever's fill then slides free (560ms after a 380ms delay) while the padlock tilts open (520ms after a 420ms delay), all on `--ease-out`.

### Toasts and Banners
- **Toasts:** stacked bottom right above the interlock on one `toast-bg` / `toast-ink` surface in every theme, with 3px corners and the pop shadow. Tone is never a toast colour: a success or failure toast leads with a small clear or stop lamp. They enter with a 220ms rise, and carry an outlined action and a close button.
- **Banners:** full-width strips above the table. *Caution* uses caution tint and ink, *compare* uses `accent-tint` with a `lit-strong` border, and *published* uses `panel`.

### Navigation (Shell nav, ScopePicker)
The shell nav is described under Layout. The theme select keeps its form inside the shell popover: a "Giao diện" label with a palette icon, then a 34px native select on `rail-deep` showing a split swatch of the current theme's base and accent.

The scope picker is the `@draft` / `@vN` qualifier of the identifier headline, set as an accent button with a chevron. It opens a menu on `sheet` with the pop shadow: a DRAFT section (mono id, title, and the "từ vN" tag, in `caution-ink` with a warning glyph when the Draft is stale) and a PUBLISHED section (newest first, the version the Latest Pointer names marked with the neutral inverse LATEST marker, `ink` ground and `sheet` text). The current scope fills `lit-strong`. Choosing an entry keeps the current tab. Escape or an outside click closes it.

### Phone RuleList
Below 600px the table becomes a read-only list framed in 1px `rule-strong`. Each Rule shows its route number, mono id and description over a definition grid of conditions and outputs. The first output is ruled off as in the table.

## Do's and Don'ts

### Do:
- **Do** route every colour through the semantic tokens so all six themes stay correct, and add a new theme only by overriding the full token map under `:root[data-theme='…']`.
- **Do** keep red, amber and green for state in every theme, and pair each lamp with its glyph and a text label.
- **Do** use `stop-fill` / `on-stop` whenever a red fill carries text, and lead a toned toast with its lamp rather than tinting the toast.
- **Do** lift a scheme colour that misses 4.5:1 for text, and mark it `derived` in themes.css.
- **Do** letter identifiers, column and group heads, counts and lamp labels in Barlow Semi Condensed, set prose in Be Vietnam Pro, and keep JetBrains Mono for expressions and ids.
- **Do** keep state transitions at 150 to 250ms on `--ease-out`, and let the release sequence be the only choreographed motion.
- **Do** keep the reduced-motion override that collapses every duration and delay to 1ms.
- **Do** keep Publish locked, with a written reason, until every interlock lamp is clear.

### Don't:
- **Don't** use a signal red, amber or green for the shell, brand mark, accent, theme swatch or a marker like LATEST in any theme, and don't give `primary` a green from outside the theme's own scheme.
- **Don't** signal state with colour alone, whether as a tinted row without a route-number change or a lamp without a label.
- **Don't** ship the category default: a neutral SaaS grid with a lone, always-clickable Publish button that explains nothing.
- **Don't** add cards, rounded containers above 3px, or decorative shadows. Divide with ruled lines.
- **Don't** use JetBrains Mono for labels, buttons or sentences.
- **Don't** add a second authored animation that competes with the lever release.
