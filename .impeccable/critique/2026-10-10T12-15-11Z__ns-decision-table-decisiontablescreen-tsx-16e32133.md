---
target: Decision Table
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/decision-table/DecisionTableScreen.tsx"
target_fingerprint: "sha256:0bf44ba5299d2fa0a9eb6226cb417854c6a9de36907f2854ba89ab03c1939e8b"
target_path: /Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/decision-table/DecisionTableScreen.tsx
timestamp: 2026-10-10T12-15-11Z
slug: ns-decision-table-decisiontablescreen-tsx-16e32133
---
# Critique: Decision Table, run after layout/clarify/onboard/harden (dual-agent)

Score 26/40 (Acceptable). H1 3, H2 3, H3 3, H4 3, H5 2, H6 2, H7 2, H8 3, H9 3, H10 2.
Specificity: authored, stronger (consequence locks, two-stage lever + release bay, reason edge marker). Generic: strip, TC form, toasts, Versions ledger. Default Gruvbox hides own world (drawing sheet); accent #8aa98a and clear #b8bb26 both green dilute signal reservation.
Detector: CLI 0. Browser: cramped-padding .cell__tree (app.css:1501, 6px inline, real minor); edge-flush-cards FP (th at scroll edge); phone text-overflow x8 FP (visually-hidden lock text). No console errors.
Fixed since previous run: pointer toast stacking, raw JSON Test Case form, cheap acks, invisible miss reason, implicit grammar.

Priority issues:
- [P1] Pinned text outputs push conditions out: irrigation 1440 hides soilMoisture/airTemp (HEAT-DRY/DRY/SOAKED read all "-"), 1280 hides 4/5. Fix: cap pinned text output ~140px; per-row chip of hidden conditions in ident cell. /impeccable layout, adapt
- [P1] Keyboard focus obscured/lost: focused cell under pinned outputs (WCAG 2.4.11); focus to document start after cell commit (RuleTable.tsx:646-656), TC save, delete confirm, Publish. Fix: scroll focused cell clear of pinned offsets; restore focus targets. /impeccable harden
- [P1] Interlock clearable by deleting evidence; no-op Draft publishable: deleting TC-01/TC-06 (no undo, DecisionTableScreen.tsx:505-514) turns Test Case lock green; GOLD5/BEV2 Match 0 unflagged; unchanged PRIORITY draft "Sẵn sàng Publish v4". Fix: undo toast for TC delete; release bay caution lines (deleted TCs, Rules without coverage); lock "Không có thay đổi so với vN". /impeccable harden, clarify
- [P2] Stale Draft only acceptable, not reconcilable (compare read-only). Fix: "Khôi phục vào Draft" on removed rows; stale lock "Lấy WKND từ v7". /impeccable clarify
- [P2] Rollback one click vs Publish ceremony (DecisionTableScreen.tsx:769-773). Fix: release-bay read-back + second press. /impeccable harden

Personas: Alex (Tab-only grid, 7 stops/row, no skip links/shortcuts, compare blocks edit), Sam (focus obscured/lost, no Rules heading, phone lamps without words), first-time Rule Author (editor shows raw ">= 1000000", "800,000" saves as ≥ 800 via comma-as-decimal cell.ts:28-34, no edit feedback, add form below fold, items JSON, adopt-as-expected tautology).
Minor: editor widens column; lock details ellipsized at 1280; WEIGHT head style; Published empty Match col + idle strip; deleted-Draft dead end; info toasts no lamp, toasts cover Thêm Test Case; Versions inspector lacks from→to; phone chrome ~150px.
Questions: conditions as the never-scroll part in FIRST? TC deletion as its own caution lock? keep a released lever with Rollback after Publish?
