---
target: Flow Tab
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/flow/FlowTab.tsx"
target_fingerprint: "sha256:588a92e13793290590d997b65fdb62aa6f93a86bfcb8e60efddb00507e02d698"
target_path: /Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/flow/FlowTab.tsx
timestamp: 2026-10-11T04-35-11Z
slug: console-src-screens-flow-flowtab-tsx
closed: true
---
# Critique: Sơ đồ (Flow) tab, 25/40 (Acceptable)

Method: dual-agent (A: design review · B: detector + browser)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Decision Result node clipped off the right edge at 1440×900 |
| 2 | Match System / Real World | 2 | Railway metaphor and dash patterns never decoded; no legend |
| 3 | User Control and Freedom | 3 | step/jump/pause/fit/re-layout all work |
| 4 | Consistency and Standards | 3 | mobile panel override selector never matches |
| 5 | Error Prevention | 3 | read-only, fit floor, reduced motion handled |
| 6 | Recognition Rather Than Recall | 2 | conditions truncated at 152px, full text only in hover title; PRIORITY weight hidden once traced |
| 7 | Flexibility and Efficiency | 2 | ←/→ only inside canvas frame, canvas not focusable; no next/prev Fact |
| 8 | Aesthetic and Minimalist Design | 3 | strong drawing, but wide/short layout leaves empty height; generic minimap |
| 9 | Error Recovery | 2 | failing Test Case replays to green Result with no expected-vs-actual; raw UNIQUE_VIOLATION code |
| 10 | Help and Documentation | 2 | no legend for tones/dashes |

Specificity: authored (route plan, route numbers, column heads, dead track). Detector: CLI 0; browser 3 (tiny-text real, 11px keys hint; clipped-overflow and layout-transition false positives). Contrast passes everywhere (≥6.08:1). On-screen node text 6.8–8.7px at zoom 0.62.

## Priority issues
- [P1] Decision Result off-screen at desktop width (FIT.minZoom 0.62 + left pan, wide layout). Fix: denser/taller layout, Result under Hit Policy, auto-pan to current step.
- [P1] Failing Test Case shows a green Result, no expected vs actual. Fix: "Kỳ vọng" block on Result node, result step lamp stop with diff detail.
- [P1] Lettering 7–8px on screen; conditions truncated with hover-only full text. Fix: fit ≥0.85, signal plates grow to ~220px, full conditions in step detail.
- [P2] Mobile: `.react-flow__panel.top-right` selector never matches (classes are `top right`), zoom buttons overlap the picker; canvas ~270px visible.
- [P2] Fact node (max 200px) overlaps Input Schema (176px apart); route plates grow taller than signals → track jogs.

## Minor
- "Trượt ở thiếu X" grammar; raw "Lỗi UNIQUE_VIOLATION"; result node repeats policy message.
- Empty state explained three times; consider auto-selecting first failing Test Case.
- Picker truncates its own pass/fail status.
- aria-live announces every 520ms during play; mounted only after a Fact is picked.
- Arrow keys don't work from the inspector list.
- Keys hint at 11px.
