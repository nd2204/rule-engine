// The track diagram: a Rule Set drawn as a signal box's route plan, one track per Rule,
// one signal per condition cell. It is a projection of the Rule Set and an Evaluation
// Trace, never a second copy of either: positions are view state and never reach the Draft.

import type { Edge, Node } from '@xyflow/react';
import type { LampState } from '../../components/Lamp';
import { describeCell, formatScalar, isAnyCell } from '../../domain/cell';
import type { Disposition, EvalResult, EvaluationTrace, Expected, InputField, OutputRow, RuleSet, TraceCondition, TraceRule } from '../../domain/types';

export type Traced = EvalResult & { trace: EvaluationTrace };

/** Left to right (Rules as rows, like the Rules Table) or top to bottom (Rules as columns, for tall and narrow canvases). */
export type Orientation = 'lr' | 'tb';

/** One condition of a Rule, as the step list spells it out. */
export interface StepCondition {
  field: string;
  text: string;
  value: string;
  lamp: LampState;
}

/** What one step of a replay lights. */
export interface FlowStep {
  id: string;
  kind: 'fact' | 'schema' | 'rule' | 'policy' | 'result';
  /** Rule steps: the Rule's id, shown in code beside the title. */
  ruleId?: string;
  title: string;
  detail: string;
  lamp: LampState;
  /** The node the step stands on, for jumping from the canvas to the step and keeping it in view. */
  nodeId: string;
  conditions?: StepCondition[];
  /** Where the Test Case parts from its expectation. */
  diverges?: boolean;
}

/** A Test Case's expectation set against what the subject returned. */
export interface Expectation {
  ok: boolean;
  /** Expected rows the Caller does not receive. */
  missing: OutputRow[];
  /** Rows the Caller receives that were not expected. */
  extra: OutputRow[];
  expected: Expected;
  /** Rules behind the missing or extra rows: the replay rests at the first of them. */
  ruleIds: string[];
  summary: string;
}

/** A track segment's state: dark, travelled by the Fact, delivering, yielding, blocked or dead after a failed signal. */
export type TrackTone = 'idle' | 'run' | 'clear' | 'held' | 'stop' | 'dead';

export interface TrackEdgeData extends Record<string, unknown> {
  tone: TrackTone;
  /** The step that lights this segment. */
  step: number;
  /** Set while a replay draws this segment in. */
  drawing?: boolean;
  /** Where a fanning segment turns: by its source (the junction after Input Schema) or by its target (the bus into Hit Policy). */
  bend?: 'source' | 'target';
  orientation: Orientation;
}

export type FlowNode = Node<Record<string, unknown>>;
export type FlowEdge = Edge<TrackEdgeData>;

// ---------- layout ----------

/** Route plates and signals share one height, so every track runs dead straight. */
export const PLATE_H = 40;
const ROUTE_W = 148;
const END_W = 184;
const HEAD_W = 148;
const ROW = 52;
const LANE_GAP = 16;

export interface Layout {
  positions: Record<string, { x: number; y: number }>;
  /** Widths of column heads, route plates and signals, per node. */
  widths: Record<string, number>;
  /** Inputs that hold at least one condition: a column of "any" carries no signal and is left out. */
  columns: InputField[];
}

/**
 * A signal grows with its condition, so the reading is whole on the drawing: mono at 13px is about 7.9px a character,
 * and the plate around it takes 50px (padding, border, the lamp and its gap), 69px with the expression icon.
 * Past the cap the step list spells the condition out in full.
 */
function signalWidth(text: string, tree: boolean): number {
  return Math.min(264, Math.max(112, Math.ceil(text.length * 7.9) + (tree ? 69 : 50)));
}

