---
target: DecisionTable re-run after drawer + shell
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/decision-table/DecisionTableScreen.tsx"
target_fingerprint: "sha256:3fe64b25c74f372055f879cbf968ec35c436690dbc4093e58951605563b0adec"
target_path: /Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/decision-table/DecisionTableScreen.tsx
timestamp: 2026-10-09T03-49-27Z
slug: src-screens-decision-table-decisiontablescreen-tsx
closed: true
---
# Critique (re-run): Decision Table after drawer + fixed shell (dual-agent)

Score 25/40 (Acceptable). H1 3, H2 3, H3 2, H4 3, H5 2, H6 2, H7 2, H8 3, H9 3, H10 2.
Specificity: authored; drawer is the most generic object. Detector: CLI 0; browser 3 (tiny-text rail foot, cramped .cell__tree true, ai-color-palette .lever__btn false positive). No console errors.
Fixed since last run: drawer = frame width, single column; fade overlay no longer masks scrollbars; Esc/close return focus.

Priority issues:
- [P0] Fixed shell squeezes table when drawer opens: 1440x900 376->270 (2/4 rows), 1440x760 186, 1280x720 141 (<1 row). Fix: table min-height ≈ head+3 rows; drawer yields (min 160, scrolls); shell only at ≥~820px tall. /impeccable layout, adapt
- [P1] Drawer disconnected from row: ONL30 row out of frame; at 1024x800 sticky interlock (158px) hides the drawer, partial at 1440x640; Thêm Rule pushed below drawer. Fix: scrollIntoView row + drawer with scroll-margin-bottom; sentence echo in sticky head; ‹ › prev/next; Thêm Rule under frame. /impeccable layout
- [P1] Esc in JSON textarea closes drawer and discards unapplied JSON (RuleTable.tsx:856); 22 tab stops to reach drawer; no focus move/announce; h3 without h2. /impeccable harden
- [P2] Outputs unpinned at 1280/1024 (only inputs visible). Pin identity+outputs, scroll conditions; or narrow ident; chip "→ 3 cột output". /impeccable adapt
- [P3] .cell__tree 24ch truncation without title; lock details clipped; dev roadmap note RuleTable.tsx:820. /impeccable polish

Personas: Alex (no prev/next, 3 scrollers, fixed drawer cap), Sam (22 tabs, no announce, Esc data loss, hidden-but-focusable drawer at 1024), first-time Rule Author (1-row table on 1280x720 projector, JSON-only list editor, unnamed locks).
Minor: stray glyph beside "percent" header; drawer --paper == --sheet on dark; index.html carries live script (don't commit).
Questions: should opening a Rule ever shrink the table (use idle strip area)? sentence as row default? fixed shell below ~820px?
