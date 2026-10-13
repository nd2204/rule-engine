import { Check, Copy, Minus, Save, ScanSearch, X } from 'lucide-react';
import { conditionFields, whenOf } from '../../domain/compound';
import { useMemo, useState } from 'react';
import { Lamp } from '../../components/Lamp';
import { conditionReading, formatScalar } from '../../domain/cell';
import type { EvalResult, EvaluationTrace, RuleSet, SimFactResult, TraceCondition, TraceNode, TraceRule } from '../../domain/types';
import { diffRuleSets } from '../decision-table/diff';
import { TestCaseForm, type TestCaseBody } from '../decision-table/TestCaseStrip';
import { Outcome } from './Outcome';

type Traced = EvalResult & { trace: EvaluationTrace };

interface Props {
  result: SimFactResult | null;
  decisionId: string;
  subject: RuleSet;
  subjectLabel: string;
  /** What a Caller would name the subject: its version, or the version a Draft would become. */
  subjectVersion: { version: number; planned: boolean };
  baselineRules: RuleSet | null;
  baseLabel: string | null;
  testCaseName?: string;
  /** Draft scope on a wide screen: a batch Fact can become a Test Case. */
  onSave?: (body: TestCaseBody) => Promise<string>;
  evaluate?: (facts: Record<string, unknown>) => Promise<EvalResult>;
  /** Draft scope: light this Fact in the Rules Table. */
  onLight?: () => void;
}

const STATUS_TEXT = { pass: 'Pass', fail: 'Fail', error: 'Lỗi' } as const;
const duration = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
const timeFormat = new Intl.DateTimeFormat('vi-VN', { timeStyle: 'medium' });

/** Simulation tab, inspector: one Fact's Evaluation Traces, the subject's and the baseline's. */
export function TraceInspector(props: Props) {
  const { result } = props;
  if (!result) {
    return (
      <section className="inspect" aria-labelledby="trace-title">
        <header className="inspect__head">
          <h2 id="trace-title" className="inspect__title">
            Evaluation Trace
          </h2>
          <p className="inspect__sub">Chưa chọn Fact</p>
        </header>
        <p className="inspect__note">
          Chọn một Fact trong danh sách để xem từng Rule được xét ra sao: điều kiện nào đúng, điều kiện nào trượt, và Hit Policy chọn Rule nào, ở cả {props.subjectLabel}
          {props.baseLabel ? ` và ${props.baseLabel}` : ''}.
        </p>
      </section>
    );
  }
  return <TraceView key={result.key} {...props} result={result} />;
}

