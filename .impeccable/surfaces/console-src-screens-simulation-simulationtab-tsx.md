---
version: 1
slug: "console-src-screens-simulation-simulationtab-tsx"
primary_target: "console/src/screens/simulation/SimulationTab.tsx"
related_targets: ["console/src/screens/simulation/useSimulation.ts"]
---

# Surface: Simulation tab (BRE Console)

Mode: Operate. Desktop-first; phone width is read-only and runs Test Cases only.

## Scope
- Rule Author asks "if I Publish, which real results change, and why": runs the Draft (or a Published @vN, read-only) against the Decision's Test Cases plus a Fact Batch (pasted JSON, imported JSON/CSV, or the illustrative sample), compared with a baseline version (Latest by default).
- Integrator reads the Decision Result as a Caller would receive it (provisional wire shape) beside the Trace Summary.
- Hand-offs: save a simulated Fact as a Test Case (Draft only, expectation adopted explicitly); light the Rules Table with a Fact; release bay reads back the batch's changed count (never a lock).
- Fact Batch lives in the open page only, never stored server-side. Auto re-run after edits up to 2.000 Facts; above that the run is manual and older results say they are stale.
- Out: editing Rules here, charts/Sankey, stored batches, server-side decision log.

## Direction contract

THESIS: Simulation is read on the same route numbers the author just edited: a Rule impact table, one row per Rule of Draft ∪ baseline, counting the Facts each Rule won under the baseline and under the Draft, and the Facts it gained, lost or now answers differently. It refuses the category default of a dashboard of charts or a flat list of changed rows that never says which Rule caused them.

OWN-WORLD: Inherits the Interlocking Control Table (DESIGN.md) unchanged: ruled sheet, route-number plates, quiet output band (here the impact band), lamps with glyph and label, three hands of lettering. Added rows keep clear-tint, removed rows the hatch; pseudo-rows (no Rule matched, UNIQUE error, rejected by Input Schema Validation) sit under a ruled seam.

STORY: The author sees "37/518 Facts đổi kết quả so với v7", finds the Rule rows with the largest Δ, selects one to list the Facts it gained or lost, opens a Fact to read the Draft and v7 Evaluation Traces condition by condition, then saves it as a Test Case or lights it in the Rules Table.

FIRST VIEWPORT: Shell nav, title block, tab row with SIMULATION current. Primary: a source bar (Test Case / Batch / Tất cả toggle, batch status and actions, baseline select, run state), then the readout line with the changed count as the one large figure, then the Rule impact table (# · Rule · v7 thắng · Draft thắng · Δ · Đổi output on the impact band), then the Fact ledger scoped by the selected Rule. At 1280×720 and 1440×900 the first viewport guarantees the ledger heading and its scope toggle; when every Rule moved, its rows start below the commit bar and the primary scrolls on its own beside the trace (amended by the user on 2026-10-10 after the finish review: the impact table keeps every Rule and pseudo-row, no inner scroller). Rules nobody moved fold into one ruled row. Inspector: Evaluation Trace of the selected Fact. Commit bar: the interlock, unchanged. Signature: Δ registered on route numbers; selecting a Rule re-scopes the Fact ledger in place.

FORM: Rule impact table (dealt lead, THE ROLL; candidate 3 of 7). Seed key 762cccdc.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions
- Management API contract for simulation runs and the Caller wire shape (provisional, mock only).
- Engine timing in traces comes from the mock evaluator and is labelled so; it is not the Go engine's latency.
