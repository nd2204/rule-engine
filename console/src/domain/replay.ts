// Replay of a past evaluation: the record a Caller kept (Facts snapshot plus
// the Decision Result with its Trace Summary), read back and checked against a
// fresh evaluation of the same immutable Decision Version.

import type { EvalError, EvalResult, OutputRow } from './types';

export interface TraceSummary {
  decisionVersion: number;
  matchedRules: string[];
  winningRules: string[];
  executionTimeMs?: number;
}

/** What the Caller kept of one evaluation. Optional parts were simply not recorded. */
export interface ReplayRecord {
  decisionId: string;
  version: number;
  facts: Record<string, unknown>;
  outputs?: OutputRow[];
  traceSummary?: TraceSummary;
  error?: Pick<EvalError, 'code' | 'message' | 'ruleIds'>;
  recordedAt?: string;
  requestId?: string;
}

export type ParseOutcome =
  | { ok: true; record: ReplayRecord }
  | { ok: false; kind: 'empty' }
  | { ok: false; kind: 'syntax'; message: string; line?: number; column?: number }
  | { ok: false; kind: 'shape'; problems: string[] };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isIdList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Where JSON.parse stopped, from the engine's message ("position 42" or "line 3 column 7"). */
function syntaxPlace(text: string, message: string): { line?: number; column?: number } {
  const lc = /line (\d+) column (\d+)/i.exec(message);
  if (lc) return { line: Number(lc[1]), column: Number(lc[2]) };
  const pos = /position (\d+)/i.exec(message);
  if (!pos) return {};
  const before = text.slice(0, Number(pos[1])).split('\n');
  return { line: before.length, column: before[before.length - 1].length + 1 };
}

/**
 * Reads a record as a Caller would have stored it: the Facts beside the
 * Decision Result, either nested (`{ facts, result: {…} }`) or flat
 * (`{ facts, decisionId, version, outputs, traceSummary }`).
 */
export function parseRecord(text: string): ParseOutcome {
  if (!text.trim()) return { ok: false, kind: 'empty' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const message = (e as Error).message;
    return { ok: false, kind: 'syntax', message, ...syntaxPlace(text, message) };
  }
  if (!isObject(raw)) return { ok: false, kind: 'shape', problems: ['Bản ghi phải là một object JSON, không phải mảng hay giá trị đơn.'] };

  const result = isObject(raw.result) ? raw.result : raw;
  const problems: string[] = [];

  const facts = raw.facts ?? result.facts;
  if (facts === undefined) problems.push('Thiếu Facts: cần trường `facts`, là Facts snapshot đã gửi cho engine.');
  else if (!isObject(facts)) problems.push('`facts` phải là một object.');

  const decisionId = result.decisionId ?? raw.decisionId;
  if (decisionId === undefined) problems.push('Thiếu `decisionId`: không biết bản ghi thuộc Decision nào.');
  else if (typeof decisionId !== 'string' || !decisionId) problems.push('`decisionId` phải là chuỗi.');

  const summaryRaw = result.traceSummary;
  let traceSummary: TraceSummary | undefined;
  if (summaryRaw !== undefined) {
    if (!isObject(summaryRaw)) problems.push('`traceSummary` phải là một object.');
    else {
      const { decisionVersion, matchedRules, winningRules, executionTimeMs } = summaryRaw;
      if (!Number.isInteger(decisionVersion)) problems.push('`traceSummary.decisionVersion` phải là số nguyên.');
      if (!isIdList(matchedRules)) problems.push('`traceSummary.matchedRules` phải là mảng Rule id.');
      if (!isIdList(winningRules)) problems.push('`traceSummary.winningRules` phải là mảng Rule id.');
      if (Number.isInteger(decisionVersion) && isIdList(matchedRules) && isIdList(winningRules)) {
        traceSummary = {
          decisionVersion: decisionVersion as number,
          matchedRules,
          winningRules,
          ...(typeof executionTimeMs === 'number' ? { executionTimeMs } : {}),
        };
      }
    }
  }

  const versionRaw = result.version ?? raw.version;
  if (versionRaw !== undefined && !Number.isInteger(versionRaw)) problems.push('`version` phải là số nguyên.');
  const version = traceSummary?.decisionVersion ?? (Number.isInteger(versionRaw) ? (versionRaw as number) : undefined);
  if (version === undefined && summaryRaw === undefined && versionRaw === undefined) {
    problems.push('Thiếu Decision Version: cần `traceSummary.decisionVersion` hoặc `version`.');
  }
  if (traceSummary && Number.isInteger(versionRaw) && versionRaw !== traceSummary.decisionVersion) {
    problems.push(`\`version\` (v${versionRaw}) khác \`traceSummary.decisionVersion\` (v${traceSummary.decisionVersion}): bản ghi tự mâu thuẫn.`);
  }

  const outputs = result.outputs;
  if (outputs !== undefined && !(Array.isArray(outputs) && outputs.every(isObject))) problems.push('`outputs` phải là mảng các dòng output.');

  const errorRaw = result.error;
  let error: ReplayRecord['error'];
  if (errorRaw !== undefined) {
    if (!isObject(errorRaw) || (errorRaw.code !== 'UNIQUE_VIOLATION' && errorRaw.code !== 'SCHEMA')) {
      problems.push('`error.code` phải là UNIQUE_VIOLATION hoặc SCHEMA.');
    } else {
      error = {
        code: errorRaw.code,
        message: typeof errorRaw.message === 'string' ? errorRaw.message : '',
        ...(isIdList(errorRaw.ruleIds) ? { ruleIds: errorRaw.ruleIds } : {}),
      };
    }
  }

  if (summaryRaw === undefined && outputs === undefined && errorRaw === undefined) {
    problems.push('Không có gì để đối chiếu: cần `traceSummary`, `outputs` hoặc `error` của lần đánh giá gốc.');
  }

  if (problems.length) return { ok: false, kind: 'shape', problems };

  const recordedAt = raw.recordedAt ?? result.recordedAt;
  const requestId = raw.requestId ?? result.requestId;
  return {
    ok: true,
    record: {
      decisionId: decisionId as string,
      version: version!,
      facts: facts as Record<string, unknown>,
      ...(outputs !== undefined ? { outputs: outputs as OutputRow[] } : {}),
      ...(traceSummary ? { traceSummary } : {}),
      ...(error ? { error } : {}),
      ...(typeof recordedAt === 'string' ? { recordedAt } : {}),
      ...(typeof requestId === 'string' ? { requestId } : {}),
    },
  };
}

