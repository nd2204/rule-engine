---
version: 1
slug: "console-src-screens-monitor-monitorscreen-tsx"
primary_target: "console/src/screens/monitor/MonitorScreen.tsx"
related_targets: ["console/src/mocks/monitor.ts","console/src/domain/monitor.ts"]
---

# Surface: Theo dõi (BRE Console)

Mode: Operate. Desktop-first; phone width reads the lanes and the ledger, no pinned columns.

## Scope
- The Integrator (and a demo audience) watches Callers evaluate Published Decisions live: which Decision Version each Caller is served, how traffic moves when the Latest Pointer moves (Publish, Rollback), and what Facts flow in.
- Shell nav destination `#/monitor`, not scoped to a Decision: no tabs, no commit bar.
- Data: Callers simulated in the mock API (illustrative, labelled as such everywhere a figure appears). Wire: `GET /api/monitor/snapshot` (bounded in-memory window, never stored) plus an SSE stream `/api/monitor/stream` with `evaluation` and `pointer` events. Publish and Rollback in the console move the pointer and the simulated traffic follows it.
- Hand-offs: an event's full Evaluation Trace is replayed from its Facts on the served version (same path as Replay); "Mở trong Replay" carries the record to `#/replay`; a lane opens its Decision.
- Out: aggregated latency figures (no measured latency exists; per-event executionTimeMs is shown as the mock's), stored history, alerts, auth.

## Direction contract

THESIS: Traffic is read per Decision as a lane on one shared time axis, stacked by the Decision Version actually served, with Latest Pointer moves drawn across the lane. The question "who is still on the old version, and did traffic follow the Publish" is answered at a glance. It refuses the category default of a log tail plus KPI tiles.

OWN-WORLD: Inherits the Interlocking Control Table unchanged: ruled sheet, title block, lamps with glyph and word, three hands. Served-on-Latest bars use the accent; bars on any other version use ink-3 hatched; errors are stop lamps on a tick row; never a categorical palette.

STORY: The viewer sees four lanes filling from the right, notices pos-app-mobile pinned to v6 while Latest is v7, Publishes a Draft in another tab, comes back to see the pointer marker and bars switch colour, clicks an error tick, reads the Facts against the schema and the full Trace.

FIRST VIEWPORT: Shell nav (new Theo dõi item), title block (Theo dõi Caller, live lamp, Callers, calls/min, errors, window, source "Caller giả lập"), then lanes (identity · stacked time bins · version split), then the event ledger filtered by lane/Caller/errors. Inspector: Caller roster by default (requested version, pin tag when not Latest), the selected event otherwise.

SIGNATURE: Latest Pointer moves drawn as vertical rules across a lane, labelled "v7 → v8 · Publish".

FORM: Version & lưu lượng (dealt candidate 7 of 7, chosen by the user over 4 and 1). Seed key 9815e5ff.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md's Layout entry for the screen.

## Open decisions
- The real service has no Decision Log (BRD 14). A live tap is an in-memory, bounded window; needs an ADR before the Go service grows it.
- Caller identification header (provisional `X-BRE-Caller`).
