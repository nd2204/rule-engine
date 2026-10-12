import { FilePlus2, GitCompareArrows, PencilLine, RotateCcw, ScanSearch, TriangleAlert } from 'lucide-react';
import { Lamp } from '../../components/Lamp';
import { ScopePicker } from '../../components/ScopePicker';
import { Workspace } from '../../components/Workspace';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { DecisionSummary, DecisionVersion, Draft, Expected, Rule, RuleSet, SimulationReport, TestCase, TestCaseResult } from '../../domain/types';
import { href, navigate, type Route, type Tab } from '../../router';
import { useDecisions, useNarrow, useToasts } from '../../state';
import { InterlockRow, type Interlock, type PublishSummary } from './InterlockRow';
import { RuleList } from './RuleList';
import { RuleTable, blankRule } from './RuleTable';
import { RulesViewSwitch } from './RulesViewSwitch';
import { SchemaInspector, SchemaTab } from './SchemaTab';
import { TestCaseStrip } from './TestCaseStrip';
import { TitleBlock, type TitleCell } from './TitleBlock';
import { diffCounts, diffRuleSets } from './diff';
import { VersionDiffInspector, VersionsTab } from './VersionsTab';
import { SimulationTab } from '../simulation/SimulationTab';
import { TraceInspector } from '../simulation/TraceInspector';
import { useSimulation, type Simulation } from '../simulation/useSimulation';
import { FlowInspector } from '../flow/FlowInspector';
import { FlowTab } from '../flow/FlowTab';
import { useFlow } from '../flow/useFlow';
import { RuleGraphInspector } from '../rule-graph/RuleGraphInspector';
import { RuleGraphView, ruleTrace } from '../rule-graph/RuleGraphView';
import { useRuleGraph, type GraphUpdate } from '../rule-graph/useRuleGraph';

type ScreenRoute = Extract<Route, { name: 'draft' | 'version' }>;

const POLICY_NOTE: Record<RuleSet['hitPolicy'], string> = {
  FIRST: 'Rule match đầu tiên quyết định',
  UNIQUE: 'Tối đa một Rule được match',
  PRIORITY: 'Rule match có weight cao nhất thắng',
  COLLECT: 'Mọi Rule match, giữ thứ tự Rule',
};

/** What a Stale Draft would undo of Latest if it were published as is: Rules Latest added or changed since the Draft's base. */
function staleLoss(draft: RuleSet, base: RuleSet | null, latest: RuleSet): string[] {
  if (!base) return [];
  const baseIds = new Set(base.rules.map((r) => r.id));
  const draftById = new Map(draft.rules.map((r) => [r.id, r]));
  const sinceBase = diffRuleSets(latest, base);
  const lost: string[] = [];
  for (const row of sinceBase) {
    if (row.kind === 'added' && !draftById.has(row.rule.id) && !baseIds.has(row.rule.id)) lost.push(row.rule.id);
    if (row.kind === 'changed') {
      // Latest changed this Rule after the base; the Draft still carries the base's version of it.
      const mine = draftById.get(row.rule.id);
      if (mine && row.prev && diffRuleSets({ ...draft, rules: [mine] }, { ...draft, rules: [row.prev] })[0]?.kind === 'same') lost.push(row.rule.id);
    }
  }
  return lost;
}

const BREAKING_CONSEQUENCE: Record<string, (field: string) => string> = {
  'new-required': (f) => `caller chưa gửi ${f} sẽ bị Input Schema Validation từ chối`,
  'now-required': (f) => `caller chưa gửi ${f} sẽ bị Input Schema Validation từ chối`,
  'type-changed': (f) => `caller gửi ${f} theo kiểu cũ sẽ bị từ chối`,
};

/** After Publish the next screen (the new version) takes focus on its headline, so keyboard users land on the result. */
let focusHeadlineOnLoad = false;

function useHeadlineFocus(ready: boolean) {
  useEffect(() => {
    if (!ready || !focusHeadlineOnLoad) return;
    focusHeadlineOnLoad = false;
    document.querySelector<HTMLElement>('.titleblock__id')?.focus();
  }, [ready]);
}

/** A pointer action from a toast runs only if the pointer is still where the toast said it was. */
async function pointerStillAt(decisionId: string, version: number): Promise<number | null> {
  const d = await api.getDecision(decisionId);
  return d.latest === version ? null : d.latest;
}

const timeFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const INSPECTOR_LABEL: Record<Tab, string> = {
  rules: 'Test Case',
  flow: 'Luồng evaluation',
  simulation: 'Evaluation Trace',
  versions: 'So với Latest',
  schema: 'Fact mẫu',
};

export function DecisionTableScreen({ route }: { route: ScreenRoute }) {
  return route.name === 'draft' ? (
    <DraftView key={`${route.decisionId}/${route.draftId}`} decisionId={route.decisionId} draftId={route.draftId} tab={route.tab} ruleId={route.ruleId} />
  ) : (
    <VersionView key={`${route.decisionId}/${route.version}`} decisionId={route.decisionId} version={route.version} tab={route.tab} ruleId={route.ruleId} />
  );
}

/** A node graph link to a Rule the scope no longer has (deleted, or never there). */
function MissingRule({ ruleId, backHref }: { ruleId: string; backHref: string }) {
  return (
    <div className="screen-state" role="alert">
      <TriangleAlert size={22} aria-hidden="true" />
      <h1 className="screen-state__title">Không có Rule {ruleId} ở đây</h1>
      <p>Rule này đã bị xoá hoặc chưa từng có trong phạm vi đang mở.</p>
      <a className="btn btn--primary" href={backHref}>
        Về Rules Table
      </a>
    </div>
  );
}

