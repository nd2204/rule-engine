// A Rule's condition as a node graph: Điều kiện nodes feed VÀ / HOẶC / KHÔNG / Mỗi phần tử nodes, which feed
// the Rule. The graph is the editing form only. What the Draft stores is still the tree (cells plus Compound
// Condition): a graph that reads as a valid tree is saved, anything else stays on the canvas with its problems shown.
// Node positions are view state, remembered by this browser, never written to the Draft.

import { describeAst } from '../../domain/cell';
import { normalize } from '../../domain/compound';
import type { AstNode, InputField, TraceNode } from '../../domain/types';

export type CompareNode = Extract<AstNode, { value: unknown }>;
export type Quant = 'some' | 'all' | 'none';

export type GData =
  | { kind: 'cond'; leaf: CompareNode | null }
  | { kind: 'and' }
  | { kind: 'or' }
  | { kind: 'not' }
  | { kind: 'each'; op: Quant; path: string }
  | { kind: 'rule' };

export type GKind = GData['kind'];

export interface GNode {
  id: string;
  data: GData;
  position: { x: number; y: number };
}

export interface GEdge {
  id: string;
  source: string;
  target: string;
}

export interface Graph {
  nodes: GNode[];
  edges: GEdge[];
}

export const RULE = 'rule';

/** How many wires may enter a node: none, one (a new one replaces it), or any number. */
export const INPUTS: Record<GKind, 0 | 1 | 'many'> = { cond: 0, and: 'many', or: 'many', not: 1, each: 1, rule: 1 };

export const edgeId = (source: string, target: string) => `e:${source}->${target}`;

