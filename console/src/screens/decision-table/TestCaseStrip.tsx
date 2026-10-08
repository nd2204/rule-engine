import { FlaskConical, PanelRightClose, PanelRightOpen, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatScalar } from '../../domain/cell';
import type { Expected, OutputField, OutputRow, RuleSet, TestCase, TestCaseResult } from '../../domain/types';
import { Lamp, type LampState } from '../../components/Lamp';
import { useNarrow } from '../../state';

interface Props {
  testCases: TestCase[] | null;
  results: TestCaseResult[] | null;
  running: boolean;
  simError: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  ruleSet: RuleSet;
  canAdd: boolean;
  onAdd?: (tc: { name: string; facts: Record<string, unknown>; expected: Expected }) => Promise<void>;
  /** Published view: Test Cases are listed without a run. */
  readOnlyNote?: string;
}

const STATUS: Record<TestCaseResult['status'], { lamp: LampState; label: string }> = {
  pass: { lamp: 'clear', label: 'Pass' },
  fail: { lamp: 'stop', label: 'Fail' },
  error: { lamp: 'stop', label: 'Lỗi' },
};

function OutputList({ rows, outputs }: { rows: OutputRow[]; outputs: OutputField[] }) {
  if (rows.length === 0) return <span className="tc__none">không có output</span>;
  return (
    <ul className="tc__outputs">
      {rows.map((row, i) => (
        <li key={i}>
          {outputs
            .filter((f) => row[f.name] !== null && row[f.name] !== undefined)
            .map((f) => (
              <span key={f.name} className="tc__out">
                <span className="tc__out-key">{f.name}</span> {formatScalar(row[f.name])}
                {f.unit && row[f.name] !== null ? ` ${f.unit}` : ''}
              </span>
            ))}
        </li>
      ))}
    </ul>
  );
}

function ExpectedView({ expected, outputs }: { expected: Expected; outputs: OutputField[] }) {
  if ('error' in expected) return <span className="tc__none">lỗi {expected.error}</span>;
  return <OutputList rows={expected.outputs} outputs={outputs} />;
}

function factValue(v: unknown): string {
  if (Array.isArray(v)) return `${v.length} phần tử`;
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return formatScalar(v);
  return JSON.stringify(v);
}