export function layoutOf(ruleSet: RuleSet, orientation: Orientation): Layout {
  const positions: Layout['positions'] = {};
  const widths: Layout['widths'] = {};
  const columns = ruleSet.inputs.filter((f) => ruleSet.rules.some((r) => !isAnyCell(r.when[f.name])));
  const width = (rule: RuleSet['rules'][number], f: InputField) =>
    isAnyCell(rule.when[f.name]) ? 0 : signalWidth(describeCell(rule.when[f.name], f) ?? '', rule.when[f.name]?.kind === 'ast');
  const sig = (rule: RuleSet['rules'][number], f: InputField) => `sig:${rule.id}:${f.name}`;

  if (orientation === 'lr') {
    // Fact over Input Schema on the left, Hit Policy over Decision Result on the right, the Rules as rows between.
    const colW = columns.map((f) => Math.max(112, ...ruleSet.rules.map((r) => width(r, f))));
    const xRoute = END_W + 56;
    const colX: number[] = [];
    let x = xRoute + ROUTE_W + 40;
    colW.forEach((w) => {
      colX.push(x);
      x += w + LANE_GAP;
    });
    const colsEnd = colW.length ? x - LANE_GAP : xRoute + ROUTE_W;
    const top = 76;
    const rows = Math.max(ruleSet.rules.length, 1);
    const centre = top + ((rows - 1) * ROW) / 2 + PLATE_H / 2;
    positions.fact = { x: 0, y: centre - 96 };
    positions.schema = { x: 0, y: centre + 8 };
    positions.policy = { x: colsEnd + 56, y: centre - 96 };
    positions.result = { x: colsEnd + 56, y: centre + 20 };
    columns.forEach((f, c) => {
      positions[`head:${f.name}`] = { x: colX[c], y: 0 };
      widths[`head:${f.name}`] = colW[c];
    });
    ruleSet.rules.forEach((rule, r) => {
      const y = top + r * ROW;
      positions[`route:${rule.id}`] = { x: xRoute, y };
      widths[`route:${rule.id}`] = ROUTE_W;
      columns.forEach((f, c) => {
        if (isAnyCell(rule.when[f.name])) return;
        positions[sig(rule, f)] = { x: colX[c], y };
        widths[sig(rule, f)] = colW[c];
      });
    });
    return { positions, widths, columns };
  }

  // Top to bottom: Fact beside Input Schema at the head, each Rule a vertical track, Hit Policy beside Decision Result at the foot.
  const ruleW = ruleSet.rules.map((rule) => Math.max(ROUTE_W, ...columns.map((f) => width(rule, f))));
  const x0 = HEAD_W + 32;
  const ruleX: number[] = [];
  let x = x0;
  ruleW.forEach((w) => {
    ruleX.push(x);
    x += w + LANE_GAP;
  });
  const bandEnd = Math.max(x - LANE_GAP, x0 + ROUTE_W);
  const centre = (x0 + bandEnd) / 2;
  const yRoute = 150;
  const rowY = (i: number) => yRoute + PLATE_H + 24 + i * ROW;
  const bottom = (columns.length ? rowY(columns.length - 1) : yRoute) + PLATE_H;
  positions.fact = { x: centre - END_W - 28, y: 0 };
  positions.schema = { x: centre + 28, y: 0 };
  positions.policy = { x: centre - END_W - 28, y: bottom + 64 };
  positions.result = { x: centre + 28, y: bottom + 64 };
  columns.forEach((f, i) => {
    positions[`head:${f.name}`] = { x: 0, y: rowY(i) };
    widths[`head:${f.name}`] = HEAD_W;
  });
  ruleSet.rules.forEach((rule, r) => {
    positions[`route:${rule.id}`] = { x: ruleX[r], y: yRoute };
    widths[`route:${rule.id}`] = ruleW[r];
    columns.forEach((f, i) => {
      if (isAnyCell(rule.when[f.name])) return;
      positions[sig(rule, f)] = { x: ruleX[r], y: rowY(i) };
      widths[sig(rule, f)] = ruleW[r];
    });
  });
  return { positions, widths, columns };
}

// ---------- wording ----------