// ---------- the check ----------

export type CheckKey = 'version' | 'matched' | 'winners' | 'result';

/** One line of the check: what was recorded, what the replay gave, and whether they agree (null: nothing recorded to check). */
export interface CheckRow {
  key: CheckKey;
  match: boolean | null;
  /** Rule ids only one side has, for the Rule rows. */
  onlyRecorded?: string[];
  onlyReplayed?: string[];
}

export interface ReplayCheck {
  rows: CheckRow[];
  /** Rows that had something recorded to check. */
  checked: number;
  mismatched: number;
  verdict: 'match' | 'mismatch';
}

function sameRow(a: OutputRow, b: OutputRow): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => (a[k] ?? null) === (b[k] ?? null));
}

export function sameOutputs(a: OutputRow[], b: OutputRow[]): boolean {
  return a.length === b.length && a.every((row, i) => sameRow(row, b[i]));
}

function idRow(key: CheckKey, recorded: string[] | undefined, replayed: string[]): CheckRow {
  if (!recorded) return { key, match: null };
  const r = new Set(recorded);
  const p = new Set(replayed);
  const onlyRecorded = recorded.filter((id) => !p.has(id));
  const onlyReplayed = replayed.filter((id) => !r.has(id));
  return { key, match: onlyRecorded.length === 0 && onlyReplayed.length === 0, onlyRecorded, onlyReplayed };
}

/**
 * Checks a replay against its record. Execution time is never part of it:
 * only the Decision Result and the Rules behind it are deterministic.
 */
export function checkReplay(record: ReplayRecord, replay: EvalResult): ReplayCheck {
  const ts = record.traceSummary;
  const rows: CheckRow[] = [
    { key: 'version', match: true },
    idRow('matched', ts?.matchedRules, replay.matchedRuleIds),
    idRow('winners', ts?.winningRules, replay.winnerRuleIds),
  ];

  let result: boolean | null = null;
  if (record.error) {
    result =
      replay.error?.code === record.error.code &&
      (!record.error.ruleIds || !replay.error.ruleIds || idRow('result', record.error.ruleIds, replay.error.ruleIds).match === true);
  } else if (record.outputs) {
    result = !replay.error && sameOutputs(record.outputs, replay.outputs);
  } else if (replay.error) {
    // Only a Trace Summary was kept, and a Trace Summary is only returned with a result: the original call did not fail.
    result = false;
  }
  rows.push({ key: 'result', match: result });

  const counted = rows.filter((r) => r.key !== 'version' && r.match !== null);
  const mismatched = counted.filter((r) => r.match === false).length;
  return { rows, checked: counted.length, mismatched, verdict: mismatched ? 'mismatch' : 'match' };
}

/** Fields the replay had to treat as false because the recorded Facts lack them. */
export function missingFields(warnings: string[]): string[] {
  return warnings.flatMap((w) => {
    const m = /^Thiếu trường (\S+?):/.exec(w);
    return m ? [m[1]] : [];
  });
}
