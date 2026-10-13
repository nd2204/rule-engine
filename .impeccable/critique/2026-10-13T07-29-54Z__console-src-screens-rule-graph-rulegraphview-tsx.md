---
target: Rule Node Graph
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/rule-graph/RuleGraphView.tsx"
target_fingerprint: "sha256:cdf574bcb25f1ae8e390633f463aa5871bad5ffbe9e3017915cd05b28e488d81"
target_path: /Users/nd2204/repos/business-rule-engine/.claude/worktrees/console-ui/console/src/screens/rule-graph/RuleGraphView.tsx
timestamp: 2026-10-13T07-29-54Z
slug: console-src-screens-rule-graph-rulegraphview-tsx
---
# Critique: Rule Node Graph (tab Rules, view Node), 24/40 (Acceptable)

Method: dual-agent (A: design review · B: detector + browser)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Readout, per-node lamps and save chip are good. The chip mixes saved and not saved in one line. The Rule node stays idle grey while the readout is red. |
| 2 | Match System / Real World | 3 | The readout falls back to AST words ("some items: …; không (channel = ONLINE)"). "Tiếp điểm đọc là" is left over from the relay design. |
| 3 | User Control and Freedom | 2 | Deleting a loose node has no undo. After adding or deleting, the view is left panned to empty space. |
| 4 | Consistency and Standards | 3 | Dashed wire means both "true, flowing" and "loose". Under reduced motion they look the same. |
| 5 | Error Prevention | 3 | Cycles refused, single-input replacement explained, invalid graph kept off the Draft. |
| 6 | Recognition Rather Than Recall | 2 | The drawer covers the clicked node and the Rule node at 1440 and 1280. |
| 7 | Flexibility and Efficiency | 2 | No keyboard wiring. Tab passes 10 edges before the first node. |
| 8 | Aesthetic and Minimalist Design | 2 | Zoom 0.72: gloss and labels render at 7.95–8.64px. At 1280×720 the readout and palette cover nodes and the Rule is clipped. |
| 9 | Error Recovery | 3 | Problems on the node foot and as links in the inspector, in plain Vietnamese. |
| 10 | Help and Documentation | 1 | Ports and wiring are taught only by tooltips and the Overview list. No legend for wire colours or dashes. |

Specificity: mostly authored (named Vietnamese nodes, Fact value + SAI/ĐÚNG on each condition, 0/1 khớp stepper, lit Rule rail). The canvas frame is stock xyflow (dot grid, bezier, zoom cluster, palette pill).
Detector: CLI 0. Browser: text-occlusion (scope hint under the palette when the drawer is open, real); 390px overflow from the Chạy thử select (real); gpt-thin-border-wide-shadow on rail and palette (style); clipped-overflow on canvas and lock__* text-overflow (false positive / belongs to another surface). Contrast ≥ 6.21:1 everywhere. Touch targets 28–38px, handles 10px.

## Priority issues
- [P1] At 1280×720 the first frame + floating HUD cover nodes: readout over Điều kiện, palette over channel=ONLINE and KHÔNG, Rule clipped at the right; text 8–9px at zoom 0.72. Fix: anchor the overflow frame on the Rule node, readout as one line in the bar row, palette docked/compact on short canvases, fit respects HUD padding, re-fit on resize. Command: adapt → layout.
- [P1] The inspector drawer hides the selected node and the Rule. Fix: when the drawer opens, re-frame over the remaining width so the selected node and the Rule are visible. Command: layout.
- [P1] Wiring is pointer-only; edges announce English internal ids; Tab goes through 10 edges first. Fix: "Đầu ra nối vào…" select in each node form, Vietnamese ariaLabelConfig/edge labels, nodes before edges in focus order. Command: harden.
- [P2] Wire signature inverted in weight: solid red false dominates thin dashed green true; dashes also mean loose. Fix: true solid + moving dash overlay, false thinner and muted, loose dotted, small legend. Command: colorize/polish.
- [P2] Mixed-language and relic copy: AST readout, "Tiếp điểm đọc là", saved/unsaved chip, "TC-04 · pass" beside a red "BEV2 không match". Command: clarify.

## Minor
- New Điều kiện placeholder unreadable at 0.72; placeholder "GOLD" looks like a set value.
- No re-fit after delete or viewport resize.
- Palette loses its "THÊM NODE" label with the drawer open at 1280.
- Drawer title "Điều kiện của Rule" is the same for every node kind.
- Node aria-describedby is the English xyflow help text.
- Mobile: rail ids truncate to "GO…", there is no narrow read-only banner on the Node view, and the Chạy thử select overflows to 461px.
- Story check: in TC-04, adding customerTier = SILVER to HOẶC does not flip the Rule (HOẶC is already true; KHÔNG and items block it). The demo script needs to be fixed.

## Questions
- Should picking a Test Case dim the true branches and keep the failing path in focus?
- Should "Thêm vào HOẶC…" from the form (place + wire in one step) be the main path for a non-programmer?
- Should the thesis figure use a 4–5 node Rule at 1:1 instead of 11 nodes at 0.72?
