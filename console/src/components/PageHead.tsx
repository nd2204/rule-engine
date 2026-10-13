import type { ReactNode } from 'react';

/** A screen's plain head: what this place is, in one line. The ruled route band belongs to the Decision Table alone. */
export function PageHead(props: { title: string; children: ReactNode }) {
  return (
    <header className="pagehead">
      <h1 className="pagehead__title">{props.title}</h1>
      <p className="pagehead__sub">{props.children}</p>
    </header>
  );
}
