---
version: 1
slug: "ns-decision-table-decisiontablescreen-tsx-16e32133"
primary_target: "console/src/screens/decision-table/DecisionTableScreen.tsx"
related_targets: []
---

# Surface: Decision Table screen (BRE Console)

Mode: Operate. Desktop-first editing; phone width is read-only.

## Scope
- Rule Author edits a Draft's Rule Set, sees Test Case pass/fail live after each edit, and Publishes once every interlock clears. Integrator opens the same screen read-only on a Published version.
- Modes: edit Draft, compare with Latest (rows registered in place), Published read-only (create Draft from it, Rollback the Latest Pointer).
- Drag-and-drop only reorders Rules (FIRST / COLLECT). PRIORITY shows a weight column, UNIQUE disables ordering and says why.
- Data comes from an MSW mock of a provisional management API; the mock carries a stand-in evaluator until the Go service exists. Sample Decisions are illustrative and labelled so.
- Out: condition-tree drag-and-drop, full Simulation screen, version history screen, auth.

## Direction contract

THESIS: The Decision Table reads like a railway interlocking control table: one Rule per row, terse conditions per cell, and Publish is a lever that only releases when every interlock shows clear. It refuses the category default of a neutral SaaS grid with a lone indigo "Publish" button that is always clickable and explains nothing.

OWN-WORLD: Drawing-office white sheet (#f9faf9) with a cooler panel layer, ink #16181d, hairline rules, a committed drawing-blue shell rail (#1b3a6b). Signal red / amber / green are the only state colours and always travel with an icon and a label. Technical condensed lettering (Barlow Semi Condensed) for the title block, column heads, identifiers and lamps; Be Vietnam Pro for UI text; JetBrains Mono only for condition expressions and ids. Tabular numerals everywhere data aligns. Title block header borrowed from engineering drawings.

STORY: The author sees which Decision and Draft they are on and what it is based on, edits a cell, watches Test Cases re-run, clicks a Test Case to see exactly which Rules it hit, and reads the interlock row to know why Publish is blocked or free.

FIRST VIEWPORT: Left: drawing-blue rail listing Decisions and their Drafts. Top of main: identifier as headline (decisionId@draft) over a ruled title block (Draft, base version vs Latest Pointer, Hit Policy, input schema). Centre: the table, input group then output group, hit counts right-aligned. Right: Test Case strip with a live pass counter. Bottom, sticky: the interlock row of lamps (Test Case present, all pass, Stale acknowledged, Breaking Change confirmed) ending at the Publish lever. Signature move: the interlock row; when the last lock clears the lamps settle to green in sequence and the lever releases.

FORM: Railway interlocking control table (candidate 5 of 7 in re-roll 1), raised by: matched Rules lit while others recede (transit), registered Draft/Latest comparison (botanical), identifiers as headline (Factory), focused Rule expands in place (streaming). Seed key c96445f8.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions
- Management API contract (OpenAPI not drafted; mock endpoints are provisional).
- Product name (using `bre`).
- Cell grammar beyond the spec's operators: DMN-style interval `[a..b)` is provisional.
