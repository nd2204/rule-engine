import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { ChevronLeft, ChevronRight, Flag, ListChecks, SlidersHorizontal, TriangleAlert, Unlink } from 'lucide-react';
import { Lamp, type LampState } from '../../components/Lamp';
import { describeAst, formatScalar } from '../../domain/cell';
import type { OutputRow, Scalar } from '../../domain/types';
import { factText, QUANTS } from './forms';
import type { GData, NodeTrace } from './graph';

export interface GNodeData extends Record<string, unknown> {
  g: GData;
  trace?: NodeTrace;
  problem?: string;
  loose: boolean;
  editable: boolean;
  /** Điều kiện: the field's label, from the input schema or the list's element fields. */
  label?: string;
  /** VÀ / HOẶC: wires in. */
  inputs: number;
  /** Rule: its id, outputs and what the Hit Policy did with it under the Test Case. */
  rule?: { id: string; outputs: { name: string; unit?: string }[]; then: OutputRow; weight?: number; verdict?: { lamp: LampState; word: string } };
  onPick?: (index: number) => void;
}

export type GFlowNode = Node<GNodeData>;

const In = ({ many, label, editable }: { many?: boolean; label?: string; editable: boolean }) => (
  <Handle type="target" position={Position.Left} isConnectable={editable} className={`gport gport--in${many ? ' gport--many' : ''}`} title={label} />
);
const Out = ({ editable }: { editable: boolean }) => (
  <Handle type="source" position={Position.Right} isConnectable={editable} className="gport gport--out" title="Kéo dây sang đầu vào của node khác" />
);

function state(d: GNodeData): string {
  const s = [d.trace ? (d.trace.missing ? 'is-missing' : d.trace.ok ? 'is-true' : 'is-false') : 'is-idle'];
  if (d.loose) s.push('is-loose');
  if (d.problem) s.push('has-problem');
  return s.join(' ');
}

function lampOf(t: NodeTrace | undefined): LampState {
  if (!t) return 'idle';
  if (t.missing) return 'caution';
  return t.ok ? 'clear' : 'stop';
}

function Foot({ d }: { d: GNodeData }) {
  return (
    <>
      {d.problem && (
        <p className="gn__problem">
          <TriangleAlert size={13} aria-hidden="true" />
          {d.problem}
        </p>
      )}
      {d.loose && !d.problem && (
        <p className="gn__loose">
          <Unlink size={13} aria-hidden="true" />
          Chưa nối tới Rule
        </p>
      )}
    </>
  );
}

function CondNode({ data: d, selected }: NodeProps<GFlowNode>) {
  const leaf = d.g.kind === 'cond' ? d.g.leaf : null;
  return (
    <div className={`gn gn--cond ${state(d)}${selected ? ' is-selected' : ''}`}>
      <header className="gn__head">
        <SlidersHorizontal size={14} aria-hidden="true" />
        <span className="gn__kind">Điều kiện</span>
        {d.label && <span className="gn__meta">{d.label}</span>}
      </header>
      <div className="gn__body">
        {leaf ? <code className="gn__expr">{describeAst(leaf)}</code> : <span className="gn__empty">Chưa đặt: chọn node rồi điền ở bên phải</span>}
        {d.trace && (
          <p className="gn__fact">
            <Lamp state={lampOf(d.trace)} size="sm" />
            <span>{d.trace.missing ? 'Fact thiếu trường' : `Fact: ${factText(d.trace.value)}`}</span>
            <strong>{d.trace.missing || !d.trace.ok ? 'sai' : 'đúng'}</strong>
          </p>
        )}
      </div>
      <Foot d={d} />
      <Out editable={d.editable} />
    </div>
  );
}

const LOGIC = {
  and: { word: 'VÀ', gloss: 'đúng khi tất cả đầu vào đúng' },
  or: { word: 'HOẶC', gloss: 'đúng khi ít nhất một đầu vào đúng' },
  not: { word: 'KHÔNG', gloss: 'đảo ngược: đúng khi đầu vào sai' },
} as const;

