import { BaseEdge, getSmoothStepPath, Handle, Position, type EdgeProps, type NodeProps } from '@xyflow/react';
import { Braces } from 'lucide-react';
import { Lamp, type LampState } from '../../components/Lamp';
import type { OutputRow } from '../../domain/types';
import { outputLine, type Expectation, type FlowEdge, type FlowNode, type Orientation, type TrackTone } from './graph';

// Handles exist only for the tracks to attach to: the diagram is read-only, nothing is wired by hand.
const In = ({ at }: { at: Position }) => <Handle type="target" position={at} isConnectable={false} className="track-port" />;
const Out = ({ at }: { at: Position }) => <Handle type="source" position={at} isConnectable={false} className="track-port" />;

/** Where tracks enter and leave each kind of plate, per orientation. */
const PORTS = {
  lr: {
    fact: { out: Position.Bottom },
    schema: { in: Position.Top, out: Position.Right },
    track: { in: Position.Left, out: Position.Right },
    policy: { in: Position.Left, out: Position.Bottom },
    result: { in: Position.Top },
  },
  tb: {
    fact: { out: Position.Right },
    schema: { in: Position.Left, out: Position.Bottom },
    track: { in: Position.Top, out: Position.Bottom },
    policy: { in: Position.Top, out: Position.Right },
    result: { in: Position.Left },
  },
} as const;

type D<T> = NodeProps<FlowNode> & { data: T & { orientation: Orientation } };

const cur = (current?: boolean) => (current ? ' is-current' : '');

function FactNode({ data }: D<{ on: boolean; factKey: string | null; source: string | null; current?: boolean }>) {
  return (
    <div className={`fnode fnode--fact${data.on ? ' is-on' : ''}${cur(data.current)}`}>
      <span className="fnode__label">Fact</span>
      {data.factKey ? <code className="fnode__id">{data.factKey}</code> : <span className="fnode__empty">—</span>}
      {data.source && <span className="fnode__note">{data.source}</span>}
      <Out at={PORTS[data.orientation].fact.out} />
    </div>
  );
}

function SchemaNode({ data }: D<{ lamp: LampState; note: string; current?: boolean }>) {
  const p = PORTS[data.orientation].schema;
  return (
    <div className={`fnode fnode--gate is-${data.lamp}${cur(data.current)}`}>
      <In at={p.in} />
      <span className="fnode__label">Input Schema</span>
      <span className="fnode__line">
        <Lamp state={data.lamp} size="sm" />
        <span className="fnode__note">{data.note}</span>
      </span>
      <Out at={p.out} />
    </div>
  );
}

function HeadNode({ data }: D<{ name: string; label: string; value: string | null; missing: boolean }>) {
  return (
    <div className={`fhead fhead--${data.orientation}`}>
      <code className="fhead__name">{data.name}</code>
      <span className={`fhead__value${data.missing ? ' is-missing' : ''}${data.value === null ? ' is-label' : ''}`}>{data.value ?? data.label}</span>
    </div>
  );
}

function RouteNode({
  data,
}: D<{
  index: number;
  ruleId: string;
  weight?: number;
  tone: TrackTone;
  word: string | null;
  fullWord: string | null;
  diverges: boolean;
  current: boolean;
}>) {
  const p = PORTS[data.orientation].track;
  const sub = [data.weight !== undefined ? `weight ${data.weight}` : null, data.word].filter(Boolean).join(' · ');
  return (
    <div
      className={`froute is-${data.tone}${data.diverges ? ' is-diverging' : ''}${cur(data.current)}`}
      title={data.fullWord ? `${data.ruleId}: ${data.fullWord}` : data.ruleId}
    >
      <In at={p.in} />
      <span className="froute__no">{data.index}</span>
      <span className="froute__body">
        <code className="froute__id">{data.ruleId}</code>
        {sub && <span className="froute__word">{sub}</span>}
      </span>
      <Out at={p.out} />
    </div>
  );
}

function SignalNode({ data }: D<{ text: string; tree: boolean; lamp: LampState; after: boolean; field: string }>) {
  const p = PORTS[data.orientation].track;
  return (
    <div className={`fsignal is-${data.lamp}${data.after ? ' is-after' : ''}`}>
      <In at={p.in} />
      <Lamp state={data.lamp} size="sm" />
      {data.tree && <Braces size={13} className="fsignal__tree" aria-hidden="true" />}
      <code className="fsignal__text" title={`${data.field} ${data.text}`}>
        {data.text}
      </code>
      <Out at={p.out} />
    </div>
  );
}

