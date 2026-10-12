import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { describeAst } from '../../domain/cell';
import { ruleTree, splitTree } from '../../domain/compound';
import type { Rule, RuleSet, TraceRule } from '../../domain/types';
import {
  INPUTS,
  RULE,
  canonKey,
  edgeId,
  graphToTree,
  layout,
  makesCycle,
  newId,
  signatures,
  traceOnGraph,
  treeToGraph,
  type GData,
  type GKind,
  type Graph,
} from './graph';

export type GraphUpdate = (patch: (r: Rule) => Rule, summary: string) => void;

const KIND_WORD: Record<GKind, string> = { cond: 'Điều kiện', and: 'VÀ', or: 'HOẶC', not: 'KHÔNG', each: 'Mỗi phần tử', rule: 'Rule' };

function readPositions(key: string | null): Record<string, { x: number; y: number }> {
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
}

function writePositions(key: string | null, g: Graph) {
  if (!key) return;
  const sigs = signatures(g);
  try {
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(g.nodes.map((n) => [sigs[n.id], n.position]))));
  } catch {
    // Remembering positions is a convenience; without storage the layout simply starts fresh.
  }
}

/**
 * The node graph of the open Rule, shared by the canvas (primary) and the node forms (inspector).
 * Every edit that leaves a valid condition is written to the Draft at once; an incomplete graph stays on the canvas.
 */
export function useRuleGraph(
  rule: Rule | null,
  ruleSet: RuleSet | null,
  update: GraphUpdate | null,
  trace: TraceRule | null,
  scopeKey: string,
) {
  const tree = useMemo(() => (rule && ruleSet ? ruleTree(rule, ruleSet.inputs) : null), [rule, ruleSet]);
  const key = canonKey(tree);
  const storeKey = rule ? `bre-rule-graph:${scopeKey}:${rule.id}` : null;
  const [graph, setGraph] = useState<Graph>(() => treeToGraph(tree, readPositions(storeKey)));
  const [selected, setSelected] = useState<string | null>(null);
  const [editRequest, setEditRequest] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);

  // The graph follows the Rule when the Rule changes from elsewhere (another Rule opened, an undo from a toast).
  const synced = useRef({ key, ruleId: rule?.id });
  useEffect(() => {
    const ruleChanged = synced.current.ruleId !== rule?.id;
    if (!ruleChanged && synced.current.key === key) return;
    synced.current = { key, ruleId: rule?.id };
    setGraph(treeToGraph(tree, readPositions(storeKey)));
    if (ruleChanged) {
      setSelected(null);
      setPicks({});
      setNotice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, rule?.id]);

  const reading = useMemo(() => graphToTree(graph, ruleSet?.inputs ?? []), [graph, ruleSet]);

  // Write a valid graph to the Draft as soon as it says something new.
  const summary = useRef<string | null>(null);
  useEffect(() => {
    if (!update || !rule || !ruleSet || reading.problems.length) return;
    const k = canonKey(reading.tree);
    if (k === synced.current.key) return;
    synced.current = { key: k, ruleId: rule.id };
    const { when, condition } = splitTree(reading.tree, ruleSet.inputs, rule);
    update((r) => {
      const out: Rule = { ...r, when };
      if (condition) out.condition = condition;
      else delete out.condition;
      return out;
    }, summary.current ?? `Sửa điều kiện của ${rule.id}`);
    summary.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading]);

  const inSync = !reading.problems.length && canonKey(reading.tree) === key;
  const traced = useMemo(
    () => (inSync && trace?.whole ? traceOnGraph(graph, tree, trace.whole, (id) => picks[id]) : {}),
    [inSync, trace, graph, tree, picks],
  );

  const editable = !!update;
  const describe = useCallback(
    (id: string) => {
      const n = graph.nodes.find((x) => x.id === id);
      if (!n) return '';
      return n.data.kind === 'cond' && n.data.leaf ? describeAst(n.data.leaf) : n.data.kind === 'each' ? `Mỗi phần tử ${n.data.path}` : KIND_WORD[n.data.kind];
    },
    [graph],
  );

  const ops = {
    /** Adds a node; returns its id. A wire can come with it, from or into an existing node. */
    add(data: GData, position: { x: number; y: number }, wire?: { from?: string; to?: string }) {
      const id = newId(data.kind);
      setGraph((g) => {
        let next: Graph = { nodes: [...g.nodes, { id, data, position }], edges: g.edges };
        if (wire?.from) next = connectIn(next, wire.from, id).graph;
        if (wire?.to) next = connectIn(next, id, wire.to).graph;
        return next;
      });
      setSelected(id);
      if (data.kind === 'cond' && !data.leaf) setEditRequest((n) => n + 1);
      setNotice(null);
      return id;
    },
    setData(id: string, data: GData, what?: string) {
      if (what) summary.current = what;
      setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, data } : n)) }));
    },
    /** Wires source → target: a node feeds one place only, and single-input nodes take one wire; both replace. */
    connect(source: string, target: string) {
      const r = connectIn(graph, source, target);
      setNotice(r.message);
      if (r.message && !r.changed) return false;
      setGraph(r.graph);
      return true;
    },
    remove(ids: string[]) {
      const drop = new Set(ids.filter((id) => id !== RULE));
      if (!drop.size) return;
      summary.current = `Xoá ${[...drop].map(describe).join(', ')} khỏi ${rule?.id ?? ''}`;
      setGraph((g) => ({ nodes: g.nodes.filter((n) => !drop.has(n.id)), edges: g.edges.filter((e) => !drop.has(e.source) && !drop.has(e.target)) }));
      setSelected((s) => (s && drop.has(s) ? null : s));
    },
    disconnect(edgeIds: string[]) {
      const drop = new Set(edgeIds);
      // Deleting a node also drops its wires: keep the node's "Xoá" summary, which earns the undo toast.
      summary.current ??= `Tháo dây trong ${rule?.id ?? ''}`;
      setGraph((g) => ({ ...g, edges: g.edges.filter((e) => !drop.has(e.id)) }));
    },
    move(changes: { id: string; position: { x: number; y: number } }[], done: boolean) {
      setGraph((g) => {
        const at = new Map(changes.map((c) => [c.id, c.position]));
        const next = { ...g, nodes: g.nodes.map((n) => (at.has(n.id) ? { ...n, position: at.get(n.id)! } : n)) };
        if (done) writePositions(storeKey, next);
        return next;
      });
    },
    relayout() {
      setGraph((g) => {
        const pos = layout(g);
        const next = { ...g, nodes: g.nodes.map((n) => ({ ...n, position: pos[n.id] ?? n.position })) };
        try {
          if (storeKey) localStorage.removeItem(storeKey);
        } catch {
          // nothing remembered to forget
        }
        return next;
      });
    },
  };

  return {
    graph,
    tree,
    reading,
    inSync,
    traced,
    trace,
    selected,
    setSelected,
    editRequest,
    requestEdit: () => setEditRequest((n) => n + 1),
    pick: (id: string, index: number) => setPicks((p) => ({ ...p, [id]: index })),
    notice,
    setNotice,
    editable,
    describe,
    ops,
  };
}

