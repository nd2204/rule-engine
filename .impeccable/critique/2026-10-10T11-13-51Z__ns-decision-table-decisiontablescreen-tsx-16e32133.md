---
target: Decision Table
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/decision-table/DecisionTableScreen.tsx"
target_fingerprint: "sha256:41bfc25c0699b388ac33339f0bc90b05a52bd5926494406fb540241a5141bd66"
target_path: /Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/decision-table/DecisionTableScreen.tsx
timestamp: 2026-10-10T11-13-51Z
slug: ns-decision-table-decisiontablescreen-tsx-16e32133
---
# Critique: Decision Table (dual-agent)

Score 26/40 (Acceptable). H1 3, H2 3, H3 2, H4 3, H5 3, H6 2, H7 2, H8 3, H9 3, H10 2.
Specificity: authored (railway interlock carried structurally); generic drift in output group + strip, Published commit bar, Gruvbox default hides own world.
Detector: CLI 0 (14 files). Browser 27 across 6 views: real = cramped-padding .cell__tree (app.css:1435, 3rd run unfixed); FP = text-occlusion x12 (panel over strip, but design consequence real), edge-flush-cards, repeating-stripes (removed-rule hatch), mobile text-overflow (visually-hidden). No console errors.

Priority issues:
- [P1] Condition columns squeezed between pinned ident and outputs; at 1440 POS hides weekday/channel (channel = Breaking lock + reason ONL30 misses TC-01); 1280 ~2.5 conditions. Fix: min condition width before pinning ident (RuleTable.tsx:73), description to 2nd line, off-screen miss edge marker. /impeccable layout, adapt
- [P1] Table height: 1280x720 rules-scroll 279px (~2.5 Rules); head ~230 + interlock ~97 fixed. Fix: one-line title block <800px tall, slim interlock until hover/focus, policy note into caption. /impeccable layout
- [P1] Non-programmer meets implicit grammar + raw JSON: bare value means == (cell.ts:5) so "800.000" in ">= 1.000.000" silently becomes equality; Add Test Case = raw JSON, Expected defaults []; no edit/delete Test Case; list fields JSON AST textarea. Fix: operator hint under input, keep operator on bare value, schema-built Test Case form prefilled from current result. /impeccable clarify, onboard
- [P2] Cheap high-stakes acks ("Đã xem v7", "Xác nhận") with no consequence; lever publishes with no preview; release ceremony only on live clear. Fix: consequence in lock detail, two-stage lever with diff/pointer summary, revocable acks. /impeccable harden, clarify
- [P2] Stale pointer toasts: after Publish v5 then Rollback v3, old toast still offers "Rollback về v4" (DecisionTableScreen.tsx:287-301, 531-542). Fix: dismiss/replace pointer toasts on pointer move, re-check before run. /impeccable harden

Personas: Alex (no grid keys, lever tab 67/68, panel covers pass count), Sam (9s undo toasts no pause state.tsx:63, lit rows not announced, "1/4Khoá" no space, phone lamps without visible words), first-time Rule Author (bare-value ==, can't tell if edit helped, by-eye output diff, JSON Test Case, unexplained Stale/Breaking).
Minor: no edit-mode changed mark; Published Match column empty; green primary "Tạo Draft" = clear-lamp green; Weight flush to output seam; phone title block ~440px; 140px dead sheet under Thêm Rule at 1440; index.html commits live.js block (localhost:8400).
Questions: two-stage lever as ritual? single expected/actual diff as strip hero? operator picker vs typed cells?
