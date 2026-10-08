---
target: DecisionTable scrolling & layout
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/decision-table/DecisionTableScreen.tsx"
target_fingerprint: "sha256:3fe64b25c74f372055f879cbf968ec35c436690dbc4093e58951605563b0adec"
target_path: /Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/decision-table/DecisionTableScreen.tsx
timestamp: 2026-10-09T03-35-18Z
slug: src-screens-decision-table-decisiontablescreen-tsx
---
# Critique: Decision Table — scrolling & layout (dual-agent)

Score 25/40 (Acceptable). H1 3, H2 3, H3 2, H4 3, H5 3, H6 1, H7 2, H8 3, H9 3, H10 2.

Specificity: authored (railway interlocking control table). Drift: input/output seam and ink frames softened in uncommitted app.css vs DESIGN.md "Drawn Line Rule" — update DESIGN.md.
Detector: CLI 0 findings. Browser: cramped-padding .cell__tree (app.css:872, true), tiny-text rail tags (borderline), ai-color-palette .lever__btn (false positive: hard-stop wipe).

Priority issues:
- [P0] Rule detail td colSpan = table width (1165px vs 846px frame); .detail auto-fit splits into 2×520px columns; AST clipped ~300px; nothing sticky. Fix: .rules-scroll container-type inline-size; .detail sticky left:0, width 100cqi, single column, 2 cols only @container ≥900px. /impeccable layout
- [P1] mask-image on .rules-scroll.has-more masks its own scrollbars + sticky header. Move mask to .rules or use inset ::after overlay. /impeccable harden
- [P1] Three viewport budgets (rules-scroll 100dvh-132, strip 100dvh-76, sticky interlock ~90px); page scrolls 143px after expanding a rule. Fix: fixed-shell grid screen, one scroller per region, interlock in flow. /impeccable layout, adapt
- [P2] Outputs rarely pinned (≈94px slack at 1440 vs 200 threshold). Pin a condensed outputs column or collapse strip while editing. /impeccable layout
- [P2] Keyboard/SR: ~100 tab stops, focus lost after commit, no aria-controls, scroller not focusable. /impeccable harden

Personas: Alex (sideways travel, no grid keys/undo), Sam (focus loss, tab count, 200% zoom), first-time Rule Author (thesis scenario hits clipped detail + hidden scrollbar; JSON AST needs template).
Minor: !important specificity fights; 70ch sentence in wide track; .strip min-height vs align-self; 600–959px loses sticky columns.
Questions: context-switching inspector? sentence as default row view? collapse title block while editing?