export type RuleGraph = ReturnType<typeof useRuleGraph>;

/** The rules of wiring, applied to a graph; `message` says what was refused or replaced. */
export function connectIn(g: Graph, source: string, target: string): { graph: Graph; message: string | null; changed: boolean } {
  const s = g.nodes.find((n) => n.id === source);
  const t = g.nodes.find((n) => n.id === target);
  if (!s || !t) return { graph: g, message: null, changed: false };
  if (s.id === RULE) return { graph: g, message: 'Rule là điểm cuối: dây chỉ đi vào Rule.', changed: false };
  if (INPUTS[t.data.kind] === 0) return { graph: g, message: 'Node Điều kiện không nhận dây vào: nó tự so sánh một trường của Fact.', changed: false };
  if (g.edges.some((e) => e.source === source && e.target === target)) return { graph: g, message: null, changed: false };
  if (makesCycle(g, source, target)) return { graph: g, message: 'Không nối được: dây này tạo một vòng lặp.', changed: false };
  const notes: string[] = [];
  let edges = g.edges;
  if (edges.some((e) => e.source === source)) {
    edges = edges.filter((e) => e.source !== source);
    notes.push('Mỗi node chỉ nối ra một chỗ: dây cũ đã chuyển sang đây. Cần dùng lại điều kiện thì nhân bản node.');
  }
  if (INPUTS[t.data.kind] === 1 && edges.some((e) => e.target === target)) {
    edges = edges.filter((e) => e.target !== target);
    notes.push(t.data.kind === 'rule' ? 'Rule nhận một dây: dây cũ đã được thay. Nhiều điều kiện thì gom qua một node VÀ.' : 'Node này nhận một dây: dây cũ đã được thay.');
  }
  return { graph: { ...g, edges: [...edges, { id: edgeId(source, target), source, target }] }, message: notes[0] ?? null, changed: true };
}