function TraceView(props: Props & { result: SimFactResult }) {
  const { result, subject, subjectLabel, baselineRules, baseLabel } = props;
  const [side, setSide] = useState<'subject' | 'baseline' | 'caller'>('subject');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const diff = useMemo(() => (baselineRules ? diffRuleSets(subject, baselineRules) : []), [subject, baselineRules]);
  const showBaseline = side === 'baseline' && !!result.baseline && !!baselineRules;
  const traced: Traced = showBaseline ? result.baseline! : result.subject;
  const ruleSet = showBaseline ? baselineRules! : subject;
  const label = showBaseline ? baseLabel! : subjectLabel;

  // A Rule's change between the two sides, said from the side being read.
  const note = (id: string): string | null => {
    const d = diff.find((r) => r.rule.id === id);
    if (!d || d.kind === 'same') return null;
    if (showBaseline) return d.kind === 'removed' ? `bỏ ở ${subjectLabel}` : d.kind === 'changed' ? `sửa ở ${subjectLabel}` : null;
    return d.kind === 'added' ? `mới, không có ở ${baseLabel}` : d.kind === 'changed' ? `sửa so với ${baseLabel}` : null;
  };

  return (
    <section className="inspect trace" aria-labelledby="trace-title">
      <header className="inspect__head">
        <h2 id="trace-title" className="inspect__title">
          Evaluation Trace
        </h2>
        <p className="inspect__sub">
          <code>{result.key}</code> · {result.source === 'test-case' ? props.testCaseName ?? 'Test Case' : 'Fact Batch'}
        </p>
      </header>

      <dl className="trace-verdict">
        {result.baseline && baseLabel && (
          <div>
            <dt>{baseLabel}</dt>
            <dd>
              <Outcome result={result.baseline} outputs={baselineRules?.outputs ?? subject.outputs} hitPolicy={subject.hitPolicy} />
            </dd>
          </div>
        )}
        <div>
          <dt>{subjectLabel}</dt>
          <dd>
            <Outcome result={result.subject} outputs={subject.outputs} hitPolicy={subject.hitPolicy} />
          </dd>
        </div>
        {result.status && (
          <div>
            <dt className="trace-verdict__label">Kỳ vọng</dt>
            <dd className={`trace-verdict__status is-${result.status}`}>
              <Lamp state={result.status === 'pass' ? 'clear' : 'stop'} size="sm" /> {STATUS_TEXT[result.status]}
            </dd>
          </div>
        )}
      </dl>
      {result.baseline && (
        <p className={`trace-verdict__change${result.changed ? ' is-changed' : ''}`}>
          {result.changed ? `Kết quả đổi: ${baseLabel} → ${subjectLabel}` : `Giữ nguyên kết quả của ${baseLabel}`}
        </p>
      )}

      {(props.onSave || props.onLight) && (
        <div className="trace__actions">
          {props.onSave && result.source === 'batch' && !saving && !savedId && (
            <button type="button" className="btn btn--secondary" onClick={() => setSaving(true)}>
              <Save size={15} aria-hidden="true" /> Lưu thành Test Case
            </button>
          )}
          {props.onLight && (
            <button type="button" className="btn btn--ghost" onClick={props.onLight}>
              <ScanSearch size={15} aria-hidden="true" /> Soi trong bảng Rules
            </button>
          )}
        </div>
      )}
      {savedId && (
        <p className="trace__saved" role="status">
          <Lamp state="clear" size="sm" /> Đã lưu thành <code>{savedId}</code>. Test Case này giờ gác Publish cùng các Test Case khác.
        </p>
      )}
      {saving && props.onSave && (
        <TestCaseForm
          ruleSet={subject}
          template={result.facts}
          evaluate={props.evaluate}
          onCancel={() => setSaving(false)}
          onSubmit={async (body) => {
            const id = await props.onSave!(body);
            setSaving(false);
            setSavedId(id);
          }}
        />
      )}

      <div className="mode trace__side" role="group" aria-label="Xem Evaluation Trace của một phiên bản, hoặc Decision Result Caller nhận">
        <button type="button" className="mode__btn" aria-pressed={side === 'subject'} onClick={() => setSide('subject')}>
          {subjectLabel}
        </button>
        {result.baseline && baseLabel && (
          <button type="button" className="mode__btn" aria-pressed={side === 'baseline'} onClick={() => setSide('baseline')}>
            {baseLabel}
          </button>
        )}
        <button type="button" className="mode__btn" aria-pressed={side === 'caller'} onClick={() => setSide('caller')}>
          Caller
        </button>
      </div>

      {side === 'caller' ? (
        <CallerView
          decisionId={props.decisionId}
          subject={{ label: subjectLabel, version: props.subjectVersion, result: result.subject }}
          baseline={result.baseline && baseLabel ? { label: baseLabel, version: { version: Number(baseLabel.slice(1)), planned: false }, result: result.baseline } : null}
        />
      ) : (
        <>
      <h3 className="tc__label">
        Rule của {label} · {ruleSet.hitPolicy}
      </h3>
      {traced.error?.code === 'SCHEMA' ? (
        <p className="trace__rejected">
          <Lamp state="stop" size="sm" /> Input Schema Validation từ chối Fact này: {traced.error.message}. Không Rule nào được xét.
        </p>
      ) : (
        <ol className="trace-rules">
          {traced.trace.rules.map((tr, i) => (
            <TraceRuleView key={tr.ruleId} tr={tr} index={i} ruleSet={ruleSet} note={note(tr.ruleId)} />
          ))}
        </ol>
      )}
      {traced.error?.code === 'UNIQUE_VIOLATION' && (
        <p className="trace__rejected">
          <Lamp state="stop" size="sm" /> {traced.error.message}: {traced.error.ruleIds?.join(', ')}. UNIQUE không cho phép nhiều Rule cùng khớp.
        </p>
      )}
      {traced.warnings.map((w) => (
        <p key={w} className="tc__warning">
          <Lamp state="caution" size="sm" /> {w}
        </p>
      ))}

      <dl className="trace-meta">
        <div>
          <dt>Rule Set</dt>
          <dd>
            <code>{traced.trace.ruleSetVersion}</code>
          </dd>
        </div>
        <div>
          <dt>Lúc</dt>
          <dd>{timeFormat.format(new Date(traced.trace.evaluatedAt))}</dd>
        </div>
        <div>
          <dt>Thời gian</dt>
          <dd>{traced.trace.durationMs < 0.1 ? '< 0,1' : duration.format(traced.trace.durationMs)} ms, đo trên trình giả lập, không phải engine Go</dd>
        </div>
        <div>
          <dt>Engine</dt>
          <dd>{traced.trace.engine}</dd>
        </div>
      </dl>

        </>
      )}

      <details className="trace__more">
        <summary>Facts đã gửi</summary>
        <pre className="inspect__code" tabIndex={0} aria-label={`Facts của ${result.key}`}>
          {JSON.stringify(result.facts, null, 2)}
        </pre>
      </details>
    </section>
  );
}

