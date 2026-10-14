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
    padding: "7px 12px 8px"
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
    padding: "6px 14px"
  lock-caution:
    backgroundColor: "{colors.caution-tint}"
    textColor: "{colors.ink}"
    padding: "6px 14px"
  lever-locked:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-3}"
    height: "40px"
  lever-free:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    height: "40px"
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
- Identifier as headline (`decisionId@draft`) over a one-line ruled title block: the route track runs through six cells, each with its stop and its label on it and its value beneath. Only the Decision Table has one; every other screen has a head of its own kind.
- The interlock row and Publish lever are the signature, with one authored release moment. The lever is the whole of its cell, and what blocks it is read on demand, not printed.
- Sections have a role (lead, evidence, reference) and say so with scale, a tick and a tonal band, never with a card.
- Motion is acknowledgement: a changed value swaps in, a row glides to its place, a lock that re-engages clicks shut. Nothing loops.
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
| Context head | `.screen__head` | The screen's head and the tab row. On the Decision Table the head is the title block (identifier headline, Decision/version picker, actions, ruled cells); other screens use a plain page head, the Theo dõi readout or the Replay slip | Content that scrolls |
| Primary | `.screen__primary` | The one object being worked on: the Rules Table, the Test Case table, Simulation results, the version history, the schema | A second object of equal weight |
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
- **Tabs** are scoped to one Decision and keep one order on every Decision: Rules, Test Case, Sơ đồ, Simulation, Version, Schema. All six are built; Test Case sits beside Rules (decided 2026-10-13) because the two are read together: a Rule edit shows its effect on the Test Cases, a failing Test Case points back at the Rules. The tab is part of the route (`#/d/:id/draft/:draft/testcases`, Rules has no suffix), and switching tabs keeps the Draft's state, including the selected Test Case. Labels are the domain terms as written in CONTEXT.md, in technical uppercase, with a 2px `accent` underline on the current tab.
- **Inspector** is 340px from 1600px and 300px below, with a `rule-strong` left rule. Its content follows the tab: Rules → the read-only Test Case strip, with the Rule panel floating over it; Test Case → the Evaluation Trace of the selected Test Case; Simulation → the Evaluation Trace of the selected Fact; Version → what the open Draft or version would change if it replaced Latest (Thêm / Sửa / Bỏ counts and the touched Rule ids); Schema → a real Fact from the first Test Case, as JSON.
- **Commit bar** belongs to the Draft or version, not to a tab, so it stays put when the tab changes: the author always sees why Publish is blocked. The Decisions screen, which has no Decision in scope, has no tabs, no inspector and no commit bar: a plain page head (title and one line) over one ledger of Decisions (id, title, Hit Policy, Latest Pointer, Drafts with their stale tag).
- **Theo dõi** (`#/monitor`, the shell nav item between Decisions and Replay) is the Integrator's live view of Callers calling Published Decisions, not scoped to a Decision: no tabs, no commit bar. The head is a **readout**, not a route band: four large tabular figures (the stream lamp with Đang nhận / Tạm dừng / Mất kết nối, Callers calling out of all, calls per minute, errors in the window, the errors in `stop-ink` when there are any) over one quiet line that says how long calls are kept in memory and the source ("Caller giả lập"); its actions are the 5 / 15 / 30 phút window and Tạm dừng, which freezes the view and counts what arrived meanwhile. The primary reads top to bottom: one lane per Decision on a shared time axis (identity · 30 stacked time bins on one scale for every lane · version split), then the Sổ lượt gọi ledger filtered by Decision, Caller, or errors and warnings. Bars served by the version the Latest Pointer held at call time are `accent`; bars served by any other version (a pinned Caller) are hatched `ink-3`, never a categorical colour; an error is a 3px `stop` tick under its bin; a Latest Pointer move is a dashed `ink` rule across the lane labelled "v7 → v6 · Rollback 13:15". The newest bin pulses on each arrival and new ledger rows slide in lit, both off under reduced motion. The inspector is the Caller roster by default (lamp, rate, each target as latest → vN or pin vN with a caution tag when behind Latest); a selected call shows its Decision Result, the Facts against the answering version's input schema, the full Evaluation Trace replayed on demand, and "Mở trong Replay", which hands the record to Replay. Aggregated latency is never shown; a call's execution time is labelled as the mock's.
- **Replay** (`#/replay`, the second shell nav item) is the Integrator's screen and is not scoped to a Decision: no tabs and no commit bar. Below 1200px its drawer toggle sits on a bare row of its own. Before a run, the primary is the pasted record (a JSON textarea that reads the record live and shows what it found or what is wrong with it) and the inspector holds illustrative sample records. After a run, the head is a **slip**: the word Replay over the Decision id with its recorded version as a plate, then one wrapped line of provenance (where the Latest Pointer is now, when it was published, when it was recorded, the request, the Hit Policy), with "Mở vN" on the right. Before a run it is a plain page head. The primary then reads, top to bottom: the verdict (one large lamp with Khớp or Lệch ở n/m mục), a check ledger (Đã ghi | Replay | Đối chiếu, each row's lamp lighting in turn), and the Evaluation Trace with a `bản ghi: …` tag on every Rule the record disagrees with. The inspector shows the recorded Facts against the version's input schema. Execution time is shown but never checked.

One page gutter (`--gutter`: 32px from 1600px, 24px below, 16px below 960px) is used by the context head and the primary column on both sides; the inspector keeps a 20px inner padding (14px below 960px). The title block's ruled cells run edge to edge from the shell nav's edge to the page edge as a six-column grid in which wide cells span two columns. There is no rule above the band (space tells it from the identifier); one rule closes it.

**One scroller per region.** At 1200px and wider, on screens at least 720px tall, the screen is a fixed 100dvh shell: the context head, then a body row where the primary and the inspector each scroll on their own, then the commit bar in flow. Shorter or narrower screens fall back to page scroll, with the table frame capped at the viewport height.

The table scrolls inside its frame, with a sticky head and thin themed scrollbars; sideways overscroll is contained so a trackpad swipe never navigates back. The output group and the Match column are always pinned on the right, in every Decision and at every width that shows the table, so the result of a Rule never scrolls away. The route number column (64px) is always pinned on the left; the identity plate joins it only while at least 320px (about three cells) is left for conditions, otherwise it scrolls with the conditions. Only conditions ever travel sideways. Pinned edges cast a soft side shadow while the table overflows, and the Rule description keeps one line (full text on hover and in the Rule panel). A condition column squeezed out between the pinned edges is never silent: an **edge marker** in the group-head row, against the pinned block on that side, names the hidden columns ("2 cột ẩn: weekday, channel") and scrolls the first into view. When the selected Test Case missed a Rule only on hidden columns, the marker takes the stop signal and names the reason instead ("ONL30 trượt ở channel"). Each Rule also reads out its own off-screen conditions under its description, in mono after a dashed "+2" count ("+2 soilMoisture < 25, airTemp ≥ 32"), with a missed one in `stop-ink` and a cross, so no Rule looks like a catch-all while its columns are out of view. Pinned text outputs (reasons, messages) keep to 140px while the table overflows, full text on hover and in the Rule panel. A cell that takes keyboard focus scrolls clear of both pinned edges, so focus is never under a pinned column.