const POLICY_RULE: Record<RuleSet['hitPolicy'], string> = {
  FIRST: 'Rule match đầu tiên quyết định',
  UNIQUE: 'Tối đa một Rule được match',
  PRIORITY: 'Rule match có weight cao nhất thắng',
  COLLECT: 'Mọi Rule match đều góp kết quả',
};

const DISPOSITION_WORD: Record<Disposition, string> = {
  won: 'match, thắng',
  collected: 'match, góp kết quả',
  shadowed: 'match, nhường',
  outweighed: 'match, thua weight',
  conflict: 'match, xung đột UNIQUE',
  missed: 'không match',
};

export function dispositionWord(tr: TraceRule): string {
  const base = DISPOSITION_WORD[tr.disposition];
  return tr.by ? `${base} ${tr.by}` : base;
}

/** The disposition as a route plate can hold it: the lit track already says the Rule matched, the step list names who it yielded to. */
const PLATE_WORD: Record<Disposition, string> = {
  won: 'thắng',
  collected: 'góp kết quả',
  shadowed: 'nhường',
  outweighed: 'thua weight',
  conflict: 'xung đột',
  missed: 'không match',
};

/** What a Caller receives when evaluation fails, in words; the code stays beside it for Integrators. */
export function errorReading(error: NonNullable<EvalResult['error']>): string {
  if (error.code === 'SCHEMA') return `Input Schema Validation từ chối Fact: ${error.message}`;
  const ids = error.ruleIds ?? [];
  return `${ids.length || 'Nhiều'} Rule cùng match${ids.length ? ` (${ids.join(', ')})` : ''}, UNIQUE không cho trả kết quả`;
}

const missing = (c: TraceCondition) => c.ok === false && !('value' in c);

function ruleLamp(tr: TraceRule): LampState {
  if (tr.disposition === 'won' || tr.disposition === 'collected') return 'clear';
  if (tr.disposition === 'conflict') return 'stop';
  if (tr.disposition === 'missed') return tr.conditions.some(missing) ? 'caution' : 'idle';
  return 'idle';
}

export function outputLine(row: OutputRow): string {
  return Object.entries(row)
    .map(([k, v]) => `${k} = ${formatScalar(v)}`)
    .join(', ');
}

function valueText(v: unknown, field: InputField): string {
  if (v === undefined || v === null) return 'thiếu';
  if (Array.isArray(v)) return `${v.length} phần tử`;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return formatScalar(v);
  return field.type;
}

function signalLamp(c: TraceCondition | undefined): LampState {
  if (!c || c.ok === null) return 'idle';
  if (c.ok) return 'clear';
  return missing(c) ? 'caution' : 'stop';
}

/** "Thiếu rainForecastMm; trượt ở zoneType": why a Rule did not match, missing fields first. */
function missReading(tr: TraceRule): string {
  const absent = tr.conditions.filter(missing).map((c) => c.field);
  const failed = tr.conditions.filter((c) => c.ok === false && !missing(c)).map((c) => c.field);
  const parts = [...(absent.length ? [`thiếu ${absent.join(', ')}`] : []), ...(failed.length ? [`trượt ở ${failed.join(', ')}`] : [])];
  const s = parts.join('; ');
  return s ? s[0].toUpperCase() + s.slice(1) : 'Không match';
}

// ---------- expectation ----------

const sameRow = (a: OutputRow, b: OutputRow) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => (a[k] ?? null) === (b[k] ?? null));
};

