import { FlaskConical, PanelRightClose, PanelRightOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { formatScalar, parseNumber } from '../../domain/cell';
import type { EvalResult, Expected, InputField, OutputField, OutputRow, RuleSet, TestCase, TestCaseResult } from '../../domain/types';
import { Lamp, type LampState } from '../../components/Lamp';
import { useFresh } from '../../components/useFresh';
import { useNarrow } from '../../state';

interface Props {
  testCases: TestCase[] | null;
  results: TestCaseResult[] | null;
  running: boolean;
  simError: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  ruleSet: RuleSet;
  /** Test Cases can be added, edited and deleted (a Draft on a wide screen). */
  canEdit: boolean;
  /** Resolves to the new Test Case's id. */
  onAdd?: (tc: TestCaseBody) => Promise<string | void>;
  onUpdate?: (id: string, tc: TestCaseBody) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  /** Evaluates Facts against the Draft as edited, for the form's preview. */
  evaluate?: (facts: Record<string, unknown>) => Promise<EvalResult>;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  // Keyboard focus follows the Test Case an action just touched (saved, closed, deleted), never back to the top of the page.
  const focusTc = (id: string | null) =>
    requestAnimationFrame(() => {
      const target = id
        ? document.querySelector<HTMLElement>(`.tc[data-tc="${window.CSS.escape(id)}"] .tc__btn`)
        : document.querySelector<HTMLElement>('.strip .tc__btn, .strip__add');
      target?.focus();
    });
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
  const verdictKey = (tc: TestCase) => `${tc.id}:${byId.get(tc.id)?.status ?? ''}:${byId.get(tc.id)?.differsFromLatest ? 'd' : ''}`;
  const fresh = useFresh((props.testCases ?? []).map(verdictKey));
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
              <li key={tc.id} className={`tc${active ? ' is-active' : ''}`} data-tc={tc.id}>
                <button type="button" className={`tc__btn${fresh.has(verdictKey(tc)) ? ' is-fresh' : ''}`} aria-pressed={active} onClick={() => onSelect(active ? null : tc.id)}>
                  <Lamp state={lampOf(r)} size="sm" />
                  <span className="tc__id">{tc.id}</span>
                  <span className="tc__name">{tc.name}</span>
                  <span className="tc__meta">
                    {status && <span className={`tc__status tc__status--${r!.status}`}>{status.label}</span>}
                    {r?.differsFromLatest && <span className="tag tag--caution">khác Latest</span>}
                    {r && r.actual.warnings.length > 0 && <span className="tag">{r.actual.warnings.length} cảnh báo</span>}
                  </span>
                </button>
                {active && editingId === tc.id && props.onUpdate ? (
                  <TestCaseForm
                    ruleSet={ruleSet}
                    testCase={tc}
                    evaluate={props.evaluate}
                    onCancel={() => {
                      setEditingId(null);
                      focusTc(tc.id);
                    }}
                    onSubmit={async (body) => {
                      await props.onUpdate!(tc.id, body);
                      setEditingId(null);
                      focusTc(tc.id);
                    }}
                  />
                ) : active && (
                  <div className="tc__detail">
                    {props.canEdit && (
                      <div className="tc__actions">
                        <button type="button" className="btn btn--ghost" onClick={() => setEditingId(tc.id)}>
                          <Pencil size={14} aria-hidden="true" /> Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--ghost-danger"
                          onClick={async () => {
                            const i = testCases.findIndex((t) => t.id === tc.id);
                            const next = testCases[i + 1]?.id ?? testCases[i - 1]?.id ?? null;
                            await props.onDelete?.(tc.id);
                            focusTc(next);
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Xoá {tc.id}
                        </button>
                      </div>
                    )}
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

      {props.canEdit && props.onAdd && testCases && (
        adding ? (
          <TestCaseForm
            ruleSet={ruleSet}
            template={testCases.find((t) => t.id === selectedId)?.facts ?? testCases[0]?.facts}
            evaluate={props.evaluate}
            onCancel={() => {
              setAdding(false);
              requestAnimationFrame(() => document.querySelector<HTMLElement>('.strip__add')?.focus());
            }}
            onSubmit={async (tc) => {
              const id = await props.onAdd!(tc);
              setAdding(false);
              if (id) focusTc(id);
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

export type TestCaseBody = { name: string; facts: Record<string, unknown>; expected: Expected };

type ExpectedKind = 'outputs' | 'UNIQUE_VIOLATION';
type RowText = Record<string, string>;

function toText(v: unknown, field: InputField): string {
  if (v === undefined || v === null) return '';
  if (field.type === 'list') return JSON.stringify(v, null, 1);
  return String(v);
}

function blankFacts(ruleSet: RuleSet, from?: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(ruleSet.inputs.map((f) => [f.name, toText(from?.[f.name], f)]));
}

function rowsFromOutputs(rows: OutputRow[], outputs: OutputField[]): RowText[] {
  return rows.map((row) => Object.fromEntries(outputs.map((f) => [f.name, row[f.name] === null || row[f.name] === undefined ? '' : String(row[f.name])])));
}

/** Reads the typed Facts against the input schema. Blank optional fields are left out of the Fact. */
function readFacts(ruleSet: RuleSet, text: Record<string, string>): { facts: Record<string, unknown>; errors: Record<string, string> } {
  const facts: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const f of ruleSet.inputs) {
    const raw = (text[f.name] ?? '').trim();
    if (raw === '') {
      if (f.required) errors[f.name] = 'Trường bắt buộc, cần một giá trị';
      continue;
    }
    if (f.type === 'number') {
      const n = parseNumber(raw);
      if (n === null) errors[f.name] = `“${raw}” không phải số`;
      else facts[f.name] = n;
    } else if (f.type === 'boolean') {
      facts[f.name] = raw === 'true';
    } else if (f.type === 'list') {
      try {
        const v = JSON.parse(raw);
        if (!Array.isArray(v)) throw new Error();
        facts[f.name] = v;
      } catch {
        errors[f.name] = 'Viết danh sách dạng JSON, ví dụ [{"category": "BEVERAGE", "qty": 2}]';
      }
    } else {
      facts[f.name] = raw;
    }
  }
  return { facts, errors };
}

function readRows(outputs: OutputField[], rows: RowText[]): { rows: OutputRow[]; error: string | null } {
  const out: OutputRow[] = [];
  for (const [i, row] of rows.entries()) {
    const r: OutputRow = {};
    for (const f of outputs) {
      const raw = (row[f.name] ?? '').trim();
      if (raw === '') r[f.name] = null;
      else if (f.type === 'number') {
        const n = parseNumber(raw);
        if (n === null) return { rows: [], error: `Dòng ${i + 1}: ${f.name} “${raw}” không phải số` };
        r[f.name] = n;
      } else r[f.name] = raw;
    }
    if (outputs.every((f) => r[f.name] === null)) return { rows: [], error: `Dòng ${i + 1} chưa có giá trị nào` };
    out.push(r);
  }
  return { rows: out, error: null };
}

export function TestCaseForm(props: {
  ruleSet: RuleSet;
  /** The Test Case being edited; absent for a new one. */
  testCase?: TestCase;
  template?: Record<string, unknown>;
  evaluate?: (facts: Record<string, unknown>) => Promise<EvalResult>;
  onCancel: () => void;
  onSubmit: (tc: TestCaseBody) => Promise<void>;
}) {
  const { ruleSet, testCase } = props;
  const outputs = ruleSet.outputs;
  const collect = ruleSet.hitPolicy === 'COLLECT';
  const [name, setName] = useState(testCase?.name ?? '');
  const [factText, setFactText] = useState(() => blankFacts(ruleSet, testCase?.facts ?? props.template));
  const [kind, setKind] = useState<ExpectedKind>(testCase && 'error' in testCase.expected ? 'UNIQUE_VIOLATION' : 'outputs');
  // null until the author says what to expect: a new Test Case never asserts "no output" by default.
  const [rows, setRows] = useState<RowText[] | null>(() =>
    testCase && 'outputs' in testCase.expected ? rowsFromOutputs(testCase.expected.outputs, outputs) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<EvalResult | null>(null);
  const uid = useId();

  const { facts, errors: factErrors } = readFacts(ruleSet, factText);
  const factsKey = JSON.stringify(facts);
  const factsOk = Object.keys(factErrors).length === 0;

  // What the Draft answers for these Facts right now, so the author can adopt it or disagree with it.
  const { evaluate } = props;
  useEffect(() => {
    if (!evaluate || !factsOk) {
      setPreview(null);
      return;
    }
    let live = true;
    const t = window.setTimeout(() => {
      evaluate(JSON.parse(factsKey)).then(
        (r) => live && setPreview(r),
        () => live && setPreview(null),
      );
    }, 300);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [evaluate, factsKey, factsOk]);

  function adoptPreview() {
    if (!preview) return;
    if (preview.error?.code === 'UNIQUE_VIOLATION') {
      setKind('UNIQUE_VIOLATION');
      return;
    }
    setKind('outputs');
    setRows(rowsFromOutputs(preview.outputs, outputs));
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!factsOk) {
      setError('Facts còn trường chưa hợp lệ, xem các ô đánh dấu đỏ');
      return;
    }
    let expected: Expected;
    if (kind === 'UNIQUE_VIOLATION') expected = { error: 'UNIQUE_VIOLATION' };
    else {
      if (rows === null) {
        setError('Chưa có kỳ vọng. Dùng kết quả Draft, thêm dòng output, hoặc chọn “Không có output”.');
        return;
      }
      const read = readRows(outputs, rows);
      if (read.error) {
        setError(read.error);
        return;
      }
      expected = { outputs: read.rows };
    }
    setBusy(true);
    try {
      await props.onSubmit({ name: name.trim() || testCase?.name || 'Test Case mới', facts, expected });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    // The form opens where the author can see it, with the cursor in its first field.
    formRef.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    formRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  }, []);

  const previewError = preview?.error;
  return (
    <form ref={formRef} className="tc-form" onSubmit={submit} noValidate>
      <h3 className="tc__label">{testCase ? `Sửa ${testCase.id}` : 'Test Case mới'}</h3>
      <label className="tc-form__label" htmlFor={`${uid}-name`}>
        Tên
      </label>
      <input
        id={`${uid}-name`}
        className="detail__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tình huống cần giữ đúng, ví dụ Khách GOLD giỏ lớn"
      />

      <fieldset className="tc-form__group">
        <legend className="tc-form__legend">Facts</legend>
        <p className="tc-form__note">Bỏ trống trường không bắt buộc nghĩa là Fact thiếu trường đó.</p>
        {ruleSet.inputs.map((f) => {
          const id = `${uid}-f-${f.name}`;
          const err = factText[f.name].trim() || f.required ? factErrors[f.name] : undefined;
          return (
            <div key={f.name} className="tc-form__field">
              <label className="tc-form__field-label" htmlFor={id}>
                <code>{f.name}</code>
                <span>
                  {f.label}
                  {f.unit ? ` · ${f.unit}` : ''}
                </span>
                {f.required && (
                  <abbr className="rules__req" title="Bắt buộc">
                    *
                  </abbr>
                )}
              </label>
              {f.type === 'boolean' ? (
                <select
                  id={id}
                  className="detail__input"
                  value={factText[f.name]}
                  onChange={(e) => setFactText({ ...factText, [f.name]: e.target.value })}
                >
                  <option value="">{f.required ? 'Chọn' : 'Không có trường này'}</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : f.type === 'list' ? (
                <textarea
                  id={id}
                  className="detail__json"
                  rows={3}
                  spellCheck={false}
                  value={factText[f.name]}
                  aria-invalid={err ? true : undefined}
                  aria-describedby={err ? `${id}-err` : `${id}-hint`}
                  onChange={(e) => setFactText({ ...factText, [f.name]: e.target.value })}
                />
              ) : (
                <input
                  id={id}
                  className="detail__input tc-form__mono"
                  value={factText[f.name]}
                  inputMode={f.type === 'number' ? 'decimal' : undefined}
                  spellCheck={false}
                  aria-invalid={err ? true : undefined}
                  aria-describedby={err ? `${id}-err` : undefined}
                  onChange={(e) => setFactText({ ...factText, [f.name]: e.target.value })}
                />
              )}
              {f.type === 'list' && !err && f.itemFields && (
                <span id={`${id}-hint`} className="tc-form__hint">
                  Mỗi phần tử có {f.itemFields.map((i) => i.name).join(', ')}
                </span>
              )}
              {err && (
                <span id={`${id}-err`} className="tc-form__error">
                  {err}
                </span>
              )}
            </div>
          );
        })}
      </fieldset>

      <fieldset className="tc-form__group">
        <legend className="tc-form__legend">Kỳ vọng</legend>
        {props.evaluate && (
          <div className="tc-form__preview" aria-live="polite">
            <span className="tc-form__preview-label">Draft hiện trả về</span>
            {!factsOk ? (
              <span className="tc__none">điền đủ Facts để xem</span>
            ) : !preview ? (
              <span className="tc__none">đang tính…</span>
            ) : previewError ? (
              <span className="tc__none">
                {previewError.message}
                {previewError.ruleIds && <>: {previewError.ruleIds.join(', ')}</>}
              </span>
            ) : (
              <OutputList rows={preview.outputs} outputs={outputs} />
            )}
            {preview && (!previewError || previewError.code === 'UNIQUE_VIOLATION') && (
              <button type="button" className="btn btn--secondary tc-form__adopt" onClick={adoptPreview}>
                Dùng làm kỳ vọng
              </button>
            )}
          </div>
        )}

        {ruleSet.hitPolicy === 'UNIQUE' && (
          <div className="tc-form__kinds" role="radiogroup" aria-label="Loại kỳ vọng">
            <label>
              <input type="radio" name={`${uid}-kind`} checked={kind === 'outputs'} onChange={() => setKind('outputs')} /> Output
            </label>
            <label>
              <input type="radio" name={`${uid}-kind`} checked={kind === 'UNIQUE_VIOLATION'} onChange={() => setKind('UNIQUE_VIOLATION')} /> Lỗi
              UNIQUE (nhiều Rule cùng match)
            </label>
          </div>
        )}

        {kind === 'outputs' && (
          <>
            {rows === null ? (
              <p className="tc-form__note">Chưa có kỳ vọng.</p>
            ) : rows.length === 0 ? (
              <p className="tc-form__note">Không có output: không Rule nào được match.</p>
            ) : (
              <ol className="tc-form__rows">
                {rows.map((row, i) => (
                  <li key={i} className="tc-form__row">
                    {outputs.map((f) => (
                      <label key={f.name} className="tc-form__cell">
                        <code>{f.name}</code>
                        <input
                          className="detail__input tc-form__mono"
                          value={row[f.name] ?? ''}
                          inputMode={f.type === 'number' ? 'decimal' : undefined}
                          spellCheck={false}
                          onChange={(e) => setRows(rows.map((r, k) => (k === i ? { ...r, [f.name]: e.target.value } : r)))}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger tc-form__row-remove"
                      aria-label={`Bỏ dòng output ${i + 1}`}
                      title="Bỏ dòng"
                      onClick={() => setRows(rows.filter((_, k) => k !== i))}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="tc-form__row-actions">
              {(collect || !rows?.length) && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setRows([...(rows ?? []), Object.fromEntries(outputs.map((f) => [f.name, '']))])}
                >
                  <Plus size={16} aria-hidden="true" /> Thêm dòng output
                </button>
              )}
              {rows?.length !== 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setRows([])}>
                  Không có output
                </button>
              )}
            </div>
          </>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="detail__error">
          {error}
        </p>
      )}
      <div className="detail__row">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Đang lưu…' : testCase ? `Lưu ${testCase.id}` : 'Lưu Test Case'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={props.onCancel}>
          Huỷ
        </button>
      </div>
    </form>
  );
}
