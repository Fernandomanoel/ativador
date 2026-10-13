"use client";

import Link from "next/link";
import { useState } from "react";
import { formatIcon, formatLabel } from "@/lib/constants";
import { bookById, progressPct, userById, visibleNotes } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Annotation, Entry } from "@/lib/types";
import { timeAgo } from "@/lib/util";
import { AnnotationForm, AnnotationList } from "./Annotations";
import { Avatar } from "./Avatar";
import { Cover } from "./Cover";
import { IconQuote } from "./Icons";

export function ProgressBar({ entry }: { entry: Entry }) {
  const { state } = useStore();
  const book = bookById(state, entry.bookId);
  const pct = progressPct(state, entry);
  return (
    <div className="progress">
      <div className="progress-track">
        <span className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">
        {entry.progress ? `p. ${entry.progress}${book?.pages ? ` de ${book.pages}` : ""}` : "Começando"}
        {pct > 0 && <strong> · {pct}%</strong>}
      </span>
    </div>
  );
}

function ProgressEditor({ entry }: { entry: Entry }) {
  const { actions } = useStore();
  const [page, setPage] = useState(String(entry.progress ?? ""));
  return (
    <form
      className="progress-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (!page) return;
        actions.updateProgress(entry.id, Number(page));
        actions.toast("Progresso atualizado");
      }}
    >
      <label>
        Estou na página
        <input type="number" min={0} value={page} onChange={(e) => setPage(e.target.value)} aria-label="Página atual" />
      </label>
      <button className="btn btn-secondary btn-sm" type="submit">
        Atualizar
      </button>
    </form>
  );
}

/** Leitura em andamento: progresso + diário de notas (públicas ou privadas). */
export function ReadingCard({ entry }: { entry: Entry }) {
  const { state, me } = useStore();
  const [open, setOpen] = useState(false);
  const book = bookById(state, entry.bookId);
  const user = userById(state, entry.userId);
  if (!book || !user) return null;
  const isMe = entry.userId === me.id;
  const notes = visibleNotes(entry, me.id);
  const privateCount = entry.notes.length - entry.notes.filter((n) => !n.isPrivate).length;

  return (
    <article className="reading-card">
      <Link href={`/u/${user.username}/livro/${book.id}`} className="reading-cover">
        <Cover book={book} size="md" />
      </Link>
      <div className="reading-main">
        <h3 className="review-title">
          <Link href={`/u/${user.username}/livro/${book.id}`}>{book.title}</Link>
        </h3>
        <p className="muted small">
          {book.author} · {formatIcon(entry.format)} {formatLabel(entry.format)} · atualizado {timeAgo(entry.updatedAt)}
        </p>
        <ProgressBar entry={entry} />
        {isMe && <ProgressEditor entry={entry} />}

        <div className="reading-notes-head">
          <span className="section-mini">Diário de leitura · {notes.length}</span>
          {isMe && privateCount > 0 && <span className="muted small">🔒 {privateCount} só para você</span>}
        </div>
        {notes.length === 0 && <p className="muted small">{isMe ? "Nenhuma nota ainda." : "Sem notas públicas ainda."}</p>}
        <AnnotationList entry={entry} limit={open ? undefined : 2} />
        {notes.length > 2 && (
          <button className="link-btn small" onClick={() => setOpen((o) => !o)}>
            {open ? "Mostrar menos" : `Ver todas as ${notes.length} notas`}
          </button>
        )}
        {isMe && <AnnotationForm entry={entry} />}
      </div>
    </article>
  );
}

/** Nota pública de leitura em andamento, para o feed (perfis de leitores e influencers). */
export function ReadingNoteCard({ entry, note }: { entry: Entry; note: Annotation }) {
  const { state } = useStore();
  const user = userById(state, entry.userId);
  const book = bookById(state, entry.bookId);
  if (!user || !book) return null;
  return (
    <article className="feed-review reading-note">
      <header className="review-by">
        <Avatar user={user} size={28} ring />
        <span>
          <Link href={`/u/${user.username}`} className="strong">
            {user.username}
          </Link>{" "}
          <span className="muted">está lendo</span>{" "}
          <Link href={`/u/${user.username}/livro/${book.id}`} className="strong">
            {book.title}
          </Link>
          <span className="muted small"> · {timeAgo(note.createdAt)}</span>
        </span>
      </header>
      <div className="reading-note-body">
        <Link href={`/u/${user.username}/livro/${book.id}`}>
          <Cover book={book} size="sm" />
        </Link>
        <div>
          {note.page && <span className="annotation-page">p. {note.page}</span>}
          {note.quote && (
            <blockquote className="note-blockquote">
              <IconQuote size={14} /> {note.quote}
            </blockquote>
          )}
          {note.body && <p className="reading-note-text">{note.body}</p>}
          <ProgressBar entry={entry} />
        </div>
      </div>
    </article>
  );
}