function PolicyNode({ data }: D<{ policy: string; rule: string; lamp: LampState; note: string | null; current?: boolean }>) {
  const p = PORTS[data.orientation].policy;
  return (
    <div className={`fnode fnode--policy is-${data.lamp}${cur(data.current)}`}>
      <In at={p.in} />
      <span className="fnode__label">Hit Policy</span>
      <span className="fnode__line">
        <Lamp state={data.lamp} size="sm" />
        <strong className="fnode__policy">{data.policy}</strong>
      </span>
      <span className="fnode__note">{data.note ?? data.rule}</span>
      <Out at={p.out} />
    </div>
  );
}

function Rows({ rows, mark }: { rows: OutputRow[]; mark?: (row: OutputRow) => 'missing' | 'extra' | null }) {
  return (
    <ul className="fnode__outputs">
      {rows.map((row, i) => {
        const m = mark?.(row) ?? null;
        return (
          <li key={i} className={m ? `is-${m}` : undefined}>
            <code>{outputLine(row)}</code>
            {m && <span className="fnode__mark">{m === 'missing' ? 'thiếu' : 'thừa'}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function ResultNode({
  data,
}: D<{ on: boolean; error: { code: string; text: string } | null; outputs: OutputRow[] | null; expect: Expectation | null; current?: boolean }>) {
  const mismatch = !!data.expect && !data.expect.ok;
  const lamp: LampState = !data.on ? 'idle' : mismatch || data.error ? 'stop' : data.outputs?.length ? 'clear' : 'idle';
  const extra = new Set(data.expect?.extra ?? []);
  return (
    <div className={`fnode fnode--result is-${lamp}${cur(data.current)}`}>
      <In at={PORTS[data.orientation].result.in} />
      <span className="fnode__label">Decision Result · Caller nhận</span>
      {!data.on ? (
        <span className="fnode__empty">chưa tới</span>
      ) : data.error ? (
        <span className="fnode__line fnode__line--top">
          <Lamp state="stop" size="sm" />
          <span className="fnode__note">
            {data.error.text} <code className="fnode__code">{data.error.code}</code>
          </span>
        </span>
      ) : data.outputs?.length ? (
        <Rows rows={data.outputs} mark={(r) => (extra.has(r) ? 'extra' : null)} />
      ) : (
        <span className="fnode__line">
          <Lamp state="idle" size="sm" />
          <span className="fnode__note">Rỗng: không Rule nào match</span>
        </span>
      )}
      {data.on && data.expect && (
        <div className={`fnode__expect${mismatch ? ' is-off' : ''}`}>
          <span className="fnode__line">
            <Lamp state={mismatch ? 'stop' : 'clear'} size="sm" />
            <span className="fnode__note">
              <strong>Kỳ vọng.</strong> {data.expect.summary}
            </span>
          </span>
          {mismatch &&
            ('error' in data.expect.expected ? (
              <code className="fnode__code">lỗi {data.expect.expected.error}</code>
            ) : data.expect.missing.length ? (
              // Only what is missing is spelled out; the rows that agree are counted.
              <>
                <Rows rows={data.expect.missing} mark={() => 'missing'} />
                {data.expect.expected.outputs.length > data.expect.missing.length && (
                  <span className="fnode__note">và {data.expect.expected.outputs.length - data.expect.missing.length} dòng khớp</span>
                )}
              </>
            ) : !data.expect.expected.outputs.length ? (
              <span className="fnode__note">Kỳ vọng kết quả rỗng</span>
            ) : null)}
        </div>
      )}
    </div>
  );
}

export const nodeTypes = {
  fact: FactNode,
  schema: SchemaNode,
  head: HeadNode,
  route: RouteNode,
  signal: SignalNode,
  policy: PolicyNode,
  result: ResultNode,
};

/** A track segment: square corners, like a route plan, never a bezier. */
function TrackEdge(props: EdgeProps<FlowEdge>) {
  const d = props.data;
  const lr = d?.orientation !== 'tb';
  // Every Rule leaves the junction on one trunk and joins Hit Policy on one bus, as a route plan draws them.
  const bend =
    d?.bend === 'source'
      ? lr
        ? { centerX: props.sourceX + 18 }
        : { centerY: props.sourceY + 20 }
      : d?.bend === 'target'
        ? lr
          ? { centerX: props.targetX - 20 }
          : { centerY: props.targetY - 22 }
        : {};
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 0,
    offset: 14,
    ...bend,
  });
  const tone = d?.tone ?? 'idle';
  const drawing = !!d?.drawing;
  return (
    <BaseEdge
      id={props.id}
      path={path}
      className={`track track--${tone}${drawing ? ' is-drawing' : ''}`}
      {...(drawing ? { pathLength: 1 } : {})}
      interactionWidth={0}
    />
  );
}

export const edgeTypes = { track: TrackEdge };
