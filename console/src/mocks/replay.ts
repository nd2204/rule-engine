// Illustrative Replay records, built from the sample Fact Batches the way a
// Caller would have stored them: the Facts snapshot beside the Decision Result
// and its Trace Summary. Synthetic, for the console demo only.

import type { EvalResult } from '../domain/types';
import { sampleBatch, type DecisionRecord } from './data';
import { evaluate } from './engine';

export interface ReplaySample {
  id: string;
  label: string;
  note: string;
  record: Record<string, unknown>;
}

/** A recording time between a version's publication and the next one, so the record belongs to that version. */
function recordedAt(d: DecisionRecord, version: number): string {
  const from = Date.parse(d.versions[version - 1].publishedAt);
  const next = d.versions[version]?.publishedAt;
  const to = next ? Date.parse(next) : from + 9 * 864e5;
  const t = new Date(from + (to - from) * 0.62);
  t.setUTCSeconds(31, 0);
  return t.toISOString();
}

function callerRecord(d: DecisionRecord, version: number, facts: Record<string, unknown>, r: EvalResult, requestId: string, ms: number) {
  const result = r.error
    ? { decisionId: d.id, version, error: { code: r.error.code, message: r.error.message, ...(r.error.ruleIds ? { ruleIds: r.error.ruleIds } : {}) } }
    : {
        decisionId: d.id,
        version,
        outputs: r.outputs,
        traceSummary: { decisionVersion: version, matchedRules: r.matchedRuleIds, winningRules: r.winnerRuleIds, executionTimeMs: ms },
      };
  return { requestId, recordedAt: recordedAt(d, version), facts, result };
}

const winners = (r: EvalResult) => (r.error ? `!${r.error.code}` : r.winnerRuleIds.join(','));

export function replaySamples(db: Record<string, DecisionRecord>): ReplaySample[] {
  const out: ReplaySample[] = [];
  const pos = db['calculate-pos-discounts'];
  const irrigation = db['determine-irrigation-action'];
  const tier = db['classify-customer-tier'];

  // A call on a version Latest has since moved past: the replay must use that version, not Latest.
  if (pos && pos.latest > 1) {
    const v = pos.latest - 1;
    const rs = pos.versions[v - 1].ruleSet;
    const facts = sampleBatch(pos.id, 96).find((f) => {
      const r = evaluate(rs, f);
      return !r.error && r.winnerRuleIds.length > 1;
    });
    if (facts) {
      out.push({
        id: 'pos-match',
        label: `${pos.id} · v${v}`,
        note: `Ghi lúc v${v} còn là Latest. Khớp.`,
        record: callerRecord(pos, v, facts, evaluate(rs, facts), 'pos-7f3a21', 0.041),
      });
    }
  }

  if (irrigation && irrigation.latest > 1) {
    const v = irrigation.latest - 1;
    const rs = irrigation.versions[v - 1].ruleSet;
    const facts = sampleBatch(irrigation.id, 96).find((f) => {
      const r = evaluate(rs, f);
      return !r.error && r.winnerRuleIds.length === 1 && r.matchedRuleIds.length > 1;
    });
    if (facts) {
      out.push({
        id: 'irrigation-match',
        label: `${irrigation.id} · v${v}`,
        note: 'Bộ điều khiển vườn, Hit Policy FIRST. Khớp.',
        record: callerRecord(irrigation, v, facts, evaluate(rs, facts), 'zone-b4-0917', 0.018),
      });
    }
  }

  // A record that kept only the Trace Summary, not the outputs: the Rules alone are checked.
  if (tier) {
    const v = tier.latest;
    const rs = tier.versions[v - 1].ruleSet;
    const facts = sampleBatch(tier.id, 64).find((f) => evaluate(rs, f).winnerRuleIds[0] === 'SILVER');
    if (facts) {
      const { outputs: _, ...summaryOnly } = callerRecord(tier, v, facts, evaluate(rs, facts), 'crm-11d2', 0.012).result as Record<string, unknown>;
      out.push({
        id: 'tier-summary',
        label: `${tier.id} · v${v}`,
        note: 'Caller chỉ lưu Trace Summary, không lưu output. Khớp.',
        record: { requestId: 'crm-11d2', recordedAt: recordedAt(tier, v), facts, result: summaryOnly },
      });
    }
  }

  // A snapshot that lost an optional field on the way to the log: the replay cannot give the recorded result.
  for (const d of [db['determine-alert-level'], irrigation, pos]) {
    if (!d) continue;
    const v = d.latest;
    const rs = d.versions[v - 1].ruleSet;
    const optional = rs.inputs.filter((f) => !f.required).map((f) => f.name);
    let found: { facts: Record<string, unknown>; field: string } | null = null;
    for (const facts of sampleBatch(d.id, 256)) {
      const full = evaluate(rs, facts);
      if (full.error || !full.winnerRuleIds.length) continue;
      const field = optional.find((k) => {
        if (!(k in facts)) return false;
        const { [k]: _, ...cut } = facts;
        const r = evaluate(rs, cut);
        return !r.error && winners(r) !== winners(full);
      });
      if (field) {
        found = { facts, field };
        break;
      }
    }
    if (!found) continue;
    const { [found.field]: _, ...cut } = found.facts;
    out.push({
      id: 'mismatch',
      label: `${d.id} · v${v}`,
      note: `Facts snapshot đã mất trường ${found.field}. Lệch.`,
      record: callerRecord(d, v, cut, evaluate(rs, found.facts), `${d.id.split('-')[1]}-90c4e8`, 0.037),
    });
    break;
  }

  return out;
}
