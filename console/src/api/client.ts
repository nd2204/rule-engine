import type {
  DecisionSummary,
  DecisionVersion,
  Draft,
  EvalResult,
  Expected,
  RuleSet,
  SimFact,
  SimScope,
  SimulationReport,
  SimulationRun,
  TestCase,
} from '../domain/types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Không kết nối được tới lớp quản trị');
  }
  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
    throw new ApiError(res.status, problem?.code ?? 'HTTP', problem?.message ?? `Lỗi ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const enc = encodeURIComponent;

export const api = {
  listDecisions: () => request<DecisionSummary[]>('GET', '/decisions'),
  getDecision: (id: string) => request<DecisionSummary>('GET', `/decisions/${enc(id)}`),
  listTestCases: (id: string) => request<TestCase[]>('GET', `/decisions/${enc(id)}/test-cases`),
  addTestCase: (
    id: string,
    tc: { name: string; facts: Record<string, unknown>; expected: Expected; restore?: { id: string; index: number } },
  ) => request<TestCase>('POST', `/decisions/${enc(id)}/test-cases`, tc),
  updateTestCase: (id: string, tcId: string, tc: { name: string; facts: Record<string, unknown>; expected: Expected }) =>
    request<TestCase>('PUT', `/decisions/${enc(id)}/test-cases/${enc(tcId)}`, tc),
  deleteTestCase: (id: string, tcId: string) => request<void>('DELETE', `/decisions/${enc(id)}/test-cases/${enc(tcId)}`),
  evaluate: (id: string, draftId: string, ruleSet: RuleSet, facts: Record<string, unknown>) =>
    request<EvalResult>('POST', `/decisions/${enc(id)}/drafts/${enc(draftId)}/evaluate`, { ruleSet, facts }),
  getVersion: (id: string, version: number) =>
    request<DecisionVersion>('GET', `/decisions/${enc(id)}/versions/${version}`),
  getDraft: (id: string, draftId: string) => request<Draft>('GET', `/decisions/${enc(id)}/drafts/${enc(draftId)}`),
  saveDraft: (id: string, draftId: string, ruleSet: RuleSet) =>
    request<Draft>('PUT', `/decisions/${enc(id)}/drafts/${enc(draftId)}`, { ruleSet }),
  createDraft: (id: string, fromVersion: number) =>
    request<Draft>('POST', `/decisions/${enc(id)}/drafts`, { fromVersion }),
  simulate: (id: string, draftId: string, ruleSet: RuleSet) =>
    request<SimulationReport>('POST', `/decisions/${enc(id)}/drafts/${enc(draftId)}/simulate`, { ruleSet }),
  /** Simulation of a Draft (as edited) or a Published version, over the Test Cases and a Fact Batch, against a baseline. */
  simulationRun: (id: string, scope: SimScope, body: { ruleSet?: RuleSet; baseline: number | null; batch: SimFact[] }) =>
    request<SimulationRun>(
      'POST',
      scope.kind === 'draft'
        ? `/decisions/${enc(id)}/drafts/${enc(scope.draftId)}/simulation-runs`
        : `/decisions/${enc(id)}/versions/${scope.version}/simulation-runs`,
      body,
    ),
  sampleBatch: (id: string) => request<{ name: string; facts: Record<string, unknown>[] }>('GET', `/decisions/${enc(id)}/sample-batch`),
  publish: (id: string, draftId: string, acknowledgedLatest: number | null, confirmBreaking: boolean) =>
    request<{ version: number; decision: DecisionSummary }>(
      'POST',
      `/decisions/${enc(id)}/drafts/${enc(draftId)}/publish`,
      { acknowledgedLatest, confirmBreaking },
    ),
  moveLatest: (id: string, version: number) =>
    request<DecisionSummary>('PUT', `/decisions/${enc(id)}/latest`, { version }),
};
