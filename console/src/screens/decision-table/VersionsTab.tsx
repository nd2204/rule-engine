import { TriangleAlert } from 'lucide-react';
import type { DecisionSummary, RuleSet } from '../../domain/types';
import { href } from '../../router';
import { diffCounts, diffRuleSets } from './diff';

type Scope = { kind: 'draft'; id: string } | { kind: 'version'; version: number };

const timeFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/** Version tab, primary: every Draft and Published version of the Decision, and where the Latest Pointer is. */
export function VersionsTab({ decision, scope }: { decision: DecisionSummary; scope: Scope }) {
  const versions = [...decision.versions].reverse();
  return (
    <div className="ledger-stack">
      <section aria-labelledby="ledger-drafts">
        <h2 id="ledger-drafts" className="section-title">
          Draft <span className="section-title__count">{decision.drafts.length}</span>
        </h2>
        {decision.drafts.length === 0 ? (
          <p className="ledger__empty">Chưa có Draft. Mở một version rồi chọn “Tạo Draft” ở thanh dưới.</p>
        ) : (
          <div className="ledger-frame">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Draft</th>
                  <th scope="col">Tiêu đề</th>
                  <th scope="col">Dựa trên</th>
                  <th scope="col" className="ledger__num">
                    Cập nhật
                  </th>
                </tr>
              </thead>
              <tbody>
                {decision.drafts.map((dr) => {
                  const stale = dr.baseVersion !== decision.latest;
                  const current = scope.kind === 'draft' && scope.id === dr.id;
                  return (
                    <tr key={dr.id} className={current ? 'is-current' : undefined}>
                      <td>
                        <a className="ledger__id" href={href.draft(decision.id, dr.id)} aria-current={current ? 'page' : undefined}>
                          {dr.id}
                        </a>
                      </td>
                      <td>{dr.title}</td>
                      <td>
                        <span className={`scope__tag${stale ? ' is-stale' : ''}`}>
                          {stale && <TriangleAlert size={11} aria-hidden="true" />}
                          từ v{dr.baseVersion}
                          {stale && <span className="visually-hidden">, Stale Draft: Latest đã là v{decision.latest}</span>}
                        </span>
                      </td>
                      <td className="ledger__num">{timeFormat.format(new Date(dr.updatedAt))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="ledger-versions">
        <h2 id="ledger-versions" className="section-title">
          Published <span className="section-title__count">{versions.length}</span>
        </h2>
        <div className="ledger-frame">
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Version</th>
                <th scope="col">Ghi chú</th>
                <th scope="col">Latest Pointer</th>
                <th scope="col" className="ledger__num">
                  Published
                </th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => {
                const current = scope.kind === 'version' && scope.version === v.version;
                return (
                  <tr key={v.version} className={current ? 'is-current' : undefined}>
                    <td>
                      <a className="ledger__id" href={href.version(decision.id, v.version)} aria-current={current ? 'page' : undefined}>
                        v{v.version}
                      </a>
                    </td>
                    <td>{v.note}</td>
                    <td>{v.version === decision.latest ? <span className="latest-mark">Latest</span> : <span className="ledger__muted">–</span>}</td>
                    <td className="ledger__num">{timeFormat.format(new Date(v.publishedAt))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Version tab, inspector: what the open Draft or version changes against Latest. */
export function VersionDiffInspector(props: { label: string; ruleSet: RuleSet; latest: RuleSet | null; latestNo: number; isLatest: boolean }) {
  const { label, ruleSet, latest, latestNo, isLatest } = props;
  const rows = latest && !isLatest ? diffRuleSets(ruleSet, latest) : null;
  const counts = rows ? diffCounts(rows) : null;
  const touched = rows?.filter((r) => r.kind !== 'same') ?? [];
  return (
    <section className="inspect" aria-labelledby="inspect-diff">
      <header className="inspect__head">
        <h2 id="inspect-diff" className="inspect__title">
          So với Latest
        </h2>
        <p className="inspect__sub">
          Nếu {label} thay cho Latest v{latestNo}
        </p>
      </header>
      {isLatest ? (
        <p className="inspect__note">Đây là version Latest Pointer đang trỏ tới. Caller gọi latest nhận đúng các Rule này.</p>
      ) : !counts ? (
        <p className="inspect__note">Đang tải Latest…</p>
      ) : (
        <>
          <dl className="inspect__counts">
            <div>
              <dt>Thêm</dt>
              <dd>{counts.added}</dd>
            </div>
            <div>
              <dt>Sửa</dt>
              <dd>{counts.changed}</dd>
            </div>
            <div>
              <dt>Bỏ</dt>
              <dd>{counts.removed}</dd>
            </div>
          </dl>
          {touched.length === 0 ? (
            <p className="inspect__note">Không khác Rule nào so với v{latestNo}.</p>
          ) : (
            <ul className="inspect__list">
              {touched.map((r) => (
                <li key={`${r.kind}-${r.rule.id}`} className={`inspect__row is-${r.kind}`}>
                  <span className="inspect__id">{r.rule.id}</span>
                  <span className="inspect__kind">{r.kind === 'added' ? 'thêm' : r.kind === 'removed' ? `bỏ, chỉ có ở v${latestNo}` : `sửa ${[...r.changed].join(', ')}`}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