/** What a Caller receives for this Fact: the subject (as it would be once Published) and the baseline it replaces. */
function CallerView(props: {
  decisionId: string;
  subject: { label: string; version: { version: number; planned: boolean }; result: Traced };
  baseline: { label: string; version: { version: number; planned: boolean }; result: Traced } | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const blocks = [props.subject, ...(props.baseline ? [props.baseline] : [])];
  return (
    <div className="caller">
      <p className="trace__payload-note">Dạng dây tạm, chờ hợp đồng OpenAPI của lớp quản trị.</p>
      {blocks.map((b) => {
        const json = JSON.stringify(callerPayload(props.decisionId, b.version.version, b.result), null, 2);
        return (
          <section key={b.label} className="caller__block" aria-label={`Decision Result của ${b.label}`}>
            <header className="caller__head">
              <h3 className="tc__label">
                {b.version.planned ? `${b.label} · nếu Publish thành v${b.version.version}` : `${b.label} · Caller nhận hôm nay`}
              </h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  void navigator.clipboard?.writeText(json).then(() => {
                    setCopied(b.label);
                    window.setTimeout(() => setCopied(null), 1600);
                  });
                }}
              >
                {copied === b.label ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied === b.label ? 'Đã chép' : 'Chép'}
              </button>
            </header>
            <pre className="inspect__code" tabIndex={0}>
              {json}
            </pre>
          </section>
        );
      })}
    </div>
  );
}

function callerPayload(decisionId: string, version: number, r: Traced) {
  if (r.error) return { decisionId, version, error: { code: r.error.code, message: r.error.message, ...(r.error.ruleIds ? { ruleIds: r.error.ruleIds } : {}) } };
  return {
    decisionId,
    version,
    outputs: r.outputs,
    traceSummary: {
      decisionVersion: version,
      matchedRules: r.matchedRuleIds,
      winningRules: r.winnerRuleIds,
      executionTimeMs: Number(r.trace.durationMs.toFixed(3)),
    },
  };
}