Responsive steps. Each step makes one structural change, so the same screen reads the same way at every size:
- **Below 1600px:** the inspector narrows to 300px and the gutter to 24px.
- **Below 1200px:** the inspector leaves the grid and becomes a drawer over the right edge of the primary (up to 340px, `--shadow-pop`, no backdrop, Escape closes and returns focus). It opens when a Rule or Test Case is selected, or from a toggle at the end of the tab row that carries the inspector's summary (on Rules and Test Case, the pass-count lamp and "8/9 pass"), so the Test Case result stays visible while the drawer is shut. The title block becomes three columns.
- **Below 960px:** the gutter is 16px and the tab row scrolls sideways inside itself. The 56px shell nav stays.
- **Shorter than 820px (960px and wider):** the chrome gives its height to the table. The identifier drops to 1.25rem and shares one line with the subtitle and the drag hint leaves the policy note. (The title block's notes, the one-line locks and the 40px lever are already the default.) At 1280×720 the table then shows every Rule of a four-Rule Decision instead of two.
- **Below 600px:** the shell nav becomes a 48px top bar (brand left, icons right, the popover drops below). The tab row moves to a fixed bottom tab bar (56px plus `safe-area-inset-bottom`, the current tab marked by a 2px top edge) with the inspector toggle as its last cell, the commit bar sits sticky directly above it in one condensed line (the lock lamps, whose labels stay for assistive tech, then the lever and its reason), and the inspector becomes a bottom sheet up to 75dvh. Phone is read-only: the mode toggle hides and the Rules Table becomes the phone RuleList.

Wireframes of all three candidates, on the Decision Table, Simulation and Version screens at every size, are kept at https://claude.ai/artifact/Vhwac8RYcPnuz7xNPFQBV8 (private to the owner).

**Ledgers.** Screens that list records (Decisions, Version, Schema) use one ledger grammar: a technical uppercase section title with a muted count, a 1px `--line` frame on `sheet`, label heads, `rule` row hairlines, mono accent ids that link, the current row on `lit`, and right-aligned tabular dates.

Spacing follows a 4px rhythm (4, 8, 12, 16, 24, 32, 48px) written as literal values in the CSS; there is no spacing token scale. Density is high: cells are at least 40px tall, buttons are 34px, and the lever is 40px.

### Named Rules
**The Five Slots Rule.** A screen is shell nav, context head, primary, inspector and commit bar, in that order in the DOM and in focus order, at every size. A new screen fills the slots; it does not add a sixth region or move one.

**The Commit Bar Follows the Draft Rule.** The interlock and Publish lever belong to the Draft, not to the Rules tab. Switching tabs never hides why Publish is blocked.

**The Pinned Result Rule.** A Rule's route number and its outputs never scroll out of view, the same way in every Decision. The identity plate pins only when conditions keep at least 320px; a hidden condition column always announces itself at the pinned edge, and its conditions are read out on each Rule.

**The Section Role Rule.** A section on a screen is one of three, and says which by scale and tone, never by a card. *Lead* is the work the screen exists for, one per screen: its head at `t-xl` in 700, a 28×2px `accent` tick above it, its count a tabular figure. *Evidence* is what the work produced (a result table, a trace, the ledger of calls): it sits on the quiet output band (`--panel`, a `rule-strong` rule above), so its tables stay `sheet` on it, the same tonal step that tells outputs from inputs inside a table. *Reference* is what the author looks things up in (the published versions list): its head steps down to `t-base`, 500, sentence case, `ink-2`. Classes: `.section-title.is-lead`, `.section-title.is-ref`, `.sect-band`.

**The Evidence Is Not a Lock Rule.** Simulation and a Fact Batch inform Publish; they never gate it. The interlock's locks are computed from Test Cases, Stale and Breaking Change only, and a batch's changed count reaches the commit bar solely as a caution line in the release bay.

## Elevation & Depth

The system is flat and ruled. Depth is drawn with hairlines and tonal panels: sheet, then panel, then panel-2. Shadows appear only where something floats over or is pinned above scrolling content.

### Shadow Vocabulary
- **Pop** (`--shadow-pop`: `0 6px 18px -6px rgb(22 24 29 / 0.28), 0 2px 4px -1px rgb(22 24 29 / 0.12)`, deepened to black 0.6 / 0.4 in the dark themes): toasts, and the two things that open over the commit bar on demand: a lock's popover and the lever's reason.
- **Pinned edge** (`±10px 0 10px -10px rgb(0 0 0 / 0.22)`): sticky identity and output columns while the table overflows. Black-based so it still reads on dark themes.
- **Drag** (`0 8px 14px -10px rgb(22 24 29 / 0.45)`): a Rule row while it is being dragged.
- **Lamp bezel** (`inset 0 -2px 0 rgb(0 0 0 / 0.18)`): lit lamps only. Idle and pending lamps are flat.

### Named Rules
**The Drawn Line Rule.** Structure is ruled, not lifted, and every line is 1px. Use `rule-strong` for the frames of the sheet's main objects and the interlock top edge, `--line` inside the table (frame, heads, the inputs | outputs seam), and `rule` hairlines for rows. Never draw a line in `ink`: on dark themes it reads as a glare, not a rule. Major divisions are made by tone (the output band), not by stroke weight.

**The Double Seam Rule.** When a division must outrank `--line` (the seam between Rules and the outcomes that are not Rules in the Rule impact table), it is drawn as two 1px `rule-strong` lines (a 3px double border), never as one heavier stroke, so the line weight stays one.

## Shapes

Corners are nearly square: 2px for tags, route numbers, cell inputs and small plates, and 3px (`--radius`) for buttons, banners, toasts, the mode toggle, the lever and the select. Lamps are the only round shapes. A removed Rule in compare mode is hatched with 45° stripes of `stop-tint` on `sheet`, the drawing-office mark for deletion. Condition trees too large for one cell sit in a dashed-border plate.

## Components

### Buttons
- **Shape:** near-square (3px), 34px tall, label in 500-weight UI sans, with an optional 16px line icon before it.
- **Primary:** `primary` fill with `on-primary` text.
- **Secondary:** `sheet` fill with a `rule-strong` border. Hover moves to `panel`. The **danger secondary** (`btn--secondary-danger`, a Test Case's Xoá beside its primary Sửa) keeps the frame with `stop-ink` text and hovers to `stop-tint` with a `stop-ink` border.
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
The head of the Decision Table drawing: the identifier headline with its accent `@draft` qualifier, a subtitle line, and actions on the right. Beneath them sits a six-cell ruled band that runs full width, flush to the rail edge and the page edge. It is one line of the route: a 1px `rule-strong` track runs through every cell, and each cell puts its **stop** and its **label on the track** (the label knocks the line out behind it with a `sheet` ground), with its value beneath. A stop is a 10px ring (the Draft's is filled `accent`, where the route starts); a cell with a lamp puts the lamp on the track in place of its ring. Short `rule` joins between cells start below the top so the track reads as continuous. The band is about 56px tall, has no rule above it (the space under the identifier does that) and closes with a `rule-strong` bottom rule. Cells that open a row carry the page gutter, so their text lines up with the identifier while every rule runs edge to edge. The screen body sits flush under the title block, so the Test Case strip's left rule meets the band's bottom rule; page banners live inside the table column rather than between the title block and the body.

A cell's note is not printed. The cell's hover text carries the value and the note together (a clipped value is always readable), and assistive tech reads the note.

**Motion is acknowledgement.** On arrival the cells report in left to right, 40ms apart, once (about 0.4s); there is no travelling pulse and nothing loops. After that, a cell whose content changed says so: its value swaps in (180ms) and its stretch of the track lights `accent` and cools (900ms). Under reduced motion the swap is a fade and the track only changes colour.

Only the Decision Table has this band. The Decisions and Replay-before-run screens use a plain page head, Theo dõi a readout, and Replay-after-run a slip; borrowing the route band elsewhere is what made every screen open the same way.

### Rules Table (signature)
- **Frame:** a 1px `--line` border on `sheet`. The head rows sit on `sheet`: quiet group heads in `ink-3` (RULE / ĐIỀU KIỆN · INPUT / KẾT QUẢ · OUTPUT) above field heads that lead, with the field name in 600-weight mono, the type in small text, and a red required mark.
- **Columns:** pinned order (and identity, when there is room) on the left, condition cells, then the output group and the Match column on the output band (`--zone`, `panel` mixed 50% into `sheet`), each behind a 1px `--line` seam. Match is its own group (TEST CASE) with a header in the same two-line grammar as a field (name "Match", meta "số TC khớp") and its count set like a numeric output value (technical figure, 600 weight, `ink-2`; `ink-3` when zero). Row states (hover, lit, winner, conflict) still tint output cells. Rule ids are 600 weight.
- **Cell states:** *miss* (expression in `ink-3` with a red cross), *hit* (green check), *changed* (`caution-tint` fill, with the previous value struck through below), *editing* (`accent-tint` cell holding the cell editor, below).
- **Cell editor:** an operator picker (a native select in mono, the operators valid for the field type: = ≥ > ≤ < ≠ khoảng in not in bất kỳ) beside a 32px mono text input in an `accent` border. Typing stays first-class and the picker follows what is typed (≥ ≤ ≠ = are read as typed too). The editor opens on the table's own reading ("≥ 1.000.000", not the stored ">= 1000000"), and an edit that parses to the same condition is no edit. Grouped thousands read as whole numbers either way round (1.000.000 or 1,000,000); a lone comma is the decimal mark. A bare typed value keeps the cell's previous operator rather than turning into `=`, and says so. Enter and Escape return focus to the cell. Under the cell a tip hangs on the same `accent` border: "Lưu thành ≥ 800.000" (or "Giữ toán tử ≥, lưu thành …"), then the grammar hint for the field type in `ink-3`. An invalid entry replaces the preview with the error in `stop-ink` and turns the input border `stop`. Enter or leaving the editor commits, Escape restores.
- **Row states:** *lit* (`lit`, with the route number outlined in accent), *winner* (`lit-strong`, with the route number filled `clear`), *context* (text recedes to `ink-3`), *conflict* (`stop-tint`, with the route number filled `stop-fill` in `on-stop`), *added* (`clear-tint`), *removed* (hatched, with text struck through). Inside lit and winner rows, secondary text (the "any" dash, dimmed miss expressions, struck previous values) steps up from `ink-3` to `ink-2` to hold 4.5:1 on the lit fills.
- **Ordering:** a drag handle reorders Rules for FIRST and COLLECT. The dragged row lifts with an accent top and bottom rule. Opening a Rule marks its row with an accent bottom rule and accent id, keeps that row in view inside the frame, and opens the Rule panel: a non-modal panel (`role="dialog"`, no backdrop) that floats over the inspector at the inspector's width, with a `rule-strong` left edge and a soft left shadow. The table never shrinks and stays live beside it. Its head on `panel` carries the route number, the mono id, previous/next Rule and close; below it the sentence reading, the description and the list-condition editors stack in one column and scroll on their own. Focus moves to the panel title on open. Escape inside a text area only leaves the editor (unapplied JSON is kept); Escape elsewhere closes the panel and returns focus to the row's toggle. Without the fixed shell (narrower than 1200px or shorter than 720px) the panel pins to the viewport's right edge as a floating sheet with the pop shadow.
- **Transitions:** cell background and colour change over 200ms. When a Rule is added, removed or duplicated, the rows below glide to their new place (200ms, 22ms apart) and a new Rule slides in from the left; a drag's drop does not glide, since the dragged rows already sit where they land. Reduced motion skips it.

### Test Case Tab
Where Test Cases are added, edited and deleted (since 2026-10-13; before that the Rules tab's strip did it). The primary is one table in the Rules Table's grammar: 1px `--line` frame on `sheet`, a sticky two-row head (technical uppercase group heads TEST CASE · FACTS · INPUT · KỲ VỌNG · HIT POLICY · DRAFT TRẢ VỀ over mono field names with type and unit in `ink-3` and a red required mark), `rule` hairlines between Test Cases, tabular numbers right-aligned. Kỳ vọng, the Hit Policy column and the verdict sit on the output band (`--zone`), so expectation and answer read as one block.

**The answer band takes the Hit Policy's shape** (decided 2026-10-14: one presentation for all four policies hid what COLLECT's several rows and the other policies' choice of Rule mean). The tab head carries the policy plate (the Rules Table's ink plate) and one sentence on how to read it; the plate repeats in the HIT POLICY group head. The **Hit Policy column** (200 to 260px) is pinned right beside the verdict, behind a 1px `--line` seam, so how the policy answered never scrolls away; its field head names the column per policy (Rule thắng · match đầu tiên, Rule match · tối đa một, Rule thắng · weight cao nhất, Rule góp dòng · khớp · thiếu · thừa). Rule ids in it are **Rule plates**: mono `t-xs` in a 1px `rule-strong` frame with 3px corners, the Rule's description on hover. The deciding Rule is filled `ink` with `sheet` text; a Rule the policy set aside (shadowed, outweighed, or a line nobody asked for) is a dashed frame in `ink-3`; a UNIQUE conflict is `stop-tint` with `stop-ink`.
- **FIRST:** the winner's plate, then its row in the Rules Table in technical uppercase `ink-3` (HÀNG 3), and under it "che" followed by the matched Rules it shadowed.
- **UNIQUE:** the one matched Rule with "1 / tối đa 1"; two or more read as red plates over "2 Rule cùng match, vượt giới hạn một" in `stop-ink`.
- **PRIORITY:** a **weight ladder**: the matched Rules ranked by weight, each a plate, a 6px bar scaled to the heaviest weight in the Rule Set (`rule-strong` on a `rule` track, the winner's in `ink`) and the weight in the technical figure; four at most, then "và 2 Rule nữa".
- **No match:** "Không Rule nào match" in `ink-3`; before a run, "–" or "Đang chạy".
- **Single-line policies (FIRST, UNIQUE, PRIORITY):** one table row per Test Case, Kỳ vọng in its output cells. A cell the subject disagrees with keeps the expected value and adds the subject's own beneath it in `stop-ink` ("Draft **20 phút**", the value in the technical 700 hand), so a failing row says which field went wrong without opening the trace. An expectation of no output or an error that came back with a row adds "Draft trả về …" to the verdict.
- **COLLECT:** each Test Case is a **set**: its own `tbody`, one table row per output line, expected and returned lines paired by value (expected order first, then what came back unasked). Identity, Facts and verdict span the set; lines inside it are ruled by a dashed `rule` hairline, the set's edge by the solid one. The identity cell adds the expectation's size (KỲ VỌNG 3 DÒNG, KỲ VỌNG TẬP RỖNG). Each line's Hit Policy cell carries the line **mark**: a sm lamp, KHỚP (`clear-ink`), THIẾU (`stop-ink`) or THỪA (`caution-ink`) in technical uppercase, the plate of the Rule that returned the line, and for a missing or extra line its values in mono under the mark, so the pinned column alone tells the story. Missing lines also read in `stop-ink` and extra ones in italic `caution-ink` in the output cells. A set with no lines reads "tập rỗng" across the outputs. The verdict counts "3/4 khớp".
- **Rows:** the identity cell, pinned left (180 to 240px), holds the lamp and mono id as the Test Case's select button over the name. The verdict cell, pinned right at 184px, reads the status in technical uppercase (`clear-ink` Pass, `stop-ink` Fail or Lỗi), the count, the pencil and delete icons, an evaluation error's message, and KHÁC LATEST as a tag. Facts and Kỳ vọng's output cells scroll sideways between the pinned edges. Below 720px only the identity stays pinned.
- **Failing rows tint:** a failing or erroring Test Case tints all its rows (`stop-tint` 55% into `sheet`, the verdict cell full `stop-tint`), so it stands out without being picked. The selected Test Case takes `accent-tint` and its id button `lit-strong`; a failing verdict cell keeps its red.
- **Editing in place:** on a Draft at 960px and wider, a Fact cell, the name, and every expected output value are buttons that turn into an input sized to the value (accent border, `paper` fill): the single row of FIRST, UNIQUE and PRIORITY, and each expected line of a COLLECT set. A line emptied of every value leaves the expectation. Enter or leaving the cell saves, Escape restores; a wrong value keeps the input open with the reason under it in `stop-ink` ("“abc” không phải số", "Trường bắt buộc"), and a saved edit re-runs Simulation. A COLLECT line's mark ends in one icon action: an extra line offers "Nhận vào Kỳ vọng" (list-plus), a missing line "Bỏ khỏi Kỳ vọng" (list-x, danger hover). A required Fact the Test Case lacks shows a red dash and a THIẾU flag. Deleting is the danger icon in the verdict cell: at once, with an undo toast, focus to the next Test Case.
- **Editor (out of the table):** anything a cell cannot hold (list Facts, a new expected line, "không có output", an expected error), the pencil icon, and "Thêm Test Case" open the **editor**, which takes the table's place (decided 2026-10-13: the in-table form row was too cramped). A 220px list on a faint `panel` wash runs down the left: "← Bảng Test Case" back to the table, then one row per Test Case (lamp, mono id, the name on one line), the open one on `lit-strong`, and "Thêm Test Case" at its foot; picking a row switches the editor and the trace to it. The rest is the editor: a head ruled in `rule-strong` (SỬA TC-01 in the technical hand with the id in mono, the current verdict with its lamp, "khác Latest" when it applies, and a danger-secondary Xoá at the right), then the Test Case form in its **wide layout**: the name across the top (max 40rem), Facts and Kỳ vọng side by side (each Fact on one line, its mono name, required mark and label in a 8 to 12rem column beside the value; Kỳ vọng opens with the Draft hiện trả về box), and the Lưu / Huỷ row pinned to the bottom of the editor on `sheet` above a `rule` hairline. Under 44rem of editor width the two groups stack. Saving or Huỷ returns to the table with focus on that row. The list and the editor each scroll on their own inside the fixed shell; the trace stays in the inspector.
- **Head:** the technical title TEST CASE beside the pass count ("4/6" at `t-xl` in `clear-ink` or `stop-ink`, then "pass"), over one `ink-3` line: how editing works, "Simulation đang chạy…", the Simulation error, or why the table is read-only.
- **Inspector:** the Evaluation Trace of the selected Test Case (the Simulation tab's inspector), with "Soi trong bảng Rules", which opens the Rules tab with the Test Case lighting the table. Below 1200px picking a row opens the drawer.
- **Read-only:** a Published version shows the same table with its own label ("v3 trả về", "v3 thiếu") and the trace; Test Cases are edited only in a Draft. A narrow screen (below 960px) is read-only too.
- **Empty:** a framed note says what a Test Case is and that Publish needs at least one, all passing, with "Thêm Test Case đầu tiên" (primary).

### Test Case Strip
The Rules tab's inspector content, read-only since the Test Case tab took over editing: it keeps the edit-and-see loop (change a Rule, watch the lamps) without a second place to edit. Its head is an uppercase technical title over a pass count (a 1.75rem figure in `clear-ink` or `stop-ink`, next to the word "pass"). Each Test Case row shows a lamp, a mono id, a name, and a status in technical uppercase; picking one lights the Rules Table. The active case expands to its Facts, then one **read-back list** of Kỳ vọng against Draft trả về ("Kỳ vọng = Draft trả về" or "Kỳ vọng ↔ Draft trả về" with an "x/y khớp" count at the end of the label's hairline): each row is a tinted band, `clear-tint` matched, `stop-tint` missing from the Draft, `caution-tint` extra in the Draft, led by its lamp and ended by KHỚP / DRAFT THIẾU / DRAFT THỪA in technical uppercase; in the narrow strip that flag drops under the values. When either side is an error, or nothing has run, Kỳ vọng and Draft trả về list separately. The matched Rules and any warnings follow, then one secondary link, "Sửa ở tab Test Case" ("Xem ở tab Test Case" on a Published version or a narrow screen), which opens the Test Case tab with the same case selected; with no Test Cases the empty note links "Thêm ở tab Test Case". A Test Case button gives under the press (scale 0.985, the lamp lifts), the chosen one draws a 2px `accent` underline in from the left (220ms), and when a run changes its verdict the status and tags swap in and the lamp flips in (reduced motion: a fade). Test Cases are shared by every Draft of the Decision, so the release bay lists the ones deleted in the session.

**Test Case form** (add and edit, in the Test Case tab's editor in its wide layout; stacked in the Simulation trace's "Lưu thành Test Case"): built from the input schema, never raw JSON except for list fields. Each Fact is a labelled row (mono field name, label and unit in `ink-3`, red required mark) with a typed control: text in mono for numbers and strings, a select for booleans, a small JSON area for lists with the item fields named below. A blank optional field means the Fact lacks it. The Kỳ vọng group opens with a dashed **Draft hiện trả về** box that evaluates the typed Facts against the Draft as edited and offers "Dùng làm kỳ vọng"; adopting is always explicit, and a new Test Case cannot be saved until the author has said what to expect (output rows, "Không có output", or for UNIQUE the evaluation error). Output rows are small ruled cards of one input per output field; COLLECT may hold several, other Hit Policies one. Beside the table (1200px and wider) the strip can fold, from a panel icon in its head, into a 56px lamp column: the vertical title, the pass count, and one lamp plus short id per Test Case. Each lamp still selects its case and lights the table. While a Rule panel is open the folded strip widens back to the inspector width under the panel, so the panel never covers the table. The fold is a per-viewer preference kept in local storage. Below 1200px the strip lives in the inspector drawer and does not fold, and the tab-row toggle carries its verdict (lamp plus "4/6 pass").

### Simulation Tab
The Simulation tab's primary answers "if I Publish, which results change, and why" on the same route numbers the author just edited. Top to bottom: the source bar, the readout, the Rule impact table, then the Fact ledger; the Evaluation Trace of the selected Fact is the inspector, and the commit bar is the interlock, unchanged. At 1200px and wider on screens at least 720px tall the primary scrolls on its own beside the trace; the impact table keeps every Rule and pseudo-row and has no scroller of its own. A run that no longer describes the Draft says so in a banner with "Chạy lại"; a failed run raises a stop banner (`stop-tint`, `stop-ink`, a 45% `stop` border).

- **Source bar:** one ruled strip (1px `--line` frame on `sheet`) of cells divided by `rule` hairlines, each led by a label in technical uppercase `ink-3`: NGUỒN, a mode toggle (Tất cả / Test Case / Fact Batch, each with its count in the technical figure, `ink-3`, softened on the pressed segment); FACT BATCH, the file name in 600 mono, a caution-ink "skipped rows" disclosure that opens a small `sheet` popover, and icon buttons to replace (refresh) or drop (danger) the batch, or with no batch a one-line `ink-2` invitation and a secondary "Nạp Fact Batch" button; SO VỚI, the baseline select (32px, `rule-strong` border, 3px corners, technical 600 lettering, the world's own chevron instead of the browser's); and the run state on the right (a small lamp, the time, and the cadence note, which drops to hover text below 1600px). Below 960px the cells stack with top hairlines.
- **Fact Batch import bay:** opens in place under the source bar as a `panel` bay in a 1px `rule-strong` frame, never a dialog: a technical uppercase title, an `ink-2` note, a 150px `sheet` JSON area, then primary "Đọc batch", secondary "Chọn tệp…" (JSON, one Fact per line, or CSV with a header row), ghost "Dùng batch mẫu (minh hoạ)" and ghost "Huỷ" at the far end. A file held over the bay shows a 2px dashed `accent` outline inset 6px on `accent-tint`. Phone shows a line asking for a wider screen instead.
- **Readout:** the tab's one large figure, the count of Facts whose result changed, set like the interlock readout (technical 700, 2.375rem, tabular, `ink`; `clear-ink` when nothing changed; `t-2xl` below 960px), followed by "/518" in technical 600 `ink-3` and the sentence "Facts đổi kết quả so với v7" in 500 `ink-2`. An illustrative batch carries the "batch minh hoạ" tag. Beside it a small definition list (technical labels, a sm lamp and value) carries the Test Case pass count. When the Draft differs from the baseline but no Fact reaches the change, a caution banner says the evidence is thin.
- **Rule impact table (signature):** one row per Rule of Draft ∪ baseline, drawn in the Rules Table's grammar: 1px `--line` frame on `sheet`, the route-number plate (52px column), the mono Rule id (600) with its description truncated on the same line and its tags (`tag--clear` "mới ở draft-3", `tag--stop` "chỉ có ở v7", `tag--caution` for changed fields or "chưa Fact nào chạm"). The figure columns sit on the impact band (`--zone`, the output band of the Rules Table) behind a 1px `--line` seam: baseline "Fact thắng", subject "khớp · thắng" (or "vào output" under COLLECT), Δ, and **Đổi output** (the Facts the Rule still wins but answers differently; `–` in `ink-3` when none). Heads use the field-head grammar: name above an `ink-3` meta line in UI sans. Counts are technical 600 figures, right-aligned and tabular; zero and absent counts recede to `ink-3`.
  - **Δ cell:** "−6" lost (`ink-2`) and "+15" gained (`accent`) at the cell's two ends, `ink-3` "0" when nil, over a 7px diverging bar ruled like the sheet: a 1px `rule` zero axis across the cell and a 1px `rule-strong` centre tick. Lost Facts grow left from the tick in `ink-3`, gained Facts grow right in `accent`, on one scale for the whole table (transform over 260ms on `--ease-out`). Δ is a count, not a state, so it never takes a signal colour. Below 600px the pair and bar give way to one signed net figure.
  - **Rows:** added rows keep `clear-tint`; removed rows keep the 45° `stop-tint` hatch with the id and description struck through in `ink-2`; hover fills `row-hover` (the band mixes 70% `--zone` into it). The selected Rule is `lit` (band `lit-strong`) with its route number outlined in `accent` and the id in `accent`.
  - **Pseudo rows:** outcomes that are not Rules (Không Rule nào khớp, Lỗi UNIQUE, Bị Input Schema Validation từ chối) follow the Rules under a **double seam** (a 3px double border of `rule-strong`: two 1px lines), with a 16px `ink-3` line icon in the plate column and their name in 500 UI sans, never mono.
  - **Fold row:** Rules nobody moved fold into one ruled row above the seam ("3 Rule không đổi: GOLD5, BEV2 … Hiện", the ids in `ink-3` mono, the action an `accent` underlined link); once unfolded, "gộp Rule không đổi" sits in the identity head.
- **Fact ledger:** the shared ledger grammar under a section title with a muted count. With no Rule selected it toggles Đổi kết quả / Tất cả; selecting a Rule re-scopes it in place, and the heading then leads with that Rule's route plate (outlined in `accent`) and a toggle of Được thêm / Mất / Đổi output / Thắng with counts (only the sides that hold Facts), plus a ghost "Bỏ chọn GOLD5". Each row: the Fact key as an `accent` mono toggle (filled `accent` with `sheet` text when it is the open Fact; Test Cases add their sm lamp and name), the field values in mono `ink-2` joined by `ink-3` middots, then the baseline and subject outcomes. In an outcome, a Rule id the Fact gained is a 2px `clear-tint` plate in `clear-ink`; one it lost is struck through in `stop-ink`; the plate and the strike carry the difference without colour, and screen readers hear "mới thắng" / "không còn thắng". UNIQUE and schema outcomes read in `stop-ink` prose. In the full list a changed Fact tints its subject cell `caution-tint`, as a changed cell does in the Rules Table. Rows page in with a ghost "Hiện thêm".
- **Evaluation Trace inspector:** headed EVALUATION TRACE over the Fact key and its source. A **verdict box** (1px `rule-strong` frame, `rule` hairlines between rows, a 72px mono label column) gives the baseline and subject outcomes and, for a Test Case, the expectation with a sm lamp and Pass / Fail; under it "Kết quả đổi: v7 → draft-3" in 600 `caution-ink`, or an `ink-2` line saying the result held. Then secondary "Lưu thành Test Case" (a batch Fact on a Draft, through the shared Test Case form, expectation adopted explicitly) and ghost "Soi trong bảng Rules", which lights the Fact in the Rules Table. A mode toggle switches draft / baseline / **Caller**. The trace lists every Rule in evaluation order with its route plate set by **disposition**: *won* and *collected* fill `clear` (verdict line in 600 `clear-ink`), *shadowed* and *outweighed* outline in `accent`, *conflict* fills `stop-fill` / `on-stop`, *missed* recedes to `ink-3`; each disposition is also written out ("khớp, nhưng đứng sau BEV2", "trượt ở channel"). **Condition rows** (indented 32px under the plate) pair a 16px check in `clear` or cross in `stop` with the mono expression and an `ink-3` "Fact: …" line (`caution-ink` "Fact thiếu trường này" when the field is absent); held conditions of a missed Rule collapse into a "+2 điều kiện khác đúng" note. **Tree nodes** for and/or conditions nest under a 1px `rule` left line, 12px marks, mono `t-xs` text, unevaluated branches in `ink-3`. **Metadata** closes the trace as a technical-label grid (Rule Set, Lúc, Thời gian with the note that timing comes from the mock evaluator, Engine), then a disclosure "Facts đã gửi". The Caller view shows each side's Decision Result as JSON with a copy button, under a note that the wire shape is provisional.
- **Release-bay batch read-back:** with a Fact Batch run against a baseline, the release bay adds one line to its caution list: "Fact Batch mau.json: 231/512 Facts đổi kết quả so với v7", with "(kết quả cũ, chạy lại ở tab Simulation)" when stale. It is evidence, never a lock: no lamp, no count in the readout, no effect on the lever.
- **Inspector toggle and phone:** below 1200px the tab-row toggle carries a sm lamp (pending while running, caution when results changed, clear when none, idle without a baseline) and "231 đổi". Below 600px the source and trace toggles stay (they are reading controls), the impact table keeps plate, identity, the two counts and a signed net, and the ledger drops the values column.

### Sơ đồ Tab (track diagram)
The Sơ đồ tab draws the Rule Set as a signal box's route plan and replays one Fact's Evaluation Trace along it. It is a projection of the Rule Set and the trace (`screens/flow/graph.ts`), never a second copy: node positions are view state held with the screen, never written to the Draft. It is read-only; Rules are still edited in the Rules Table. Built on `@xyflow/react` with its base stylesheet only; every colour comes from the semantic tokens.

- **Two orientations.** Ngang (left to right, the default on wide screens): Fact over Input Schema at the left, one route plate per Rule stacked in Rule order, signals standing in their input's column under a column head, Hit Policy over Decision Result at the right. Dọc (top to bottom, the default below 960px): Fact beside Input Schema at the head, each Rule a vertical track, column heads become row heads at the left, Hit Policy beside Decision Result at the foot. The viewer's choice is remembered (localStorage `bre-flow-orientation`). Inputs whose cells are all "any" carry no signal and get no lane.
- **Plates.** Route plates and signals are one height (40px) so every track runs dead straight; a lane takes the width of its widest condition (112–232px) so readings are whole. Every track leaves Input Schema on one trunk and joins Hit Policy on one bus; segments are orthogonal with square corners, never curves.
- **Canvas and frame.** Fills the primary slot down to the commit bar on `sheet` with a faint ruled grid. The first frame fits the plan under the toolbar but never below 0.85 zoom, so the lettering stays readable; a plan that cannot fit starts from the Fact and shows a minimap. Picking a Fact keeps that frame; stepping, jumping or replaying pans to keep the step's plate in view (instant under reduced motion). Pan by dragging, zoom by scroll or pinch, nodes can be dragged; Xếp lại appears once one was.
- **Tracks.** Dark until the Fact reaches them. Travelled: `ink-3`, 2px. Delivering (won, collected): `clear`, 3px, all the way to the Result. Matched but yielded (shadowed, outweighed): dashed 8/4. UNIQUE conflict or a result off its expectation: `stop`. After a failed signal: dead (dashed 3/4, dark), and later signals recede to 50%.
- **Signals.** A lamp and the cell's reading in mono; a Braces glyph marks a condition tree. Clear, stop, caution (a missing field; its column head reads "thiếu" in `caution-ink`), idle when not reached or "any".
- **Expectation.** For a Test Case the Decision Result plate reads "Decision Result · Caller nhận" and adds a Kỳ vọng block: a lamp and the verdict, then only the missing rows (marked THIẾU in `stop-ink`) and a count of the rows that agree; extra rows are marked THỪA. A Test Case that parts from its expectation opens resting on the step where it parts (the Rule behind the first missing or extra row, else the Result), with that route plate and step in `stop-tint`. Errors read in words with the code beside them in muted mono.
- **Toolbar.** Top-left: the Fact picker (a status lamp, then Test Cases as "id · pass/fail · name" and up to 500 Facts of the Fact Batch), the player (previous, Chạy luồng / Dừng, next) and the current step. Top-right: Ngang / Dọc, then zoom in, zoom out, Vừa khung, Xếp lại. Bottom-left: a folded Chú giải (track tones and lamps, for screenshots that must stand alone) and the error, empty and no-Rule hints.
- **Replay (the tab's one moment).** Chạy luồng replays from the Fact, one step every 520ms; the segments of the current step draw themselves in over 460ms with `--ease-out`. The plate of the step on show carries a 2px `accent` ring.
- **Keyboard and screen readers.** The canvas frame takes focus (inset `accent` ring); ←/→ (and ↑/↓) step, Home/End jump, PgUp/PgDn change Fact, from the canvas or the step list. A visually hidden live region speaks the step only when a replay rests, never on every tick.
- **Inspector.** LUỒNG EVALUATION over the Fact key, a Draft / baseline toggle when the run has a baseline, then the steps as an ordered list of buttons. Steps not yet reached keep their verdict back ("chưa xét"). The step on show, and any step that parts from the expectation, opens its conditions: lamp, field and reading in mono, the Fact's value in technical figures.
- **Phone.** Below 600px the tab opens on Các bước (the picker and the step list in the primary) with Sơ đồ as the second view.
- **Data.** The tab reads the screen's Simulation run (it keeps the Simulation running while open) and shares its selected Fact with the Simulation tab. Opening it with nothing picked selects the first failing Test Case, or the first one. Picking a Fact here never opens the inspector drawer.

### Rule Node Graph (Trình sửa node)
One Rule's whole Condition as an n8n-style node graph, the drag-and-drop editor the BRD names for Phase 2. It replaced a relay-circuit design on 2026-10-12: the owner found series/parallel symbols hard to read and wanted to wire nodes freely. It opens from a Rule (the Workflow icon on its row, the Rule panel's "Mở trình sửa node", a Compound line, or the phone list) at `…/rule/:ruleId`, and takes the primary slot of the Rules tab; the inspector holds the node forms and the commit bar stays. Rules, the breadcrumb, and Esc with nothing selected lead back to the table. A Published version and a narrow screen open it read-only. Built on `@xyflow/react` like the Sơ đồ tab.

- **One tree, two views.** The graph edits the Rule's cells and Compound Condition as one tree (`domain/compound.ts`, `screens/rule-graph/graph.ts`). A graph that reads as a valid tree is written to the Draft at once and split back into cells and Compound Condition; an untouched cell keeps the author's text. A graph with problems stays on the canvas and is not saved; the status chip says so ("Chưa ghi vào Draft: n chỗ cần sửa").
- **Nodes.** Data runs left to right into the Rule. Điều kiện (a field, an operator, a value in mono, the field's label in its head), VÀ and HOẶC (the word itself in 1.5rem technical letter, with a one-line gloss and the count of wires in), KHÔNG, Mỗi phần tử (`some / all / none` over a list, said as "Có ít nhất một / Tất cả / Không có phần tử của items khớp"), and the Rule (its id and outputs). Logic is always a named node, never a drawing convention.
- **Wiring.** Drag from a node's right port to another's left port. VÀ / HOẶC take any number of wires (a tall port); KHÔNG, Mỗi phần tử and the Rule take one, and a new wire replaces the old. A node feeds one place: wiring it elsewhere moves the wire, and a toast-style notice says so. A wire that would close a loop is refused. Dropping a wire on empty canvas opens a menu of node kinds, created already wired.
- **Problems in place.** A node that keeps the graph from being a tree carries a `stop-tint` foot with the reason (no input, no value set, an element field outside Mỗi phần tử); the inspector lists them as links. Nodes not wired to the Rule are dashed with "Chưa nối tới Rule" and are left out of the save.
- **Adding.** A "Thêm node" strip above the canvas: drag a kind onto the canvas, or click to place it in free space under the graph (the view pans to it). A new Điều kiện opens its form in the inspector.
- **Trace.** "Chạy thử" picks a Test Case: each node shows true or false (lamp, the Fact's value on Điều kiện, "1/2 khớp" and an element stepper on Mỗi phần tử), wires carry their source's answer (`clear` 2.5px with moving dashes when true, a muted `stop` when false), and the Rule node names the disposition. A line over the canvas says it in words. The trace is the engine's (`TraceRule.whole`), matched to nodes by what they say, not by position.
- **Layout and view.** Laid out right to left from the Rule, each column as wide as its widest node; the first frame fits the graph but never below 0.72 zoom, so lettering stays readable, and a bigger graph is panned. Dragged positions are remembered by this browser per Rule (localStorage `bre-rule-graph:<scope>:<rule>`), never written to the Draft; Xếp lại resets them.
- **Keyboard.** Nodes and wires are focusable; Delete removes, Enter or double click opens the form, Esc steps back. Every deletion earns the Draft's undo toast.
- **In the table.** A Rule with a Compound Condition reads it under its description, in mono after a COMPOUND tag, with a cross or check under a selected Test Case. The Sơ đồ tab and the Evaluation Trace list it as a pseudo column `@compound`.

### Interlock Row and Publish Lever (signature)
- **Row:** the last row of the screen with a 1px `rule-strong` top edge and no shadow. A readout bay comes first, then four locks (Test Case present, all pass, Stale acknowledged, Breaking Change confirmed), then the lever bay on `panel`. About 50px tall: one line per lock, a 40px lever.
- **Readout:** the row's one large figure, the count of clear locks over the total ("1/4", technical 700 at 1.25rem, tabular, in `ink`; `clear-ink` once free; the "/4" in `ink-3`), beside a KHOÁ ĐÃ GIẢI label on one baseline. The colour of state is carried by each lock's lamp and label, not by the figure. When the count changes it ticks over (200ms).
- **Scope:** the row is the commit bar of a Draft and stays in place on every tab. On a Published version the same bar (`.commit`) holds a LATEST POINTER title bay, a line saying where the pointer is with a small lamp, and on a `panel` bay the Rollback and "Tạo Draft" buttons, which no longer sit in the title block. Below 600px it condenses to one line above the bottom tab bar.
- **Lock:** at rest a lamp and an uppercase label on one line (the state colour on the label: `stop-ink`, `caution-ink`; a clear lock recedes to `ink-3`, so the blocking ones lead). Its detail and its ways out are read on demand: hover or focus opens a ruled popover directly above the lock, attached to it (square at the foot, no gap to cross), on `panel` with `--shadow-pop`, holding the detail in `ink` and, under a `rule` hairline, the actions as real secondary buttons (30px), never as links. Opening waits 70ms and closing 90ms so crossing from lock to lock does not flicker; focus opens it at once. The lock is focusable (`tabindex=0`, its label and detail as its accessible name); the last lock's popover aligns right. While a lock is hovered or focused its ground is `row-hover` and its label `ink`.
- **Lever, locked:** the lever is the whole of its cell: no padding, no radius, a 1px `rule-strong` rule on its left only, at least 40px tall and filling the bay. Labelled in technical uppercase at 1rem, on `panel-2` in `ink-3`, with a not-allowed cursor. The padlock plate on the left is a step of the lever's own fill (`panel-2` mixed 45% toward `sheet`, glyph `ink-2`), never a second colour. A small bordered numeral at the lever's end says how many locks block. The reason ("Còn 3 khoá chưa giải") is not printed: hover, focus or a press on the locked lever opens it as a popover above the lever (it stays in the DOM as a status for assistive tech, and while the lever is armed it stays up, since it says how to confirm). Its focus ring sits inside the cell.
- **Lever, free:** the `primary` fill wipes in from the left, the text turns `on-primary`, the padlock plate darkens with it (`primary` mixed 20% toward `on-primary`, glyph `on-primary`), and the reason line turns `clear-ink`. The lever's fill is the theme's green, the same value as the clear lamp; the reason line keeps `clear-ink`. The `lever-lock` / `on-lever-lock` tokens are no longer read.
- **Nothing to publish:** a Draft identical to Latest (same Rules in the same order, same schema and Hit Policy) keeps the lever locked with "Không có thay đổi so với v3", even at 4/4.
- **Lever, armed (two-stage pull):** the first press on a free lever does not publish. It opens the **release bay**, a `panel` band ruled across the whole commit bar above the locks, that reads back what Publish will do: the Rules added, changed and removed against Latest, the pointer move ("v7 → v8", with the reminder that the old version still evaluates and Rollback is one step), the Test Case count, every consequence the author accepted, and a caution line in `caution-ink` ("Cần để ý") when the evidence is thinner than the count admits: Test Cases deleted this session, and Rules no Test Case matches. The lever turns to "Xác nhận Publish v8" with a 2px inset ring and the reason line says "Nhấn lần nữa để Publish · Esc để huỷ". The second press publishes; Escape or the bay's close button lets the lever fall back. Any change to what would be published (an edit, a lock, a Test Case result) disarms it, so the read-back is never stale. No timer: a confirmation never expires under the author.
- **Lock consequences:** a caution lock states what accepting it costs, not only what is true. Stale Draft names the Rules of Latest the Draft would undo ("Publish sẽ bỏ WKND của v7") and offers both ways out: "Lấy WKND từ v7" brings Latest's Rule into the Draft (with an undo toast), "Chấp nhận bỏ" leaves it out knowingly. In compare, a hatched removed row carries the same restore as "Khôi phục vào Draft". A lock may carry several actions in a row; its detail keeps two lines while it blocks, one once clear, and the full sentence on hover. Breaking Change says who breaks ("caller chưa gửi channel sẽ bị Input Schema Validation từ chối") and its action names the field. Accepted locks keep the sentence with "Đã chấp nhận:" / "Đã xác nhận:" and offer "Bỏ chấp nhận" / "Bỏ xác nhận". A Publish the service rejects (409: a newer Latest, a changed Test Case) reloads what the locks read and drops a stale acknowledgement, keeping the edits.
- **Release (the one authored motion):** when the last lock clears, the lamps settle in sequence (460ms each, staggered 90ms). The lever's fill then slides free (560ms after a 380ms delay) while the padlock tilts open (520ms after a 420ms delay), all on `--ease-out`.
- **Acknowledgements (not performances):** a lock whose state changed flips its lamp in (220ms; skipped while the release plays, which already settles the lamps), and when a lock re-engages after the lever was free the padlock clicks shut (300ms), the mirror of the unlock. Reduced motion: a fade, and no click.

### Toasts and Banners
- **Toasts:** stacked bottom right above the interlock on one `toast-bg` / `toast-ink` surface in every theme, with 3px corners and the pop shadow. Tone is never a toast colour: a success or failure toast leads with a small clear or stop lamp. They enter with a 220ms rise, and carry an outlined action and a close button. The stack sits above the commit bar's measured height, so the release bay is never covered. Timers stand still while the pointer or keyboard focus is on the stack (5s plain, 10s with an action). Toasts about one Decision's Latest Pointer share a key: a new one replaces the old, so two pointer moves against different baselines are never offered at once, and a pointer action re-reads the pointer before it runs and refuses with an explanation if someone moved it meanwhile. A failed autosave raises a stop toast with "Thử lưu lại", keeps the edits on the page, and the page asks before it is closed while edits are unsaved.
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
- **Do** keep state transitions at 150 to 250ms on `--ease-out`, and let the release sequence be the only choreographed motion. Everything else is acknowledgement of a change that really happened (a value that changed, a row that moved), and plays once.
- **Do** give each section a role (lead, evidence, reference) with scale, a tick and a tonal band.
- **Do** read secondary information on demand (a lock's detail and actions, the lever's reason) through hover and focus, and keep it in the accessibility tree.
- **Do** keep the reduced-motion override that collapses every duration and delay to 1ms.
- **Do** keep Publish locked, with a written reason, until every interlock lamp is clear.

### Don't:
- **Don't** use a signal red, amber or green for the shell, brand mark, accent, theme swatch or a marker like LATEST in any theme, and don't give `primary` a green from outside the theme's own scheme.
- **Don't** signal state with colour alone, whether as a tinted row without a route-number change or a lamp without a label.
- **Don't** ship the category default: a neutral SaaS grid with a lone, always-clickable Publish button that explains nothing.
- **Don't** add cards, rounded containers above 3px, or decorative shadows. Divide with ruled lines.
- **Don't** use JetBrains Mono for labels, buttons or sentences.
- **Don't** add a second authored animation that competes with the lever release, and don't loop anything: an animation that repeats while nothing changes is decoration.
- **Don't** open every screen with the title block's route band. It is the Decision Table's, where the cells really are stations.
- **Don't** offer an action as an underlined link where it is a button (a lock's "Chấp nhận bỏ" is a secondary button).