let seq = 0;
export const newId = (kind: GKind) => `${kind}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

// ---------- tree → graph ----------

/** Builds the graph of a tree, laid out right to left from the Rule; `remembered` positions win over the layout. */
export function treeToGraph(tree: AstNode | null, remembered: Record<string, { x: number; y: number }> = {}): Graph {
  const nodes: GNode[] = [{ id: RULE, data: { kind: 'rule' }, position: { x: 0, y: 0 } }];
  const edges: GEdge[] = [];
  const build = (n: AstNode): string => {
    let data: GData;
    let kids: AstNode[] = [];
    switch (n.op) {
      case 'and':
      case 'or':
        data = { kind: n.op };
        kids = n.args;
        break;
      case 'not':
        data = { kind: 'not' };
        kids = [n.arg];
        break;
      case 'some':
      case 'all':
      case 'none':
        data = { kind: 'each', op: n.op, path: n.path };
        kids = [n.where];
        break;
      default:
        data = { kind: 'cond', leaf: n };
    }
    const id = newId(data.kind);
    nodes.push({ id, data, position: { x: 0, y: 0 } });
    for (const k of kids) {
      const child = build(k);
      edges.push({ id: edgeId(child, id), source: child, target: id });
    }
    return id;
  };
  if (tree) {
    const root = build(tree);
    edges.push({ id: edgeId(root, RULE), source: root, target: RULE });
  }
  const g = { nodes, edges };
  const auto = layout(g);
  const sigs = signatures(g);
  return { nodes: nodes.map((n) => ({ ...n, position: remembered[sigs[n.id]] ?? auto[n.id] ?? n.position })), edges };
}

// ---------- graph → tree ----------

export interface Problem {
  nodeId: string;
  message: string;
}

export interface Reading {
  tree: AstNode | null;
  problems: Problem[];
  /** Nodes not wired, directly or through others, into the Rule: they are not part of its condition. */
  loose: Set<string>;
}

const inputsOf = (g: Graph, id: string) =>
  g.edges
    .filter((e) => e.target === id)
    .map((e) => g.nodes.find((n) => n.id === e.source)!)
    .filter(Boolean)
    // Inputs read top to bottom, the way they are drawn.
    .sort((a, b) => a.position.y - b.position.y);

/** Reads the graph back into a condition tree, with every problem that keeps it from being one. */
export function graphToTree(g: Graph, inputs: InputField[]): Reading {
  const problems: Problem[] = [];
  const reached = new Set<string>();
  const top = inputs.filter((f) => f.type !== 'list');

  const read = (node: GNode, scope: InputField[], listName: string | null): AstNode | null => {
    reached.add(node.id);
    const ins = inputsOf(g, node.id);
    const d = node.data;
    switch (d.kind) {
      case 'cond': {
        if (!d.leaf) {
          problems.push({ nodeId: node.id, message: 'Chưa đặt điều kiện' });
          return null;
        }
        if (!scope.some((f) => f.name === d.leaf!.path)) {
          problems.push({
            nodeId: node.id,
            message: listName ? `${d.leaf.path} không phải trường của phần tử ${listName}` : `${d.leaf.path} là trường của phần tử: nối qua một node Mỗi phần tử`,
          });
          return null;
        }
        return d.leaf;
      }
      case 'and':
      case 'or': {
        if (!ins.length) {
          problems.push({ nodeId: node.id, message: 'Chưa có đầu vào nào' });
          return null;
        }
        const args = ins.map((n) => read(n, scope, listName));
        if (args.some((a) => !a)) return null;
        return args.length === 1 ? args[0] : { op: d.kind, args: args as AstNode[] };
      }
      case 'not': {
        if (!ins.length) {
          problems.push({ nodeId: node.id, message: 'Chưa có đầu vào' });
          return null;
        }
        const arg = read(ins[0], scope, listName);
        return arg && { op: 'not', arg };
      }
      case 'each': {
        const list = inputs.find((f) => f.name === d.path && f.type === 'list');
        if (!list) {
          problems.push({ nodeId: node.id, message: `Không có danh sách ${d.path}` });
          return null;
        }
        if (listName) {
          problems.push({ nodeId: node.id, message: 'Không lồng Mỗi phần tử trong Mỗi phần tử' });
          return null;
        }
        if (!ins.length) {
          problems.push({ nodeId: node.id, message: 'Chưa có điều kiện cho mỗi phần tử' });
          return null;
        }
        const where = read(ins[0], (list.itemFields ?? []).filter((f) => f.type !== 'list'), list.name);
        return where && { op: d.op, path: d.path, where };
      }
      case 'rule':
        return null;
    }
  };

  reached.add(RULE);
  const first = inputsOf(g, RULE)[0];
  const raw = first ? read(first, top, null) : null;
  const loose = new Set(g.nodes.filter((n) => !reached.has(n.id)).map((n) => n.id));
  return { tree: problems.length ? null : raw && normalize(raw), problems, loose };
}

/** True when wiring source → target would close a loop. */
export function makesCycle(g: Graph, source: string, target: string): boolean {
  if (source === target) return true;
  // A loop exists when the target already feeds, directly or not, into the source.
  const stack = [target];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === source) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const e of g.edges) if (e.source === id) stack.push(e.target);
  }
  return false;
}

/** The fields a condition node may compare: an item's fields when it feeds a Mỗi phần tử node, else the Fact's. */
export function scopeOf(g: Graph, id: string, inputs: InputField[]): { fields: InputField[]; list: string | null } {
  let cur = id;
  const seen = new Set<string>();
  while (!seen.has(cur)) {
    seen.add(cur);
    const out = g.edges.find((e) => e.source === cur);
    if (!out) break;
    const next = g.nodes.find((n) => n.id === out.target);
    if (!next) break;
    if (next.data.kind === 'each') {
      const each = next.data;
      const list = inputs.find((f) => f.name === each.path);
      return { fields: (list?.itemFields ?? []).filter((f) => f.type !== 'list'), list: each.path };
    }
    cur = next.id;
  }
  return { fields: inputs.filter((f) => f.type !== 'list'), list: null };
}

// ---------- layout ----------

export const SIZE: Record<GKind, { w: number; h: number }> = {
  cond: { w: 224, h: 90 },
  and: { w: 144, h: 76 },
  or: { w: 144, h: 76 },
  not: { w: 144, h: 76 },
  each: { w: 236, h: 104 },
  rule: { w: 240, h: 150 },
};

const COL_GAP = 72;
const ROW_GAP = 20;

/** Right to left from the Rule: each node one column left of what it feeds, centred on its inputs. */
export function layout(g: Graph): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  const depthOf: Record<string, number> = {};
  let cursor = 0;
  const place = (id: string, depth: number): number => {
    depthOf[id] = depth;
    const node = g.nodes.find((n) => n.id === id)!;
    const size = SIZE[node.data.kind];
    const ins = g.edges.filter((e) => e.target === id).map((e) => e.source);
    let cy: number;
    if (!ins.length) {
      cy = cursor + size.h / 2;
      cursor += size.h + ROW_GAP;
    } else {
      const ys = ins.map((s) => place(s, depth + 1));
      cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    }
    pos[id] = { x: 0, y: cy - size.h / 2 };
    return cy;
  };
  place(RULE, 0);
  // A column is as wide as its widest node, so narrow VÀ / HOẶC columns keep the graph compact.
  const kindOf = (id: string) => g.nodes.find((n) => n.id === id)!.data.kind;
  const width: number[] = [];
  for (const [id, d] of Object.entries(depthOf)) width[d] = Math.max(width[d] ?? 0, SIZE[kindOf(id)].w);
  const right: number[] = [0];
  for (let d = 1; d < width.length; d++) right[d] = right[d - 1] - width[d - 1] - COL_GAP;
  for (const [id, d] of Object.entries(depthOf)) pos[id].x = right[d] - (width[d] + SIZE[kindOf(id)].w) / 2;
  // Nodes not wired to the Rule wait in a row under the graph.
  let lx = right[Math.min(2, right.length - 1)] - width[Math.min(2, width.length - 1)];
  for (const n of g.nodes) {
    if (pos[n.id]) continue;
    pos[n.id] = { x: lx, y: cursor + 40 };
    lx += SIZE[n.data.kind].w + 24;
  }
  const minX = Math.min(...Object.values(pos).map((p) => p.x));
  for (const p of Object.values(pos)) p.x -= minX;
  return pos;
}

/** A name for each node that survives a rebuild: its kind and what its subtree says, numbered when repeated. */
export function signatures(g: Graph): Record<string, string> {
  const memo: Record<string, string> = {};
  const say = (id: string): string => {
    if (memo[id]) return memo[id];
    const n = g.nodes.find((x) => x.id === id)!;
    const ins = inputsOf(g, id).map((x) => say(x.id));
    const d = n.data;
    const head = d.kind === 'cond' ? `cond(${d.leaf ? describeAst(d.leaf) : '?'})` : d.kind === 'each' ? `${d.op}(${d.path})` : d.kind;
    return (memo[id] = ins.length ? `${head}[${ins.join(',')}]` : head);
  };
  const count: Record<string, number> = {};
  const out: Record<string, string> = {};
  for (const n of g.nodes) {
    const s = say(n.id);
    count[s] = (count[s] ?? 0) + 1;
    out[n.id] = `${s}#${count[s]}`;
  }
  return out;
}

