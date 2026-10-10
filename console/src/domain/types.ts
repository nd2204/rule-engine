// Domain vocabulary follows CONTEXT.md. The wire shapes here are provisional
// until the management layer's OpenAPI contract exists.

export type HitPolicy = 'FIRST' | 'UNIQUE' | 'PRIORITY' | 'COLLECT';

export type Scalar = string | number | boolean;

export type FieldType = 'number' | 'string' | 'boolean' | 'list';

export interface InputField {
  name: string;
  type: FieldType;
  required: boolean;
  label: string;
  unit?: string;
  /** Item fields, for `list` fields evaluated with some / all / none. */
  itemFields?: InputField[];
}

export interface OutputField {
  name: string;
  type: 'number' | 'string';
  label: string;
  unit?: string;
}

export type CompareOp = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in';

export type AstNode =
  | { op: 'and' | 'or'; args: AstNode[] }
  | { op: 'not'; arg: AstNode }
  | { op: 'some' | 'all' | 'none'; path: string; where: AstNode }
  | { op: CompareOp; path: string; value: Scalar | Scalar[] };

/** A Decision Table cell: a parsed simple condition, or raw JSON AST. */
export type Cell = { kind: 'expr'; text: string } | { kind: 'ast'; ast: AstNode };

export type OutputRow = Record<string, Scalar | null>;

export interface Rule {
  id: string;
  description: string;
  /** Only meaningful under PRIORITY. */
  weight?: number;
  when: Record<string, Cell>;
  then: OutputRow;
}

export interface RuleSet {
  hitPolicy: HitPolicy;
  inputs: InputField[];
  outputs: OutputField[];
  rules: Rule[];
}

export type Expected = { outputs: OutputRow[] } | { error: 'UNIQUE_VIOLATION' | 'SCHEMA' };

export interface TestCase {
  id: string;
  name: string;
  facts: Record<string, unknown>;
  expected: Expected;
}

export interface DecisionVersion {
  decisionId: string;
  version: number;
  ruleSet: RuleSet;
  publishedAt: string;
  note: string;
}

export interface DraftSummary {
  id: string;
  title: string;
  baseVersion: number;
  updatedAt: string;
}

export interface Draft extends DraftSummary {
  decisionId: string;
  ruleSet: RuleSet;
}

export interface DecisionSummary {
  id: string;
  title: string;
  domain: string;
  hitPolicy: HitPolicy;
  latest: number;
  versions: { version: number; publishedAt: string; note: string }[];
  drafts: DraftSummary[];
}

export interface EvalError {
  code: 'UNIQUE_VIOLATION' | 'SCHEMA';
  message: string;
  ruleIds?: string[];
}

export interface EvalResult {
  outputs: OutputRow[];
  matchedRuleIds: string[];
  winnerRuleIds: string[];
  /** Per Rule, per input field: true / false, or null for "any". */
  cellOutcomes: Record<string, Record<string, boolean | null>>;
  warnings: string[];
  error?: EvalError;
}

export type TestStatus = 'pass' | 'fail' | 'error';

export interface TestCaseResult {
  testCaseId: string;
  status: TestStatus;
  actual: EvalResult;
  /** Simulation's diff report: the Latest version answers differently. */
  differsFromLatest: boolean;
}

export interface BreakingChange {
  field: string;
  kind: 'new-required' | 'type-changed' | 'now-required';
  message: string;
}

export interface SimulationReport {
  results: TestCaseResult[];
  breakingChanges: BreakingChange[];
  latestVersion: number;
}

// ---------- Evaluation Trace ----------

/** One node of a condition, evaluated: a cell's condition tree, or one item of a list iterated by some / all / none. */
export interface TraceNode {
  text: string;
  /** null: a summary line with no verdict of its own (items left out). */
  ok: boolean | null;
  children?: TraceNode[];
}

export interface TraceCondition {
  field: string;
  /** null: the cell means "any". */
  ok: boolean | null;
  /** The Fact's value for this field, as the engine read it; absent when the Fact lacks the field. */
  value?: unknown;
  /** Present for condition trees (raw JSON AST cells). */
  tree?: TraceNode;
}

/** How the Hit Policy treated a Rule for this Fact. */
export type Disposition = 'won' | 'collected' | 'shadowed' | 'outweighed' | 'conflict' | 'missed';

export interface TraceRule {
  ruleId: string;
  matched: boolean;
  disposition: Disposition;
  /** The Rule that took precedence over this one (shadowed, outweighed). */
  by?: string;
  conditions: TraceCondition[];
}

export interface EvaluationTrace {
  /** "v7" or the Draft id. */
  ruleSetVersion: string;
  hitPolicy: HitPolicy;
  engine: string;
  evaluatedAt: string;
  durationMs: number;
  rules: TraceRule[];
}

// ---------- Simulation run ----------

export type SimScope = { kind: 'draft'; draftId: string } | { kind: 'version'; version: number };

export interface SimFact {
  /** Test Case id, or "#0012" for the 12th row of the Fact Batch. */
  key: string;
  source: 'test-case' | 'batch';
  facts: Record<string, unknown>;
}

export interface SimFactResult {
  key: string;
  source: SimFact['source'];
  facts: Record<string, unknown>;
  /** The scope under simulation (the Draft as edited, or a Published version). */
  subject: EvalResult & { trace: EvaluationTrace };
  /** The baseline version; absent when there is none to compare with. */
  baseline?: EvalResult & { trace: EvaluationTrace };
  changed: boolean;
  /** Test Cases only: the subject's result against the expectation. */
  status?: TestStatus;
}

export interface SimulationRun {
  subjectLabel: string;
  baselineVersion: number | null;
  ranAt: string;
  results: SimFactResult[];
}
