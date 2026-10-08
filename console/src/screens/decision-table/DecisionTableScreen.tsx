import { FilePlus2, GitCompareArrows, PencilLine, RotateCcw, TriangleAlert } from 'lucide-react';
import { Lamp } from '../../components/Lamp';
import { ScopePicker } from '../../components/ScopePicker';
import { Workspace } from '../../components/Workspace';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { DecisionSummary, DecisionVersion, Draft, Expected, RuleSet, SimulationReport, TestCase } from '../../domain/types';
import { href, navigate, type Route, type Tab } from '../../router';
import { useDecisions, useNarrow, useToasts } from '../../state';
import { InterlockRow, type Interlock } from './InterlockRow';
import { RuleList } from './RuleList';
import { RuleTable } from './RuleTable';
import { SchemaInspector, SchemaTab } from './SchemaTab';
import { TestCaseStrip } from './TestCaseStrip';
import { TitleBlock, type TitleCell } from './TitleBlock';
import { diffCounts, diffRuleSets } from './diff';
import { VersionDiffInspector, VersionsTab } from './VersionsTab';

type ScreenRoute = Extract<Route, { name: 'draft' | 'version' }>;

const POLICY_NOTE: Record<RuleSet['hitPolicy'], string> = {
  FIRST: 'Rule match đầu tiên quyết định',
  UNIQUE: 'Tối đa một Rule được match',
  PRIORITY: 'Rule match có weight cao nhất thắng',
  COLLECT: 'Mọi Rule match, giữ thứ tự Rule',
};

const timeFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const INSPECTOR_LABEL: Record<Tab, string> = {
  rules: 'Test Case',
  versions: 'So với Latest',
  schema: 'Fact mẫu',
};