function LogicNode({ data: d, selected }: NodeProps<GFlowNode>) {
  const kind = d.g.kind as 'and' | 'or' | 'not';
  const meta = LOGIC[kind];
  return (
    <div className={`gn gn--logic gn--${kind} ${state(d)}${selected ? ' is-selected' : ''}`}>
      <In many={kind !== 'not'} editable={d.editable} />
      <div className="gn__logic">
        <span className="gn__word">{meta.word}</span>
        {d.trace && <Lamp state={lampOf(d.trace)} size="sm" />}
      </div>
      <p className="gn__gloss">
        {meta.gloss}
        {kind !== 'not' && d.inputs > 0 ? ` · ${d.inputs} đầu vào` : ''}
      </p>
      <Foot d={d} />
      <Out editable={d.editable} />
    </div>
  );
}

function EachNode({ data: d, selected }: NodeProps<GFlowNode>) {
  const g = d.g.kind === 'each' ? d.g : null;
  if (!g) return null;
  const q = QUANTS.find((x) => x.op === g.op)!;
  const items = d.trace?.items;
  return (
    <div className={`gn gn--each ${state(d)}${selected ? ' is-selected' : ''}`}>
      <In label="mỗi phần tử" editable={d.editable} />
      <header className="gn__head">
        <ListChecks size={14} aria-hidden="true" />
        <span className="gn__kind">Mỗi phần tử</span>
        <code className="gn__meta gn__meta--code">{g.path}</code>
      </header>
      <div className="gn__body">
        <p className="gn__quant">
          <strong>{q.word}</strong> phần tử của <code>{g.path}</code> khớp điều kiện nối vào
        </p>
        {items && (
          <div className="gn__items nodrag">
            <Lamp state={lampOf(d.trace)} size="sm" />
            <span>
              {items.matched}/{items.count} khớp
            </span>
            <span className="gn__stepper">
              <button type="button" aria-label="Phần tử trước" disabled={items.index === 0} onClick={() => d.onPick?.(items.index - 1)}>
                <ChevronLeft size={13} aria-hidden="true" />
              </button>
              <code>
                {g.path}[{items.index}]
              </code>
              <button type="button" aria-label="Phần tử sau" disabled={items.index >= items.count - 1} onClick={() => d.onPick?.(items.index + 1)}>
                <ChevronRight size={13} aria-hidden="true" />
              </button>
            </span>
          </div>
        )}
      </div>
      <Foot d={d} />
      <Out editable={d.editable} />
    </div>
  );
}

function RuleNode({ data: d, selected }: NodeProps<GFlowNode>) {
  const r = d.rule!;
  const v = r.verdict;
  return (
    <div className={`gn gn--rule${v ? ` is-${v.lamp}` : ''}${selected ? ' is-selected' : ''}`}>
      <In label="khi" editable={d.editable} />
      <header className="gn__head">
        <Flag size={14} aria-hidden="true" />
        <span className="gn__kind">Rule</span>
        <code className="gn__rule-id">{r.id}</code>
      </header>
      {v && (
        <p className="gn__verdict">
          <Lamp state={v.lamp} size="sm" />
          {v.word}
        </p>
      )}
      <dl className="gn__outputs">
        {r.outputs.map((f) => (
          <div key={f.name}>
            <dt>{f.name}</dt>
            <dd>
              {formatScalar((r.then[f.name] ?? null) as Scalar | null)}
              {f.unit && r.then[f.name] != null ? ` ${f.unit}` : ''}
            </dd>
          </div>
        ))}
        {r.weight !== undefined && (
          <div>
            <dt>weight</dt>
            <dd>{r.weight}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export const nodeTypes = { cond: CondNode, logic: LogicNode, each: EachNode, rule: RuleNode };

export const typeOf = (g: GData): keyof typeof nodeTypes => (g.kind === 'and' || g.kind === 'or' || g.kind === 'not' ? 'logic' : g.kind);