function dispositionText(tr: TraceRule, ruleSet: RuleSet, failed: string[]): string {
  const weight = (id: string) => ruleSet.rules.find((r) => r.id === id)?.weight ?? 0;
  switch (tr.disposition) {
    case 'won':
      return ruleSet.hitPolicy === 'PRIORITY'
        ? `thắng: weight ${weight(tr.ruleId)} cao nhất trong các Rule khớp`
        : ruleSet.hitPolicy === 'UNIQUE'
          ? 'thắng: Rule duy nhất khớp'
          : 'thắng: Rule khớp đầu tiên';
    case 'collected':
      return 'khớp, vào output';
    case 'shadowed':
      return `khớp, nhưng đứng sau ${tr.by}`;
    case 'outweighed':
      return weight(tr.ruleId) === weight(tr.by ?? '')
        ? `khớp, cùng weight ${weight(tr.ruleId)} với ${tr.by} nhưng đứng sau`
        : `khớp, nhưng weight ${weight(tr.ruleId)} thấp hơn ${weight(tr.by ?? '')} của ${tr.by}`;
    case 'conflict':
      return 'khớp cùng Rule khác: lỗi UNIQUE';
    case 'missed':
      return failed.length ? `trượt ở ${failed.join(', ')}` : 'trượt';
  }
}

export function TraceRuleView({ tr, index, ruleSet, note }: { tr: TraceRule; index: number; ruleSet: RuleSet; note: string | null }) {
  const rule = ruleSet.rules.find((r) => r.id === tr.ruleId);
  const failed = tr.conditions.filter((c) => c.ok === false);
  const held = tr.conditions.filter((c) => c.ok === true);
  const shown = tr.matched ? held : failed;
  const won = tr.disposition === 'won' || tr.disposition === 'collected';
  return (
    <li className={`trace-rule is-${tr.disposition}`}>
      <div className="trace-rule__head">
        <span className="rule__index">{index + 1}</span>
        <code className="trace-rule__id">{tr.ruleId}</code>
        {note && <span className="tag">{note}</span>}
      </div>
      <p className={`trace-rule__verdict${won ? ' is-won' : ''}`}>{dispositionText(tr, ruleSet, failed.map((c) => c.field))}</p>
      {shown.length > 0 && (
        <ul className="trace-conds">
          {shown.map((c) => (
            <ConditionView key={c.field} c={c} ruleSet={ruleSet} cell={rule ? whenOf(rule, c.field) : undefined} />
          ))}
        </ul>
      )}
      {!tr.matched && held.length > 0 && <p className="trace-rule__rest">+{held.length} điều kiện khác đúng</p>}
      {tr.matched && tr.conditions.every((c) => c.ok === null) && <p className="trace-rule__rest">Không có điều kiện: khớp mọi Fact</p>}
    </li>
  );
}

function ConditionView({ c, ruleSet, cell }: { c: TraceCondition; ruleSet: RuleSet; cell: Parameters<typeof conditionReading>[0] }) {
  const field = conditionFields(ruleSet).find((f) => f.name === c.field);
  const reading = field ? conditionReading(cell, field) : c.field;
  const missing = !('value' in c);
  return (
    <li className={`trace-cond is-${c.ok ? 'hit' : 'miss'}`}>
      <span className="trace-cond__mark" aria-label={c.ok ? 'đúng' : 'sai'}>
        {c.ok ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : <X size={13} strokeWidth={3} aria-hidden="true" />}
      </span>
      <span className="trace-cond__body">
        <code className="trace-cond__expr">{reading}</code>
        {!c.tree && (
          <span className={`trace-cond__fact${missing ? ' is-missing' : ''}`}>
            {missing ? 'Fact thiếu trường này' : `Fact: ${factText(c.value)}`}
          </span>
        )}
        {c.tree?.children && <TreeView nodes={c.tree.children} />}
      </span>
    </li>
  );
}

function TreeView({ nodes }: { nodes: TraceNode[] }) {
  return (
    <ul className="trace-tree">
      {nodes.map((node, i) => (
        <li key={i} className={node.ok === null ? 'is-rest' : node.ok ? 'is-hit' : 'is-miss'}>
          {node.ok === null ? (
            <Minus size={12} aria-hidden="true" />
          ) : node.ok ? (
            <Check size={12} strokeWidth={3} aria-label="đúng" />
          ) : (
            <X size={12} strokeWidth={3} aria-label="sai" />
          )}
          <code>{node.text}</code>
          {node.children && node.children.length > 0 && <TreeView nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}

function factText(v: unknown): string {
  if (Array.isArray(v)) return `${v.length} phần tử`;
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return formatScalar(v);
  return JSON.stringify(v);
}