// ---------------- shared bits ----------------

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="screen-state" role="alert">
      <TriangleAlert size={22} aria-hidden="true" />
      <h1 className="screen-state__title">Không tải được màn hình này</h1>
      <p>{message}</p>
      <button type="button" className="btn btn--primary" onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="screen screen--loading" aria-busy="true" aria-label="Đang tải">
      <div className="screen__head">
        <div className="sk sk--title" />
        <div className="sk sk--block" />
      </div>
      <div className="screen__body">
        <div className="sk-table">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="sk sk--row" />
          ))}
        </div>
        <div className="sk sk--strip" />
      </div>
    </div>
  );
}

/** The Simulation tab's verdict on the inspector toggle: how many Facts change against the baseline. */
function simSummary(sim: Simulation) {
  if (!sim.run) return undefined;
  const changed = sim.run.results.filter((r) => r.changed).length;
  return (
    <>
      <Lamp state={sim.running ? 'pending' : sim.run.baselineVersion === null ? 'idle' : changed ? 'caution' : 'clear'} size="sm" />
      <span>{sim.run.baselineVersion === null ? `${sim.run.results.length} Facts` : `${changed.toLocaleString('vi-VN')} đổi`}</span>
    </>
  );
}

function newFieldsOf(ruleSet: RuleSet, latest: RuleSet | undefined) {
  if (!latest) return new Set<string>();
  const before = new Set(latest.inputs.map((f) => f.name));
  return new Set(ruleSet.inputs.filter((f) => !before.has(f.name)).map((f) => f.name));
}

// ---------------- Draft ----------------

type SaveState = { kind: 'saved'; at: string } | { kind: 'saving' } | { kind: 'error'; message: string };

