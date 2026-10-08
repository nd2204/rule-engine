import { Info, TriangleAlert } from 'lucide-react';
import { Workspace } from '../../components/Workspace';
import type { DecisionSummary } from '../../domain/types';
import { href } from '../../router';
import { useDecisions } from '../../state';

function openHref(d: DecisionSummary) {
  return d.drafts[0] ? href.draft(d.id, d.drafts[0].id) : href.version(d.id, d.latest);
}

/** Home: every Decision, with its Drafts and where its Latest Pointer is. No Decision in scope, so no tabs or commit bar. */
export function DecisionsScreen() {
  const { decisions, error, refresh } = useDecisions();

  const head = (
    <header className="titleblock titleblock--plain">
      <div className="titleblock__ident">
        <h1 className="titleblock__id">Decisions</h1>
        <p className="titleblock__sub">
          {decisions ? `${decisions.length} Decision` : 'Đang tải'} <span aria-hidden="true">·</span> mở một Draft để sửa Rule, hoặc
          một version để xem và Rollback
        </p>
      </div>
    </header>
  );

  const primary = error ? (
    <div className="screen-state" role="alert">
      <TriangleAlert size={22} aria-hidden="true" />
      <h2 className="screen-state__title">Không tải được danh sách Decision</h2>
      <p>{error}</p>
      <button type="button" className="btn btn--primary" onClick={() => void refresh()}>
        Thử lại
      </button>
    </div>
  ) : (
    <>
      <p className="banner banner--published">
        <Info size={16} aria-hidden="true" />
        <span>Mock API trong trình duyệt. Bốn Decision dưới đây là minh họa theo bộ pilot của spec và reset khi tải lại trang.</span>
      </p>
      <div className="ledger-frame">
        <table className="ledger ledger--decisions" aria-busy={!decisions}>
          <thead>
            <tr>
              <th scope="col">Decision</th>
              <th scope="col">Hit Policy</th>
              <th scope="col">Latest Pointer</th>
              <th scope="col">Draft</th>
            </tr>
          </thead>
          <tbody>
            {!decisions &&
              [0, 1, 2, 3].map((i) => (
                <tr key={i} className="ledger__skeleton">
                  <td colSpan={4}>
                    <span className="sk sk--row" />
                  </td>
                </tr>
              ))}
            {decisions?.map((d) => (
              <tr key={d.id}>
                <th scope="row">
                  <a className="ledger__id" href={openHref(d)}>
                    {d.id}
                  </a>
                  <span className="ledger__desc">
                    {d.title} <span aria-hidden="true">·</span> {d.domain}
                  </span>
                </th>
                <td>
                  <span className="tag">{d.hitPolicy}</span>
                </td>
                <td>
                  <a className="ledger__link" href={href.version(d.id, d.latest)}>
                    v{d.latest}
                  </a>{' '}
                  <span className="ledger__muted">/ {d.versions.length} version</span>
                </td>
                <td>
                  {d.drafts.length === 0 ? (
                    <span className="ledger__muted">Chưa có Draft</span>
                  ) : (
                    <ul className="ledger__drafts">
                      {d.drafts.map((dr) => {
                        const stale = dr.baseVersion !== d.latest;
                        return (
                          <li key={dr.id}>
                            <a className="ledger__link" href={href.draft(d.id, dr.id)}>
                              {dr.id}
                            </a>
                            <span className={`scope__tag${stale ? ' is-stale' : ''}`} title={stale ? `Stale Draft: Latest đã là v${d.latest}` : undefined}>
                              {stale && <TriangleAlert size={11} aria-label="Stale Draft" />}
                              từ v{dr.baseVersion}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return <Workspace className="screen--home" head={head} primary={primary} />;
}