export function DecisionTableScreen({ route }: { route: ScreenRoute }) {
  return route.name === 'draft' ? (
    <DraftView key={`${route.decisionId}/${route.draftId}`} decisionId={route.decisionId} draftId={route.draftId} tab={route.tab} />
  ) : (
    <VersionView key={`${route.decisionId}/${route.version}`} decisionId={route.decisionId} version={route.version} tab={route.tab} />
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

function newFieldsOf(ruleSet: RuleSet, latest: RuleSet | undefined) {
  if (!latest) return new Set<string>();
  const before = new Set(latest.inputs.map((f) => f.name));
  return new Set(ruleSet.inputs.filter((f) => !before.has(f.name)).map((f) => f.name));
}

// ---------------- Draft ----------------

type SaveState = { kind: 'saved'; at: string } | { kind: 'saving' } | { kind: 'error'; message: string };

function DraftView({ decisionId, draftId, tab }: { decisionId: string; draftId: string; tab: Tab }) {
  const narrow = useNarrow();
  const phone = useNarrow('(max-width: 599px)');
  const { refresh } = useDecisions();
  const { push } = useToasts();

  const [loadError, setLoadError] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionSummary | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [ruleSet, setRuleSet] = useState<RuleSet | null>(null);
  const [latest, setLatest] = useState<DecisionVersion | null>(null);
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
      const lv = await api.getVersion(decisionId, d.latest);
      setDecision(d);
      setDraft(dr);
      setRuleSet(dr.ruleSet);
      setLatest(lv);
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

  // Autosave the Draft.
  useEffect(() => {
    if (!ruleSet || !dirty.current) return;
    setSave({ kind: 'saving' });
    const t = window.setTimeout(async () => {
      try {
        const saved = await api.saveDraft(decisionId, draftId, ruleSet);
        dirty.current = false;
        setSave({ kind: 'saved', at: saved.updatedAt });
      } catch (e) {
        setSave({ kind: 'error', message: (e as Error).message });
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [ruleSet, decisionId, draftId]);

  const onChange = useCallback(
    (next: RuleSet, summary: string) => {
      const before = ruleSet;
      dirty.current = true;
      setRuleSet(next);
      if (summary.startsWith('Xoá') && before) {
        push({
          tone: 'info',
          message: `Đã ${summary.toLowerCase()}.`,
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
  const selected = results?.find((r) => r.testCaseId === selectedId) ?? null;
  const editable = !narrow && !compare;
  const counts = diff ? diffCounts(diff) : null;

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
      action: failing.length
        ? {
            label: `Xem ${failing[0].testCaseId}`,
            run: () => {
              setSelectedId(failing[0].testCaseId);
              setDrawerOpen(true);
              if (tab !== 'rules') navigate(href.draft(decisionId, draftId));
            },
          }
        : undefined,
    },
    {
      id: 'stale',
      label: 'Stale Draft',
      state: staleCleared ? 'clear' : 'caution',
      detail: !stale
        ? `Dựa trên Latest v${latestNo}`
        : ackLatest === latestNo
          ? `Đã xem thay đổi của v${latestNo}`
          : `Draft dựa trên v${draft.baseVersion}, Latest đã là v${latestNo}`,
      action: staleCleared || narrow
        ? undefined
        : compare
          ? { label: `Đã xem v${latestNo}`, run: () => setAckLatest(latestNo) }
          : {
              label: `So sánh với v${latestNo}`,
              run: () => {
                setCompare(true);
                if (tab !== 'rules') navigate(href.draft(decisionId, draftId));
              },
            },
    },
    {
      id: 'breaking',
      label: 'Breaking Change',
      state: !report ? 'pending' : breaking.length === 0 || confirmBreaking ? 'clear' : 'caution',
      detail: !report
        ? 'Đang kiểm tra input schema'
        : breaking.length === 0
          ? 'Input schema tương thích với Latest'
          : `${breaking.map((b) => b.message).join('; ')}${confirmBreaking ? ' · đã xác nhận' : ''}`,
      action: breaking.length && !confirmBreaking && !narrow ? { label: 'Xác nhận', run: () => setConfirmBreaking(true) } : undefined,
    },
  ];

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
      navigate(href.version(decisionId, version), true);
      push({
        tone: 'clear',
        message: `Đã Publish v${version}. Latest Pointer chuyển sang v${version}.`,
        action: {
          label: `Rollback về v${latestNo}`,
          run: async () => {
            try {
              await api.moveLatest(decisionId, latestNo);
              await refresh();
              push({ tone: 'info', message: `Latest Pointer đã quay về v${latestNo}. v${version} vẫn evaluate được theo số version.` });
            } catch (e) {
              push({ tone: 'stop', message: (e as Error).message });
            }
          },
        },
      });
    } catch (e) {
      push({ tone: 'stop', message: `Publish bị từ chối: ${(e as Error).message}` });
      setPublishing(false);
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

  const primary =
    tab === 'versions' ? (
      <VersionsTab decision={decision} scope={{ kind: 'draft', id: draft.id }} />
    ) : tab === 'schema' ? (
      <SchemaTab ruleSet={ruleSet} />
    ) : (
      <>
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
                Đã xem v{latestNo}
              </button>
            )}
          </p>
        )}
        {phone ? (
          <RuleList ruleSet={ruleSet} />
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
          />
        )}
      </>
    );

  const inspector =
    tab === 'versions' ? (
      <VersionDiffInspector label={draft.id} ruleSet={ruleSet} latest={latest.ruleSet} latestNo={latestNo} isLatest={false} />
    ) : tab === 'schema' ? (
      <SchemaInspector testCases={testCases} />
    ) : (
      <TestCaseStrip
        testCases={testCases}
        results={results}
        running={running}
        simError={simError}
        selectedId={selectedId}
        onSelect={setSelectedId}
        ruleSet={ruleSet}
        canAdd={!narrow}
        onAdd={async (tc: { name: string; facts: Record<string, unknown>; expected: Expected }) => {
          const created = await api.addTestCase(decisionId, tc);
          setTestCases((all) => [...(all ?? []), created]);
          setSelectedId(created.id);
        }}
      />
    );

  const summary =
    tab === 'rules' && results && total > 0 ? (
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
              <div className="mode" role="group" aria-label="Chế độ xem">
                <button type="button" className="mode__btn" aria-pressed={!compare} onClick={() => setCompare(false)}>
                  <PencilLine size={15} aria-hidden="true" /> {narrow ? 'Xem' : 'Sửa'}
                </button>
                <button type="button" className="mode__btn" aria-pressed={compare} onClick={() => setCompare(true)}>
                  <GitCompareArrows size={15} aria-hidden="true" /> So sánh với Latest v{latestNo}
                </button>
              </div>
            ) : undefined
          }
        />
      }
      tabs={{ active: tab, href: (t) => href.draft(decisionId, draftId, t) }}
      primary={primary}
      inspector={inspector}
      inspectorLabel={INSPECTOR_LABEL[tab]}
      inspectorSummary={summary}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={setDrawerOpen}
      commit={
        <InterlockRow
          locks={locks}
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

function VersionView({ decisionId, version, tab }: { decisionId: string; version: number; tab: Tab }) {
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
      push({
        tone: 'clear',
        message: `Latest Pointer đã chuyển sang v${version}. v${previous} vẫn evaluate được theo số version.`,
        action: {
          label: `Quay lại v${previous}`,
          run: async () => {
            const back = await api.moveLatest(decisionId, previous);
            setDecision(back);
            await refresh();
          },
        },
      });
    } catch (e) {
      push({ tone: 'stop', message: (e as Error).message });
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
    ) : (
      <>
        <p className="banner banner--published">
          Decision Version đã Published không bao giờ thay đổi. Muốn sửa, tạo một Draft từ version này.
        </p>
        {phone ? (
          <RuleList ruleSet={dv.ruleSet} />
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
          />
        )}
      </>
    );

  const inspector =
    tab === 'versions' ? (
      <VersionDiffInspector label={`v${version}`} ruleSet={dv.ruleSet} latest={latestRuleSet} latestNo={decision.latest} isLatest={isLatest} />
    ) : tab === 'schema' ? (
      <SchemaInspector testCases={testCases} />
    ) : (
      <TestCaseStrip
        testCases={testCases}
        results={null}
        running={false}
        simError={null}
        selectedId={selectedId}
        onSelect={setSelectedId}
        ruleSet={dv.ruleSet}
        canAdd={false}
        readOnlyNote="Simulation chạy trên Draft. Tạo Draft từ version này để chạy Test Case."
      />
    );

  return (
    <Workspace
      className="screen--published"
      head={
        <TitleBlock
          identifier={decision.id}
          qualifier={<ScopePicker decision={decision} scope={{ kind: 'version', version }} tab={tab} />}
          title={decision.title}
          domain={decision.domain}
          cells={cells}
        />
      }
      tabs={{ active: tab, href: (t) => href.version(decisionId, version, t) }}
      primary={primary}
      inspector={inspector}
      inspectorLabel={INSPECTOR_LABEL[tab]}
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
