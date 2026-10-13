// Provisional management API, served in the browser by MSW until the Go
// service exists. Paths and payloads are placeholders for the OpenAPI contract.

import { delay, http, HttpResponse } from 'msw';
import type { DecisionSummary, Draft, Expected, RuleSet, SimFact, SimulationReport, SimulationRun, TestCase } from '../domain/types';
import { sampleBatch, seed, type DecisionRecord } from './data';
import { breakingChanges, evaluate, simulate, simulateRun, traced } from './engine';
import { replaySamples } from './replay';

const db = seed();
let draftCounter = 10;

function summary(d: DecisionRecord): DecisionSummary {
  return {
    id: d.id,
    title: d.title,
    domain: d.domain,
    hitPolicy: d.versions[d.latest - 1].ruleSet.hitPolicy,
    latest: d.latest,
    versions: d.versions.map((v) => ({ version: v.version, publishedAt: v.publishedAt, note: v.note })),
    drafts: d.drafts.map(({ id, title, baseVersion, updatedAt }) => ({ id, title, baseVersion, updatedAt })),
  };
}

function problem(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}

function findDecision(id: string) {
  return db[id];
}

function latestRuleSet(d: DecisionRecord): RuleSet {
  return d.versions[d.latest - 1].ruleSet;
}

const LATENCY = 140;

/** A run's latency grows with the batch, so the pending state is visible on big batches. */
const runDelay = (n: number) => delay(LATENCY + Math.min(1200, Math.round(n / 8)));

type RunBody = { ruleSet?: RuleSet; baseline: number | null; batch?: SimFact[] };

function baselineOf(d: DecisionRecord, baseline: number | null) {
  if (baseline === null) return null;
  const v = d.versions[baseline - 1];
  return v ? { ruleSet: v.ruleSet, label: `v${v.version}` } : undefined;
}