function DraftView({ decisionId, draftId, tab, ruleId }: { decisionId: string; draftId: string; tab: Tab; ruleId?: string }) {
  const narrow = useNarrow();
  const phone = useNarrow('(max-width: 599px)');
  const { refresh } = useDecisions();
  const { push } = useToasts();

  const [loadError, setLoadError] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionSummary | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [ruleSet, setRuleSet] = useState<RuleSet | null>(null);
  const [latest, setLatest] = useState<DecisionVersion | null>(null);
  const [base, setBase] = useState<RuleSet | null>(null);
  const [testCases, setTestCases] = useState<TestCase[] | null>(null);

  const [report, setReport] = useState<SimulationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);
  const [ackLatest, setAckLatest] = useState<number | null>(null);
  const [confirmBreaking, setConfirmBreaking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => setDrawerOpen(false), [ruleId]);
  // Test Cases deleted in this session: the release bay names them, since a deletion can turn a lock green.
  const [deletedTcs, setDeletedTcs] = useState<string[]>([]);
  // A Simulation Fact lit in the Rules Table, the way a selected Test Case lights it. An edit puts it out.
  const [litFact, setLitFact] = useState<TestCaseResult | null>(null);
  useEffect(() => setLitFact(null), [ruleSet]);

  const sim = useSimulation({
    decisionId,
    scope: { kind: 'draft', draftId },
    ruleSet: ruleSet ?? undefined,
    testCases,
    defaultBaseline: decision?.latest ?? null,
    active: tab === 'simulation' || tab === 'flow',
  });
  const flow = useFlow(sim, ruleSet, testCases);
  // Below 1200px the trace is a drawer: picking a Fact opens it.
  const stacked = useNarrow('(max-width: 1199px)');
  useEffect(() => {
    if (sim.selectedKey && stacked && tab === 'simulation') setDrawerOpen(true);
    // Only a pick in the Simulation tab opens the trace; the Sơ đồ tab shows it on the canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.selectedKey, stacked]);

  const dirty = useRef(false);
  const simSeq = useRef(0);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [d, dr, tcs] = await Promise.all([
        api.getDecision(decisionId),
        api.getDraft(decisionId, draftId),
        api.listTestCases(decisionId),
      ]);
      const [lv, bv] = await Promise.all([
        api.getVersion(decisionId, d.latest),
        dr.baseVersion === d.latest ? null : api.getVersion(decisionId, dr.baseVersion).catch(() => null),
      ]);
      setDecision(d);
      setDraft(dr);
      setRuleSet(dr.ruleSet);
      setLatest(lv);
      setBase(bv ? bv.ruleSet : lv.ruleSet);
      setTestCases(tcs);
      setSave({ kind: 'saved', at: dr.updatedAt });
    } catch (e) {
      setLoadError(e instanceof ApiError && e.status === 404 ? 'Draft này không còn tồn tại, có thể đã được Publish.' : (e as Error).message);
    }
  }, [decisionId, draftId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Simulation re-runs after every edit (debounced), against all Test Cases.
  useEffect(() => {
    if (!ruleSet || !testCases) return;
    const seq = ++simSeq.current;
    setRunning(true);
    const t = window.setTimeout(async () => {
      try {
        const r = await api.simulate(decisionId, draftId, ruleSet);
        if (seq !== simSeq.current) return;
        setReport(r);
        setSimError(null);
      } catch (e) {
        if (seq === simSeq.current) setSimError((e as Error).message);
      } finally {
        if (seq === simSeq.current) setRunning(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [ruleSet, testCases, decisionId, draftId]);

  // Autosave the Draft. A failed save keeps the edits in the page and offers to try again.
  const [saveAttempt, setSaveAttempt] = useState(0);
  useEffect(() => {
    if (!ruleSet || !dirty.current) return;
    setSave({ kind: 'saving' });
    const t = window.setTimeout(async () => {
      try {
        const saved = await api.saveDraft(decisionId, draftId, ruleSet);
        dirty.current = false;
        setSave({ kind: 'saved', at: saved.updatedAt });
      } catch (e) {
        const message = (e as Error).message;
        setSave({ kind: 'error', message });
        push({
          key: `save:${draftId}`,
          tone: 'stop',
          message: `Chưa lưu được Draft: ${message}. Thay đổi vẫn còn trên trang này.`,
          action: { label: 'Thử lưu lại', run: () => setSaveAttempt((n) => n + 1) },
        });
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [ruleSet, decisionId, draftId, saveAttempt, push]);

  // Leaving with unsaved edits asks first.
  const unsaved = save?.kind === 'saving' || save?.kind === 'error';
  useEffect(() => {
    if (!unsaved) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [unsaved]);

  const onChange = useCallback(
    (next: RuleSet, summary: string) => {
      const before = ruleSet;
      dirty.current = true;
      setRuleSet(next);
      if (summary.startsWith('Xoá') && before) {
        push({
          tone: 'info',
          message: `Đã ${summary.charAt(0).toLowerCase()}${summary.slice(1)}.`,
          action: {
            label: 'Hoàn tác',
            run: () => {
              dirty.current = true;
              setRuleSet(before);
            },
          },
        });
      }
    },
    [ruleSet, push],
  );

  // The node graph of one Rule, opened from the Rules tab: it edits the same Draft through the same onChange.
  const openRule = (ruleId && ruleSet?.rules.find((r) => r.id === ruleId)) || null;
  const graphUpdate = useCallback<GraphUpdate>(
    (patch, summary) => {
      if (!ruleSet || !ruleId) return;
      onChange({ ...ruleSet, rules: ruleSet.rules.map((r) => (r.id === ruleId ? patch(r) : r)) }, summary);
    },
    [ruleSet, ruleId, onChange],
  );
  const graph = useRuleGraph(
    openRule,
    ruleSet,
    narrow ? null : graphUpdate,
    openRule ? ruleTrace(report?.results ?? null, selectedId, openRule.id) : null,
    `${decisionId}/${draftId}`,
  );
  // The canvas takes the whole body and the form lives in a drawer: asking to edit (Enter, double click, a new node) opens it.
  useEffect(() => {
    if (graph.editRequest) setDrawerOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.editRequest]);
  // Picking a node opens its form; clicking the empty canvas puts it away again.
  const hadNode = useRef(false);
  useEffect(() => {
    if (graph.selected) setDrawerOpen(true);
    else if (hadNode.current) setDrawerOpen(false);
    hadNode.current = !!graph.selected;
  }, [graph.selected]);

  const diff = useMemo(() => (compare && ruleSet && latest ? diffRuleSets(ruleSet, latest.ruleSet) : null), [compare, ruleSet, latest]);
  const newFields = useMemo(() => (ruleSet ? newFieldsOf(ruleSet, latest?.ruleSet) : new Set<string>()), [ruleSet, latest]);

  if (loadError) return <LoadError message={loadError} onRetry={() => void load()} />;
  if (!decision || !draft || !ruleSet || !latest) return <Skeleton />;

  const latestNo = decision.latest;
  const stale = draft.baseVersion !== latestNo;
  const staleCleared = !stale || ackLatest === latestNo;
  const breaking = report?.breakingChanges ?? [];
  const results = report?.results ?? null;
  const failing = results?.filter((r) => r.status !== 'pass') ?? [];
  const selected = litFact ?? results?.find((r) => r.testCaseId === selectedId) ?? null;
  const editable = !narrow && !compare;
  const counts = diff ? diffCounts(diff) : null;
  const lost = stale ? staleLoss(ruleSet, base, latest.ruleSet) : [];
  const consequences = breaking.map((b) => BREAKING_CONSEQUENCE[b.kind]?.(b.field) ?? b.message);

  const locks: Interlock[] = [
    {
      id: 'has-tests',
      label: 'Có Test Case',
      state: !testCases ? 'pending' : testCases.length ? 'clear' : 'stop',
      detail: testCases?.length ? `${testCases.length} Test Case của Decision` : 'Chưa có Test Case nào',
    },
    {
      id: 'tests-pass',
      label: 'Test Case pass',
      state: !results || running ? 'pending' : failing.length ? 'stop' : testCases?.length ? 'clear' : 'stop',
      detail: !results
        ? 'Simulation đang chạy'
        : failing.length
          ? `${failing.length} chưa pass: ${failing.map((f) => f.testCaseId).join(', ')}`
          : `${results.length}/${results.length} pass`,
      actions: failing.length
        ? [
            {
              label: `Xem ${failing[0].testCaseId}`,
              run: () => {
                setSelectedId(failing[0].testCaseId);
                setDrawerOpen(true);
                if (tab !== 'rules') navigate(href.draft(decisionId, draftId));
              },
            },
          ]
        : undefined,
    },
    {
      id: 'stale',
      label: 'Stale Draft',
      state: staleCleared ? 'clear' : 'caution',
      // The detail names what Publish would undo of Latest, so the acknowledgement is an informed one.
      detail: !stale
        ? `Dựa trên Latest v${latestNo}`
        : lost.length
          ? `${ackLatest === latestNo ? 'Đã chấp nhận: ' : ''}Publish sẽ bỏ ${lost.join(', ')} của v${latestNo}`
          : `${ackLatest === latestNo ? 'Đã xem. ' : ''}Dựa trên v${draft.baseVersion}, Latest là v${latestNo}; không mất thay đổi nào của v${latestNo}`,
      // Two ways out when Latest moved on: bring its Rules into the Draft, or knowingly leave them out.
      actions: !stale || narrow
        ? undefined
        : ackLatest === latestNo
          ? [{ label: 'Bỏ chấp nhận', run: () => setAckLatest(null) }]
          : lost.length
            ? [
                { label: `Lấy ${lost.join(', ')} từ v${latestNo}`, run: () => takeFromLatest(lost) },
                { label: 'Chấp nhận bỏ', run: () => setAckLatest(latestNo) },
              ]
            : [{ label: `Đã xem v${latestNo}`, run: () => setAckLatest(latestNo) }],
    },
    {
      id: 'breaking',
      label: 'Breaking Change',
      state: !report ? 'pending' : breaking.length === 0 || confirmBreaking ? 'clear' : 'caution',
      detail: !report
        ? 'Đang kiểm tra input schema'
        : breaking.length === 0
          ? 'Input schema tương thích với Latest'
          : `${confirmBreaking ? 'Đã xác nhận: ' : 'Sau Publish, '}${consequences.join('; ')}`,
      actions:
        !breaking.length || narrow
          ? undefined
          : confirmBreaking
            ? [{ label: 'Bỏ xác nhận', run: () => setConfirmBreaking(false) }]
            : [{ label: `Xác nhận ${breaking.map((b) => b.field).join(', ')}`, run: () => setConfirmBreaking(true) }],
    },
  ];

  /** Brings Latest's version of these Rules into the Draft: replaced in place, or inserted where Latest has them. */
  function takeFromLatest(ids: string[]) {
    if (!ruleSet || !latest) return;
    const before = ruleSet;
    let rules = [...ruleSet.rules];
    for (const id of ids) {
      const theirs = latest.ruleSet.rules.find((r) => r.id === id);
      if (!theirs) continue;
      const copy: Rule = structuredClone(theirs);
      // Inputs Latest does not have (a field this Draft added) read as "any" in the restored Rule.
      for (const f of ruleSet.inputs) if (!copy.when[f.name]) copy.when[f.name] = { kind: 'expr', text: '-' };
      const mine = rules.findIndex((r) => r.id === id);
      if (mine >= 0) rules[mine] = copy;
      else rules.splice(Math.min(latest.ruleSet.rules.indexOf(theirs), rules.length), 0, copy);
    }
    dirty.current = true;
    setRuleSet({ ...ruleSet, rules });
    push({
      tone: 'info',
      message: `Đã lấy ${ids.join(', ')} từ v${latest.version} vào Draft.`,
      action: {
        label: 'Hoàn tác',
        run: () => {
          dirty.current = true;
          setRuleSet(before);
        },
      },
    });
  }

  async function deleteTestCase(id: string) {
    const all = testCases ?? [];
    const index = all.findIndex((t) => t.id === id);
    const tc = all[index];
    if (!tc) return;
    try {
      await api.deleteTestCase(decisionId, id);
    } catch (e) {
      push({ tone: 'stop', message: `Chưa xoá được ${id}: ${(e as Error).message}` });
      return;
    }
    setTestCases((cur) => (cur ?? []).filter((t) => t.id !== id));
    setDeletedTcs((cur) => [...cur, id]);
    setSelectedId(null);
    push({
      key: `tc-delete:${id}`,
      tone: 'info',
      message: `Đã xoá ${id}. Test Case dùng chung cho mọi Draft của Decision này.`,
      action: {
        label: 'Hoàn tác',
        run: async () => {
          try {
            const back = await api.addTestCase(decisionId, { name: tc.name, facts: tc.facts, expected: tc.expected, restore: { id, index } });
            setTestCases((cur) => {
              const next = [...(cur ?? [])];
              next.splice(Math.min(index, next.length), 0, back);
              return next;
            });
            setDeletedTcs((cur) => cur.filter((x) => x !== id));
            setSelectedId(id);
          } catch (e) {
            push({ tone: 'stop', message: `Chưa khôi phục được ${id}: ${(e as Error).message}` });
          }
        },
      },
    });
  }

  async function publish() {
    if (!ruleSet) return;
    setPublishing(true);
    try {
      if (dirty.current) {
        await api.saveDraft(decisionId, draftId, ruleSet);
        dirty.current = false;
      }
      const { version } = await api.publish(decisionId, draftId, stale ? ackLatest : null, confirmBreaking);
      await refresh();
      focusHeadlineOnLoad = true;
      navigate(href.version(decisionId, version), true);
      const key = `pointer:${decisionId}`;
      push({
        key,
        tone: 'clear',
        message: `Đã Publish v${version}. Latest Pointer chuyển sang v${version}.`,
        action: {
          label: `Rollback về v${latestNo}`,
          run: async () => {
            try {
              const movedTo = await pointerStillAt(decisionId, version);
              if (movedTo !== null) {
                push({ key, tone: 'stop', message: `Latest Pointer đã ở v${movedTo}, không còn ở v${version}. Không Rollback để tránh ghi đè thao tác đó.` });
                return;
              }
              await api.moveLatest(decisionId, latestNo);
              await refresh();
              push({ key, tone: 'info', message: `Latest Pointer đã quay về v${latestNo}. v${version} vẫn evaluate được theo số version.` });
            } catch (e) {
              push({ key, tone: 'stop', message: (e as Error).message });
            }
          },
        },
      });
    } catch (e) {
      setPublishing(false);
      if (e instanceof ApiError && e.status === 409) {
        // Someone moved first (a newer Latest, a changed Test Case): reload what the locks read, keep the edits.
        try {
          const d = await api.getDecision(decisionId);
          const [lv, tcs] = await Promise.all([api.getVersion(decisionId, d.latest), api.listTestCases(decisionId)]);
          setDecision(d);
          setLatest(lv);
          setTestCases(tcs);
          if (ackLatest !== d.latest) setAckLatest(null);
        } catch {
          // The rejection message below still explains what to do.
        }
        push({ tone: 'stop', message: `Publish bị từ chối: ${e.message}. Các khoá đã được cập nhật theo trạng thái mới.` });
      } else {
        push({ tone: 'stop', message: `Publish chưa thực hiện được: ${(e as Error).message}. Draft vẫn nguyên, thử lại khi kết nối ổn định.` });
      }
    }
  }

  const cells: TitleCell[] = [
    { label: 'Draft', value: draft.title, note: draft.id, wide: true },
    {
      label: 'Dựa trên',
      value: `v${draft.baseVersion}`,
      lamp: stale ? (staleCleared ? 'clear' : 'caution') : undefined,
      note: stale ? `Latest Pointer đang ở v${latestNo}` : 'Là Latest hiện tại',
    },
    { label: 'Hit Policy', value: ruleSet.hitPolicy, note: POLICY_NOTE[ruleSet.hitPolicy] },
    {
      label: 'Input schema',
      value: `${ruleSet.inputs.length} trường`,
      note: newFields.size ? `mới: ${[...newFields].join(', ')}` : 'Không thêm trường',
    },
    {
      label: 'Lưu',
      value: save?.kind === 'saving' ? 'Đang lưu…' : save?.kind === 'error' ? 'Lưu lỗi' : 'Đã lưu',
      lamp: save?.kind === 'error' ? 'stop' : undefined,
      note: save?.kind === 'saved' ? timeFormat.format(new Date(save.at)) : save?.kind === 'error' ? save.message : '',
    },
  ];

  const passed = results?.filter((r) => r.status === 'pass').length ?? 0;
  const total = testCases?.length ?? 0;

  const latestDiff = diffRuleSets(ruleSet, latest.ruleSet);
  const unchanged =
    latestDiff.every((r, i) => r.kind === 'same' && r.prevIndex === i) &&
    JSON.stringify([ruleSet.hitPolicy, ruleSet.inputs, ruleSet.outputs]) ===
      JSON.stringify([latest.ruleSet.hitPolicy, latest.ruleSet.inputs, latest.ruleSet.outputs]);
  const reached = new Set(results?.flatMap((r) => r.actual.matchedRuleIds) ?? []);
  const unreached = results ? ruleSet.rules.filter((r) => !reached.has(r.id)).map((r) => r.id) : [];
  const idsOf = (kind: 'added' | 'changed' | 'removed') => latestDiff.filter((r) => r.kind === kind).map((r) => r.rule.id);
  const publishSummary: PublishSummary = {
    nextVersion: decision.versions.length + 1,
    latestNo,
    added: idsOf('added'),
    changed: idsOf('changed'),
    removed: idsOf('removed'),
    passed,
    total,
    acknowledged: [
      ...(stale && ackLatest === latestNo ? [lost.length ? `bỏ ${lost.join(', ')} của v${latestNo}` : `đã xem v${latestNo}`] : []),
      ...(breaking.length && confirmBreaking ? consequences : []),
    ],
    cautions: [
      ...(deletedTcs.length ? [`đã xoá Test Case ${deletedTcs.join(', ')} trong phiên này`] : []),
      ...(unreached.length ? [`chưa Test Case nào match ${unreached.join(', ')}`] : []),
      ...(sim.batch && sim.run && sim.run.baselineVersion !== null
        ? [
            `Fact Batch ${sim.batch.name}: ${sim.run.results.filter((r) => r.source === 'batch' && r.changed).length.toLocaleString('vi-VN')}/${sim.batch.facts.length.toLocaleString('vi-VN')} Facts đổi kết quả so với v${sim.run.baselineVersion}${sim.stale ? ' (kết quả cũ, chạy lại ở tab Simulation)' : ''}`,
          ]
        : []),
    ],
    unchanged,
  };

  const primary =
    tab === 'versions' ? (
      <VersionsTab decision={decision} scope={{ kind: 'draft', id: draft.id }} />
    ) : tab === 'schema' ? (
      <SchemaTab ruleSet={ruleSet} />
    ) : tab === 'flow' ? (
      <FlowTab flow={flow} sim={sim} testCases={testCases} />
    ) : ruleId ? (
      openRule ? (
        <RuleGraphView
          graph={graph}
          rule={openRule}
          index={ruleSet.rules.indexOf(openRule)}
          ruleSet={ruleSet}
          testCases={testCases}
          results={results}
          running={running}
          selectedTc={selectedId}
          onSelectTc={(id) => {
            setLitFact(null);
            setSelectedId(id);
          }}
          ruleHref={(id) => href.draftRule(decisionId, draftId, id)}
          onAddRule={
            narrow
              ? undefined
              : () => {
                  const rule = blankRule(ruleSet);
                  onChange({ ...ruleSet, rules: [...ruleSet.rules, rule] }, `Thêm ${rule.id}`);
                  navigate(href.draftRule(decisionId, draftId, rule.id));
                }
          }
          inspectorOpen={drawerOpen}
          onToggleInspector={() => setDrawerOpen((o) => !o)}
        />
      ) : (
        <MissingRule ruleId={ruleId} backHref={href.draft(decisionId, draftId)} />
      )
    ) : tab === 'simulation' ? (
      <SimulationTab
        sim={sim}
        decisionId={decisionId}
        subject={ruleSet}
        subjectLabel={draft.id}
        versions={decision.versions.map((v) => v.version)}
        latestNo={latestNo}
        testCases={testCases}
        canImport={!phone}
      />
    ) : (
      <>
        {litFact && (
          <p className="banner banner--compare">
            <ScanSearch size={16} aria-hidden="true" />
            <span>
              Đang soi Fact <code>{litFact.testCaseId}</code> từ Simulation: Rule khớp được tô sáng như khi chọn một Test Case.
            </span>
            <button type="button" className="btn btn--secondary" onClick={() => setLitFact(null)}>
              Bỏ soi
            </button>
          </p>
        )}
        {narrow && (
          <p className="banner">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>
              Màn hình hẹp chỉ để xem. Mở trên màn hình rộng hơn để sửa Rule và Publish. Dữ liệu là minh họa từ mock API.
            </span>
          </p>
        )}
        {compare && counts && (
          <p className="banner banner--compare">
            <GitCompareArrows size={16} aria-hidden="true" />
            <span>
              So với Latest v{latestNo}: <strong>{counts.added}</strong> Rule mới, <strong>{counts.changed}</strong> đã sửa,{' '}
              <strong>{counts.removed}</strong> đã xoá. Giá trị cũ hiện gạch ngang ngay dưới ô.
            </span>
            {stale && ackLatest !== latestNo && (
              <button type="button" className="btn btn--secondary" onClick={() => setAckLatest(latestNo)}>
                {lost.length ? `Chấp nhận bỏ ${lost.join(', ')}` : `Đã xem v${latestNo}`}
              </button>
            )}
          </p>
        )}
        {phone ? (
          <RuleList ruleSet={ruleSet} circuitHref={(id) => href.draftRule(decisionId, draftId, id)} />
        ) : (
          <RuleTable
            ruleSet={ruleSet}
            editable={editable}
            onChange={onChange}
            results={results}
            selected={selected}
            diff={diff}
            newFields={newFields}
            expandedId={expandedId}
            onExpand={setExpandedId}
            onRestore={narrow ? undefined : (rule) => takeFromLatest([rule.id])}
            latestNo={latestNo}
            circuitHref={(id) => href.draftRule(decisionId, draftId, id)}
          />
        )}
      </>
    );

  const inspector =
    tab === 'versions' ? (
      <VersionDiffInspector label={draft.id} ruleSet={ruleSet} latest={latest.ruleSet} latestNo={latestNo} isLatest={false} />
    ) : tab === 'schema' ? (
      <SchemaInspector testCases={testCases} />
    ) : tab === 'flow' ? (
      <FlowInspector flow={flow} subjectLabel={draft.id} baseLabel={sim.run?.baselineVersion ? `v${sim.run.baselineVersion}` : null} />
    ) : openRule ? (
      <RuleGraphInspector graph={graph} rule={openRule} ruleSet={ruleSet} onUpdateRule={narrow ? undefined : graphUpdate} />
    ) : tab === 'simulation' ? (
      <TraceInspector
        result={sim.run?.results.find((r) => r.key === sim.selectedKey) ?? null}
        decisionId={decisionId}
        subject={ruleSet}
        subjectLabel={draft.id}
        subjectVersion={{ version: decision.versions.length + 1, planned: true }}
        baselineRules={sim.run?.baselineVersion === null ? null : sim.baselineRuleSet}
        baseLabel={sim.run?.baselineVersion ? `v${sim.run.baselineVersion}` : null}
        testCaseName={testCases?.find((t) => t.id === sim.selectedKey)?.name}
        onSave={
          narrow
            ? undefined
            : async (tc) => {
                const created = await api.addTestCase(decisionId, tc);
                setTestCases((all) => [...(all ?? []), created]);
                return created.id;
              }
        }
        evaluate={(facts) => api.evaluate(decisionId, draftId, ruleSet, facts)}
        onLight={() => {
          const r = sim.run?.results.find((x) => x.key === sim.selectedKey);
          if (!r) return;
          setSelectedId(null);
          setLitFact({ testCaseId: r.key, status: r.status ?? 'pass', actual: r.subject, differsFromLatest: r.changed });
          setDrawerOpen(false);
          navigate(href.draft(decisionId, draftId));
        }}
      />
    ) : (
      <TestCaseStrip
        testCases={testCases}
        results={results}
        running={running}
        simError={simError}
        selectedId={selectedId}
        onSelect={(id) => {
          setLitFact(null);
          setSelectedId(id);
        }}
        ruleSet={ruleSet}
        canEdit={!narrow}
        onAdd={async (tc: { name: string; facts: Record<string, unknown>; expected: Expected }) => {
          const created = await api.addTestCase(decisionId, tc);
          setTestCases((all) => [...(all ?? []), created]);
          setSelectedId(created.id);
          return created.id;
        }}
        onUpdate={async (id, tc) => {
          const updated = await api.updateTestCase(decisionId, id, tc);
          setTestCases((all) => (all ?? []).map((t) => (t.id === id ? updated : t)));
        }}
        onDelete={deleteTestCase}
        evaluate={(facts) => api.evaluate(decisionId, draftId, ruleSet, facts)}
      />
    );

  const summary =
    tab === 'simulation' ? (
      simSummary(sim)
    ) : tab === 'rules' && results && total > 0 ? (
      <>
        <Lamp state={running ? 'pending' : passed === total ? 'clear' : 'stop'} size="sm" />
        <span>
          {passed}/{total} pass
        </span>
      </>
    ) : undefined;

  return (
    <Workspace
      head={
        <TitleBlock
          identifier={decision.id}
          qualifier={<ScopePicker decision={decision} scope={{ kind: 'draft', id: draft.id }} tab={tab} />}
          title={decision.title}
          domain={decision.domain}
          cells={cells}
          actions={
            tab === 'rules' ? (
              <div className="titleblock__buttons">
                {!ruleId && (
                  <div className="mode" role="group" aria-label="Chế độ xem">
                    <button type="button" className="mode__btn" aria-pressed={!compare} onClick={() => setCompare(false)}>
                      <PencilLine size={15} aria-hidden="true" /> {narrow ? 'Xem' : 'Sửa'}
                    </button>
                    <button type="button" className="mode__btn" aria-pressed={compare} onClick={() => setCompare(true)}>
                      <GitCompareArrows size={15} aria-hidden="true" /> So sánh với Latest v{latestNo}
                    </button>
                  </div>
                )}
                <RulesViewSwitch
                  view={ruleId ? 'node' : 'table'}
                  tableHref={href.draft(decisionId, draftId)}
                  nodeHref={ruleSet.rules[0] ? href.draftRule(decisionId, draftId, ruleSet.rules[0].id) : null}
                />
              </div>
            ) : undefined
          }
        />
      }
      tabs={{ active: tab, href: (t) => href.draft(decisionId, draftId, t) }}
      primary={primary}
      inspector={inspector}
      className={openRule ? 'screen--canvas' : undefined}
      inspectorLabel={openRule ? 'Điều kiện của Rule' : INSPECTOR_LABEL[tab]}
      inspectorSummary={openRule ? undefined : summary}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={setDrawerOpen}
      commit={
        <InterlockRow
          locks={locks}
          summary={publishSummary}
          nextVersion={decision.versions.length + 1}
          publishing={publishing}
          blockedByViewport={narrow}
          onPublish={() => void publish()}
        />
      }
    />
  );
}

// ---------------- Published version ----------------

function VersionView({ decisionId, version, tab, ruleId }: { decisionId: string; version: number; tab: Tab; ruleId?: string }) {
  const phone = useNarrow('(max-width: 599px)');
  const { refresh } = useDecisions();
  const { push } = useToasts();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionSummary | null>(null);
  const [dv, setDv] = useState<DecisionVersion | null>(null);
  const [testCases, setTestCases] = useState<TestCase[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [latestRuleSet, setLatestRuleSet] = useState<RuleSet | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => setDrawerOpen(false), [ruleId]);

  // Simulation of a Published version compares with Latest; Latest itself compares with the version before it.
  const sim = useSimulation({
    decisionId,
    scope: { kind: 'version', version },
    testCases,
    defaultBaseline: !decision ? null : decision.latest !== version ? decision.latest : version > 1 ? version - 1 : null,
    active: tab === 'simulation' || tab === 'flow' || !!ruleId,
  });
  const flow = useFlow(sim, dv?.ruleSet ?? null, testCases);
  // A Published version's node graph is read-only; its Test Cases run through the version's Simulation.
  const openRule = (ruleId && dv?.ruleSet.rules.find((r) => r.id === ruleId)) || null;
  const graphResults = useMemo<TestCaseResult[] | null>(
    () =>
      sim.run
        ? sim.run.results
            .filter((r) => r.source === 'test-case')
            .map((r) => ({ testCaseId: r.key, status: r.status ?? 'pass', actual: r.subject, differsFromLatest: r.changed }))
        : null,
    [sim.run],
  );
  const graph = useRuleGraph(openRule, dv?.ruleSet ?? null, null, openRule ? ruleTrace(graphResults, selectedId, openRule.id) : null, `${decisionId}/v${version}`);
  // Picking a node opens its reading; clicking the empty canvas puts it away again.
  const hadNode = useRef(false);
  useEffect(() => {
    if (graph.selected) setDrawerOpen(true);
    else if (hadNode.current) setDrawerOpen(false);
    hadNode.current = !!graph.selected;
  }, [graph.selected]);
  const stacked = useNarrow('(max-width: 1199px)');
  useEffect(() => {
    if (sim.selectedKey && stacked && tab === 'simulation') setDrawerOpen(true);
    // Only a pick in the Simulation tab opens the trace; the Sơ đồ tab shows it on the canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.selectedKey, stacked]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [d, v, tcs] = await Promise.all([
        api.getDecision(decisionId),
        api.getVersion(decisionId, version),
        api.listTestCases(decisionId),
      ]);
      setDecision(d);
      setDv(v);
      setTestCases(tcs);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, [decisionId, version]);

  useEffect(() => {
    void load();
  }, [load]);

  // The Version tab compares against whichever version the Latest Pointer names now.
  const latestNo = decision?.latest;
  useEffect(() => {
    if (latestNo === undefined) return;
    let live = true;
    api.getVersion(decisionId, latestNo).then(
      (v) => live && setLatestRuleSet(v.ruleSet),
      () => live && setLatestRuleSet(null),
    );
    return () => {
      live = false;
    };
  }, [decisionId, latestNo]);

  useHeadlineFocus(!!decision && !!dv);
  if (loadError) return <LoadError message={loadError} onRetry={() => void load()} />;
  if (!decision || !dv) return <Skeleton />;

  const isLatest = decision.latest === version;

  async function createDraft() {
    setBusy(true);
    try {
      const draft = await api.createDraft(decisionId, version);
      await refresh();
      navigate(href.draft(decisionId, draft.id));
    } catch (e) {
      push({ tone: 'stop', message: (e as Error).message });
      setBusy(false);
    }
  }

  async function moveLatest() {
    const previous = decision!.latest;
    setBusy(true);
    try {
      const d = await api.moveLatest(decisionId, version);
      setDecision(d);
      await refresh();
      const key = `pointer:${decisionId}`;
      push({
        key,
        tone: 'clear',
        message: `Latest Pointer đã chuyển sang v${version}. v${previous} vẫn evaluate được theo số version.`,
        action: {
          label: `Quay lại v${previous}`,
          run: async () => {
            try {
              const movedTo = await pointerStillAt(decisionId, version);
              if (movedTo !== null) {
                push({ key, tone: 'stop', message: `Latest Pointer đã ở v${movedTo}, không còn ở v${version}. Không quay lại để tránh ghi đè thao tác đó.` });
                return;
              }
              const back = await api.moveLatest(decisionId, previous);
              setDecision(back);
              await refresh();
              push({ key, tone: 'info', message: `Latest Pointer đã quay lại v${previous}.` });
            } catch (e) {
              push({ key, tone: 'stop', message: (e as Error).message });
            }
          },
        },
      });
    } catch (e) {
      push({ key: `pointer:${decisionId}`, tone: 'stop', message: `Chưa dời được Latest Pointer: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  const cells: TitleCell[] = [
    { label: 'Trạng thái', value: 'Published', lamp: 'clear', note: timeFormat.format(new Date(dv.publishedAt)) },
    {
      label: 'Latest Pointer',
      value: isLatest ? 'Trỏ vào version này' : `Đang ở v${decision.latest}`,
      note: isLatest ? 'Caller gọi latest nhận version này' : `Caller vẫn gọi được v${version} theo số version`,
    },
    { label: 'Hit Policy', value: dv.ruleSet.hitPolicy, note: POLICY_NOTE[dv.ruleSet.hitPolicy] },
    { label: 'Input schema', value: `${dv.ruleSet.inputs.length} trường`, note: dv.ruleSet.inputs.filter((f) => f.required).length + ' bắt buộc' },
    { label: 'Ghi chú', value: dv.note, wide: true },
  ];

  const primary =
    tab === 'versions' ? (
      <VersionsTab decision={decision} scope={{ kind: 'version', version }} />
    ) : tab === 'schema' ? (
      <SchemaTab ruleSet={dv.ruleSet} />
    ) : tab === 'flow' ? (
      <FlowTab flow={flow} sim={sim} testCases={testCases} />
    ) : ruleId ? (
      openRule ? (
        <RuleGraphView
          graph={graph}
          rule={openRule}
          index={dv.ruleSet.rules.indexOf(openRule)}
          ruleSet={dv.ruleSet}
          testCases={testCases}
          results={graphResults}
          running={sim.running}
          selectedTc={selectedId}
          onSelectTc={setSelectedId}
          ruleHref={(id) => href.versionRule(decisionId, version, id)}
          inspectorOpen={drawerOpen}
          onToggleInspector={() => setDrawerOpen((o) => !o)}
        />
      ) : (
        <MissingRule ruleId={ruleId} backHref={href.version(decisionId, version)} />
      )
    ) : tab === 'simulation' ? (
      <SimulationTab
        sim={sim}
        decisionId={decisionId}
        subject={dv.ruleSet}
        subjectLabel={`v${version}`}
        versions={decision.versions.map((v) => v.version).filter((v) => v !== version)}
        latestNo={decision.latest}
        testCases={testCases}
        canImport={!phone}
      />
    ) : (
      <>
        <p className="banner banner--published">
          Decision Version đã Published không bao giờ thay đổi. Muốn sửa, tạo một Draft từ version này.
        </p>
        {phone ? (
          <RuleList ruleSet={dv.ruleSet} circuitHref={(id) => href.versionRule(decisionId, version, id)} />
        ) : (
          <RuleTable
            ruleSet={dv.ruleSet}
            editable={false}
            onChange={() => {}}
            results={null}
            selected={null}
            diff={null}
            newFields={new Set()}
            expandedId={expandedId}
            onExpand={setExpandedId}
            circuitHref={(id) => href.versionRule(decisionId, version, id)}
          />
        )}
      </>
    );

  const inspector =
    tab === 'versions' ? (
      <VersionDiffInspector label={`v${version}`} ruleSet={dv.ruleSet} latest={latestRuleSet} latestNo={decision.latest} isLatest={isLatest} />
    ) : tab === 'schema' ? (
      <SchemaInspector testCases={testCases} />
    ) : tab === 'flow' ? (
      <FlowInspector flow={flow} subjectLabel={`v${version}`} baseLabel={sim.run?.baselineVersion ? `v${sim.run.baselineVersion}` : null} />
    ) : openRule ? (
      <RuleGraphInspector graph={graph} rule={openRule} ruleSet={dv.ruleSet} />
    ) : tab === 'simulation' ? (
      <TraceInspector
        result={sim.run?.results.find((r) => r.key === sim.selectedKey) ?? null}
        decisionId={decisionId}
        subject={dv.ruleSet}
        subjectLabel={`v${version}`}
        subjectVersion={{ version, planned: false }}
        baselineRules={sim.run?.baselineVersion === null ? null : sim.baselineRuleSet}
        baseLabel={sim.run?.baselineVersion ? `v${sim.run.baselineVersion}` : null}
        testCaseName={testCases?.find((t) => t.id === sim.selectedKey)?.name}
      />
    ) : (
      <TestCaseStrip
        testCases={testCases}
        results={null}
        running={false}
        simError={null}
        selectedId={selectedId}
        onSelect={setSelectedId}
        ruleSet={dv.ruleSet}
        canEdit={false}
        readOnlyNote="Test Case chạy trên version này ở tab Simulation. Muốn sửa Rule, tạo Draft từ version này."
      />
    );

  return (
    <Workspace
      className={`screen--published${openRule ? ' screen--canvas' : ''}`}
      head={
        <TitleBlock
          identifier={decision.id}
          qualifier={<ScopePicker decision={decision} scope={{ kind: 'version', version }} tab={tab} />}
          title={decision.title}
          domain={decision.domain}
          cells={cells}
          actions={
            tab === 'rules' ? (
              <RulesViewSwitch
                view={ruleId ? 'node' : 'table'}
                tableHref={href.version(decisionId, version)}
                nodeHref={dv.ruleSet.rules[0] ? href.versionRule(decisionId, version, dv.ruleSet.rules[0].id) : null}
              />
            ) : undefined
          }
        />
      }
      tabs={{ active: tab, href: (t) => href.version(decisionId, version, t) }}
      primary={primary}
      inspector={inspector}
      inspectorLabel={openRule ? 'Điều kiện của Rule' : INSPECTOR_LABEL[tab]}
      inspectorSummary={tab === 'simulation' ? simSummary(sim) : undefined}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={setDrawerOpen}
      commit={
        <section className="commit" aria-labelledby="commit-title">
          <h2 id="commit-title" className="interlock__title">
            Latest Pointer
          </h2>
          <p className="commit__state">
            <Lamp state={isLatest ? 'clear' : 'idle'} size="sm" />
            <span>
              {isLatest
                ? `Đang trỏ vào v${version}. Caller gọi latest nhận version này.`
                : `Đang trỏ vào v${decision.latest}. v${version} vẫn evaluate được theo số version.`}
            </span>
          </p>
          <div className="commit__actions">
            {!isLatest && (
              <button type="button" className="btn btn--secondary" disabled={busy} onClick={() => void moveLatest()}>
                <RotateCcw size={15} aria-hidden="true" />
                {version < decision.latest ? `Rollback về v${version}` : `Đặt Latest Pointer về v${version}`}
              </button>
            )}
            <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void createDraft()}>
              <FilePlus2 size={15} aria-hidden="true" /> Tạo Draft từ v{version}
            </button>
          </div>
        </section>
      }
    />
  );
}
