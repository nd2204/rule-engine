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
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { ChevronDown, LayoutGrid, ListChecks, Maximize, Minus, PanelRightClose, PanelRightOpen, Plus, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { Lamp, type LampState } from '../../components/Lamp';
import { describeAst } from '../../domain/cell';
import { conjuncts } from '../../domain/compound';
import type { InputField, Rule, RuleSet, TestCase, TestCaseResult, TraceRule } from '../../domain/types';
import { INPUTS, RULE, SIZE, makesCycle, scopeOf, type GData, type GKind } from './graph';
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
        </header>
        <p className={`rgraph__readout is-${verdict.lamp}`} aria-live="polite">
          <Lamp state={verdict.lamp} size="sm" />
          <span>{verdict.text}</span>
        </p>
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
    </nav>
  );
}

// Below 0.72 the node lettering stops being comfortable: a bigger graph is panned instead.
// The padding clears what floats on the canvas: the Rule list on the left, the verdict above, the palette below.
const FIT = { padding: { top: '120px', right: '40px', bottom: '80px', left: '272px' }, minZoom: 0.72, maxZoom: 1 } as const;
const FIT_NARROW = { ...FIT, padding: { ...FIT.padding, top: '170px', left: '136px' } } as const;
const fitOptions = () => (window.matchMedia('(max-width: 639px)').matches ? FIT_NARROW : FIT);

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
          animated: !!t?.ok,
          selected: selectedEdges.has(e.id),
          deletable: editable,
        };
      }),
    [g, selectedEdges, editable],
  );

  // Frame the graph when a Rule opens; later edits keep the author's view.
  const frame = useCallback(
    async (duration: number) => {
      await rf.fitView({ ...fitOptions(), duration });
    },
    [rf],
  );
  useEffect(() => {
    setMeasured({});
    const t = window.setTimeout(() => void frame(0), 40);
    return () => window.clearTimeout(t);
  }, [rule.id, frame]);

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
    g.ops.add(data, { x, y });
    const zoom = rf.getViewport().zoom;
    window.setTimeout(() => void rf.setCenter(x + SIZE[kind].w / 2, y + SIZE[kind].h / 2, { zoom, duration: 260 }), 30);
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
  const scopeHint = g.selected ? scopeOf(g.graph, g.selected, ruleSet.inputs).list : null;

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
        deleteKeyCode={editable ? ['Delete', 'Backspace'] : null}
        connectionRadius={36}
        minZoom={0.35}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'default' }}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={fitOptions()}
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
          {scopeHint && <span className="rgraph__scope">Trong {scopeHint}: so sánh trường của phần tử</span>}
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
