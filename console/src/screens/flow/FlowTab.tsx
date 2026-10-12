import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { ChevronDown, LayoutGrid, Maximize, Minus, MoveDown, MoveRight, Pause, Play, Plus, SkipBack, SkipForward } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Lamp, type LampState } from '../../components/Lamp';
import type { TestCase } from '../../domain/types';
import { useNarrow } from '../../state';
import type { Simulation } from '../simulation/useSimulation';
import { FlowSteps } from './FlowInspector';
import { buildGraph, layoutOf, type FlowNode } from './graph';
import { edgeTypes, nodeTypes } from './nodes';
import type { Flow } from './useFlow';

interface Props {
  flow: Flow;
  sim: Simulation;
  testCases: TestCase[] | null;
}

/** Sơ đồ tab: the Rule Set as a route plan, and one Fact's Evaluation Trace replayed along it. */
export function FlowTab(props: Props) {
  // The canvas fills the primary slot down to the commit bar: it needs to know where it starts.
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => el.style.setProperty('--flow-top', `${Math.round(el.getBoundingClientRect().top + window.scrollY)}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  // On a phone the steps are the main reading; the drawing is a second view.
  const phone = useNarrow('(max-width: 599px)');
  const [view, setView] = useState<'diagram' | 'steps'>('steps');
  const showSteps = phone && view === 'steps';

  useAutoPick(props.sim);

  return (
    <section ref={ref} className={`flow${showSteps ? ' flow--steps' : ''}`} aria-label="Sơ đồ Evaluation Trace">
      {phone && (
        <div className="mode flow__views" role="group" aria-label="Cách xem">
          <button type="button" className="mode__btn" aria-pressed={view === 'steps'} onClick={() => setView('steps')}>
            Các bước
          </button>
          <button type="button" className="mode__btn" aria-pressed={view === 'diagram'} onClick={() => setView('diagram')}>
            Sơ đồ
          </button>
        </div>
      )}
      {showSteps ? (
        <div className="flow__steps-view">
          <FactPicker {...props} />
          <FlowSteps flow={props.flow} />
        </div>
      ) : (
        <ReactFlowProvider>
          <Canvas {...props} />
        </ReactFlowProvider>
      )}
    </section>
  );
}

/** Opening the tab with nothing picked lands on the first failing Test Case, or the first one: the drawing is never empty for long. */
function useAutoPick(sim: Simulation) {
  const done = useRef(false);
  const results = sim.run?.results;
  useEffect(() => {
    if (done.current || !results?.length) return;
    done.current = true;
    if (sim.selectedKey) return;
    const tcs = results.filter((r) => r.source === 'test-case');
    const pick = tcs.find((r) => r.status && r.status !== 'pass') ?? tcs[0] ?? results[0];
    sim.setSelectedKey(pick.key);
  }, [results, sim]);
}

const STATUS_WORD = { pass: 'pass', fail: 'fail', error: 'lỗi' } as const;
const STATUS_LAMP: Record<string, LampState> = { pass: 'clear', fail: 'stop', error: 'stop' };
const BATCH_CAP = 500;

function FactPicker({ flow, sim, testCases }: Props) {
  const results = sim.run?.results ?? [];
  const tcs = results.filter((r) => r.source === 'test-case');
  const batch = results.filter((r) => r.source === 'batch');
  const lamp: LampState = flow.result?.status ? STATUS_LAMP[flow.result.status] : flow.result ? (flow.result.changed ? 'caution' : 'idle') : 'idle';
  return (
    <label className="flow__pick">
      <span className="visually-hidden">Fact chạy trên sơ đồ</span>
      <span className="flow__pick-lamp">
        <Lamp state={sim.running && !sim.run ? 'pending' : lamp} size="sm" />
      </span>
      <span className="sim-source__select-wrap">
        <select
          className="sim-source__select flow__select"
          value={sim.selectedKey ?? ''}
          onChange={(e) => sim.setSelectedKey(e.target.value || null)}
          disabled={!results.length}
          aria-keyshortcuts="PageUp PageDown"
        >
          <option value="">{results.length ? 'Chọn Fact…' : sim.running ? 'Đang chạy Simulation…' : 'Chưa có Fact'}</option>
          {tcs.length > 0 && (
            <optgroup label="Test Case">
              {tcs.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.key} · {r.status ? STATUS_WORD[r.status] : ''} · {testCases?.find((t) => t.id === r.key)?.name ?? ''}
                </option>
              ))}
            </optgroup>
          )}
          {batch.length > 0 && (
            <optgroup label={`Fact Batch${batch.length > BATCH_CAP ? `: ${BATCH_CAP} Fact đầu` : ''}`}>
              {batch.slice(0, BATCH_CAP).map((r) => (
                <option key={r.key} value={r.key}>
                  {r.key}
                  {r.changed ? ' · đổi kết quả' : ''}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <ChevronDown size={14} aria-hidden="true" className="sim-source__chevron" />
      </span>
    </label>
  );
}

// Room under the toolbar. Below 0.85 the lettering stops being readable, so a plan that cannot fit is panned instead.
const PAD = { top: '84px', right: '32px', bottom: '32px', left: '32px' } as const;
const FIT = { padding: PAD, minZoom: 0.85, maxZoom: 1.1 };

function Canvas({ flow, sim, testCases }: Props) {
  const rf = useReactFlow();
  const narrow = useNarrow('(max-width: 959px)');
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const { ruleSet, result, traced, steps, current, playing, moved, setMoved, orientation, expect } = flow;

  // Measured sizes go back into the controlled nodes, or React Flow cannot route the tracks.
  const [measured, setMeasured] = useState<Record<string, { width: number; height: number }>>({});
  const layout = useMemo(() => (ruleSet ? layoutOf(ruleSet, orientation) : { positions: {}, widths: {}, columns: [] }), [ruleSet, orientation]);
  const graph = useMemo(() => {
    if (!ruleSet) return { nodes: [], edges: [] };
    const g = buildGraph(
      {
        ruleSet,
        traced,
        facts: result?.facts ?? null,
        factKey: result?.key ?? null,
        factSource: result ? (result.source === 'test-case' ? testCases?.find((t) => t.id === result.key)?.name ?? 'Test Case' : 'Fact Batch') : null,
        steps,
        current,
        expect,
        orientation,
      },
      layout,
    );
    return {
      nodes: g.nodes.map((n) => ({ ...n, ...(moved[n.id] ? { position: moved[n.id] } : {}), ...(measured[n.id] ? { measured: measured[n.id] } : {}) })),
      edges: playing ? g.edges.map((e) => (e.data!.step === current ? { ...e, data: { ...e.data!, drawing: true } } : e)) : g.edges,
    };
  }, [ruleSet, traced, result, testCases, steps, current, playing, layout, moved, measured, expect, orientation]);

  // The node of the step on show stays in view, the canvas never shows a different step from the bar and the list.
  // It moves only as far as it must, so as much of the route as fits stays on screen around it.
  const focusId = steps[current]?.nodeId;
  const reveal = useCallback(
    (id: string | undefined, duration: number) => {
      const node = id ? rf.getInternalNode(id) : undefined;
      const frameEl = frameRef.current;
      if (!node || !frameEl) return;
      const box = frameEl.getBoundingClientRect();
      const { x: vx, y: vy, zoom } = rf.getViewport();
      const w = (node.measured.width ?? 160) * zoom;
      const h = (node.measured.height ?? 40) * zoom;
      const sx = node.internals.positionAbsolute.x * zoom + vx;
      const sy = node.internals.positionAbsolute.y * zoom + vy;
      // Room the panels take: the toolbar above, and the minimap in the bottom right corner when it shows.
      const top = Number.parseFloat(PAD.top);
      const map = frameEl.querySelector('.flow__map')?.getBoundingClientRect();
      const mapLeft = map ? map.left - box.left - 16 : box.width - 16;
      const mapTop = map ? map.top - box.top - 16 : box.height - 16;
      const nudge = (start: number, size: number, min: number, max: number) =>
        start < min ? min - start : start + size > max ? Math.max(min - start, max - (start + size)) : 0;
      const dx = nudge(sx, w, 16, box.width - 16);
      const dy = nudge(sy, h, top, box.height - 16);
      let nx = sx + dx;
      let ny = sy + dy;
      // Under the minimap: step left of it when the plate fits there, otherwise up above it.
      if (map && nx + w > mapLeft && ny + h > mapTop) {
        if (mapLeft - w >= 16) nx = mapLeft - w;
        else ny = Math.max(top, mapTop - h);
      }
      if (nx === sx && ny === sy) return;
      void rf.setViewport({ x: vx + nx - sx, y: vy + ny - sy, zoom }, { duration });
    },
    [rf],
  );

  // Whether the plan fits at a readable size; when it does not, the minimap earns its place.
  const [clamped, setClamped] = useState(false);
  const focusRef = useRef(focusId);
  focusRef.current = focusId;
  const frame = useCallback(
    async (duration: number) => {
      await rf.fitView({ ...FIT, duration });
      const vp = rf.getViewport();
      const tight = vp.zoom <= FIT.minZoom + 0.001;
      setClamped(tight);
      // Too big to fit: start where the route is read from, the Fact, then bring the step on show into view.
      if (tight) await rf.setViewport(orientation === 'lr' ? { ...vp, x: 32 } : { ...vp, y: 84 }, { duration });
      window.setTimeout(() => reveal(focusRef.current, duration), 0);
    },
    [rf, orientation, reveal],
  );
  const shape = ruleSet ? `${ruleSet.rules.length}x${ruleSet.inputs.length}|${flow.side}|${orientation}` : '';
  useEffect(() => {
    setMeasured({});
    const t = window.setTimeout(() => void frame(0), 30);
    return () => window.clearTimeout(t);
  }, [shape, frame]);

  useEffect(() => {
    const t = window.setTimeout(() => reveal(focusId, reduced ? 0 : 320), 60);
    return () => window.clearTimeout(t);
  }, [focusId, reveal, reduced, shape, clamped]);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      const next: Record<string, { x: number; y: number }> = {};
      const sizes: Record<string, { width: number; height: number }> = {};
      for (const c of changes) {
        if (c.type === 'position' && c.position) next[c.id] = c.position;
        if (c.type === 'dimensions' && c.dimensions) sizes[c.id] = c.dimensions;
      }
      if (Object.keys(next).length) setMoved((m) => ({ ...m, ...next }));
      if (Object.keys(sizes).length) setMeasured((m) => ({ ...m, ...sizes }));
    },
    [setMoved],
  );

  const step = steps[current];
  const anyMoved = Object.keys(moved).length > 0;
  const results = sim.run?.results ?? [];
  // Spoken once a replay rests, never every 520ms while it runs.
  const spoken = step && !playing ? `Bước ${current + 1} trên ${steps.length}: ${step.ruleId ? `${step.ruleId} ` : ''}${step.title}. ${step.detail}` : '';

  return (
    <div
      ref={frameRef}
      className="flow__frame"
      tabIndex={0}
      role="group"
      aria-roledescription="sơ đồ"
      aria-label="Sơ đồ Evaluation Trace. Mũi tên trái phải để đi từng bước, Page Up Page Down để đổi Fact."
      onKeyDown={(e) => flow.onKey(e)}
    >
      <p className="visually-hidden" aria-live="polite">
        {spoken}
      </p>
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={(_, n) => {
          const s = (n.data as { step?: number }).step;
          if (typeof s === 'number' && s >= 0) flow.go(s);
        }}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        disableKeyboardA11y
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={FIT}
      >
        <Background variant={BackgroundVariant.Lines} gap={28} className="flow__grid" />

        <Panel position="top-left" className="flow__bar">
          <FactPicker flow={flow} sim={sim} testCases={testCases} />

          <div className="flow__player" role="group" aria-label="Phát lại luồng">
            <button
              type="button"
              className="flow__btn"
              aria-label="Bước trước"
              aria-keyshortcuts="ArrowLeft"
              disabled={!steps.length || current <= 0}
              onClick={() => flow.go(current - 1)}
            >
              <SkipBack size={15} aria-hidden="true" />
            </button>
            <button type="button" className="flow__btn flow__btn--run" disabled={!steps.length} onClick={() => (playing ? flow.pause() : flow.play())}>
              {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
              {playing ? 'Dừng' : 'Chạy luồng'}
            </button>
            <button
              type="button"
              className="flow__btn"
              aria-label="Bước sau"
              aria-keyshortcuts="ArrowRight"
              disabled={!steps.length || current >= steps.length - 1}
              onClick={() => flow.go(current + 1)}
            >
              <SkipForward size={15} aria-hidden="true" />
            </button>
          </div>

          {step && (
            <p className={`flow__step${step.diverges ? ' is-diverging' : ''}`} aria-hidden="true">
              <span className="flow__count">
                {current + 1}/{steps.length}
              </span>
              <Lamp state={step.lamp} size="sm" />
              <span className="flow__step-title">
                {step.ruleId && <code>{step.ruleId}</code>} {step.title}
              </span>
            </p>
          )}
        </Panel>

        <Panel position="top-right" className="flow__view">
          <div className="flow__group" role="group" aria-label="Hướng sơ đồ">
            <button
              type="button"
              className="flow__btn"
              aria-pressed={orientation === 'lr'}
              aria-label="Ngang: Rule là các hàng"
              title="Ngang"
              onClick={() => flow.setOrientation('lr')}
            >
              <MoveRight size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="flow__btn"
              aria-pressed={orientation === 'tb'}
              aria-label="Dọc: Rule là các cột"
              title="Dọc"
              onClick={() => flow.setOrientation('tb')}
            >
              <MoveDown size={15} aria-hidden="true" />
            </button>
          </div>
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
            {anyMoved && (
              <button
                type="button"
                className="flow__btn"
                aria-label="Xếp lại các node đã kéo"
                title="Xếp lại"
                onClick={() => {
                  setMoved({});
                  window.setTimeout(() => void frame(240), 0);
                }}
              >
                <LayoutGrid size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </Panel>

        {!narrow && clamped && (
          <MiniMap pannable zoomable className="flow__map" nodeClassName={(n) => `flow__map-node flow__map-node--${n.type}`} ariaLabel="Bản đồ thu nhỏ" />
        )}

        <Panel position="bottom-left" className="flow__foot">
          <Legend />
          {(sim.error || !ruleSet?.rules.length || (!results.length && !sim.running)) && (
            <p className="flow__hint">
              {sim.error ? (
                <>
                  <Lamp state="stop" size="sm" /> <span>Simulation chưa chạy được: {sim.error}. Mở tab Simulation để chạy lại.</span>
                </>
              ) : !ruleSet?.rules.length ? (
                <span>Rule Set chưa có Rule nào: sơ đồ chỉ có Input Schema và Hit Policy.</span>
              ) : (
                <span>Chưa có Fact nào để chạy. Thêm Test Case ở tab Rules hoặc nạp Fact Batch ở tab Simulation.</span>
              )}
            </p>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}

const TRACKS = [
  ['clear', 'Đưa kết quả tới Caller'],
  ['run', 'Fact đã đi qua'],
  ['held', 'Match nhưng nhường Rule khác'],
  ['stop', 'Xung đột hoặc khác kỳ vọng'],
  ['dead', 'Sau tín hiệu trượt'],
  ['idle', 'Chưa tới'],
] as const;

const SIGNALS = [
  ['clear', 'Điều kiện đúng'],
  ['stop', 'Điều kiện sai'],
  ['caution', 'Fact thiếu trường'],
  ['idle', 'Chưa xét'],
] as const;

/** The key to the drawing, folded by default; open, it lets a screenshot stand on its own in the thesis. */
function Legend() {
  return (
    <details className="flow__legend">
      <summary>Chú giải</summary>
      <div className="flow__legend-body">
        <ul aria-label="Đường ray">
          {TRACKS.map(([tone, label]) => (
            <li key={tone}>
              <svg width="28" height="8" aria-hidden="true" className="flow__legend-track">
                <line x1="0" y1="4" x2="28" y2="4" className={`track track--${tone}`} />
              </svg>
              {label}
            </li>
          ))}
        </ul>
        <ul aria-label="Tín hiệu">
          {SIGNALS.map(([lamp, label]) => (
            <li key={lamp}>
              <Lamp state={lamp} size="sm" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function useReducedMotion() {
  return useNarrow('(prefers-reduced-motion: reduce)');
}
