import {
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type FinalConnectionState,
  type NodeChange,
  type ReactFlowProps,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { ChevronDown, Info, LayoutGrid, ListChecks, Maximize, Minus, PanelRightClose, PanelRightOpen, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { Lamp, type LampState } from '../../components/Lamp';
import { describeAst } from '../../domain/cell';
import { conjuncts } from '../../domain/compound';
import type { InputField, Rule, RuleSet, TestCase, TestCaseResult, TraceRule } from '../../domain/types';
import { INPUTS, RULE, SIZE, makesCycle, type GData, type GKind } from './graph';
import { nodeTypes, typeOf, type GFlowNode } from './nodes';
import type { RuleGraph } from './useRuleGraph';

interface Props {
  graph: RuleGraph;
  rule: Rule;
  index: number;
  ruleSet: RuleSet;
  testCases: TestCase[] | null;
  results: TestCaseResult[] | null;
  running: boolean;
  selectedTc: string | null;
  onSelectTc: (id: string | null) => void;
  ruleHref: (ruleId: string) => string;
  /** Present when the Rule Set is editable: adds a blank Rule and opens it. */
  onAddRule?: () => void;
  /** Present when the Rule Set is editable: removes the open Rule and moves to its neighbour. */
  onRemoveRule?: () => void;
  /** The Rule's inspector, a drawer beside the canvas: a node opens it, this toggle opens the Rule's overview. */
  inspectorOpen: boolean;
  onToggleInspector: () => void;
}

/** The open Rule's Evaluation Trace for the selected Test Case, when the Simulation has one. */
export function ruleTrace(results: TestCaseResult[] | null, tcId: string | null, ruleId: string): TraceRule | null {
  return results?.find((r) => r.testCaseId === tcId)?.actual.trace?.rules.find((r) => r.ruleId === ruleId) ?? null;
}

export const DISPOSITION_WORD: Record<TraceRule['disposition'], string> = {
  won: 'match, thắng',
  collected: 'match, vào output',
  shadowed: 'match, bị Rule trước che',
  outweighed: 'match, thua weight',
  conflict: 'match, xung đột UNIQUE',
  missed: 'không match',
};

/** The palette, in the order an author reaches for them. */
export const PALETTE: { kind: GKind; word: string; hint: string }[] = [
  { kind: 'cond', word: 'Điều kiện', hint: 'So sánh một trường của Fact' },
  { kind: 'and', word: 'VÀ', hint: 'Đúng khi tất cả đầu vào đúng' },
  { kind: 'or', word: 'HOẶC', hint: 'Đúng khi ít nhất một đầu vào đúng' },
  { kind: 'not', word: 'KHÔNG', hint: 'Đảo ngược đầu vào' },
  { kind: 'each', word: 'Mỗi phần tử', hint: 'Xét từng phần tử của một danh sách' },
];

export function freshData(kind: GKind, ruleSet: RuleSet): GData | null {
  switch (kind) {
    case 'cond':
      return { kind: 'cond', leaf: null };
    case 'each': {
      const list = ruleSet.inputs.find((f) => f.type === 'list');
      return list ? { kind: 'each', op: 'some', path: list.name } : null;
    }
    case 'rule':
      return null;
    default:
      return { kind };
  }
}

export function RuleGraphView(props: Props) {
  // The canvas bleeds to the edges of the primary slot, down to the commit bar: it needs to know where it starts.
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => el.style.setProperty('--graph-top', `${Math.round(el.getBoundingClientRect().top + window.scrollY)}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  const { graph: g, ruleSet } = props;
  const tr = g.trace;
  const result = props.results?.find((r) => r.testCaseId === props.selectedTc) ?? null;
  const verdict = readout(props, tr, result?.actual.error?.code === 'SCHEMA' ? result.actual.error.message : null);
  const tcs = props.testCases ?? [];
  const lists = ruleSet.inputs.filter((f) => f.type === 'list');

  return (
    <section ref={ref} className="rgraph" aria-labelledby="rgraph-title">
      <RuleRail {...props} />

      <div className="rgraph__hud">
        <header className="rgraph__bar">
          <label className="rgraph__fact">
            <span className="rgraph__label">Chạy thử</span>
            <span className="sim-source__select-wrap">
              <select className="sim-source__select" value={props.selectedTc ?? ''} onChange={(e) => props.onSelectTc(e.target.value || null)} disabled={!tcs.length}>
                <option value="">{tcs.length ? 'Không chọn Test Case' : 'Chưa có Test Case'}</option>
                {tcs.map((t) => {
                  const r = props.results?.find((x) => x.testCaseId === t.id);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.id} · {t.name}
                      {r ? ` · ${r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'fail' : 'lỗi'}` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} aria-hidden="true" className="sim-source__chevron" />
            </span>
          </label>
          {/* Beside the Test Case it answers, so the head stays one row on a laptop and the graph keeps the height. With no Test Case there is nothing to read yet, so the hint folds to an icon. */}
          {props.selectedTc ? (
            <p className={`rgraph__readout is-${verdict.lamp}`} aria-live="polite">
              <Lamp state={verdict.lamp} size="sm" />
              <span>{verdict.text}</span>
            </p>
          ) : (
            <p className="rgraph__readout is-idle rgraph__readout--icon" aria-live="polite">
              <button type="button" className="rgraph__hint" aria-label="Cách xem node đúng, sai" aria-describedby="rgraph-hint">
                <Info size={15} aria-hidden="true" />
              </button>
              <span id="rgraph-hint" role="tooltip" className="rgraph__hint-tip">
                {verdict.text}
              </span>
            </p>
          )}
        </header>
      </div>

      <ReactFlowProvider>
        <Canvas {...props} lists={lists} />
      </ReactFlowProvider>
    </section>
  );
}

/** The Rule Set down the left edge: the Node view's way between Rules, lit by the selected Test Case. */
function RuleRail(props: Props) {
  const { ruleSet, rule } = props;
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  }, [rule.id]);
  return (
    <nav className="rgraph__rail" aria-label="Rules">
      <p className="rgraph__rail-head">
        <span className="rgraph__label">Rules</span>
        <span className="rgraph__rail-count">{ruleSet.rules.length}</span>
      </p>
      <ol ref={listRef} className="rgraph__rules">
        {ruleSet.rules.map((r, i) => {
          const tr = props.selectedTc ? ruleTrace(props.results, props.selectedTc, r.id) : null;
          const lamp: LampState | null = !tr
            ? null
            : !tr.matched
              ? 'idle'
              : tr.disposition === 'won' || tr.disposition === 'collected'
                ? 'clear'
                : tr.disposition === 'conflict'
                  ? 'stop'
                  : 'caution';
          return (
            <li key={r.id}>
              <a
                className="rgraph__rule"
                href={props.ruleHref(r.id)}
                aria-current={r.id === rule.id ? 'page' : undefined}
                title={tr ? `${r.id}: ${tr.matched ? DISPOSITION_WORD[tr.disposition] : 'không match'}` : undefined}
              >
                <span className="rule__index">{i + 1}</span>
                <span className="rgraph__rule-text">
                  <span className="rgraph__rule-id" id={r.id === rule.id ? 'rgraph-title' : undefined}>
                    {r.id}
                  </span>
                  <span className="rgraph__rule-desc">{r.description || 'Chưa có mô tả'}</span>
                </span>
                {lamp && <Lamp state={lamp} size="sm" />}
              </a>
            </li>
          );
        })}
      </ol>
      {props.onAddRule && (
        <button type="button" className="rgraph__rail-add" onClick={props.onAddRule}>
          <Plus size={15} aria-hidden="true" /> Thêm Rule
        </button>
      )}
      {props.onRemoveRule && (
        <button type="button" className="rgraph__rail-remove" onClick={props.onRemoveRule}>
          <Trash2 size={15} aria-hidden="true" /> Xoá {rule.id}
        </button>
      )}
    </nav>
  );
}

// Below 0.8 the node lettering (12px glosses and labels) drops under 10px on screen: a bigger graph is panned instead.
const MIN_ZOOM = 0.8;
// The first paint only: once the canvas is measured, frame() fits to the room the floating panels leave.
const FIT = { padding: { top: '120px', right: '40px', bottom: '80px', left: '272px' }, minZoom: MIN_ZOOM, maxZoom: 1 } as const;

interface Room {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The part of the canvas nothing floats over, in px from the frame's corner: right of the Rule list, under the head, above the palette and the status. */
function roomOf(frame: HTMLElement): Room {
  const box = frame.getBoundingClientRect();
  const root = frame.closest('.rgraph') ?? frame;
  const at = (sel: string) => root.querySelector(sel)?.getBoundingClientRect();
  const rail = at('.rgraph__rail');
  const above = [at('.rgraph__hud'), at('.rgraph__view')].map((r) => (r ? r.bottom - box.top : 0));
  const below = [at('.rgraph__palette'), at('.rgraph__status')].map((r) => (r && r.height ? box.bottom - r.top : 0));
  return {
    left: (rail ? rail.right - box.left : 0) + 24,
    top: Math.max(0, ...above) + 16,
    right: box.width - 24,
    bottom: box.height - Math.max(0, ...below) - 16,
  };
}

/** How far a span [a, b] must move to sit inside [min, max]; when it cannot fit, its start wins. */
const nudge = (a: number, b: number, min: number, max: number) => (a < min ? min - a : b > max ? Math.max(min - a, max - b) : 0);

const ARIA: ReactFlowProps['ariaLabelConfig'] = {
  'node.a11yDescription.default': 'Enter để chọn node và mở form của nó ở ngăn bên phải. Delete để xoá, Escape để bỏ chọn.',
  'node.a11yDescription.keyboardDisabled': 'Enter để chọn node và mở form của nó ở ngăn bên phải. Escape để bỏ chọn.',
  'node.a11yDescription.ariaLiveMessage': ({ x, y }) => `Đã dời node tới x ${Math.round(x)}, y ${Math.round(y)}.`,
  'edge.a11yDescription.default': 'Dây giữa hai node. Nối hoặc tháo dây ở mục Đầu ra nối vào trong form của node.',
  'handle.ariaLabel': 'Cổng nối dây',
};

interface Picker {
  x: number;
  y: number;
  at: { x: number; y: number };
  /** The node the dropped wire came from, and which end of it. */
  from: string;
  end: 'source' | 'target';
}

function Canvas(props: Props & { lists: InputField[] }) {
  const { graph: g, ruleSet, rule } = props;
  const rf = useReactFlow();
  const frameRef = useRef<HTMLDivElement>(null);
  const editable = g.editable;
  const [measured, setMeasured] = useState<Record<string, { width: number; height: number }>>({});
  const [selectedEdges, setSelectedEdges] = useState<Set<string>>(new Set());
  const [picker, setPicker] = useState<Picker | null>(null);

  const labels = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of ruleSet.inputs) {
      m.set(f.name, f.label);
      for (const i of f.itemFields ?? []) if (!m.has(i.name)) m.set(i.name, i.label);
    }
    return m;
  }, [ruleSet.inputs]);

  const problems = useMemo(() => new Map(g.reading.problems.map((p) => [p.nodeId, p.message])), [g.reading.problems]);
  const tr = g.trace;
  const nodes = useMemo<GFlowNode[]>(
    () =>
      g.graph.nodes.map((n) => ({
        id: n.id,
        type: typeOf(n.data),
        position: n.position,
        selected: g.selected === n.id,
        deletable: editable && n.id !== RULE,
        connectable: editable,
        ariaLabel: nodeLabel(g, n.id, n.id === RULE && tr ? DISPOSITION_WORD[tr.disposition] : null),
        ...(measured[n.id] ? { measured: measured[n.id] } : {}),
        data: {
          g: n.data,
          trace: g.traced[n.id],
          problem: problems.get(n.id),
          loose: g.reading.loose.has(n.id),
          editable,
          label: n.data.kind === 'cond' && n.data.leaf ? labels.get(n.data.leaf.path) : undefined,
          inputs: g.graph.edges.filter((e) => e.target === n.id).length,
          onPick: (i: number) => g.pick(n.id, i),
          ...(n.id === RULE
            ? {
                rule: {
                  id: rule.id,
                  outputs: ruleSet.outputs,
                  then: rule.then,
                  ...(ruleSet.hitPolicy === 'PRIORITY' ? { weight: rule.weight ?? 0 } : {}),
                  ...(tr
                    ? {
                        verdict: {
                          lamp: (tr.disposition === 'won' || tr.disposition === 'collected' ? 'clear' : tr.matched ? 'caution' : 'idle') as LampState,
                          word: DISPOSITION_WORD[tr.disposition],
                        },
                      }
                    : {}),
                },
              }
            : {}),
        },
      })),
    [g, editable, measured, problems, labels, rule, ruleSet, tr],
  );

  const edges = useMemo<Edge[]>(
    () =>
      g.graph.edges.map((e) => {
        const t = g.traced[e.source];
        const tone = t ? (t.ok ? 'is-true' : 'is-false') : 'is-idle';
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          className: `gedge ${tone}${g.reading.loose.has(e.source) ? ' is-loose' : ''}`,
          ariaLabel: `Dây từ ${g.nameOf(e.source)} vào ${g.nameOf(e.target)}${t ? (t.ok ? ', mang giá trị đúng' : ', mang giá trị sai') : ''}`,
          animated: !!t?.ok,
          selected: selectedEdges.has(e.id),
          deletable: editable,
        };
      }),
    [g, selectedEdges, editable],
  );

  // Frame the graph in the room the floating panels leave. A graph too big to read whole is anchored on the Rule,
  // where the answer is, and read back from it to the left.
  const frame = useCallback(
    async (duration: number) => {
      const el = frameRef.current;
      if (!el) return;
      const room = roomOf(el);
      const px = (n: number) => `${Math.round(n)}px` as const;
      const padding = { top: px(room.top), left: px(room.left), right: px(el.clientWidth - room.right), bottom: px(el.clientHeight - room.bottom) };
      await rf.fitView({ padding, minZoom: MIN_ZOOM, maxZoom: 1, duration });
      const vp = rf.getViewport();
      if (vp.zoom > MIN_ZOOM + 0.001) return;
      const all = rf.getNodesBounds(rf.getNodes());
      const ruleNode = rf.getInternalNode(RULE);
      const z = vp.zoom;
      const fitsW = all.width * z <= room.right - room.left;
      const fitsH = all.height * z <= room.bottom - room.top;
      const rx = ruleNode ? ruleNode.internals.positionAbsolute.x + (ruleNode.measured.width ?? SIZE.rule.w) : all.x + all.width;
      const ry = ruleNode ? ruleNode.internals.positionAbsolute.y + (ruleNode.measured.height ?? SIZE.rule.h) / 2 : all.y + all.height / 2;
      const x = fitsW ? room.left + (room.right - room.left - all.width * z) / 2 - all.x * z : room.right - rx * z;
      const y = fitsH ? room.top + (room.bottom - room.top - all.height * z) / 2 - all.y * z : (room.top + room.bottom) / 2 - ry * z;
      await rf.setViewport({ x, y, zoom: z }, { duration });
    },
    [rf],
  );

  /** Pans as little as it takes to bring these nodes clear of the floating panels; when they cannot all show, the first one wins. */
  const reveal = useCallback(
    (ids: string[], duration: number) => {
      const el = frameRef.current;
      if (!el) return;
      const room = roomOf(el);
      const { x: vx, y: vy, zoom } = rf.getViewport();
      const boxes = ids.flatMap((id) => {
        const n = rf.getInternalNode(id);
        if (!n) return [];
        const l = n.internals.positionAbsolute.x * zoom + vx;
        const t = n.internals.positionAbsolute.y * zoom + vy;
        return [{ l, t, r: l + (n.measured.width ?? 200) * zoom, b: t + (n.measured.height ?? 80) * zoom }];
      });
      if (!boxes.length) return;
      let u = boxes.reduce((a, b) => ({ l: Math.min(a.l, b.l), t: Math.min(a.t, b.t), r: Math.max(a.r, b.r), b: Math.max(a.b, b.b) }));
      if (u.r - u.l > room.right - room.left || u.b - u.t > room.bottom - room.top) u = boxes[0];
      const dx = nudge(u.l, u.r, room.left, room.right);
      const dy = nudge(u.t, u.b, room.top, room.bottom);
      if (dx || dy) void rf.setViewport({ x: vx + dx, y: vy + dy, zoom }, { duration });
    },
    [rf],
  );

  useEffect(() => {
    setMeasured({});
    const t = window.setTimeout(() => void frame(0), 40);
    return () => window.clearTimeout(t);
  }, [rule.id, frame]);

  // The node being edited and the Rule stay in sight: when a node is picked, and when the canvas changes size
  // (the inspector drawer opening beside it, a window resize). With nothing picked, a new size re-frames the graph.
  const selectedRef = useRef(g.selected);
  selectedRef.current = g.selected;
  useEffect(() => {
    if (!g.selected) return;
    const t = window.setTimeout(() => reveal([g.selected!, RULE], 220), 60);
    return () => window.clearTimeout(t);
  }, [g.selected, reveal]);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    let size = `${el.clientWidth}x${el.clientHeight}`;
    let t = 0;
    const ro = new ResizeObserver(() => {
      const next = `${el.clientWidth}x${el.clientHeight}`;
      if (next === size) return;
      size = next;
      window.clearTimeout(t);
      t = window.setTimeout(() => (selectedRef.current ? reveal([selectedRef.current, RULE], 220) : void frame(220)), 120);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [frame, reveal]);

  // Under a Test Case the part the readout names is brought into sight with the Rule: the first false input
  // of the node that feeds the Rule, or that node itself. A graph that fits whole is already in view and stays put.
  const feed = g.graph.edges.find((e) => e.target === RULE)?.source;
  const failing =
    feed && g.traced[feed] && !g.traced[feed].ok
      ? (g.graph.edges.find((e) => e.target === feed && g.traced[e.source] && !g.traced[e.source].ok)?.source ?? feed)
      : null;
  useEffect(() => {
    if (!failing || selectedRef.current) return;
    const t = window.setTimeout(() => reveal([failing, RULE], 260), 80);
    return () => window.clearTimeout(t);
  }, [failing, props.selectedTc, reveal]);

  // A deleted node leaves a hole where the author was looking: the rest of the graph is framed again.
  const count = g.graph.nodes.length;
  const prevCount = useRef(count);
  useEffect(() => {
    const shrank = count < prevCount.current;
    prevCount.current = count;
    if (!shrank) return;
    const t = window.setTimeout(() => void frame(240), 60);
    return () => window.clearTimeout(t);
  }, [count, frame]);

  const onNodesChange = useCallback(
    (changes: NodeChange<GFlowNode>[]) => {
      const moves: { id: string; position: { x: number; y: number } }[] = [];
      let done = false;
      const sizes: Record<string, { width: number; height: number }> = {};
      const removed: string[] = [];
      for (const c of changes) {
        if (c.type === 'position' && c.position) {
          moves.push({ id: c.id, position: c.position });
          if (!c.dragging) done = true;
        } else if (c.type === 'position' && c.dragging === false) done = true;
        if (c.type === 'dimensions' && c.dimensions) sizes[c.id] = c.dimensions;
        if (c.type === 'select') {
          if (c.selected) g.setSelected(c.id);
          else g.setSelected((s) => (s === c.id ? null : s));
        }
        if (c.type === 'remove') removed.push(c.id);
      }
      if (moves.length || done) g.ops.move(moves, done);
      if (Object.keys(sizes).length) setMeasured((m) => ({ ...m, ...sizes }));
      if (removed.length) g.ops.remove(removed);
    },
    [g],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed: string[] = [];
      setSelectedEdges((cur) => {
        const next = new Set(cur);
        for (const c of changes) {
          if (c.type === 'select') c.selected ? next.add(c.id) : next.delete(c.id);
          if (c.type === 'remove') next.delete(c.id);
        }
        return next;
      });
      for (const c of changes) if (c.type === 'remove') removed.push(c.id);
      if (removed.length) g.ops.disconnect(removed);
    },
    [g],
  );

  const isValidConnection = useCallback(
    (c: Connection | Edge) => {
      if (!c.source || !c.target || c.source === RULE) return false;
      const t = g.graph.nodes.find((n) => n.id === c.target);
      if (!t || INPUTS[t.data.kind] === 0) return false;
      return !makesCycle(g.graph, c.source, c.target);
    },
    [g.graph],
  );

  // A wire dropped on empty canvas asks what to put there, the way n8n does.
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (!editable || state.isValid || state.toNode || !state.fromNode || !state.fromHandle) return;
      const box = frameRef.current?.getBoundingClientRect();
      const p = 'changedTouches' in event ? event.changedTouches[0] : event;
      if (!box) return;
      setPicker({
        x: p.clientX - box.left,
        y: p.clientY - box.top,
        at: rf.screenToFlowPosition({ x: p.clientX, y: p.clientY }),
        from: state.fromNode.id,
        end: state.fromHandle.type,
      });
    },
    [editable, rf],
  );

  function addAt(kind: GKind, at: { x: number; y: number }, wire?: { from?: string; to?: string }) {
    const data = freshData(kind, ruleSet);
    if (!data) return;
    const size = SIZE[kind];
    g.ops.add(data, { x: at.x - (wire?.to ? size.w : 0), y: at.y - size.h / 2 }, wire);
  }

  /** A palette click puts the node in free space under the graph, and brings it into view. */
  function addCentred(kind: GKind) {
    const data = freshData(kind, ruleSet);
    if (!data) return;
    const nodes = g.graph.nodes;
    const left = Math.min(...nodes.map((n) => n.position.x));
    const bottom = Math.max(...nodes.map((n) => n.position.y + SIZE[n.data.kind].h));
    const free = nodes.filter((n) => n.position.y > bottom - 2 * SIZE.cond.h && g.reading.loose.has(n.id));
    const x = free.length ? Math.max(...free.map((n) => n.position.x + SIZE[n.data.kind].w)) + 24 : left;
    const y = free.length ? Math.min(...free.map((n) => n.position.y)) : bottom + 48;
    const id = g.ops.add(data, { x, y });
    window.setTimeout(() => reveal([id], 260), 60);
  }

  function onDrop(e: DragEvent) {
    const kind = e.dataTransfer.getData('application/x-bre-node') as GKind;
    if (!kind) return;
    e.preventDefault();
    const at = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addAt(kind, { x: at.x - SIZE[kind].w / 2, y: at.y });
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('input, select, textarea')) return;
    if (e.key === 'Escape') {
      if (picker) setPicker(null);
      else if (g.selected) g.setSelected(null);
      e.preventDefault();
    } else if (e.key === 'Enter' && g.selected) {
      e.preventDefault();
      g.requestEdit();
    }
  }

  const pickerKinds = picker
    ? PALETTE.filter((p) => {
        if (p.kind === 'each' && !props.lists.length) return false;
        // From an output the new node must take an input; into an input anything that gives one.
        return picker.end === 'source' ? INPUTS[p.kind] !== 0 : true;
      })
    : [];

  return (
    <div ref={frameRef} className="rgraph__frame" onKeyDown={onKey}>
      {editable && (
        <div className="rgraph__palette" role="group" aria-label="Thêm node">
          <span className="rgraph__label">Thêm node</span>
          {PALETTE.filter((p) => p.kind !== 'each' || props.lists.length).map((p) => (
            <button
              key={p.kind}
              type="button"
              className={`rgraph__part rgraph__part--${p.kind}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-bre-node', p.kind);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => addCentred(p.kind)}
              title={`${p.hint}. Kéo thả vào canvas, hoặc bấm để thêm.`}
            >
              <PartIcon kind={p.kind} />
              {p.word}
            </button>
          ))}
        </div>
      )}
      <div className="rgraph__flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(c) => c.source && c.target && g.ops.connect(c.source, c.target)}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        onNodeDoubleClick={(_, n) => {
          g.setSelected(n.id);
          g.requestEdit();
        }}
        onPaneClick={() => {
          setPicker(null);
          g.setSelected(null);
        }}
        onDragOver={(e) => {
          if (!editable) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={onDrop}
        nodesConnectable={editable}
        // Edges sit before nodes in the document: focusable, they would put ten stops ahead of the first node.
        // Wires are made and unmade from a node's form instead ("Đầu ra nối vào").
        edgesFocusable={false}
        ariaLabelConfig={ARIA}
        deleteKeyCode={editable ? ['Delete', 'Backspace'] : null}
        connectionRadius={36}
        minZoom={0.35}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'default' }}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={FIT}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} className="rgraph__grid" />

        <Panel position="top-right" className="rgraph__view">
          <div className="flow__group" role="group" aria-label="Khung nhìn">
            <button type="button" className="flow__btn" aria-label="Phóng to" title="Phóng to" onClick={() => void rf.zoomIn({ duration: 160 })}>
              <Plus size={15} aria-hidden="true" />
            </button>
            <button type="button" className="flow__btn" aria-label="Thu nhỏ" title="Thu nhỏ" onClick={() => void rf.zoomOut({ duration: 160 })}>
              <Minus size={15} aria-hidden="true" />
            </button>
            <button type="button" className="flow__btn" aria-label="Vừa khung" title="Vừa khung" onClick={() => void frame(240)}>
              <Maximize size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="flow__btn"
              aria-label="Xếp lại node"
              title="Xếp lại"
              onClick={() => {
                g.ops.relayout();
                window.setTimeout(() => void frame(240), 30);
              }}
            >
              <LayoutGrid size={15} aria-hidden="true" />
            </button>
          </div>
        </Panel>

        <Panel position="bottom-right" className="rgraph__status">
          <SaveState graph={g} />
          <button
            type="button"
            className="rgraph__panel-btn"
            aria-expanded={props.inspectorOpen}
            aria-controls="inspector"
            aria-label={props.inspectorOpen ? 'Đóng ngăn Điều kiện của Rule' : 'Mở ngăn Điều kiện của Rule'}
            title="Điều kiện của Rule"
            onClick={props.onToggleInspector}
          >
            {props.inspectorOpen ? <PanelRightClose size={16} aria-hidden="true" /> : <PanelRightOpen size={16} aria-hidden="true" />}
          </button>
        </Panel>

      </ReactFlow>
      </div>

      {g.notice && (
        <p className="rgraph__notice" role="status">
          {g.notice}
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={() => g.setNotice(null)}>
            ×
          </button>
        </p>
      )}

      {picker && (
        <div
          className="rgraph__picker"
          style={{
            left: Math.min(picker.x, (frameRef.current?.clientWidth ?? 9999) - 260),
            // Near the foot of the canvas the menu opens upwards.
            ...(picker.y > (frameRef.current?.clientHeight ?? 0) - 300 ? { bottom: (frameRef.current?.clientHeight ?? 0) - picker.y } : { top: picker.y }),
          }}
          role="menu"
          aria-label="Thêm node nối với dây này"
        >
          <p className="rgraph__picker-head">{picker.end === 'source' ? 'Nối vào node mới' : 'Node mới cấp đầu vào'}</p>
          {pickerKinds.map((p) => (
            <button
              key={p.kind}
              type="button"
              role="menuitem"
              className="rgraph__picker-item"
              onClick={() => {
                addAt(p.kind, picker.end === 'source' ? picker.at : { x: picker.at.x, y: picker.at.y }, picker.end === 'source' ? { from: picker.from } : { to: picker.from });
                setPicker(null);
              }}
            >
              <PartIcon kind={p.kind} />
              <span>
                <strong>{p.word}</strong>
                <small>{p.hint}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PartIcon({ kind }: { kind: GKind }) {
  if (kind === 'cond') return <SlidersHorizontal size={14} aria-hidden="true" />;
  if (kind === 'each') return <ListChecks size={14} aria-hidden="true" />;
  return <span className={`rgraph__chip rgraph__chip--${kind}`} aria-hidden="true" />;
}

/** Whether what the canvas shows is what the Draft holds. */
export function SaveState({ graph: g }: { graph: RuleGraph }) {
  const n = g.reading.problems.length;
  const loose = g.reading.loose.size;
  if (!g.editable)
    return (
      <span className="rgraph__save">
        <Lamp state="idle" size="sm" /> Chỉ xem
      </span>
    );
  return (
    <span className={`rgraph__save is-${n ? 'stop' : loose ? 'caution' : 'clear'}`}>
      <Lamp state={n ? 'stop' : loose ? 'caution' : 'clear'} size="sm" />
      {n ? `Chưa ghi vào Draft: ${n} chỗ cần sửa` : loose ? `Đã ghi vào Draft · ${loose} node chưa nối, không được lưu` : 'Đã ghi vào Draft'}
    </span>
  );
}

/** The line over the canvas: what the selected Test Case does to this Rule, in words. */
function readout(p: Props, tr: TraceRule | null, schemaError: string | null): { lamp: LampState; text: string } {
  if (!p.selectedTc) return { lamp: 'idle', text: 'Chọn một Test Case ở “Chạy thử” để xem node nào đúng, node nào sai với Fact của nó.' };
  if (p.graph.reading.problems.length) return { lamp: 'caution', text: 'Graph đang sửa dở: sửa các chỗ báo đỏ để chạy lại Test Case.' };
  if (!p.results || (p.running && !tr)) return { lamp: 'pending', text: `Đang chạy ${p.selectedTc}…` };
  if (schemaError) return { lamp: 'stop', text: `${p.selectedTc} bị Input Schema Validation từ chối: ${schemaError}. Không Rule nào được xét.` };
  if (!tr) return { lamp: 'idle', text: `${p.selectedTc} chưa có Evaluation Trace cho ${p.rule.id}.` };
  if (tr.matched) {
    const won = tr.disposition === 'won' || tr.disposition === 'collected';
    return {
      lamp: won ? 'clear' : tr.disposition === 'conflict' ? 'stop' : 'caution',
      text: `${p.selectedTc}: điều kiện đúng, ${p.rule.id} ${DISPOSITION_WORD[tr.disposition]}${tr.by ? ` (${tr.by})` : ''}.`,
    };
  }
  const tree = p.graph.tree;
  const parts = conjuncts(tree);
  const kids = tree?.op === 'and' ? (tr.whole?.children ?? []) : tr.whole ? [tr.whole] : [];
  const failed = parts.filter((_, i) => kids[i]?.ok === false).map((n) => describeAst(n));
  return { lamp: 'stop', text: `${p.selectedTc}: sai ở ${failed.join('; ') || 'một điều kiện'}, nên ${p.rule.id} không match.` };
}

/** A node's accessible name: what it is, and what the Test Case made of it. */
function nodeLabel(g: RuleGraph, id: string, ruleWord: string | null): string {
  const t = g.traced[id];
  const verdict = id === RULE ? ruleWord : t ? (t.missing ? 'Fact thiếu trường' : t.ok ? 'đúng' : 'sai') : null;
  const parts = [g.nameOf(id), verdict, g.reading.loose.has(id) ? 'chưa nối tới Rule' : null, g.reading.problems.find((p) => p.nodeId === id)?.message];
  return parts.filter(Boolean).join(', ');
}