/** Sets a Test Case's expectation against the result, row by row, and names the Rules behind each difference. */
export function expectationOf(ruleSet: RuleSet, traced: Traced, expected: Expected): Expectation {
  if ('error' in expected) {
    const ok = traced.error?.code === expected.error;
    return {
      ok,
      missing: [],
      extra: ok ? [] : traced.outputs,
      expected,
      ruleIds: ok ? [] : traced.winnerRuleIds,
      summary: ok ? `Đúng kỳ vọng: lỗi ${expected.error}` : `Kỳ vọng lỗi ${expected.error}, nhận ${traced.error ? `lỗi ${traced.error.code}` : 'kết quả'}`,
    };
  }
  if (traced.error) {
    return {
      ok: false,
      missing: expected.outputs,
      extra: [],
      expected,
      ruleIds: traced.error.ruleIds ?? [],
      summary: `Kỳ vọng kết quả, nhận lỗi ${traced.error.code}`,
    };
  }
  const left = [...traced.outputs];
  const miss: OutputRow[] = [];
  for (const row of expected.outputs) {
    const i = left.findIndex((r) => sameRow(r, row));
    if (i >= 0) left.splice(i, 1);
    else miss.push(row);
  }
  const ok = miss.length === 0 && left.length === 0;
  const byRow = (row: OutputRow) => ruleSet.rules.find((r) => sameRow(r.then, row))?.id;
  const ruleIds = [
    ...miss.map(byRow),
    ...traced.winnerRuleIds.filter((id) => left.some((row) => sameRow(ruleSet.rules.find((r) => r.id === id)?.then ?? {}, row))),
  ].filter((x): x is string => !!x);
  const parts = [...(miss.length ? [`thiếu ${miss.length} dòng`] : []), ...(left.length ? [`thừa ${left.length} dòng`] : [])];
  return { ok, missing: miss, extra: left, expected, ruleIds, summary: ok ? 'Đúng kỳ vọng' : `Khác kỳ vọng: ${parts.join(', ')}` };
}

// ---------- steps ----------

/** The replay of one Fact through the Rule Set, in the order the engine works. */
export function stepsOf(
  ruleSet: RuleSet,
  traced: Traced | null,
  factKey: string | null,
  facts: Record<string, unknown> | null,
  expect: Expectation | null,
): FlowStep[] {
  if (!traced || !factKey) return [];
  const mismatch = !!expect && !expect.ok;
  const steps: FlowStep[] = [{ id: 'fact', kind: 'fact', title: 'Fact nhận vào', detail: factKey, lamp: 'clear', nodeId: 'fact' }];
  const schemaError = traced.error?.code === 'SCHEMA' ? traced.error : null;
  steps.push({
    id: 'schema',
    kind: 'schema',
    title: 'Input Schema Validation',
    detail: schemaError ? `Từ chối: ${schemaError.message}. Không Rule nào được xét.` : `${ruleSet.inputs.length} trường hợp lệ`,
    lamp: schemaError ? 'stop' : 'clear',
    nodeId: 'schema',
  });
  if (!schemaError) {
    for (const rule of ruleSet.rules) {
      const tr = traced.trace.rules.find((t) => t.ruleId === rule.id);
      if (!tr) continue;
      const diverges = mismatch && expect!.ruleIds.includes(rule.id);
      const conditions: StepCondition[] = ruleSet.inputs
        .filter((f) => !isAnyCell(rule.when[f.name]))
        .map((f) => ({
          field: f.name,
          text: describeCell(rule.when[f.name], f) ?? '',
          value: valueText(facts?.[f.name], f),
          lamp: signalLamp(tr.conditions.find((x) => x.field === f.name)),
        }));
      steps.push({
        id: `rule:${rule.id}`,
        kind: 'rule',
        ruleId: rule.id,
        title: dispositionWord(tr),
        detail: tr.matched ? rule.description : missReading(tr),
        lamp: diverges ? 'stop' : ruleLamp(tr),
        nodeId: `route:${rule.id}`,
        conditions,
        diverges,
      });
    }
    const unique = traced.error?.code === 'UNIQUE_VIOLATION' ? traced.error : null;
    steps.push({
      id: 'policy',
      kind: 'policy',
      title: `Hit Policy ${ruleSet.hitPolicy}`,
      detail: unique
        ? `${unique.ruleIds?.length ?? 'Nhiều'} Rule cùng match: ${unique.ruleIds?.join(', ')}. UNIQUE không chọn được Rule nào.`
        : traced.matchedRuleIds.length === 0
          ? 'Không Rule nào match'
          : `${traced.matchedRuleIds.length} Rule match, chọn ${traced.winnerRuleIds.join(', ')}`,
      lamp: unique ? 'stop' : traced.winnerRuleIds.length ? 'clear' : 'idle',
      nodeId: 'policy',
    });
  }
  const received = traced.error
    ? `Caller nhận lỗi ${traced.error.code}`
    : traced.outputs.length
      ? traced.outputs.map(outputLine).join(' · ')
      : 'Kết quả rỗng: không Rule nào match, không phải lỗi';
  steps.push({
    id: 'result',
    kind: 'result',
    title: 'Decision Result',
    detail: mismatch ? `${expect!.summary}. ${received}` : received,
    lamp: mismatch || traced.error ? 'stop' : traced.outputs.length ? 'clear' : 'idle',
    nodeId: 'result',
    diverges: mismatch && expect!.ruleIds.length === 0,
  });
  return steps;
}

