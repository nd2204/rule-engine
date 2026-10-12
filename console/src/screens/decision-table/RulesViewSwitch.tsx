import { Table2, Workflow } from 'lucide-react';

interface Props {
  view: 'table' | 'node';
  tableHref: string;
  /** Null while the Rule Set has no Rule to draw. */
  nodeHref: string | null;
}

/** The Rules tab's two views of the same Rule Set: the Decision Table, and one Rule at a time as a node graph. */
export function RulesViewSwitch({ view, tableHref, nodeHref }: Props) {
  return (
    <nav className="mode mode--view" aria-label="View của Rules">
      <a className="mode__btn" href={tableHref} aria-current={view === 'table' ? 'page' : undefined}>
        <Table2 size={15} aria-hidden="true" /> Bảng
      </a>
      {nodeHref ? (
        <a className="mode__btn" href={nodeHref} aria-current={view === 'node' ? 'page' : undefined}>
          <Workflow size={15} aria-hidden="true" /> Node
        </a>
      ) : (
        <span className="mode__btn is-off" title="Rule Set chưa có Rule nào">
          <Workflow size={15} aria-hidden="true" /> Node
        </span>
      )}
    </nav>
  );
}