// ---------- comparing trees ----------

/** A key equal for two trees that differ only in the order of and / or branches. */
export function canonKey(tree: AstNode | null): string {
  if (!tree) return '∅';
  const k = (n: AstNode): string => {
    switch (n.op) {
      case 'and':
      case 'or':
        return `${n.op}(${n.args.map(k).sort().join(',')})`;
      case 'not':
        return `not(${k(n.arg)})`;
      case 'some':
      case 'all':
      case 'none':
        return `${n.op}:${n.path}(${k(n.where)})`;
      default:
        return `${n.path}${n.op}${JSON.stringify(n.value)}`;
    }
  };
  return k(normalize(tree));
}

// ---------- Evaluation Trace on the graph ----------

export interface NodeTrace {
  ok: boolean;
  value?: unknown;
  missing?: boolean;
  /** Mỗi phần tử: the element shown, out of how many, and how many matched. */
  items?: { index: number; count: number; matched: number; total: number };
}

/** The normalized tree a wired node stands for (null when incomplete). */
function subtree(g: Graph, id: string): AstNode | null {
  const node = g.nodes.find((n) => n.id === id)!;
  const ins = inputsOf(g, id);
  const d = node.data;
  switch (d.kind) {
    case 'cond':
      return d.leaf;
    case 'and':
    case 'or': {
      const args = ins.map((n) => subtree(g, n.id));
      if (!args.length || args.some((a) => !a)) return null;
      return normalize(args.length === 1 ? args[0]! : { op: d.kind, args: args as AstNode[] });
    }
    case 'not': {
      const a = ins[0] && subtree(g, ins[0].id);
      return a ? normalize({ op: 'not', arg: a }) : null;
    }
    case 'each': {
      const a = ins[0] && subtree(g, ins[0].id);
      return a ? { op: d.op, path: d.path, where: a } : null;
    }
    default:
      return null;
  }
}