/** Where a replay of a newly picked Fact rests: the first step that parts from the expectation, or the end. */
export function restingStep(steps: FlowStep[]): number {
  const i = steps.findIndex((s) => s.diverges);
  return i >= 0 ? i : steps.length - 1;
}

// ---------- nodes and edges ----------

export interface GraphInput {
  ruleSet: RuleSet;
  traced: Traced | null;
  facts: Record<string, unknown> | null;
  factKey: string | null;
  factSource: string | null;
  steps: FlowStep[];
  /** The step on show; every step after it is still dark. */
  current: number;
  expect: Expectation | null;
  orientation: Orientation;
}

function toneOf(d: Disposition): TrackTone {
  if (d === 'won' || d === 'collected') return 'clear';
  if (d === 'conflict') return 'stop';
  if (d === 'shadowed' || d === 'outweighed') return 'held';
  return 'run';
}

export function buildGraph(input: GraphInput, layout: Layout): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const { ruleSet, traced, facts, steps, current, orientation } = input;
  const stepOf = (id: string) => steps.findIndex((s) => s.id === id);
  const reached = (id: string) => {
    const i = stepOf(id);
    return i >= 0 && i <= current;
  };
  const at = (id: string) => steps[current]?.nodeId === id;
  const pos = (id: string) => layout.positions[id] ?? { x: 0, y: 0 };
  const sized = (id: string) => (layout.widths[id] ? { width: layout.widths[id] } : {});
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const edge = (id: string, source: string, target: string, tone: TrackTone, step: number, bend?: TrackEdgeData['bend']) =>
    edges.push({ id, source, target, type: 'track', data: { tone, step, orientation, ...(bend ? { bend } : {}) }, selectable: false, focusable: false });

  const schemaError = traced?.error?.code === 'SCHEMA' ? traced.error : null;
  const factOn = reached('fact');
  const schemaOn = reached('schema');

  nodes.push({
    id: 'fact',
    type: 'fact',
    position: pos('fact'),
    data: { on: factOn, factKey: input.factKey, source: input.factSource, step: stepOf('fact'), orientation, current: at('fact') },
  });
  nodes.push({
    id: 'schema',
    type: 'schema',
    position: pos('schema'),
    data: {
      lamp: schemaOn ? (schemaError ? 'stop' : 'clear') : 'idle',
      note: schemaOn
        ? schemaError
          ? schemaError.message
          : `${ruleSet.inputs.length} trường hợp lệ`
        : `${ruleSet.inputs.filter((f) => f.required).length} trường bắt buộc`,
      step: stepOf('schema'),
      orientation,
      current: at('schema'),
    },
  });
  edge('e:fact', 'fact', 'schema', schemaOn ? (schemaError ? 'stop' : 'run') : 'idle', stepOf('schema'));

  layout.columns.forEach((f) => {
    nodes.push({
      id: `head:${f.name}`,
      type: 'head',
      position: pos(`head:${f.name}`),
      ...sized(`head:${f.name}`),
      draggable: false,
      selectable: false,
      focusable: false,
      data: {
        name: f.name,
        label: f.label,
        value: factOn && facts ? valueText(facts[f.name], f) : null,
        missing: factOn && (facts?.[f.name] === undefined || facts?.[f.name] === null),
        orientation,
      },
    });
  });

  ruleSet.rules.forEach((rule, r) => {
    const tr = traced?.trace.rules.find((t) => t.ruleId === rule.id);
    const sid = `rule:${rule.id}`;
    const s = stepOf(sid);
    const on = !!tr && reached(sid);
    const tone: TrackTone = on ? toneOf(tr!.disposition) : 'idle';
    const routeId = `route:${rule.id}`;
    nodes.push({
      id: routeId,
      type: 'route',
      position: pos(routeId),
      ...sized(routeId),
      data: {
        index: r + 1,
        ruleId: rule.id,
        weight: ruleSet.hitPolicy === 'PRIORITY' ? rule.weight ?? 0 : undefined,
        tone,
        word: on ? PLATE_WORD[tr!.disposition] : null,
        fullWord: on ? dispositionWord(tr!) : null,
        diverges: on && !!steps[s]?.diverges,
        current: at(routeId),
        step: s,
        orientation,
      },
    });
    edge(`e:${rule.id}:in`, 'schema', routeId, tone, s, 'source');

    let prev = routeId;
    let alive = true;
    for (const f of layout.columns) {
      if (isAnyCell(rule.when[f.name])) continue;
      const c = tr?.conditions.find((x) => x.field === f.name);
      const id = `sig:${rule.id}:${f.name}`;
      nodes.push({
        id,
        type: 'signal',
        position: pos(id),
        ...sized(id),
        data: {
          text: describeCell(rule.when[f.name], f) ?? '',
          tree: rule.when[f.name]?.kind === 'ast',
          lamp: on ? signalLamp(c) : 'idle',
          // Past a failed signal the Rule has already lost: the engine still reports the cell, the diagram lets it recede.
          after: on && !alive,
          field: f.name,
          step: s,
          orientation,
        },
      });
      edge(`e:${prev}->${id}`, prev, id, !on ? 'idle' : alive ? tone : 'dead', s);
      if (on && c?.ok === false) alive = false;
      prev = id;
    }
    edge(`e:${rule.id}:out`, prev, 'policy', !on ? 'idle' : alive ? tone : 'dead', s, 'target');
  });

  const policyOn = reached('policy');
  const unique = traced?.error?.code === 'UNIQUE_VIOLATION';
  nodes.push({
    id: 'policy',
    type: 'policy',
    position: pos('policy'),
    data: {
      policy: ruleSet.hitPolicy,
      rule: POLICY_RULE[ruleSet.hitPolicy],
      lamp: policyOn ? (unique ? 'stop' : traced!.winnerRuleIds.length ? 'clear' : 'idle') : 'idle',
      note: policyOn ? steps[stepOf('policy')].detail : null,
      step: stepOf('policy'),
      orientation,
      current: at('policy'),
    },
  });

  const resultOn = reached('result');
  const mismatch = !!input.expect && !input.expect.ok;
  nodes.push({
    id: 'result',
    type: 'result',
    position: pos('result'),
    data: {
      on: resultOn,
      error: resultOn && traced?.error ? { code: traced.error.code, text: errorReading(traced.error) } : null,
      outputs: resultOn && traced && !traced.error ? traced.outputs : null,
      expect: resultOn ? input.expect : null,
      step: stepOf('result'),
      orientation,
      current: at('result'),
    },
  });
  edge(
    'e:result',
    'policy',
    'result',
    !resultOn || !traced ? 'idle' : schemaError ? 'dead' : traced.error || mismatch ? 'stop' : traced.outputs.length ? 'clear' : 'dead',
    stepOf('result'),
  );

  // Dark track first, so a lit route is never painted over where tracks share a trunk.
  const rank: Record<TrackTone, number> = { idle: 0, dead: 1, run: 2, held: 3, clear: 4, stop: 5 };
  edges.sort((a, b) => rank[a.data!.tone] - rank[b.data!.tone]);
  return { nodes, edges };
}