const COLLAPSE_KEY = 'bre.strip.collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export function TestCaseStrip(props: Props) {
  const { testCases, results, running, simError, selectedId, onSelect, ruleSet } = props;
  const [adding, setAdding] = useState(false);
  // The strip folds to a lamp column to give the table width; only where it sits beside the table.
  const [collapsedPref, setCollapsedPref] = useState(readCollapsed);
  const stacked = useNarrow('(max-width: 1199px)');
  const collapsed = collapsedPref && !stacked;
  const setCollapsed = (v: boolean) => {
    setCollapsedPref(v);
    try {
      localStorage.setItem(COLLAPSE_KEY, v ? '1' : '0');
    } catch {
      // Storage unavailable: the choice lasts for this page only.
    }
  };
  const byId = new Map(results?.map((r) => [r.testCaseId, r]));
  const passed = results?.filter((r) => r.status === 'pass').length ?? 0;
  const total = testCases?.length ?? 0;
  const lampOf = (r: TestCaseResult | undefined): LampState =>
    r ? STATUS[r.status].lamp : running || !props.readOnlyNote ? 'pending' : 'idle';

  if (collapsed) {
    return (
      <section className="strip is-collapsed" aria-labelledby="tc-heading">
        <button
          type="button"
          className="icon-btn strip__toggle"
          aria-label="Mở rộng cột Test Case"
          title="Mở rộng cột Test Case"
          aria-expanded={false}
          onClick={() => setCollapsed(false)}
        >
          <PanelRightOpen size={16} aria-hidden="true" />
        </button>
        <h2 id="tc-heading" className="strip__rail-title">
          Test Case
        </h2>
        {results && total > 0 && (
          <p className={`strip__rail-count${passed === total ? ' is-clear' : ' is-stop'}`} aria-live="polite">
            <strong>{passed}</strong>
            <span>/{total}</span>
            <span className="visually-hidden"> pass</span>
          </p>
        )}
        {testCases && testCases.length > 0 && (
          <ul className="strip__lamps">
            {testCases.map((tc) => {
              const r = byId.get(tc.id);
              const active = selectedId === tc.id;
              const label = `${tc.id} ${tc.name}${r ? `: ${STATUS[r.status].label}` : ''}`;
              return (
                <li key={tc.id}>
                  <button
                    type="button"
                    className={`strip__lamp${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    aria-label={label}
                    title={label}
                    onClick={() => onSelect(active ? null : tc.id)}
                  >
                    <Lamp state={lampOf(r)} size="sm" />
                    <span className="strip__lamp-id" aria-hidden="true">
                      {tc.id.replace(/^[A-Z]+-/, '')}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="strip" aria-labelledby="tc-heading">
      <header className="strip__head">
        <h2 id="tc-heading" className="strip__title">
          Test Case
        </h2>
        {results && total > 0 ? (
          <p className={`strip__count${passed === total ? ' is-clear' : ' is-stop'}`} aria-live="polite">
            <strong>
              {passed}/{total}
            </strong>{' '}
            pass
          </p>
        ) : null}
        {!stacked && (
          <button
            type="button"
            className="icon-btn strip__toggle"
            aria-label="Thu gọn cột Test Case"
            title="Thu gọn cột Test Case"
            aria-expanded={true}
            onClick={() => setCollapsed(true)}
          >
            <PanelRightClose size={16} aria-hidden="true" />
          </button>
        )}
        <p className="strip__status" aria-live="polite">
          {props.readOnlyNote ??
            (simError
              ? `Simulation lỗi: ${simError}`
              : running
                ? 'Simulation đang chạy…'
                : results
                  ? 'Simulation chạy lại sau mỗi lần sửa'
                  : '')}
        </p>
      </header>

      {!testCases && (
        <ul className="tc-list" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="tc-skeleton" />
          ))}
        </ul>
      )}

      {testCases && testCases.length === 0 && (
        <div className="strip__empty">
          <FlaskConical size={20} aria-hidden="true" />
          <p>
            Decision này chưa có Test Case. Mỗi Test Case là một bộ Facts mẫu và Decision Result bạn mong đợi; Publish cần ít
            nhất một Test Case và tất cả phải pass.
          </p>
        </div>
      )}

      {testCases && testCases.length > 0 && (
        <ul className="tc-list">
          {testCases.map((tc) => {
            const r = byId.get(tc.id);
            const status = r ? STATUS[r.status] : null;
            const active = selectedId === tc.id;
            return (
              <li key={tc.id} className={`tc${active ? ' is-active' : ''}`}>
                <button type="button" className="tc__btn" aria-pressed={active} onClick={() => onSelect(active ? null : tc.id)}>
                  <Lamp state={lampOf(r)} size="sm" />
                  <span className="tc__id">{tc.id}</span>
                  <span className="tc__name">{tc.name}</span>
                  <span className="tc__meta">
                    {status && <span className={`tc__status tc__status--${r!.status}`}>{status.label}</span>}
                    {r?.differsFromLatest && <span className="tag tag--caution">khác Latest</span>}
                    {r && r.actual.warnings.length > 0 && <span className="tag">{r.actual.warnings.length} cảnh báo</span>}
                  </span>
                </button>
                {active && (
                  <div className="tc__detail">
                    <h3 className="tc__label">Facts</h3>
                    <dl className="tc__facts">
                      {Object.entries(tc.facts).map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{factValue(v)}</dd>
                        </div>
                      ))}
                    </dl>
                    <h3 className="tc__label">Kỳ vọng</h3>
                    <ExpectedView expected={tc.expected} outputs={ruleSet.outputs} />
                    {r && (
                      <>
                        <h3 className="tc__label">Draft trả về</h3>
                        {r.actual.error ? (
                          <p className="tc__error">
                            {r.actual.error.message}
                            {r.actual.error.ruleIds && <>: {r.actual.error.ruleIds.join(', ')}</>}
                          </p>
                        ) : (
                          <OutputList rows={r.actual.outputs} outputs={ruleSet.outputs} />
                        )}
                        <p className="tc__trace">
                          Match: {r.actual.matchedRuleIds.length ? r.actual.matchedRuleIds.join(', ') : 'không Rule nào'}
                          {r.actual.winnerRuleIds.length > 0 && ruleSet.hitPolicy !== 'COLLECT' && (
                            <> · thắng: {r.actual.winnerRuleIds.join(', ')}</>
                          )}
                        </p>
                        {r.actual.warnings.map((w) => (
                          <p key={w} className="tc__warning">
                            <Lamp state="caution" size="sm" /> {w}
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {props.canAdd && props.onAdd && testCases && (
        adding ? (
          <AddTestCase
            ruleSet={ruleSet}
            template={testCases.find((t) => t.id === selectedId)?.facts ?? testCases[0]?.facts}
            onCancel={() => setAdding(false)}
            onSubmit={async (tc) => {
              await props.onAdd!(tc);
              setAdding(false);
            }}
          />
        ) : (
          <button type="button" className="btn btn--ghost strip__add" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden="true" /> Thêm Test Case
          </button>
        )
      )}
    </section>
  );
}

function templateFacts(ruleSet: RuleSet): Record<string, unknown> {
  return Object.fromEntries(
    ruleSet.inputs.map((f) => [f.name, f.type === 'number' ? 0 : f.type === 'list' ? [] : f.type === 'boolean' ? false : '']),
  );
}

function AddTestCase(props: {
  ruleSet: RuleSet;
  template?: Record<string, unknown>;
  onCancel: () => void;
  onSubmit: (tc: { name: string; facts: Record<string, unknown>; expected: Expected }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [facts, setFacts] = useState(() => JSON.stringify(props.template ?? templateFacts(props.ruleSet), null, 2));
  const [expected, setExpected] = useState('[]');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    let parsedFacts: unknown;
    let parsedExpected: unknown;
    try {
      parsedFacts = JSON.parse(facts);
    } catch {
      setError('Facts không phải JSON hợp lệ');
      return;
    }
    try {
      parsedExpected = JSON.parse(expected);
    } catch {
      setError('Kỳ vọng không phải JSON hợp lệ');
      return;
    }
    if (!parsedFacts || typeof parsedFacts !== 'object' || Array.isArray(parsedFacts)) {
      setError('Facts phải là một object');
      return;
    }
    if (!Array.isArray(parsedExpected)) {
      setError('Kỳ vọng phải là danh sách output, ví dụ [] hoặc [{"tier": "GOLD"}]');
      return;
    }
    setBusy(true);
    try {
      await props.onSubmit({
        name: name.trim() || 'Test Case mới',
        facts: parsedFacts as Record<string, unknown>,
        expected: { outputs: parsedExpected as OutputRow[] },
      });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="tc-form" onSubmit={submit}>
      <h3 className="tc__label">Test Case mới</h3>
      <label className="tc-form__label" htmlFor="tc-name">
        Tên
      </label>
      <input id="tc-name" className="detail__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tình huống cần giữ đúng" />
      <label className="tc-form__label" htmlFor="tc-facts">
        Facts (JSON)
      </label>
      <textarea id="tc-facts" className="detail__json" rows={8} spellCheck={false} value={facts} onChange={(e) => setFacts(e.target.value)} />
      <label className="tc-form__label" htmlFor="tc-expected">
        Kỳ vọng: danh sách output (JSON)
      </label>
      <textarea id="tc-expected" className="detail__json" rows={3} spellCheck={false} value={expected} onChange={(e) => setExpected(e.target.value)} />
      {error && (
        <p role="alert" className="detail__error">
          {error}
        </p>
      )}
      <div className="detail__row">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Lưu Test Case'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={props.onCancel}>
          Huỷ
        </button>
      </div>
    </form>
  );
}