/**
 * Lays the engine's trace of the Rule's condition (in the engine's tree order) onto the graph's nodes.
 * Branches are matched by what they say, not by position, since the table may hold them in another order.
 */
export function traceOnGraph(g: Graph, tree: AstNode | null, trace: TraceNode | null, pick: (id: string) => number | undefined): Record<string, NodeTrace> {
  const out: Record<string, NodeTrace> = {};
  if (!tree || !trace) return out;
  const first = inputsOf(g, RULE)[0];
  if (!first) return out;

  const attach = (id: string, ast: AstNode, t: TraceNode) => {
    const node = g.nodes.find((n) => n.id === id)!;
    const ins = inputsOf(g, id);
    const d = node.data;
    if ((d.kind === 'and' || d.kind === 'or') && ins.length === 1) {
      attach(ins[0].id, ast, t);
      out[id] = { ok: out[ins[0].id]?.ok ?? !!t.ok };
      return;
    }
    out[id] = { ok: !!t.ok };
    switch (d.kind) {
      case 'cond':
        out[id] = { ok: !!t.ok, ...(t.missing ? { missing: true } : { value: t.value }) };
        return;
      case 'not':
        if (ins[0] && ast.op === 'not' && t.children?.[0]) attach(ins[0].id, ast.arg, t.children[0]);
        return;
      case 'each': {
        if (!ins[0] || !('where' in ast)) return;
        const els = (t.children ?? []).filter((c) => c.ok !== null);
        if (!els.length) return;
        const preferred = d.op === 'all' ? els.findIndex((c) => c.ok === false) : els.findIndex((c) => c.ok === true);
        const index = Math.min(pick(id) ?? Math.max(0, preferred), els.length - 1);
        const total = Number(/\((\d+) phần tử\)/.exec(t.text)?.[1] ?? els.length);
        out[id].items = { index, count: els.length, matched: els.filter((c) => c.ok).length, total };
        attach(ins[0].id, ast.where, els[index]);
        return;
      }
      case 'and':
      case 'or': {
        if (ast.op !== d.kind) return;
        // A VÀ wired into a VÀ reads as one flat VÀ in the engine: descend through same-kind nodes.
        const flat: string[] = [];
        const nested: string[] = [];
        const walk = (nid: string) => {
          for (const c of inputsOf(g, nid)) {
            if (c.data.kind === d.kind && inputsOf(g, c.id).length > 1) {
              nested.push(c.id);
              walk(c.id);
            } else flat.push(c.id);
          }
        };
        walk(id);
        const used = new Set<number>();
        for (const cid of flat) {
          const key = canonKey(subtree(g, cid));
          const i = ast.args.findIndex((a, j) => !used.has(j) && canonKey(a) === key);
          if (i < 0 || !t.children?.[i]) continue;
          used.add(i);
          attach(cid, ast.args[i], t.children[i]);
        }
        for (const nid of nested.reverse()) {
          const oks = inputsOf(g, nid).map((c) => out[c.id]?.ok);
          if (oks.every((o) => o !== undefined)) out[nid] = { ok: d.kind === 'and' ? oks.every(Boolean) : oks.some(Boolean) };
        }
        return;
      }
    }
  };
  attach(first.id, tree, trace);
  return out;
}