export const handlers = [
  http.get('/api/decisions', async () => {
    await delay(LATENCY);
    return HttpResponse.json(Object.values(db).map(summary));
  }),

  http.get('/api/decisions/:id', async ({ params }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    return d ? HttpResponse.json(summary(d)) : problem(404, 'NOT_FOUND', 'Không tìm thấy Decision');
  }),

  http.get('/api/decisions/:id/test-cases', async ({ params }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    return d ? HttpResponse.json(d.testCases) : problem(404, 'NOT_FOUND', 'Không tìm thấy Decision');
  }),

  http.post('/api/decisions/:id/test-cases', async ({ params, request }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    if (!d) return problem(404, 'NOT_FOUND', 'Không tìm thấy Decision');
    const { restore, ...body } = (await request.json()) as {
      name: string;
      facts: Record<string, unknown>;
      expected: Expected;
      /** Undo of a delete: the same id back at its old place. */
      restore?: { id: string; index: number };
    };
    if (restore) {
      if (d.testCases.some((t) => t.id === restore.id)) return problem(409, 'ID_TAKEN', `${restore.id} đã tồn tại`);
      const tc: TestCase = { id: restore.id, ...body };
      d.testCases.splice(Math.min(restore.index, d.testCases.length), 0, tc);
      d.retiredIds?.delete(restore.id);
      return HttpResponse.json(tc, { status: 201 });
    }
    const prefix = d.testCases[0]?.id.split('-')[0] ?? 'TC';
    // Ids are never reused, so a deleted Test Case's id does not come back meaning something else.
    const used = [...d.testCases.map((t) => t.id), ...(d.retiredIds ?? [])];
    const next = Math.max(0, ...used.map((id) => Number(id.split('-')[1]) || 0)) + 1;
    const tc: TestCase = { id: `${prefix}-${String(next).padStart(2, '0')}`, ...body };
    d.testCases.push(tc);
    return HttpResponse.json(tc, { status: 201 });
  }),

  http.put('/api/decisions/:id/test-cases/:tcId', async ({ params, request }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    const i = d?.testCases.findIndex((t) => t.id === params.tcId) ?? -1;
    if (!d || i < 0) return problem(404, 'NOT_FOUND', 'Không tìm thấy Test Case');
    const body = (await request.json()) as { name: string; facts: Record<string, unknown>; expected: Expected };
    d.testCases[i] = { id: d.testCases[i].id, ...body };
    return HttpResponse.json(d.testCases[i]);
  }),

  http.delete('/api/decisions/:id/test-cases/:tcId', async ({ params }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    const i = d?.testCases.findIndex((t) => t.id === params.tcId) ?? -1;
    if (!d || i < 0) return problem(404, 'NOT_FOUND', 'Không tìm thấy Test Case');
    const [gone] = d.testCases.splice(i, 1);
    (d.retiredIds ??= new Set()).add(gone.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/decisions/:id/versions/:version', async ({ params }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    const v = d?.versions[Number(params.version) - 1];
    return v ? HttpResponse.json(v) : problem(404, 'NOT_FOUND', 'Không tìm thấy Decision Version');
  }),

  http.get('/api/decisions/:id/drafts/:draftId', async ({ params }) => {
    await delay(LATENCY);
    const draft = findDecision(params.id as string)?.drafts.find((x) => x.id === params.draftId);
    return draft ? HttpResponse.json(draft) : problem(404, 'NOT_FOUND', 'Không tìm thấy Draft');
  }),

  http.put('/api/decisions/:id/drafts/:draftId', async ({ params, request }) => {
    await delay(LATENCY);
    const draft = findDecision(params.id as string)?.drafts.find((x) => x.id === params.draftId);
    if (!draft) return problem(404, 'NOT_FOUND', 'Không tìm thấy Draft');
    const body = (await request.json()) as { ruleSet: RuleSet };
    draft.ruleSet = body.ruleSet;
    draft.updatedAt = new Date().toISOString();
    return HttpResponse.json(draft);
  }),

  http.post('/api/decisions/:id/drafts', async ({ params, request }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    if (!d) return problem(404, 'NOT_FOUND', 'Không tìm thấy Decision');
    const { fromVersion } = (await request.json()) as { fromVersion: number };
    const base = d.versions[fromVersion - 1];
    if (!base) return problem(404, 'NOT_FOUND', 'Không tìm thấy Decision Version');
    const draft: Draft = {
      id: `draft-${++draftCounter}`,
      decisionId: d.id,
      title: `Draft từ v${fromVersion}`,
      baseVersion: fromVersion,
      updatedAt: new Date().toISOString(),
      ruleSet: structuredClone(base.ruleSet),
    };
    d.drafts.push(draft);
    return HttpResponse.json(draft, { status: 201 });
  }),

  http.post('/api/decisions/:id/drafts/:draftId/simulate', async ({ params, request }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    const draft = d?.drafts.find((x) => x.id === params.draftId);
    if (!d || !draft) return problem(404, 'NOT_FOUND', 'Không tìm thấy Draft');
    const body = (await request.json()) as { ruleSet?: RuleSet };
    const ruleSet = body.ruleSet ?? draft.ruleSet;
    const report: SimulationReport = {
      results: simulate(ruleSet, latestRuleSet(d), d.testCases),
      breakingChanges: breakingChanges(ruleSet, latestRuleSet(d)),
      latestVersion: d.latest,
    };
    return HttpResponse.json(report);
  }),

  http.post('/api/decisions/:id/drafts/:draftId/simulation-runs', async ({ params, request }) => {
    const d = findDecision(params.id as string);
    const draft = d?.drafts.find((x) => x.id === params.draftId);
    const body = (await request.json()) as RunBody;
    await runDelay(body.batch?.length ?? 0);
    if (!d || !draft) return problem(404, 'NOT_FOUND', 'Không tìm thấy Draft');
    const baseline = baselineOf(d, body.baseline);
    if (baseline === undefined) return problem(404, 'NOT_FOUND', `Không có v${body.baseline} để so sánh`);
    const run: SimulationRun = {
      subjectLabel: draft.id,
      baselineVersion: body.baseline,
      ranAt: new Date().toISOString(),
      results: simulateRun({ ruleSet: body.ruleSet ?? draft.ruleSet, label: draft.id }, baseline, d.testCases, body.batch ?? []),
    };
    return HttpResponse.json(run);
  }),

  http.post('/api/decisions/:id/versions/:version/simulation-runs', async ({ params, request }) => {
    const d = findDecision(params.id as string);
    const v = d?.versions[Number(params.version) - 1];
    const body = (await request.json()) as RunBody;
    await runDelay(body.batch?.length ?? 0);
    if (!d || !v) return problem(404, 'NOT_FOUND', 'Không tìm thấy Decision Version');
    const baseline = baselineOf(d, body.baseline);
    if (baseline === undefined) return problem(404, 'NOT_FOUND', `Không có v${body.baseline} để so sánh`);
    const run: SimulationRun = {
      subjectLabel: `v${v.version}`,
      baselineVersion: body.baseline,
      ranAt: new Date().toISOString(),
      results: simulateRun({ ruleSet: v.ruleSet, label: `v${v.version}` }, baseline, d.testCases, body.batch ?? []),
    };
    return HttpResponse.json(run);
  }),

  // An illustrative Fact Batch, generated, for trying Simulation without real data.
  http.get('/api/decisions/:id/sample-batch', async ({ params }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    if (!d) return problem(404, 'NOT_FOUND', 'Không tìm thấy Decision');
    return HttpResponse.json({ name: `mau-${d.id}.json`, facts: sampleBatch(d.id) });
  }),

  // Evaluates one set of Facts against the Draft as edited, for a Test Case being written.
  http.post('/api/decisions/:id/drafts/:draftId/evaluate', async ({ params, request }) => {
    await delay(LATENCY);
    const draft = findDecision(params.id as string)?.drafts.find((x) => x.id === params.draftId);
    if (!draft) return problem(404, 'NOT_FOUND', 'Không tìm thấy Draft');
    const body = (await request.json()) as { ruleSet?: RuleSet; facts: Record<string, unknown> };
    return HttpResponse.json(evaluate(body.ruleSet ?? draft.ruleSet, body.facts));
  }),

  // Replay: one set of Facts against one Published version, with its full Evaluation Trace. Latest plays no part.
  http.post('/api/decisions/:id/versions/:version/evaluate', async ({ params, request }) => {
    await delay(LATENCY);
    const d = findDecision(params.id as string);
    if (!d) return problem(404, 'DECISION_NOT_FOUND', `Không có Decision ${params.id as string}`);
    const v = d.versions[Number(params.version) - 1];
    if (!v) return problem(404, 'VERSION_NOT_FOUND', `${d.id} không có v${params.version as string}: các version hiện có là v1 đến v${d.versions.length}`);
    const body = (await request.json()) as { facts: Record<string, unknown> };
    return HttpResponse.json(traced(v.ruleSet, body.facts, `v${v.version}`));
  }),

  // Illustrative records, shaped as a Caller would keep them, for trying Replay without a real log.
  http.get('/api/replay-samples', async () => {
    await delay(LATENCY);
    return HttpResponse.json(replaySamples(db));
  }),

  http.post('/api/decisions/:id/drafts/:draftId/publish', async ({ params, request }) => {
    await delay(LATENCY * 3);
    const d = findDecision(params.id as string);
    const draft = d?.drafts.find((x) => x.id === params.draftId);
    if (!d || !draft) return problem(404, 'NOT_FOUND', 'Không tìm thấy Draft');
    const body = (await request.json()) as { acknowledgedLatest: number | null; confirmBreaking: boolean };

    if (d.testCases.length === 0) return problem(409, 'NO_TEST_CASES', 'Draft cần ít nhất một Test Case');
    const results = simulate(draft.ruleSet, latestRuleSet(d), d.testCases);
    if (results.some((r) => r.status !== 'pass')) return problem(409, 'TESTS_FAILING', 'Còn Test Case chưa pass');
    if (draft.baseVersion !== d.latest && body.acknowledgedLatest !== d.latest) {
      return problem(409, 'STALE_DRAFT', `Latest đã lên v${d.latest}, cần xác nhận trước khi Publish`);
    }
    if (breakingChanges(draft.ruleSet, latestRuleSet(d)).length > 0 && !body.confirmBreaking) {
      return problem(409, 'BREAKING_CHANGE', 'Cần xác nhận Breaking Change');
    }

    const version = d.versions.length + 1;
    d.versions.push({
      decisionId: d.id,
      version,
      ruleSet: structuredClone(draft.ruleSet),
      publishedAt: new Date().toISOString(),
      note: draft.title,
    });
    d.latest = version;
    d.drafts = d.drafts.filter((x) => x.id !== draft.id);
    return HttpResponse.json({ version, decision: summary(d) });
  }),

  http.put('/api/decisions/:id/latest', async ({ params, request }) => {
    await delay(LATENCY * 2);
    const d = findDecision(params.id as string);
    if (!d) return problem(404, 'NOT_FOUND', 'Không tìm thấy Decision');
    const { version } = (await request.json()) as { version: number };
    if (!d.versions[version - 1]) return problem(404, 'NOT_FOUND', 'Không tìm thấy Decision Version');
    d.latest = version;
    return HttpResponse.json(summary(d));
  }),
];
